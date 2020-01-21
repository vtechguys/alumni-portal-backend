const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const User = mongoose.model('users');
const Profile = require('../models/Profile');

const keys = require('../config/keys');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;

module.exports = passport => {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      User.findById(jwt_payload.id)
        .then(user => {
          if (user) {
            Profile
            .findOne({
              user: user._id.toString()
            })
            .then(profile => {
              if(profile){
                user.profile = profile;
                return done(null, user);

              }
              else{
                return done(null, user);

              }
              

            })
            .catch(err=> console.log("profile", err));
            
            
          }
          else{
            return done(null, false);

          }
        })
        .catch(err => console.log(err));
    })
  );
};
