const fs = require('fs');

const cacheLocation = './data/rooms-cache.json';

function load() {
	try {
		if (fs.existsSync(cacheLocation)) {
			return JSON.parse(fs.readFileSync(cacheLocation, 'utf-8'));
		}
	} catch (err) {
		console.log('Failed to read rooms cache:', err);
	}
	return null;
}

function save(rooms) {
	fs.writeFile(cacheLocation, JSON.stringify(rooms), (err) => {
		if (err) console.log('Failed to write rooms cache:', err);
	});
}

// Each successful fetch already pulls every room's upcoming appointments
// (up to calendarSearch.maxDays ahead), not just the current one. So a
// cached room can still be judged correctly against the clock without
// contacting MS again: drop appointments that have already ended, then
// re-derive Busy from whichever appointment is now first in line.
function recomputeFromCache(cachedRoom) {
	const now = Date.now();
	const appointments = (cachedRoom.Appointments || []).filter((appt) => appt.End >= now);
	const room = Object.assign({}, cachedRoom, { Appointments: appointments });

	room.Busy = appointments.length > 0 && appointments[0].Start < now && now < appointments[0].End;
	delete room.ErrorMessage;

	return room;
}

// Merge a fresh fetch with the last known good cache: any room whose
// calendar lookup errored this cycle falls back to its cached appointment
// list, re-evaluated against the current time, instead of showing as
// incorrectly available.
function mergeWithCache(freshRooms, cachedRooms) {
	if (!cachedRooms) return freshRooms;

	const cachedByEmail = {};
	cachedRooms.forEach((room) => {
		cachedByEmail[room.Email] = room;
	});

	return freshRooms.map((room) => {
		if (room.ErrorMessage && cachedByEmail[room.Email]) {
			return recomputeFromCache(cachedByEmail[room.Email]);
		}
		return room;
	});
}

// Total fetch failure: every room comes from cache, each re-evaluated
// against the current time.
function refreshFromCache(cachedRooms) {
	return cachedRooms.map(recomputeFromCache);
}

module.exports = { load, save, mergeWithCache, refreshFromCache };
