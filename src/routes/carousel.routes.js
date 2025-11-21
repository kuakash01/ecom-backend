const express =  require('express');
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken'); // Middleware to verify token

const {getCarousel} = require('../conrollers/carousel.controller');


router.get('/', getCarousel);


module.exports = router;