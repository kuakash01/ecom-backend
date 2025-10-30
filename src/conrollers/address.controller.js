// const Address = require('../models/address.model');

const addAddress = async (req, res) => {
    try{
        const {phone, alternatePhone, street, city, state, country, pincode} = req.body;
        const userId = req.user.id; // verifyToken middleware adds user info to req

        res.status(200).json({status: 'success', message: 'Address added successfully', data:{
            phone,
            alternatePhone,
            street,
            city,
            state,
            country,
            pincode,
            user: userId
        }});

    } catch(err){
        res.status(500).json({status: 'failed', message: 'Server Error', error: err.message});
    }
}
module.exports = {addAddress};