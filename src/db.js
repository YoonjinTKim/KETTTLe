const mongojs = require('mongojs');
const db = mongojs(process.env.MONGO_URL || 'mongodb://localhost:27017/ketttle-db');
const logger = require('./logger');

try {
    db.jobs.createIndex({
        user_id: 1
    });

    db.jobs.createIndex({
        user_id: 1,
        updated_at: 1
    });

    db.jobs.createIndex({
        status: 1
    })
} catch(err) {
    logger.log({ level: 'error', message: err.message });
}

module.exports = db;