// const dotenv = require('dotenv');
require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const path = require('path'); 
const cookieParser = require('cookie-parser');



// database connection
require('./config/connection.db')(); // Import and call the connection function

const PORT = process.env.PORT || 5000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';


//middleware
app.use(express.urlencoded({ extended: true })); // middleware for parsing form data
app.use(express.json()); // middleware for parsing JSON data
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Adjust as needed
    credentials: true, // Allow cookies to be sent with requests
})); // middleware for enabling CORS
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cookieParser()); // middleware for parsing cookies


// route registration
app.use('/api', require('./routes/index'));


// app listening
app.listen(PORT, HOSTNAME, () => {
    console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
})