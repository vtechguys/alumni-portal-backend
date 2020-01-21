const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  enrollmentNumber: {
    type: String,
    sparse: true
  },
  mobile: {
    type: String,
    sparse: true
  },
  code: {
    type: String,
    default: '+91'
  },
  temporaryMobile: {
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default : 'https://res.cloudinary.com/ajcloud/image/upload/v1575563625/default_profile_image.png'
  },
  date: {
    type: Date,
    default: Date.now
  },
  profile : {
    type : Schema.Types.ObjectId,
    ref : 'profile'
  },
  emailVerified: Boolean,
  emailToken: String,
  emailTokenTimeStamp: Date,

  passwordToken: String,
  passwordTimeStamp: Date,

  role: {
    type: String,
    default: 'guest'
  }

});
UserSchema.index({ 'email': 1 });
UserSchema.index({ 'role': 1 });


const User = mongoose.model('users', UserSchema);
module.exports = User