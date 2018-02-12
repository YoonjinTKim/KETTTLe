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

    createJob: (req, res) => {
        // TODO: populate job data object with input file name, user info, etc...
        var jobData = {};
        db.jobs.insert(jobData, (err, result) => {
            res.send(result);
        });
    },

    completeJob: (req, res) => {
        db.jobs.find({ _id: db.ObjectId(req.params.jid) }, (err, result) => {
            // TODO: notify user job is done, save job output file location and update job status
            res.send(result);
        });
    },

    submitJob: (req, res) => {
        var form = new formidable.IncomingForm();
        form.parse(req, (err, fields, { read_1, read_2 }) => {
            res.redirect('/');

            // First, copy input to arc login node.
            arc.copyFile(read_1.path, read_2.path)
                .then(() => {
                    // TODO: ssh into arc login node and run qsub script with
                    // correct arguments.

                });
        });
    }
};