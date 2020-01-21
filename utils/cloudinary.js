const Cloudinary = require("cloudinary").v2;
const config = require('../config');


const configClodinary = {
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    secure: true,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
};

Cloudinary.config(configClodinary);

const CloudinaryUpload = Cloudinary.uploader;


const upload = (file, fileName, callback )=>{
        const configUpload = {
            public_id: fileName,
            use_filename: true,
            unique_filename: true,
            folder : '/avatar'
        };
        CloudinaryUpload.upload(file, configUpload, function cloudinaryUploadCb(error, result){
            if(error){
                console.log('cloudinary err', error);
                callback(error, null);
            }
            else{
                console.log(result);
                callback(null, result);
            }
        });
    }

module.exports = upload;