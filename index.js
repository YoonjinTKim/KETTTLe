var express = require('express');
var mongojs = require('mongojs');

var db = mongojs(process.env.MONGO_URL || 'mongodb://localhost:27017/ketttle-db');

var app = express();
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "user-create.htm");
})

app.get('/process_get', function (req, res) {
    response = {
        first_name:req.query.first_name,
        last_name:req.query.last_name,
        email:req.query.email,
        password:req.query.password
    };
    console.log(response);
    res.end(JSON.stringify(response));
})

var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})
