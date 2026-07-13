const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary only if variables are set
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary successfully configured for image uploads.');
} else {
  console.log('Cloudinary environment variables missing. Falling back to local filesystem storage.');
}

const getMulterStorage = (fallbackStorage) => {
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'mythri-restaurant',
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
        public_id: (req, file) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          // Get basic file name without extension
          const baseName = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9]/g, '_');
          return file.fieldname + '-' + baseName + '-' + uniqueSuffix;
        }
      }
    });
  }
  return fallbackStorage;
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  getMulterStorage
};
