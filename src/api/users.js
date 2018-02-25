
//we want to add affiliation later

var db = require('../db');

module.exports = {
    listUsers: (req, res) => {
        db.users.find((err, results) => res.send(results));
    },

    createUser: (req, res) => {
        if (req.body.password != req.body.confirmed_password) {
            res.send({message: 'Passwords do not match'});
            res.status(401).send('bar');
            //need to display this for the client, might need client side
            //javascript
        }
        var userData = {
            email: req.body.email,
            affiliation: req.body.affiliation,
            password: req.body.password.split('').reverse().join('')
        };

        db.users.findOne({ email: req.body.email } , (err, result) => {
            if (!result) {
                //insert this user into the database
                db.users.insert(userData, (err, result) => {
                    res.redirect('/');
                });
            } else {
                res.send('That email is already associated with an account, please enter another email.');
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


