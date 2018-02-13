var express = require('express');
var router = express.Router();
var jobs = require('./jobs');
var users = require('./users');

router.get('/jobs', jobs.listJobs);
router.get('/jobs/:jid', jobs.findJob);
router.post('/jobs', jobs.submitJob);
router.post('/jobs/finished/:jid', jobs.completeJob);
router.post('/users', users.createUser);

module.exports = router;
