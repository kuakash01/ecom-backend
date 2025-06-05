require("dotenv").config();
const mongoose = require('mongoose');


const DB_URL = process.env.MONGO_URI+"/"+process.env.DB_NAME; // Replace with your MongoDB connection string


module.exports = async() => {
    try {
    
        const db_connection =  await mongoose.connect(`${DB_URL}`);
        console.log('MongoDB connected successfully');
        return db_connection;
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
    
}
