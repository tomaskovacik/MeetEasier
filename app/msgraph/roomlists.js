var graph = require('./graph');

module.exports = function(callback, req) {
	graph
		.getRoomList(req.app.locals.msalClient)
		.then(
			(lists) => {
				var roomLists = [];
				lists.value.forEach(function(item, i, array) {
					roomLists.push(item.displayName);
				});
				callback(null, roomLists);
			},
			(err) => {
				callback(err, null);
			}
		)
		.catch((err) => callback(err, null));
};
