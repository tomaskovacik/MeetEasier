const msal = require('@azure/msal-node');
const config = require('../config/config');
const roomsCache = require('./roomsCache');
const getRooms = require('./msgraph/rooms.js');
const getRoomLists = require('./msgraph/roomlists.js');
const bookRoom = require('./msgraph/roombooking.js');

const msalClient = new msal.ConfidentialClientApplication(config.msalConfig);

module.exports = function (app) {
  var path = require('path');

  // api routes ================================================================
  // returns an array of room objects
  app.get('/api/rooms', function (req, res) {
    getRooms(function (err, rooms) {
      if (err) {
        console.log(err);
        const cached = roomsCache.load();
        if (cached) {
          res.json(roomsCache.refreshFromCache(cached));
          return;
        }

        res.json({
          error: 'Hmm, there seems to be a weird issue occuring.'
        });
      } else {
        res.json(rooms);
      }
    }, msalClient);
  });

  // returns an array of roomlist objects
  app.get('/api/roomlists', function (req, res) {
    getRoomLists(function (err, roomlists) {
      if (err) {
        res.json({
          error: 'Hmm, there seems to be a weird issue occuring.'
        });
      } else {
        res.json(roomlists);
      }
    }, msalClient);
  });

  // books a room
  app.get('/api/roombooking', function (req, res) {
    console.log("Route Room Booking");

    var roomEmail = req.query.roomEmail;
    var roomName = req.query.roomName;
    var startTime = req.query.startTime;
    var endTime = req.query.endTime;
    var bookingType = req.query.bookingType;

    bookRoom(function (err) {
      if (err) {
        res.json({
          error: 'Hmm, there seems to be a weird issue occuring.'
        });
      } else {
        res.json({
          success: 'Room booked successfully!'
        });
      }
    }, roomEmail, roomName, startTime, endTime, bookingType, msalClient);

    console.log(roomEmail + " | " + roomName + " | " + startTime + " | " + endTime + " | " + bookingType);
  });

  // heartbeat-service to check if server is alive
  app.get('/api/heartbeat', function (req, res) {
    res.json({ status: 'OK' });
  });

  // redirects everything else to our react app
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../ui-react/build/', 'index.html'));
  });
};
