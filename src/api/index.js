var express = require('express');
var router = express.Router();
var jobs = require('./jobs');

router.get('/jobs', jobs.listJobs);
router.get('/jobs/:jid', jobs.findJob);
router.post('/jobs', jobs.createJob);
router.post('/jobs/finished/:jid', jobs.completeJob);

module.exports = router;
