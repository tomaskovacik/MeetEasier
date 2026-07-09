const msal = require('@azure/msal-node');
const config = require('../config/config');
const roomsCache = require('./roomsCache');
const getRooms = require('./msgraph/rooms.js');

const msalClient = new msal.ConfidentialClientApplication(config.msalConfig);

module.exports = function(io) {
	var isRunning = false;
	var lastGoodRooms = roomsCache.load();

	// Check and update rooms every 60 seconds -----------------------------------
	io.of('/').on('connection', function(socket) {
		if (lastGoodRooms) {
			// serve last known-good data immediately to newly connected clients,
			// in case MS is unreachable when they connect
			socket.emit('updatedRooms', roomsCache.refreshFromCache(lastGoodRooms));
		}

		if (!isRunning) {
			(function callAPI() {
				getRooms(function(err, result) {
					if (result) {
						if (err) {
							console.log(err);
						} else {
							// Any room whose calendar lookup failed this cycle falls
							// back to its last known-good state instead of showing
							// as incorrectly available.
							result = roomsCache.mergeWithCache(result, lastGoodRooms);
							lastGoodRooms = result;
							roomsCache.save(result);
						}

						// send data to page (fresh, or merged with cache on partial failure)
						io.of('/').emit('updatedRooms', result);
					} else if (err) {
						console.log(err);
						// total failure: fall back to last known-good data (re-evaluated
						// against the current time) rather than leaving clients with nothing
						if (lastGoodRooms) io.of('/').emit('updatedRooms', roomsCache.refreshFromCache(lastGoodRooms));
					}

					io.of('/').emit('controllerDone', 'done');
				}, msalClient);

				setTimeout(callAPI, 60000);
			})();
		}

		isRunning = true;
	});
};
