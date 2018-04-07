const nodemailer = require('nodemailer');
const pug = require('pug');
const db = require('./db');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        type: 'OAuth2',
        user: 'ketttlenotification@gmail.com',
        clientId: process.env.KETTTLE_EMAIL_CLIENT_ID,
        clientSecret: process.env.KETTTLE_EMAIL_CLIENT_SECRET,
        refreshToken: process.env.KETTTLE_EMAIL_REFRESH_TOKEN
    }
});

function _send(to, subject, html) {
    let options = {
        from: 'ketttlenotification@gmail.com',
        to,
        subject,
        html
    };
    transporter.sendMail(options, (err, info) => {
        if (err) {
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
            if (err || !result || !result[0] || !result[0].user || !result[0].user[0]) {
                logger.log({ level: 'error', message: 'Failed to aggregate job info for email notification', job_id, err, result });
                return;
            }
            let jobUrl = `http://bench.cs.vt.edu/ketttle/job/${job_id}/visualization`;
            let template = pug.renderFile('./templates/job_notification.pug', { 
                job_id,
                job_url: jobUrl
            });
            _send(result[0].user[0].email, 'Your job has been finished', template);
        });
}

module.exports = {
    notify
};


