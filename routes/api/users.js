const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer')
const Datauri = require('datauri')
const xlsx = require('xlsx')
const keys = require('../../config/keys');
const passport = require('passport');
const middleware = require('../../middleware/authenticate');

const Validate = require('validator');
const mailer = require('./../../utils/mailer')
const isEmpty = require('../../validation/is-empty');

const utils = require('../../utils');
const path = require('path');

const bufferStorage = multer.memoryStorage()

// const diskStorage = multer.diskStorage()

const upload = multer({storage : bufferStorage})

// const uploadAvatar = multer({dest : 'public/profile'})

function randomStringGen(x = 8, options = {}) {
  const randomstring = require('randomstring');
  return randomstring.generate(x);
}


// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Users Works' }));

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = 'Email already exists';
      return res.status(400).json(errors);
    } else {
      // const avatar = gravatar.url(req.body.email, {
      //   s: '200', // Size
      //   r: 'pg', // Rating
      //   d: 'mm' // Default
      // });

      const tokenEmail = randomStringGen(8);
      const newUser = new User({
        enrollmentNumber: req.body.enrollmentNumber,
        name: req.body.name,
        email: req.body.email,
        // avatar,
        password: req.body.password,
        profile: null,
        emailToken: tokenEmail,
        emailTokenTimeStamp: new Date(),
        emailVerified: false

      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              //email verification code.  
              return res.json(user);

            })
            .catch(err => console.log(err));
        });
      });

      var subject = 'Welcome to BPIT Connect. '
        var body = `Hi ${newUser.name}, You have succefully registered. Please complete your Email verification by clicking on link below.  \n ${keys.REQUEST_FRONTNEND_BASE_URL}/verify-account/${newUser.email}/${newUser.emailToken}\n\n
                    
                    --------------------------\n\n
                    Please click on the link below and login \n
                    ${keys.REQUEST_FRONTNEND_BASE_URL}/login\n\n
                    --------------------------\n\n
                    Thanks`
        mailer.sendEmail(newUser.email, subject, body)
         
      // var subject = 'Welcome to BPIT Connect. '
      // var body = `Hi ${newUser.name}, You have succefully registered. Please complete your Profile for verification. Thanks`
      // mailer.sendEmail(newUser.email, subject, body)
    
    }
  });
});



// @route   GET api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  console.log(errors)
  console.log(isValid)
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).populate('profile').exec((err, user) => {
    console.log(user);
    if (err) {
      console.log(err)
    }

    // Check for user
    if (!user) {
      errors.email = 'User not found';
      return res.status(404).json(errors);
    }

    // Check Password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User Matched

        // Sign Token
        const userObj = user.toObject();
        userObj.id = userObj._id;

        delete userObj.password;
        delete userObj._id;
        console.log(user.profile);
        userObj.verifiedAccount = userObj.profile ? userObj.profile.verifiedAccount : false;
        const payload = userObj; // Create JWT Payload
        // console.log(userObj);

        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token,
              data: {
                user: userObj
              }
            });
          }
        );
      } else {
        errors.password = 'Password incorrect';
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);


router.post('/assign-role',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin')],
  (req, res) => {
    const errors = {};

    if (!req.body.userId) {
      errors.userId = 'User Id is required.';
    }
    const ALLOWED_ROLES = ['admin', 'moderator', 'user'];
    if (!req.body.role || !ALLOWED_ROLES.includes(req.body.role)) {
      errors.role = 'Role is not valid.';
    }
    const isValid = isEmpty(errors);

    if (!isValid) {
      res.status(400).json(errors);
    }
    else {
      const FIND_QUERY = {
        '_id': req.body.userId
      };
      const UPDATE_QUERY = {
        '$set': {
          'role': req.body.role
        }
      };
      User
        .findByIdAndUpdate(FIND_QUERY, UPDATE_QUERY, { new: true })
        .exec(function updateCb(error, result) {
          if (error) {
            res.status(500).send('server error');
          }
          else {
            res.status(200).json(result);
          }
        });
    }
  }
);

router.post('/upload-students', [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin'), upload.single('file')],
  (request, response) => {
    
        const file = request.file

        if(file){
          const workbook = xlsx.read(file.buffer)
          const sheetsName = workbook.SheetNames

          sheetsName.forEach((el, index)=>{
            var jsonArr = xlsx.utils.sheet_to_json(workbook.Sheets[sheetsName[index]])

            jsonArr.forEach((obj)=>{
              var userArr = []

              Object.keys(obj).forEach((key)=>{
                userArr.push(obj[key])

              })
              saveUser(userArr,(result, err)=>{
                if(err){
                  console.log(err)
                }
              })
            })
          })
          
          return response.status(200).json({message : 'Parsing Completed', success : true})
         
        }else{
          console.log('file not found')
          return response.status(200).json({message : 'file not recieved', success : false})
        }
        

    
  }
)

function createPasswordAndHashIt(userObject, cb) {
  const indexOfAt = userObject.email.indexOf('@');
  let passwordIn = randomStringGen(10);
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(passwordIn, salt, (err, hash) => {
      if (err) throw err;
      cb( {
        password: passwordIn, 
        hash: hash
      }
      )
    });
  });

}
function saveUser(user, callback) {
  const enrollmentNumber = user[0];
  const name = user[1];
  const email = user[2];
  const emailToken = randomStringGen(10)
  const emailVerified = false
  const emailTokenTimeStamp = new Date()

  if (enrollmentNumber && name && email && Validate.isEmail(email)) {
    console.log('valid item');
    const userObject = {
      enrollmentNumber,
      name,
      email,
      emailToken,
      emailVerified,
      emailTokenTimeStamp
    };

  createPasswordAndHashIt(userObject, (passwordObject)=>{
    userObject.password = passwordObject.hash;

    console.log(userObject);

      User.create(userObject)
      .then(userSaved => {
        // mail this user 
        console.log("saved", userSaved._id);

        var subject = 'Welcome to BPIT Connect. '
        var body = `Hi ${userObject.name}, You have succefully registered. Please complete your Profile for verification.\nFollowing is your Login Credentials. \n\nVerify your email by clicking on link below \n ${keys.REQUEST_FRONTNEND_BASE_URL}/verify-account/${userObject.email}/${userObject.emailToken}\n\n
                    
                    --------------------------\n
                    ${keys.REQUEST_FRONTNEND_BASE_URL}/login\n
                    Email : ${userObject.email}\n
                    Passcode : ${passwordObject.password}\n
                    --------------------------\n\n
                    Thanks`
        mailer.sendEmail(userObject.email, subject, body)
        
        callback(null, userSaved);
      })
      .catch(err => {
        console.log(err);
        callback(err, null);
      });
  });
    
  }
  else{
    callback('invalid', null);
  }

}


function SetAvatar(userId, URL, response){
  console.log(userId)
  User.findOneAndUpdate({
    _id: userId
  }, {
    '$set': {
      'avatar': URL
    }
  }, { new: true }, function (error1, user){
      if(error1){
        response.status(500).json({
          message: 'Server Error Occured!',
          success : false
        });
      }
      else{
        if(!user){
          response.status(404).json({
            success : false,
            message: 'User not found'
          });
        }
        else{
          response.status(200).json({
            message: 'Upload success',
            success : true
          })
        }
      }
  });
}
router.post('/upload-profile-pic', [passport.authenticate('jwt', { session: false }), upload.single('file')], 
(request, response)=>{
 
  
  
  const file = request.file
  const userId = request.body.userId
  // console.log(request)
  const dUri = new Datauri().format(path.extname(file.originalname).toString(), file.buffer)

  // console.log(dUri)
  if(file){
    if(file.size <= 2*1024*1024){
      
      

      utils.cloudinary(dUri.content, file.originalname, (err, result)=>{
        if(err){
          console.log('Cloudinary err', err)
          return response.status(200).json({message : 'Some error occured', success : false})
        }else{
          const URL = result.secure_url || result.url;
          SetAvatar(userId, URL, response);
          console.log('Upload Completed')
          // return response.status(200).json({message : 'Upload Completed', success : true})
        }
      })
    }else{
      console.log('file must be less than 2MB')
      return response.status(200).json({message : 'file oversized. Must be less than 2MB', success : false})
    }
    
  }else{
    console.log('file not found')
    return response.status(200).json({message : 'file not recieved', success : false})
  }
  // return response.status(200).json({message : 'Upload Completed', success : true})

  
  // const BusBoy = require('busboy');

  // const data = {};

  // const busboy = new BusBoy({ headers: request.headers });

  // try {
  //   busboy.on('file', function busboyFileUpload(fieldname, file, filename, encoding, mimetype){
  //     data.userId = request.user.id;
  //     if(fieldname.trim() !== 'file' || !(mimetype.includes('image/'))){
  //       return response.status(403).json({
  //         message: 'Invalid format',
  //         format: 'unrecognized format'
  //       });
  //     }
  //     //removet this else block in production
  //     else{
  //       const fileNameWithoutExtension = 'profile-' + data.userId;
  //       const fileName = fileNameWithoutExtension + '.png'
        
  //       const saveToPath = path.join(__dirname, './../../', 'public/', 'profile/', fileName );
  //       file.pipe(fs.createWriteStream(saveToPath));

        // cloudinaryOperations.upload(saveToPath, function cloudinaryUploadRouteCb(error, result){
        //   if(error){
        //     response.status(500).json({
        //       message: 'Server Error Occured!'
        //     });
        //   }
        //   else{
        //     const URL = result.secure_url || result.url;
        //     SetAvatar(data.userId, URL, response);
        //   }
        // }, fileNameWithoutExtension);
      // }
      //aws
      // const config = require('../../config');
      // awsOperations.s3Upload(config.AWS_BUCKET_Assets, file, 'profile/' +  'profile-' + data.userId + '.jpeg', (error, result)=>{
      //   if(error){
      //     console.log(error);
      //     response.status(500).json({
      //       message: 'Server Error Occured!'
      //     });
      //   }
      //   else{
      //     const URL = config.AWS_CLOUDFRONT_URL + '/profile/' + 'profile-' + data.userId + '.jpeg';
      //     User.findOneAndUpdate({
      //       _id: data.userId
      //     }, {
      //       '$set': {
      //         'avatar': URL
      //       }
      //     }, { new: true }, function (error1, user){
      //         if(error1){
      //           response.status(500).json({
      //             message: 'Server Error Occured!'
      //           });
      //         }
      //         else{
      //           if(!user){
      //             response.status(404).josn({
      //               userNotFound: 'user not found',
      //               message: 'User not found'
      //             });
      //           }
      //           else{
      //             response.status(200).json({
      //               message: 'Upload success',
      //               data: {
      //                 user: user,
      //                 avatar: user.avatar
      //               }
      //             })
      //           }
      //         }
      //     });
      //   }
      // });

  //   });
  // }
  // catch(exp){
  //   console.log(exp);
  //   response.status(500).json({
  //     message: 'Server Error Occured.'
  //   });
  // }
  // busboy.on('finish', function busboyFinishCb(){
  //   upload success not the aws upload.
  // });

  // return request.pipe(busboy);

});

router.post('/forgot-password',(request, response)=>{

  const email = request.body.email

  console.log(email)
  User.findOne({email},(err, user)=>{
    if(err){
      response.status(400)
    }
    if(!user){
      return response.status(404).json({success: false, message: 'User not found'});
    }
      const passwordToken = randomStringGen(10)
      user.passwordToken = passwordToken
      user.passwordTimeStamp = new Date()

      var subject = 'Reset your BPIT Connect Password. '
      var body = `Hi ${user.name}, Reset your Password using the link given below.\n\n${keys.REQUEST_FRONTNEND_BASE_URL}/reset-password/${email}/${user.passwordTimeStamp.getTime()}/${passwordToken}/ \nThanks`

      
      user.save()
      mailer.sendEmail(email, subject, body)
      console.log(user.name, subject, body)
      response.status(200).json({success : true})
    
  })
})

router.post('/reset-password/:email/:hash', (request, response)=>{
  console.log(request.params)
  const email = request.params.email
  const hash = request.params.hash
  const currTimestamp = new Date()

  const password = request.body.password
  User.findOne({email},(err, user)=>{
    if(err){
      return response.status(404).json({err : 'User not found'})
    }

    if(user.passwordTimeStamp && user.passwordToken){
      if(currTimestamp.getTime() - user.passwordTimeStamp.getTime() > 5*60*1000){     // 5 min window
        response.status(400).json({err : 'Link Expired !!!'})
      }else{
        if(hash === user.passwordToken){
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash1) => {
              if (err) throw err;
              user.password = hash1;
              user.passwordToken = null
              user.passwordTimeStamp = null
              user
                .save()
                .then(user => {
                  //email verification code.  
                  return response.json({success : true});
                })
                .catch(err => console.log(err));
            });
          });
        }
      }
    }
    
    
  })
})


router.post('/verify-account/:email/:hash', (request, response)=>{

  const email = request.params.email
  const hash = request.params.hash
  // const currTimestamp = new Date()
  console.log(email)
  User.findOne({email},(err, user)=>{
    if(err){
      response.status(404).json({err : 'User not found'})
    }else{
      if(user.emailToken && !user.emailVerified && user.emailTokenTimeStamp){
        if(hash === user.emailToken && !user.emailVerified){
          user.emailToken = null
          user.emailVerified = true
          user.emailTokenTimeStamp = null

          user.save()
          .then(user => {
            //email verification code.  
            return response.json({success : true});
          })
          .catch(err => console.log(err))
        }
      }else{
        response.json({success : false});
      }
    }
  })
})
module.exports = router;
