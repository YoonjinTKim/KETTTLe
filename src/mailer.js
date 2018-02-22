var nodemailer = require('nodemailer');
var pug = require('pug');
var db = require('./db');

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
        if (err)
            console.log(err)
        else
            console.log(info);
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
                console.log(err);
                return;
            }
            var template = pug.renderFile('./templates/job_notification.pug', { job_id });
            _send(result[0].user[0].email, 'Job Completion', template);
        });
}

module.exports = {
    notify
};


