const express = require('express');
const router = express.Router();

const passport = require('passport');
const middleware = require('../../middleware/authenticate');
// Load Validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Profile Model
const Profile = require('../../models/Profile');
// Load User Model
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Profile Works' }));

// @route   GET api/profile
// @desc    Get current users profile
// @access  Private
router.get(
  '/',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id, })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all',
[passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],

  (req, res) => {
    const errors = {};
    const QUERY = {
      verifiedAccount: true
    };
    
    // console.log(req.user);
    const higherRole = ['superadmin', 'admin', 'moderator']

    if(req.user &&  higherRole.indexOf(req.user.role) > -1){
      delete QUERY.verifiedAccount;
    }
    console.log(QUERY);
    Profile.find(QUERY)
      .populate({  
        path : 'user',
        select : ['name', 'avatar', 'role'],
        // match : { $or : []}
      })
      .then(profiles => {
        if (!profiles) {
          errors.noprofile = 'There are no profiles';
          return res.status(404).json(errors);
        }

        console.log("Total profiles" + profiles.length)
        
        //eliminating higher profiles
        profiles.forEach((profile, index)=>{

          if(profile.user.role === 'superadmin' || profile.handle === 'superadmin'){
            profiles.splice(index, 1);

          }

        });

        //eliminating the requested user's profile
        profiles.forEach((profile, index)=>{

          if(profile.user._id.equals(req.user._id)){
            profiles.splice(index, 1);
          }

        });


          console.log(profiles.length)
        res.json(profiles);
      })
      .catch(err =>{ 
        console.log(err);
        res.status(404).json({ profile: 'There are no profiles' })});

    
  });

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public

router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar', 'role','email'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: 'There is no profile for this user' })
    );
});

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post(
  '/',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;
    // Skills - Spilt into array
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',');
    }

    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        // Create

        // Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'That handle already exists';
            res.status(400).json(errors);
          }

          // Save Profile
          new Profile(profileFields).save().then(profile => {
            User.updateOne({
              _id : profileFields.user
            },{
              $set : {
                profile : profile._id
              }
            },(err, result)=>{
              if(err){
                console.log(err)
              }
              
            })
            res.json(profile)
          });
        });
      }
    });
  }
);

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to exp array
      profile.experience.unshift(newExp);

      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  '/education',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to exp array
      profile.education.unshift(newEdu);

      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete(
  '/experience/:exp_id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete(
  '/education/:edu_id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete(
  '/:user_id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
  (req, res) => {
    let userId = req.user.id;
    if (['superadmin', 'admin', 'moderator'].includes(req.user.role)) {
      userId = req.params.user_id;
    }
    if (!userId) {
      return res.status(400).json({
        userId: 'required user id'
      });
    }

    Profile.findOneAndRemove({ user: userId }).then((result) => {
      User.findOneAndRemove({ _id: result._id }).then(() =>
        res.json({ success: true })
      );
    });
  }
);



router.post(
  '/verify',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator')],
  (req, res) => {

    console.log("here");
    let profileId = req.body.userId;
    if (!profileId) {
      return res.status(400).json({
        profileId: 'required profile id'
      });
    }
    Profile
      .findOneAndUpdate({
        user: profileId
      }, {
        '$set': {
          verifiedAccount: req.body.status
        }
      },)
      .then(result => {
        Profile
        .findOne({
          user: profileId
        })
        // .populate('user', ['name', 'avatar', 'role'])
        .populate('user')
        .then(profile=>{

          profile.user.role = req.body.status ?  'user' : 'guest'
          profile.user.verifiedAccount = req.body.status;
          profile.user.save()
          
          Profile.findOne({user : profileId})
          .populate('user', ['name', 'avatar', 'role'])
          .then(res1 => {
            // console.log(res1)
            res.json(res1)
          })

          // console.log(res1);
          // res.json(res1);
        })
        .catch(err1=>{
          console.log(err1);
          res.status(500).json(err1);
        });

      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  }

);

module.exports = router;
