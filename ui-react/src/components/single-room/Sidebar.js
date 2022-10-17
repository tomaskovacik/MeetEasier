import React from 'react';
import PropTypes from 'prop-types';

import Clock from './Clock';
  let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let kolko = 0;
const Sidebar = ({ config, details, room }) => (
  <div className="columns small-4 right-col">
    <div id="single-room__clock-wrap">
      <Clock />
    </div>
    <div id="upcoming-title">
      {config.upcomingTitle}
    </div>
    <table>
	{ //details.upcomingAppointments ?
        room.Appointments.slice(room.Busy?1:0).map((item, key) => {
          return (
            <tr key={key}>
              <td>
	      <div className="up__meeting-title" >{item.Subject}</div>
	      <div className="up__meeting-organizer" >{item.Organizer}</div>
              <div className="up__meeting-time">
                { item.Start && item.End ?
			days[new Date(parseInt(item.Start, 10)).getDay()] + ' ' +
                  new Date(parseInt(item.Start, 10)).getHours() + ':' + (new Date(parseInt(item.Start, 10)).getMinutes() <= 9 ? '0':'' ) + new Date(parseInt(item.Start, 10)).getMinutes()
                  + ' - ' +
                  new Date(parseInt(item.End, 10)).getHours() + ':' + (new Date(parseInt(item.End, 10)).getMinutes() <= 9 ? '0' : '' ) +new Date(parseInt(item.End, 10)).getMinutes()
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
