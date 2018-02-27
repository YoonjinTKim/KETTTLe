const cron = require('cron');
const db = require('./db');
const arc = require('./arc');
const logger = require('./logger');

/**
 * Find and run a job every 10 minutes (in production).
 * For development environments, run every 2 seconds.
 */
const interval = process.env.NODE_ENV === 'production' ? '0 */10 * * * *' : '*/2 * * * * *'
const job = cron.job(interval, () => arc.getJobCount(arc.runOrWait));
job.start();