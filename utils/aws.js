'use strict'
const AWS = require('aws-sdk');
const request = require('request');
const S3 = new AWS.S3();
const config = require('../config');

const operations = {
    s3Upload(bucket, file, name, callback) {
        const s3Bucket = new AWS.S3(
            {
                accessKeyId: config.AWS_USER_KEY,
                secretAccessKey: config.AWS_USER_SECRET,
                Bucket: bucket,
            },
            {
                partSize: 10 * 1024 * 1024,
                queueSize: 100
            }
        );
        const params = {
            Bucket: bucket,
            Key: name,
            Body: file
        };
        s3Bucket.upload(params, function (error, result) {
            if (error) {
                callback(error, null);
            }
            else {
                callback(null, result);
            }
        });
    },
    s3Delete(bucket, filename, callback) {
        const params = {
            Bucket: bucket,
            Key: filename
        };
        S3.deleteObject(params, function (error, data) {
            if (error) {
                console.log(error);
                callback(error, null);
            }
            else {
                callback(null, data);
            }
        });
    },

};
module.exports = operations;