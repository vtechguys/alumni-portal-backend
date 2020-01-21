const express = require('express')
const router = express.Router()
const passport = require('passport')

const middleware = require('../../middleware/authenticate')
const Profile = require('../../models/Profile')
const Post = require('../../models/Post')


router.post(
    "/search",
    [passport.authenticate('jwt', { session: false }), middleware.validateRole('superadmin', 'admin', 'moderator', 'user', 'guest')],
    async (req, res)=>{

        // console.log(req)
        const keyword = req.body.keyword
        const key = req.body.key

        const result = {}
        result['profiles'] = []
        result['posts'] = []
        result['timestamp'] = req.body.timestamp;
        // console.log(req.body);
        
        console.log(key)
        switch(key){
            case 'profile' : {

                const profiles = await Profile.find({handle : keyword}).populate('user',['name', 'avatar'])
                if(profiles.length > 0){
                    profiles.forEach((profile)=>{
                        result.profiles.push({
                            name : profile.user.name,
                            avatar : profile.user.avatar,
                            handle : profile.handle
                        })
                    })
                }

                break
            }
            case 'post' : {
                const posts = await Post.find({tags : keyword})
                result.posts = posts
                break
            }

            default :
             null
        }
       

        
        console.log(result)
        res.json({data : result})
    }
)

module.exports = router