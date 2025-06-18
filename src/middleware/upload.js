    // src/middleware/upload.js
    const path = require('path');
    const multer = require('multer');

    const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
    });

    const upload = multer({ storage });

    module.exports = upload;
