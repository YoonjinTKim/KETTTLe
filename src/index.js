var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var cookierparser = require('cookie-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var bcrypt = require('bcrypt-nodejs');

var db = require('./db');
var users = require('./api/users');
var Strategy = require('passport-local').Strategy;

require('./scheduler');

/***
 * user auth code from
 * https://github.com/passport/express-4.x-local-example
 **/
passport.use(new Strategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false
}, (email, password, done) => {
        db.users.findOne({ email: email }, (err, user) => {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!bcrypt.compareSync(password, user.password) ) { return done(null, false); }
            return done(null, user);
        });
    }
));

passport.serializeUser((user, cb) => {
    cb(null, user._id);
});

passport.deserializeUser((_id, cb) => {
    db.users.findOne({ _id: db.ObjectId(_id) }, (err, user) => {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

var app = express();

app.use((req, res, next) => {
    try {
        next();
    } catch(err) {
        res.render('error')
    }
});

// include necessary app middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookierparser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({ url: process.env.MONGO_URL || 'mongodb://localhost:27017/ketttle-db' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // lifespan of a day
}));
app.use('/public', express.static(path.join(__dirname, '../public')));
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '../templates'));

// initilize the passport session
app.use(passport.initialize());
app.use(passport.session());

// requests for authentification
app.post('/api/users/login', passport.authenticate('local', { failureRedirect: '/login?failed=true' }), users.login);

// All business related logic should be under the api route.
app.use('/api', require('./api'));
app.use('/', require('./views'));

app.listen(3000, () => console.log('listening on *:3000'));
