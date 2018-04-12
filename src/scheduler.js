const db = require('./db');
const arc = require('./arc');
const logger = require('./logger');

setInterval(() => {
    arc.getJobCount()
        .then(arc.runOrWait)
        .then((status) => status && logger.log({ level: 'info', message: 'Scheduler has submitted a background job' }))
        .catch((err) => logger.log({ level: 'error', message: err.message }));
}, 1000 * 60 * 10);
