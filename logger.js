const moment = require('moment');

module.exports = {
	log: function(content, type = 'log') {
		const timestamp = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
		switch (type) {
		case 'log': {
			return console.log(`${timestamp} [\x1b[36m${type.toUpperCase()}\x1b[0m] ${content} `);
		}
		case 'warn': {
			return console.log(`${timestamp} [\x1b[93m${type.toUpperCase()}\x1b[0m] ${content} `);
		}
		case 'error': {
			return console.log(`${timestamp} [\x1b[91m${type.toUpperCase()}\x1b[0m] ${content} `);
		}
		case 'debug': {
			return console.log(`${timestamp} [\x1b[30m${type.toUpperCase()}\x1b[0m] ${content} `);
		}
		default: throw new TypeError('Logger type must be either warn, debug, log');
		}
	},
	error: function(...args) {this.log(...args, 'error');},
	warn: function(...args) {this.log(...args, 'warn');},
	debug: function(...args) {this.log(...args, 'debug');},
};
