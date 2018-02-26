var mongojs = require('mongojs');
var db = mongojs(process.env.MONGO_URL || 'mongodb://localhost:27017/ketttle-db');

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

module.exports = db;