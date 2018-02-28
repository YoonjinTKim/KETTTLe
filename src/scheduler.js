const cron = require('cron');
const db = require('./db');
const arc = require('./arc');
const logger = require('./logger');

/**
 * Find and run a job every 10 minutes (in production).
 * For development environments, run every minute.
 */
const interval = process.env.NODE_ENV === 'production' ? '0 10 * * * *' : '60 * * * * *'
const job = cron.job(interval, () => {
    arc.getJobCount(arc.runOrWait)
        .catch((err) => logger.log({ level: 'error', message: err.message }));
});
job.start();