var express = require('express');
var ensureLogin = require('connect-ensure-login')
var router = express.Router();

var loginMiddleware = ensureLogin.ensureLoggedIn();

router.get('/', (req, res) => {
    res.render('home', { logged_in: !!req.user })
});

router.get('/login', (req, res) => {
    res.render('login', { logged_in: !!req.user })
});

router.get('/about', (req, res) => {
    res.render('about', { logged_in: !!req.user })
});

router.get('/register', (req, res) => {
    res.render('register', { logged_in: !!req.user })
});

// Authenticated routes.
router.get('/upload', loginMiddleware, (req, res) => {
    res.render('upload', { logged_in: !!req.user });
});

module.exports = router;