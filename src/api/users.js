var db = require('../db');
var logger = require('../logger');

var bcrypt = require('bcrypt-nodejs');

module.exports = {
    listUsers: (req, res) => {
        db.users.find((err, results) => res.send(results));
    },

    createUser: (req, res) => {
        if (req.body.password != req.body.confirmed_password) {
            res.redirect('/ketttle/register?mismatch=true');
            return;
        }

        var hash = bcrypt.hashSync(req.body.password);
        var userData = {
            email: req.body.email,
            affiliation: req.body.affiliation,
            password: hash
        };

        db.users.findOne({ email: req.body.email } , (err, result) => {
            if (err || result) {
                if (err)
                    logger.log({ level: 'error', message: 'Failed to find user during registration', userData, err });
                res.redirect('/ketttle/register?exists=true');
                return;
            } else if (!result) {
                db.users.insert(userData, (err, result) => {
                    req.login({
                        emai: userData.email,
                        password: req.body.password,
                        _id: result._id
                    }, () => res.redirect('/ketttle'));
                });
            }
        });
    },

    logout: (req, res) => {
        req.logout();
        res.redirect('/ketttle');
    },

    login: (req, res) => {
        res.redirect('/ketttle');
    }
};


