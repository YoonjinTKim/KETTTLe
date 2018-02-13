var express = require('express');
var db = require('./db');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(3000, () => console.log('listening on *:3000'));
app.get('/', (req, res) => res.send('Hello World!'));

// All business related logic should be under the api route.
app.use('/api', require('./api'));
app.use('/', express.static('templates'));

