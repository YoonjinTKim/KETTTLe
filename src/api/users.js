var db = require('../db');
var logger = require('../logger');

module.exports = {
    listUsers: (req, res) => {
        db.users.find((err, results) => res.send(results));
    },

    createUser: (req, res) => {
        if (req.body.password != req.body.confirmed_password) {
            res.redirect('/register?mismatch=true');
            return;
        }

        var userData = {
            email: req.body.email,
            affiliation: req.body.affiliation,
            password: req.body.password.split('').reverse().join('')
        };

        db.users.findOne({ email: req.body.email } , (err, result) => {
            if (err || result) {
                if (err)
                    logger.log({ level: 'error', message: 'Failed to find user during registration', userData, err });
                res.redirect('/register?exists=true');
            } else if (!result) {
                db.users.insert(userData, (err, result) => {
                    req.login({
                        emai: userData.email,
                        password: userData.password.split('').reverse().join(''),
                        _id: result._id
                    }, () => res.redirect('/'));
                });
            }
        });
    },

    logout: (req, res) => {
        req.logout();
        res.redirect('/');
    },

    login: (req, res) => {
        res.redirect('/');
    }
};


