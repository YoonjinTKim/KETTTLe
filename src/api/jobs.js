var formidable = require('formidable');
var db = require('../db');
var arc = require('../arc');
var mailer = require('../mailer');
var logger = require('../logger');

module.exports = {
    listJobs: (req, res) => {
        db.jobs.find((err, results) => res.send(results));
    },

    findJob: (req, res) => {
        db.jobs.find({ _id: db.ObjectId(req.params.jid) }, (err, result) => {
            res.send(result);
        });
    },

    downloadJob: (req, res) => {
        db.jobs.findOne({ _id: db.ObjectId(req.params.jid) }, (err, result) => {
            if (err) {
                logger.log({ level: 'error', message: 'Failed to find job for downloading', job_id: req.params.jid, err });
                res.status(500).send('foo');
                return;
            } else if (!result || result.status !== 'completed') {
                res.send({ message: 'Job does not exist or has not been finished' });
                return;
            }

            arc.retrieveOutput(req.params.jid)
                .then((result) => {
                    res.download(`/tmp/output_${req.params.jid}.tar.gz`);
                })
                .catch((err) => {
                    logger.log({ level: 'error', message: 'Failed to retrieve job output from arc', job_id: req.params.jid, err });
                });
        });
    },

    completeJob: (req, res) => {
        db.jobs.update({ _id: db.ObjectId(req.params.jid) }, {
            $set: { status: 'completed' }
        }, (err, result) => {
            if (err) {
                logger.log({ level: 'error', message: 'Failed to update job on completion', job_id: req.params.jid, err });
                res.status(500);
            } else {
                res.send(result);
            }
        });

        mailer.notify(req.params.jid);
        req.jobQueue.runNext();
    },

    submitJob: (req, res) => {
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, { read_1, read_2 }) => {
            if (err) {
                logger.log({ level: 'error', message: 'Failed to parse form during job submission', err });
                return;
            }
            res.redirect('/jobs');

            var jobData = {
                updated_at: new Date(),
                status: 'submitted',
                user_id: req.user._id,
                database: fields.database
            };

            db.jobs.insert(jobData, (err, result) => {
                if (err) {
                    logger.log({ level: 'error', message: 'Failed to create document for new job', err, jobData });
                    return;
                }
                jobData._id = result._id;
                // Copy input to arc login node.
                arc.copyFile(read_1.path, read_2.path, result._id)
                    .then(() => req.jobQueue.submit(jobData))
                    .catch((err) => {
                        logger.log({ level: 'error', message: 'Failed to submit job to arc', err });
                    });
            });
        });
    }
};