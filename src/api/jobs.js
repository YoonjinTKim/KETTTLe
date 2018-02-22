var formidable = require('formidable');
var db = require('../db');
var arc = require('../arc');
var mailer = require('../mailer');

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
            if (err || !result || result.status !== 'completed') {
                res.send({ message: 'Job does not exist or has not been finished'});
            }

            arc.retrieveOutput(req.params.jid)
                .then((result) => {
                    res.download(`/tmp/${req.params.jid}.txt`);
                })
                .catch((err) => {
                    // TODO: error logging
                    console.log(err);
                });
        });
    },

    completeJob: (req, res) => {
        db.jobs.update({ _id: db.ObjectId(req.params.jid) }, {
            $set: { status: 'completed' }
        }, (err, result) => {
            res.send(result);
        });

        mailer.notify(req.params.jid);
    },

    submitJob: (req, res) => {
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, { read_1, read_2 }) => {
            res.redirect('/jobs');

            var jobData = {
                updated_at: new Date(),
                status: 'submitted',
                user_id: req.user._id
            };

            db.jobs.insert(jobData, (err, result) => {
                var jobId = result._id;
                // Copy input to arc login node.
                arc.copyFile(read_1.path, read_2.path, jobId)
                    .then(() => arc.runJob(jobId))
                    .catch((err) => {
                        // TODO: add error logging
                        console.log(err);
                    });
            });
        });
    }
};