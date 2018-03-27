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
    db.jobs.findOne({ _id: db.ObjectId(req.params.jid) }, (err, job) => {
        arc.retrieveAbundance(req.params.jid)
            .then((file) => visualization.create(file, req.params.jid))
            .then((visualizationHTML) => {
                res.render('visualization', {
                    logged_in: !!req.user,
                    job,
                    visualizationHTML
                });
                arc.remove(`/tmp/output_${req.params.jid}.tar.gz`)
            })
            .catch((err) => {
                logger.log({ level: 'error', message: err.message, job, view: 'job visualization' });
                res.render('visualization', {
                    logged_in: !!req.user,
                    job
                });
                arc.remove(`/tmp/output_${req.params.jid}.tar.gz`)
            });
    });
});

router.get('/jobs/compare', loginMiddleware, (req, res) => {
    let jobIds = Object.keys(req.query);
    let promises = jobIds.map((jid) => arc.retrieveAbundance(jid).then(visualization.readFile))
    Promise.all(promises).then((data) => {
        return new Promise((resolve, reject) => {
            db.jobs.find({ _id: { $in : jobIds.map(db.ObjectId) }}, (err, jobs) => {
                if (err)
                    reject(err);
                else
                    resolve({ data, jobs });
            });
        });
    }).then(({ data, jobs}) => visualization.compare(data, jobs))
        .then((visualizationHTML) => {
            res.render('comparison', { 
                logged_in: !!req.user,
                visualizationHTML
            });
        })
        .catch((err) => {
            logger.log({ level: 'error', message: err.message, view: 'job comparison' });
            res.render('comparison', { logged_in: !!req.user });
        });
});

module.exports = router;