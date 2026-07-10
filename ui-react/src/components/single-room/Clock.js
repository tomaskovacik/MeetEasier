import React from 'react';
var mL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The date only ever changes at midnight, and the Joan devices are asleep
// at midnight (per their sleep schedule), so a fresh render after each
// wake-up always shows the correct date - no interval/re-render needed
// during the day at all.
const Clock = () => {
  const date = new Date();
  return (
    <div id="single-room__clock">
      <div id="single-room__time"></div>
      <div id="single-room__date">
        {date.getDate() + ' ' + mL[date.getMonth()]}
      </div>
    </div>
  );
};

export default Clock;
