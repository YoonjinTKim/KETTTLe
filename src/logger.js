const winston = require('winston');

// For development purposes, log to the console.
// For production runs, log to a file.
let transport;
if (process.env.NODE_ENV === 'production') {
    transport = new winston.transports.File({
        filename: 'error.log',
        level: 'error',
        colorize: false,
        timestamp: true,
        maxsize: 100 * 1024, // 100 * 1kb
        maxFiles: 2 // Store two files of previous logs and the current log (<= 3 total files)
    });
} else {
    transport = new winston.transports.Console({ 
        colorize: true,
        timestamp: true
    });
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [ transport ]
});

module.exports = logger;