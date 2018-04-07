var express = require('express');
var router = express.Router();
var jobs = require('./jobs');
var users = require('./users');

router.get('/jobs/download/:jid', jobs.downloadJob);
router.post('/jobs', jobs.submitJob);
router.post('/jobs/finished/:jid', jobs.completeJob);
router.post('/jobs/started/:jid', jobs.startJob);

router.post('/users', users.createUser);
router.get('/users/logout', users.logout);

module.exports = router;
