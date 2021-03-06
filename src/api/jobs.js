var formidable = require('formidable');
var db = require('../db');
var arc = require('../arc');
var mailer = require('../mailer');
var logger = require('../logger');

module.exports = {
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
                .then((path) => {
                    res.download(path);
                    arc.remove(`/tmp/output_${req.params.jid}.tar.gz`)
                })
                .catch((err) => {
                    logger.log({ level: 'error', message: err.message, job_id: req.params.jid });
                    arc.remove(`/tmp/output_${req.params.jid}.tar.gz`)
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
    },

    startJob: (req, res) => {
        db.jobs.update({ _id: db.ObjectId(req.params.jid) }, {
            $set: { status: 'running' }
        }, (err, result) => {
            if (err) {
                logger.log({ level: 'error', message: 'Failed to update job on start', job_id: req.params.jid, err });
                res.status(500);
            } else {
                res.send(result);
            }
        });
    },

    submitJob: (req, res) => {
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                logger.log({ level: 'error', message: 'Failed to parse form during job submission', err });
                return;
            }
            res.redirect('/ketttle/jobs');

            let read_1 = files.read_1;
            let read_2 = files.read_2;
            let read_count = 1;

            if (read_2.size > 0) {
                read_count ++;
            }

            var jobData = {
                updated_at: new Date(),
                status: 'waiting',
                user_id: req.user._id,
                database: fields.database,
                name: fields.name,
                read_count
            };

            db.jobs.insert(jobData, (err, result) => {
                if (err) {
                    logger.log({ level: 'error', message: 'Failed to create document for new job', err, jobData });
                    return;
                }
                jobData._id = result._id;
                // Copy input to arc login node.
                arc.copyFile(read_1.path, read_2.path, result._id)
                    .then(arc.getJobCount)
                    .then((count) => arc.runOrWait(count, jobData))
                    .catch((err) => {
                        logger.log({ level: 'error', message: err.message });
                    });
            });
        });
    }
};
