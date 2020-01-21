const keys = require('./keys');
const config = {
    HIGHER_ROLES: ['superadmin', 'admin', 'moderator'],
    ALL_ROLES: ['superadmin', 'admin', 'moderator', 'user', 'guest'],
    AWS_USER_KEY: keys.AWS_USER_KEY,
    AWS_USER_SECRET: keys.AWS_USER_SECRET,
    AWS_REGION: keys.AWS_REGION,
    AWS_BUCKET_URL: keys.AWS_BUCKET_URL,
    AWS_CLOUDFRONT_URL: keys.AWS_CLOUDFRONT_URL,
    AWS_BUCKET_Assets: keys.AWS_BUCKET_Assets,
    CLOUDINARY_API_KEY: keys.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: keys.CLOUDINARY_API_SECRET,
    CLOUDINARY_URL:keys.CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME: keys.CLOUDINARY_CLOUD_NAME,

    SMTP_SERVICE : keys.SMTP_SERVICE,
    SMTP_AUTH_MAIL : keys.SMTP_AUTH_MAIL,
    SMTP_AUTH_PASS : keys.SMTP_AUTH_PASS
};
module.exports = config;