'use strict'

const User = require('../models/User');
const Profile = require('../models/Profile');
const ObjectId = require('mongoose').Types.ObjectId;
const bcrypt = require('bcryptjs');
const config = require('../config/keys');

function deleteExistingSuperAdmin(userIds) {
    console.log("PREVIOUS SUPERADMIN EXIST DLETEING");

    const QUERY_PROFILE = {
        'user': {
            '$in': userIds
        }
    };
    console.log(userIds);
    Profile
        .remove(QUERY_PROFILE, (error1, results) => {
            if (error1) {
                console.log("ERROR WHILE PROFILE DELETEING");
                console.log(error1);
                process.exit();
            }
            else {
                User
                    .remove({
                        '_id': {
                            '$in': userIds
                        }
                    }, (error3, results2) => {
                        if (error3) {
                            console.log("ERROR WHILE DELETING USERS");
                            process.exit();
                        }
                        else {
                            create();
                        }
                    });
            }
        });
}

function create() {
    console.log("CREATING USER");
    const newUser = new User({
        name: 'superadmin',
        email: config.SUPER_ADMIN_MAIL,
        password: 'Superadmin@123',
        emailVerified: true,
        role: 'superadmin',
        verifiedAccount: true
    });

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
                .save()
                .then(user => {
                    console.log("CREATED SUPERDADMIN");

                    const profileObj = {
                        user: user._id,
                        handle: 'superadmin',
                        skills: ['teach', 'management'],
                        status: 'System Admin',
                        verifiedAccount: true
                    };
                    const profileObjNew = new Profile(profileObj);
                    profileObjNew.save(profileObj)
                    .then(profile=> {
                        const FIND_QUERY = {
                            '_id': user._id
                        };
                        const UPDATE_QUERY = {
                            '$set': {
                                'profile': profile._id
                            }
                        };
                        User
                        .findByIdAndUpdate(FIND_QUERY, UPDATE_QUERY)
                        .then(user=>{
                            console.log("SUCCEFFULLY CREATED USER & PROFILE");
                        })
                        .catch(console.error);

                    })
                    .catch(err=> process.exit());
                })
                .catch(err => {
                    console.log("CREATING USER");
                    process.exit();
                });
        });
    });
}

function createSuperAdmin() {
    console.log("\n");
    console.log("_______INTI_________");
    console.log("\n");

    const QUERY_USER = {
        'role': 'superadmin'
    };
    User
        .find(QUERY_USER, (error, results) => {
            if (error) {
                console.log("ERROR WHILE USER FINDING WITH ROLE SUPERADMIN \n");
                console.log(error);
                process.exit();
            }
            else {

                if (results && results.length === 0) {
                    console.log("NO PREVIOUS SUPERADMIN FOUND");
                    create();
                }
                else {
                    const userIds = [];
                    for (let i = 0; i < results.length; i++) {
                        const users = results[i];
                        userIds.push(users._id);
                    }
                    console.log("SUPER ADMIN FOUND", results.length);
                    deleteExistingSuperAdmin(userIds);
                }

            }
        });
}

module.exports = {
    createSuperAdmin
};