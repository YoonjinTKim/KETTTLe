var mongojs = require('mongojs');
var db = mongojs(process.env.MONGO_URL || 'mongodb://localhost:27017/ketttle-db');
module.exports = db;