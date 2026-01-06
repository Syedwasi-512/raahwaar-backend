// middlewares/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Curly braces use karein
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "raahwaar_products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: (req, file) => `prod-${Date.now()}-${file.originalname.split('.')[0]}`,
    },
});

const upload = multer({ storage: storage });
module.exports = upload;