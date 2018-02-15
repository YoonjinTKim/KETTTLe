var express = require('express');
var db = require('./db');
var bodyParser = require('body-parser');
var passport = require('passport');
var strategy = require('passport-local').Strategy;

/*
user auth code from 
https://github.com/passport/express-4.x-local-example
*/
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passwd',
    session: false
},
    function(email, password, done) {
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

//include necessary app middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

//initilize the passport session
app.use(passport.initialize());
app.use(passport.session());

//requests for authentification
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
  
app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
});


app.listen(3000, () => console.log('listening on *:3000'));
app.get('/', (req, res) => res.send('Hello World!'));

// All business related logic should be under the api route.
app.use('/api', require('./api'));

// HACK: manually append html extension to url
app.use((req, res, next) => {
    req.url += '.html';
    next();
});
app.use('/', express.static('templates'));

