const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');
const searchAndFilters = require('./routes/api/searchAndFilters')
const app = express();

app.use((req, res, next)=>{
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "authorization, content-type")
  next()
})

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DB Config
const db = require('./config/keys').mongoURI;
console.log(db)
// Connect to MongoDB
mongoose
  .connect(db)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Passport Config
require('./config/passport')(passport);
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
// Error handling ( most notably 'Insufficient permissions' )
app.use( function( error, request, response, next ) {
  if( !error ) return next();
  response.send( error.msg, error.errorCode );
});

// Use Routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);
app.use('/api/widgets',searchAndFilters)

// app.get('/reset-password/:email/:hash',(request, response)=>{
//   response.sendFile(path.resolve(__dirname, 'public/pages/reset-password.html'));
// })

// Server static assets if in production
// if (process.env.NODE_ENV === 'production') {
//   // Set static folder
//   app.use(express.static('client/build'));

//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'public/pages'));
//   });
// }
// else{
//   app.use(express.static('client/build'));

//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//   });
// }

// while testing without aws.
// if(process.env.IS_AWS_TESTING){
//   app.use(express.static('public'));
// }



const __INITIALIZE__ = require('./config/init');
__INITIALIZE__.createSuperAdmin();






const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
