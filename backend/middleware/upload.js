const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isGif = file.mimetype === 'image/gif';
        return {
            folder: 'mempa/covers',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            // Si c'est un GIF, on ne fait pas de transformation pour ne pas faire planter Cloudinary.
            // Sinon, on applique le recadrage 500x500.
            transformation: isGif ? [] : [{ width: 500, height: 500, crop: 'fill' }]
        };
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max
});

module.exports = { upload, cloudinary };