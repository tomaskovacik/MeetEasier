const config = require("../config/config");

module.exports = function (io) {
  var isRunning = false;

  // Check and update rooms every 60 seconds -----------------------------------
  io.of("/").on("connection", function (socket) {
    if (!isRunning) {
      (function callAPI() {
        let api;
        if (config.calendarSearch.useGraphAPI === true) {
          api = require("./msgraph/rooms.js");
        } else {
          api = require("./ews/rooms.js");
        }

        api(function (err, result) {
          if (result) {
            if (err) return console.log(err);
            // send data to page
            io.of("/").emit("updatedRooms", result);
          }

          io.of("/").emit("controllerDone", "done");
        });

        setTimeout(callAPI, 60000);
      })();
    }

    isRunning = true;
  });
};
