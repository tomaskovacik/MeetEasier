import React, { Component } from 'react';
var mL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Clock extends Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date()
    }

    this.tick = this.tick.bind(this);
  }

  tick() {
    this.setState ({
      date: new Date()
    });
  }

  componentDidMount = () => {
    this.timerID = setInterval(this.tick, 1000);
  }

  componentWillUnmount = () => {
    clearInterval(this.timerID);
  }

  render() {
    return (
      <div id="single-room__clock">
        <div id="single-room__time">
          {
//		  this.state.date.toLocaleTimeString('sk-SK',{hour: '2-digit', minute: '2-digit'})
	  }
        </div>
        <div id="single-room__date">
	    {this.state.date.getDate() + ' ' + mL[this.state.date.getMonth()]}
        </div>
      </div>

    );
  }
}

export default Clock;
