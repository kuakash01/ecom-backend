require("dotenv").config();
const mongoose = require('mongoose');


module.exports = async() => {
    try {
    
        const db_connection =  await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log('MongoDB connected successfully');
        return db_connection;
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
    
}
