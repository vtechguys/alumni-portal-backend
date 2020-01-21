const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const middleware = require('../../middleware/authenticate');
// Post model
const Post = require('../../models/Post');
// Profile model
const Profile = require('../../models/Profile');

const User = require('../../models/User')

const config = require('../../config');
const HIGHER_ROLES = config.HIGHER_ROLES;
// Validation
const validatePostInput = require('../../validation/post');

// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get('/', (req, res) => {
  let query = {};

  let index = req.body.index || 0;
  let limit = req.body.limit || 10;

  let sort = {
    date: - 1
  };

  if (req.body.orderBy) {
    sort = orderBy;
  }
  Post.find(query)
    .skip(index)
    .limit(limit)
    .sort(sort)
    .then(posts => { 
      // const postObj = posts;
      // postObj.commentsCount = postObj.comments ? postObj.comments.length :  0;
      // res.json(postObj) 
      res.json(posts);
    })
    .catch(err => res.status(404).json({ nopostsfound: 'No posts found' }));
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with that ID' })
    );
});

router.get('/tags/:tag',(req, res)=>{
  
  const keyword = req.params.tag
  Post.find({tags : keyword})
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with that tag' })
    );
})

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  '/',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    console.log(errors);
    // Check Validation





    if (!isValid) {
      console.log("HERE");
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    else{
      let isValidProfile = false;
      if(req.user && req.user.profile && req.user.profile.verifiedAccount){
        isValidProfile = true;
      }
      if(!isValidProfile){
        res.json({
          text: 'you must have valid profile first'
        });
      }
      else{
        Profile.findOne({user : req.user.id})
        .then(profile => {
          const newPost = new Post({
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id,
            tags: req.body.tags || [],
            handle : profile.handle
          });
      
          newPost.save().then(post => res.json(post));
        })
        
      }
    }


  }
);

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete(
  '/:id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {
    console.log("DELETE");
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          console.log(post.user, req.user.id, HIGHER_ROLES.includes(req.user.role));
          if (post.user.toString() === req.user.id || HIGHER_ROLES.includes(req.user.role)) {
            post.remove().then(() => res.json({ success: true }));

          }
          else {
            console.log("Why?");
            return res
              .status(401)
              .json({ notauthorized: 'User not authorized' });
          }

          // Delete
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/like/:id
// @desc    Like post
// @access  Private
router.post(
  '/like/:id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          }

          // Add user id to likes array
          post.likes.unshift({ user: req.user.id });

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/unlike/:id
// @desc    Unlike post
// @access  Private
router.post(
  '/unlike/:id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: 'You have not yet liked this post' });
          }

          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          post.likes.splice(removeIndex, 1);

          // Save
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.post(
  '/comment/:id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    Profile.findOne({user : req.user.id})
    .then(profile => profile)
    .then((profile)=>{
      Post.findById(req.params.id)
      .then(post => {
        console.log(profile)
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id,
          handle : profile.handle
        };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
    })
    .catch(err => res.status(404).json({ postnotfound: 'Not post found' }));
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Remove comment from post
// @access  Private
router.delete(
  '/comment/:post_id/:comment_id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {


    Post.findById(req.params.post_id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exist' });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// Update post
router.post(
  '/update-post/:post_id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {

    Post.findById(req.params.post_id)
      .then(post => {
        if(post.user == req.user.id || HIGHER_ROLES.includes(req.user.role)){
          
          const newPostObject = {};
          newPostObject.text = req.body.text ||  post.text;
          newPostObject.tags = req.body.tags || post.tags;

          post.update({
            '$set': newPostObject
          }, { new: true }).then(post2=>{
            res.status(200).json(post2);
          }).catch(err=>res.status(500).send(err));
        }
        else{
          res.status(401).json({
            notauthorized: 'unauthorized'
          });
        }
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);
router.post(
  '/update-comment/:post_id/:comment_id',
  [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user')],
  (req, res) => {


    Post.findById(req.params.post_id)
      .then(post => {
        // Check to see if comment exists
        if(post.user === req.user.id || HIGHER_ROLE.includes(req.user.role) ){
          const commentIndex = post.comments.findIndex(comment => comment._id.toString() === req.params.comment_id);
          if (commentIndex=-1) {
            return res
              .status(404)
              .json({ commentnotexists: 'Comment does not exist' });
          }
          const currentComment = post.comments[commentIndex];
          post.comments[commentIndex].text = req.body.text || currentComment.text;
          post.save().then(post => res.json(post));
        }
        else{
          res.status(401).json({
            notauthorized: 'unauthorized'
          });
        }

      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);
module.exports = router;
