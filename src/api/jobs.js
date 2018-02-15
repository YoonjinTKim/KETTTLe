var formidable = require('formidable');
var db = require('../db');
var arc = require('../arc');

module.exports = {
    listJobs: (req, res) => {
        db.jobs.find((err, results) => res.send(results));
    },

    findJob: (req, res) => {
        db.jobs.find({ _id: db.ObjectId(req.params.jid) }, (err, result) => {
            res.send(result);
        });
    },

    completeJob: (req, res) => {
        db.jobs.update({ _id: db.ObjectId(req.params.jid) }, {
            $set: { status: 'completed' }
        }, (err, result) => {
            res.send(result);
            console.log(result);
        });
    },

    submitJob: (req, res) => {
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, { read_1, read_2 }) => {
            res.redirect('/');

            var jobData = {
                updated_at: new Date(),
                status: 'submitted'
                // TODO: add user data
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