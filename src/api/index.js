var express = require('express');
var router = express.Router();

router.get('/job_finished', require('./job_finished'));

module.exports = router;
