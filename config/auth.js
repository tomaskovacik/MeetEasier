const msal = require('@azure/msal-node');
const cacheLocation = './data/cache.json';
const cachePlugin = require('../app/msgraph/cachePlugin')(cacheLocation);

// expose our config directly to our application using module.exports
module.exports = {
	// this user MUST have full access to all the room accounts
	exchange: {
		username: 'user',
		password: 'secret',
		uri: 'https://outlook.office365.com/EWS/Exchange.asmx'
	},
	msalConfig: {
		auth: {
			clientId: process.env.OAUTH_CLIENT_ID ? process.env.OAUTH_CLIENT_ID : 'client_id',
			authority: process.env.OAUTH_AUTHORITY ? process.env.OAUTH_AUTHORITY : 'authority',
			clientSecret: process.env.OAUTH_CLIENT_SECRET ? process.env.OAUTH_CLIENT_SECRET : 'client_secret'
		},
		cache: {
			cachePlugin
		},
		system: {
			loggerOptions: {
				loggerCallback(loglevel, message, containsPii) {
					console.log(message);
				},
				piiLoggingEnabled: false,
				logLevel: msal.LogLevel.Verbose
			}
		}
	},
	// Ex: CONTOSO.COM, Contoso.com, Contoso.co.uk, etc.
	domain: process.env.DOMAIN ? process.env.DOMAIN : 'contoso.com'
};
