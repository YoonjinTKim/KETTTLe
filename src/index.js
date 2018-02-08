var express = require('express');
var db = require('./db');

var app = express();
app.listen(3000, () => console.log('listening on *:3000'));
app.get('/', (req, res) => res.send('Hello World!'));

// All business related logic should be under the api route.
app.use('/api', require('./api'));
