var path = require('path');
var express = require('express');
var db = require('./db');
var bodyParser = require('body-parser');
var passport = require('passport');
var cookierparser = require('cookie-parser');
var session = require('express-session');
var ensureLogin = require('connect-ensure-login')

var Strategy = require('passport-local').Strategy;

/***
 * user auth code from
 * https://github.com/passport/express-4.x-local-example
 **/
passport.use(new Strategy({
    usernameField: 'email',
    passwordField: 'passwd',
    session: false
},
    (email, password, done) => {
        db.users.find({ email: email }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (user.password.split('').reverse().join('') != password) { return done(null, false); }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

var app = express();

// include necessary app middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookierparser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use('/public', express.static(path.join(__dirname, '../public')));
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '../templates'));

// initilize the passport session
app.use(passport.initialize());
app.use(passport.session());

// requests for authentification
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});
  
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/profile', ensureLogin.ensureLoggedIn(), (req, res) => {
    res.render('profile', { user: req.user });
});

// All business related logic should be under the api route.
app.use('/api', require('./api'));
app.use('/', require('./views'));

app.listen(3000, () => console.log('listening on *:3000'));