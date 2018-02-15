var express = require('express');
var router = express.Router();

router.get('/', (req, res) => res.render('home'));
router.get('/home', (req, res) => res.render('home'));
router.get('/login', (req, res) => res.render('login'));
router.get('/about', (req, res) => res.render('about'));
router.get('/register', (req, res) => res.render('register'));
router.get('/upload', (req, res) => res.render('upload'));

module.exports = router;