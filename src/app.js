// const dotenv = require('dotenv');
require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// database connection
require('./config/connection.db')(); // Import and call the connection function

const PORT = process.env.PORT || 5000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';

//middleware
app.use(express.urlencoded({ extended: true })); // middleware for parsing form data
app.use(express.json()); // middleware for parsing JSON data
app.use(cors()); // middleware for enabling CORS

app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/products", require("./routes/products.routes"))


// app listening
app.listen(PORT, HOSTNAME, () => {
    console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
})