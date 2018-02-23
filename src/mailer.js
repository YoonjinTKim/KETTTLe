var nodemailer = require('nodemailer');
var pug = require('pug');
var db = require('./db');
var logger = require('./logger');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ketttlenotification@gmail.com',
        pass: process.env.KETTTLE_EMAIL_PW
    }
});

function _send(to, subject, html) {
    var options = {
        from: 'ketttlenotification@gmail.com',
        to,
        subject,
        html
    };
    transporter.sendMail(options, (err, info) => {
        if (err) {
            console.log(err, process.env.KETTTLE_EMAIL_PW);
            logger.log({ level: 'error', message: 'Failed to send email for finished job', err, info, options });
        }
    });
}

function notify(job_id) {
    db.jobs.aggregate(
        { $match: { _id : db.ObjectId(job_id) } },
        { 
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
            }
        }, {
            $project: {
               'user.email': 1 
            } 
        }, (err, result) => {
            if (err) {
                logger.log({ level: 'error', message: 'Faield to aggregate job info for email notification', job_id });
                return;
            }
            var template = pug.renderFile('./templates/job_notification.pug', { job_id });
            _send(result[0].user[0].email, 'Job Completion', template);
        });
}

module.exports = {
    notify
};


