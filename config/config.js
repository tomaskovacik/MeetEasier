const msal = require('@azure/msal-node');
const cacheLocation = './data/cache.json';
const cachePlugin = require('../app/msgraph/cachePlugin')(cacheLocation);

// Read the .env-file
require('dotenv').config();

// docker-compose's env_file directive (unlike a shell sourcing .env) does
// not strip quotes from values, so OAUTH_AUTHORITY="https://..." would
// otherwise be passed through literally, quotes included, breaking MSAL's
// URL parsing. Strip one layer of matching wrapping quotes defensively.
function envVar(name, fallback) {
	const value = process.env[name];
	if (!value) return fallback;
	const match = value.match(/^(['"])(.*)\1$/);
	return match ? match[2] : value;
}

// expose our config directly to our application using module.exports
module.exports = {
	// Configuration for the msgraph-sdk
	msalConfig: {
		auth: {
			clientId: envVar('OAUTH_CLIENT_ID', 'OAUTH_CLIENT_ID_NOT_SET'),
			authority: envVar('OAUTH_AUTHORITY', 'OAUTH_AUTHORITY_NOT_SET'),
			clientSecret: envVar('OAUTH_CLIENT_SECRET', 'OAUTH_CLIENT_SECRET_NOT_SET')
		},
/*		cache: {
			cachePlugin
		},*/
		system: {
			loggerOptions: {
				// TODO: Better logging / other options?
				loggerCallback(loglevel, message, containsPii) {
					console.log(message);
				},
				piiLoggingEnabled: false,
				logLevel: msal.LogLevel.Error
			}
		}
	},
	// Search-settings to use when retrieving data from the calendars
	calendarSearch: {
		maxDays: envVar('SEARCH_MAXDAYS', 10),
		maxRoomLists: envVar('SEARCH_MAXROOMLISTS', 10),
		maxRooms: envVar('SEARCH_MAXROOMS', 10),
		maxItems: envVar('SEARCH_MAXITEMS', 6)
	}
};
