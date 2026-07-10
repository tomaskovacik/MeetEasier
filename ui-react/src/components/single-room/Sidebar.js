import React from 'react';
import PropTypes from 'prop-types';

import Clock from './Clock';
import DeviceStatus from './DeviceStatus';
  let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let kolko = 0;
const Sidebar = ({ config, details, room }) => (
  <div className="columns small-4 right-col">
    <div id="single-room__clock-wrap">
      <Clock />
      <DeviceStatus />
    </div>
    <div id="upcoming-title">
      {config.upcomingTitle}
    </div>
    <table>
      { //details.upcomingAppointments ?
        room.Appointments.slice(room.Busy?1:0).map((item, key) => {
          const startDate = new Date(parseInt(item.Start, 10));
          const endDate = new Date(parseInt(item.End, 10));
          return (
            <tr key={key}>
              <td>
	      <div className="up__meeting-title" >{item.Subject}</div>
	      <div className="up__meeting-organizer" >{item.Organizer}</div>
              <div className="up__meeting-time">
                { item.Start && item.End ?
                  days[startDate.getDay()] + ' ' +
                  startDate.getHours() + ':' + (startDate.getMinutes() <= 9 ? '0':'' ) + startDate.getMinutes()
                  + ' - ' +
                  endDate.getHours() + ':' + (endDate.getMinutes() <= 9 ? '0' : '' ) + endDate.getMinutes()
                :
                  ''
                }
		  </div>
              </td>
            </tr>
          );
        })//:''
      }
    </table>
  </div>
);

Sidebar.propTypes = {
  room: PropTypes.object,
  details: PropTypes.object,
  config: PropTypes.object
}

export default Sidebar;
