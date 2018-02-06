var express = require('express');
var mongojs = require('mongojs');

var db = mongojs(process.env.MONGO_URL || 'mongodb://localhost:27017/local');

var app = express();
app.listen(3000, () => console.log('listening on *:3000'));
app.get('/', (req, res) => res.send('Hello World!'))
