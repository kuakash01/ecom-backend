// config/multer.js
const multer = require('multer');

// Use memory storage to get the file buffer
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
