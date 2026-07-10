const msal = require('@azure/msal-node');
const config = require('../config/config');
const roomsCache = require('./roomsCache');
const getRooms = require('./msgraph/rooms.js');

const msalClient = new msal.ConfidentialClientApplication(config.msalConfig);

module.exports = function(io) {
	var isRunning = false;
	var lastGoodRooms = roomsCache.load();
	// True whenever any currently-held room data isn't from a fully clean,
	// live fetch this cycle - i.e. someone could book a room online right
	// now without us seeing it, risking a booking collision.
	var isOffline = true;
	// Tracks the content of the last room broadcast so we only push (and
	// cause a re-render / e-ink refresh) when something actually changed,
	// not every poll cycle regardless of content.
	var lastBroadcastJson = null;

	function broadcastRoomsIfChanged(rooms) {
		const json = JSON.stringify(rooms);
		if (json === lastBroadcastJson) return;
		lastBroadcastJson = json;
		io.of('/').emit('updatedRooms', rooms);
	}

	// Check and update rooms every 60 seconds -----------------------------------
	io.of('/').on('connection', function(socket) {
		if (lastGoodRooms) {
			// serve last known-good data immediately to newly connected clients,
			// in case MS is unreachable when they connect
			socket.emit('updatedRooms', roomsCache.refreshFromCache(lastGoodRooms));
		}
		socket.emit('dataSource', { offline: isOffline });

		if (!isRunning) {
			(function callAPI() {
				getRooms(function(err, result) {
					if (result) {
						if (err) {
							console.log(err);
							isOffline = true;
						} else {
							const hadPartialFailure = result.some((room) => room.ErrorMessage);
							// Any room whose calendar lookup failed this cycle falls
							// back to its last known-good state instead of showing
							// as incorrectly available.
							result = roomsCache.mergeWithCache(result, lastGoodRooms);
							lastGoodRooms = result;
							roomsCache.save(result);
							isOffline = hadPartialFailure;
						}

						// send data to page (fresh, or merged with cache on partial failure)
						broadcastRoomsIfChanged(result);
					} else if (err) {
						console.log(err);
						isOffline = true;
						// total failure: fall back to last known-good data (re-evaluated
						// against the current time) rather than leaving clients with nothing
						if (lastGoodRooms) broadcastRoomsIfChanged(roomsCache.refreshFromCache(lastGoodRooms));
					}

					io.of('/').emit('dataSource', { offline: isOffline });
					io.of('/').emit('controllerDone', 'done');
				}, msalClient);

				setTimeout(callAPI, 60000);
			})();
		}

		isRunning = true;
	});
};
