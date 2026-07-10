import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as config from '../../config/singleRoom.config.js';

import RoomStatusBlock from './RoomStatusBlock';
import Sidebar from './Sidebar';
import Socket from '../global/Socket';
import Spinner from '../global/Spinner';
import Popup from './Popup';

// Guarantee every room has an Appointments array, regardless of what the
// server sends - RoomStatusBlock/Sidebar both assume it's always present.
function sanitizeRooms(rooms) {
  if (!Array.isArray(rooms)) return [];
  return rooms.map((room) => ({
    ...room,
    Appointments: Array.isArray(room.Appointments) ? room.Appointments : []
  }));
}

// Next Date instance of the given "HH:MM" time, today if it hasn't passed
// yet, otherwise tomorrow.
function nextOccurrence(now, hhmm) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

// sleepStart/sleepEnd are "HH:MM"; the window wraps past midnight
// (e.g. 17:59 -> 07:01), which is the expected/normal case here.
function isSleeping(now, sleepStart, sleepEnd) {
  const toMinutes = (hhmm) => {
    const [hours, minutes] = hhmm.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(sleepStart);
  const endMinutes = toMinutes(sleepEnd);
  if (startMinutes > endMinutes) {
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

class ErrorHandler extends React.Component {
  constructor(props) {
    super(props)
    this.state = { errorOccurred: false, currentError: null }
  }

  componentDidCatch(error, info) {
    this.setState({ errorOccurred: true });
    this.setState({ currentError: error });
  }
  
  render() {
    if (this.state.errorOccurred){
        if ((this.state.currentError.toString().includes("Cannot read property 'length' of undefined")) || (this.state.currentError.toString().includes("Cannot read property 'Subject' of undefined")))
        {
          window.location.reload();
        }
     return <div><h2></h2></div> 
    }
    else{
       return this.props.children; 
    } 
  }
}

class Display extends Component {
  constructor(props) {
    super(props);
    this.togglePopup = this.togglePopup.bind(this);
    this.state = {
      showPopup: false,
      popupText: "Booking now... please wait",
      response: false,
      roomAlias: this.props.alias,
      rooms: [],
      room: [],
      // Starts true (conservative default) until either the REST fetch or
      // the socket confirms we have a fully live, current data source.
      offline: true,
      sleeping: false,
      roomDetails: {
        appointmentExists: false,
        timesPresent: false,
        upcomingAppointments: false,
        nextUp: ''
      },
    };
  }
  togglePopup = (text) =>{
    this.setState({popupText: text});
    this.setState({showPopup: !this.state.showPopup});
    
  }
  getRoomsData = () => {
    return fetch('/api/rooms')
      .then((response) => {
        this.setState({ offline: response.headers.get('X-Rooms-Source') === 'cache' });
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          // no live data and no cache to fall back to yet; wait for the
          // socket connection to deliver data once it's available
          console.log(data);
          return;
        }
        this.setState({
          rooms: sanitizeRooms(data)
        }, () => this.processRoomDetails());
      })
  }

  handleDataSource = (dataSource) => {
    this.setState({ offline: dataSource.offline });
  }

  scheduleSleepTransitions = () => {
    const { sleepStart, sleepEnd } = this.state;
    const now = new Date();
    const sleeping = isSleeping(now, sleepStart, sleepEnd);
    this.setState({ sleeping });

    // A single precise timer for the next boundary, instead of polling -
    // exactly one transition (and one re-render) at each sleep/wake edge.
    const nextTransition = nextOccurrence(now, sleeping ? sleepEnd : sleepStart);
    this.sleepTimerID = setTimeout(this.scheduleSleepTransitions, nextTransition - now);
  }

  fetchSleepConfig = () => {
    return fetch('/api/config')
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          sleepStart: data.sleepStart,
          sleepEnd: data.sleepEnd
        }, () => this.scheduleSleepTransitions());
      })
  }

  processRoomDetails = () => {
    const { rooms, roomAlias } = this.state;
    let roomArray = rooms.filter(item => item.RoomAlias === roomAlias);
    let room = roomArray[0];
	
    // 1) ensure that appointments exist for the room
    // 2) check if there are more than 1 upcoming appointments
    // 3) check if there are times in the room.Start & room.End
    // 4) if the meeting is not going on now, append "Next Up: "
    if (typeof room.Appointments !== 'undefined' && room.Appointments.length > 0) {
      this.setState(prevState => ({
        roomDetails: {
          ...prevState.roomDetails,
          appointmentExists: true
        }
      }));
      if (room.Appointments.length > 1) {
        this.setState(prevState => ({
          roomDetails: {
            ...prevState.roomDetails,
            upcomingAppointments: true
          }
        }));
      }

      if (room.Appointments[0].Start && room.Appointments[0].End) {
        this.setState(prevState => ({
          roomDetails: {
            ...prevState.roomDetails,
            timesPresent: true
          }
        }));

        if (!room.Busy) {
          this.setState(prevState => ({
            roomDetails: {
              ...prevState.roomDetails,
              nextUp: config.nextUp + ': '
            }
          }));
		  

		    //console.log("ROOM IS FREE");
        }
        else {
          this.setState(prevState => ({
            roomDetails: {
              ...prevState.roomDetails,
              nextUp: ''
            }
          }));
		    //console.log("ROOM IS BUSY");
        }
      }
    }

    this.setState({
      response: true,
      room: room
    });
  }

  handleSocket = (socketResponse) => {
    // response is intentionally not set here - processRoomDetails() sets
    // it atomically together with `room` once the matched room is found,
    // avoiding a render where response is already true but room is still
    // the constructor's placeholder ([]), which crashed RoomStatusBlock/
    // Sidebar (both assume room is a real room object once response=true).
    this.setState({
      rooms: sanitizeRooms(socketResponse.rooms)
    }, () => this.processRoomDetails());
  }

  componentDidMount = () => {
    this.getRoomsData();
    this.fetchSleepConfig();
  }

  componentWillUnmount = () => {
    clearTimeout(this.sleepTimerID);
  }

  render() {
    const { response, room, roomDetails, offline, sleeping } = this.state;

    return (
      <ErrorHandler>
      <div>
        {/* kept mounted while sleeping too, so data/cache stay warm and
            the display is current the moment it wakes back up */}
        <Socket response={this.handleSocket} onDataSource={this.handleDataSource}/>

        { sleeping ?
          <div id="single-room__sleeping">
            <img src="../img/cat_sleeping.svg" alt="" />
          </div>
        : response ?
          <div className="row expanded full-height">
            {this.state.showPopup ? <Popup text={this.state.popupText} /> : null}
            <RoomStatusBlock room={room} details={roomDetails} config={config} togglePopup = {this.togglePopup.bind(this)} showPopup = {this.state.showPopup} offline={offline} />
            <Sidebar room={room} details={roomDetails} config={config} />
          </div>
        :
          <Spinner />
        }
      </div>
      </ErrorHandler>
    );
  }
}

Display.propTypes = {
  alias: PropTypes.string
}

export default Display;
