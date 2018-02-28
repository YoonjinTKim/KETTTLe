const express = require('express');
const ensureLogin = require('connect-ensure-login')
const db = require('./db');
const visualization = require('./createVisualization');
const logger = require('./logger');
const arc = require('./arc');
const router = express.Router();
const loginMiddleware = ensureLogin.ensureLoggedIn();

router.get('/', (req, res) => {
    res.render('home', { logged_in: !!req.user, home: true });
});

router.get('/login', (req, res) => {
    res.render('login', {
        logged_in: !!req.user,
        login: true,
        failed: req.query.failed
    });
});

router.get('/register', (req, res) => {
    res.render('register', {
        logged_in: !!req.user,
        register: true,
        exists: req.query.exists,
        mismatch: req.query.mismatch
    });
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
    let threshold = 4;
    let perPage = 9;
    let currentPage = Number(req.query.page || 1);
    db.jobs.count({ user_id: req.user._id }, (err, count) => {
        let maxPages = Math.ceil(count / perPage);

        // Validation check
        if (currentPage <= 0 || currentPage > maxPages) currentPage = 1;
        db.jobs.find({ user_id: req.user._id })
            .sort({ updated_at: -1 })
            .skip((perPage * currentPage) - perPage)
            .limit(perPage, (err, result) => {
                let pages;
                if (maxPages < perPage) {
                    pages = Array(maxPages).fill().map((e, i) => i + 1);
                } else if (currentPage <= threshold) {
                    pages = Array(perPage).fill().map((e, i) => i + 1);
                } else if (currentPage >= (maxPages - threshold)) {
                    pages = Array(perPage).fill().map((e, i) => i + (maxPages - perPage + 1));
                } else {
                    pages = Array(perPage).fill().map((e, i) => i + currentPage - threshold);
                }
                res.render('jobs', {
                    logged_in: !!req.user,
                    jobs: result,
                    jobslist: true,
                    page: currentPage,
                    maxPages,
                    pages
                });
        });
    });
});

router.get('/job/:jid/visualization', loginMiddleware, (req, res) => {
    // TODO: create visualization
    db.jobs.findOne({ _id: db.ObjectId(req.params.jid) }, (err, job) => {
        res.render('visualization', {
            logged_in: !!req.user,
            job
        });
    });
});

module.exports = router;