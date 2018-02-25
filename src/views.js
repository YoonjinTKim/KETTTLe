var express = require('express');
var ensureLogin = require('connect-ensure-login')
var db = require('./db');
var router = express.Router();

var loginMiddleware = ensureLogin.ensureLoggedIn();

router.get('/', (req, res) => {
    res.render('home', { logged_in: !!req.user, home: true });
});

router.get('/login', (req, res) => {
    res.render('login', { logged_in: !!req.user, login: true });
});

router.get('/register', (req, res) => {
    res.render('register', { logged_in: !!req.user, register: true });
});

// Authenticated routes.
router.get('/upload', loginMiddleware, (req, res) => {
    res.render('upload', { 
        logged_in: !!req.user,
        user_id: req.user._id,
        upload: true
    });
});

router.get('/jobs', loginMiddleware, (req, res) => {
    db.jobs.find({ user_id: req.user._id }).sort({ updated_at: -1 }, (err, result) => {
        res.render('jobs', {
            logged_in: !!req.user,
            jobs: result,
            jobslist: true
        });
    })
});

module.exports = router;