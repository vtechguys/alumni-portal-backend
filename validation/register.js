const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateRegisterInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : '';
  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.password2 = !isEmpty(data.password2) ? data.password2 : '';
  data.enrollmentNumber = !isEmpty(data.enrollmentNumber) ? data.enrollmentNumber : '';

  
  if(Validator.default.isEmpty(data.enrollmentNumber)){
    errors.enrollmentNumber = 'Enrollment Number is required.'
  }

  if(data.enrollmentNumber && data.enrollmentNumber.length === 11){
    errors.enrollmentNumber = 'Enrollment Number must be of 11 charaters';
  }

  if(isNaN(data.enrollmentNumber)){
    errors.enrollmentNumber = 'Invalid. Only digits required.'
  }

  if (!Validator.default.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = 'Name must be between 2 and 30 characters';
  }

  if (Validator.default.isEmpty(data.name)) {
    errors.name = 'Name field is required';
  }

  if (Validator.default.isEmpty(data.email)) {
    errors.email = 'Email field is required';
  }

  if (!Validator.default.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }

  if (Validator.default.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  if (!Validator.default.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (Validator.default.isEmpty(data.password2)) {
    errors.password2 = 'Confirm Password field is required';
  }

  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = 'Passwords must match';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
