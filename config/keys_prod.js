const config = {
  mongoURI: process.env.MONGO_URI,
  secretOrKey: process.env.SECRET_OR_KEY,
  SUPER_ADMIN_MAIL: process.env.SUPER_ADMIN_MAIL,
  AWS_USER_KEY: process.env.AWS_USER_KEY,
  AWS_USER_SECRET: process.env.AWS_USER_SECRET,
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET_URL: process.env.AWS_BUCKET_URL,
  AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL,
  AWS_BUCKET_Assets: process.env.AWS_BUCKET_Assets,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_URL:process.env.CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,

  SMTP_SERVICE : process.env.SMTP_SERVICE,
  SMTP_AUTH_MAIL : process.env.SMTP_AUTH_MAIL,
  SMTP_AUTH_PASS : process.env.SMTP_AUTH_PASS,
  BASE_URL : 'https://calm-retreat-93373.herokuapp.com',
  REQUEST_FRONTNEND_BASE_URL: 'https://alumni-portal-bpit.herokuapp.com'

};

module.exports = config;



