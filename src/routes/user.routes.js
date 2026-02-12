const express = require('express');
const router = express.Router();
const upload = require('../config/multer'); 

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token

const { getProfile, updateProfile } = require('../conrollers/user.controller');


// router.post('/', verifyToken, createOrder);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken,  upload.single("profilePicture"), updateProfile);


module.exports = router;