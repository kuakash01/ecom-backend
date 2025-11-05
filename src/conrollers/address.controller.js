const Address = require('../models/address.model');
const addressValidation = require('../validations/address.validation');

const addAddress = async (req, res) => {
    try {
        
        // Validate request body
        const { error } = addressValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ status: 'failed', message: error.details[0].message });
        }
        
        const { fullName, phone, alternatePhone, street, city, state, country, pincode } = req.body;
        const userId = req.user.id; // verifyToken middleware adds user info to req

        
        const newAddress = new Address({
            user: userId,
            fullName,
            phone,
            alternatePhone,
            street,
            city,
            state,
            country,
            pincode,
        })
        await newAddress.save();
        res.status(200).json({ status: 'success', message: 'Address added successfully', data: newAddress });

    } catch (err) {
        res.status(500).json({ status: 'failed', message: 'Server Error', error: err.message });
    }
}

const getAddress = async (req, res) => {
    try {
        const userId = req.user.id; // verifyToken middleware adds user info to req
        const addresses = await Address.find({ user: userId });
        if (addresses.length === 0) {
            return res.status(404).json({ status: "failed", message: "No addresses found" });
        }
        res.status(200).json({ status: "success", data: addresses });
    } catch (err) {
        res.status(500).json({ status: "failed", message: "Server Error", error: err.message });
    }
}

const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.user.id;
        const { phone, alternatePhone, street, city, state, country, pincode } = req.body;
        const address = await Address.findOneAndUpdate(
            { _id: addressId, user: userId },
            {
                phone,
                alternatePhone,
                street,
                city,
                state,
                country,
                pincode,
            },
            { new: true }
        );
        if (!address) {
            return res.status(404).json({ status: "failed", message: "Address not found" });
        }
        res.status(200).json({ status: "success", message: "Address updated successfully", data: address });
    } catch (err) {
        res.status(500).json({ status: "failed", message: "Server Error", error: err.message });
    }
}


const deleteAddress = async(req, res)=>{
    try{
        const addressId = req.params.addressId;
        const userId = req.user.id;

        const address = await Address.findOneAndDelete({_id: addressId, user: userId});
        if(!address){
            return res.status(404).json({status: "failed", message: "Address not found"});
        }
        res.status(200).json({status: "success", message: "Address deleted successfully"});
    } catch (err) {
        res.status(500).json({status: "failed", message: "Server Error", error: err.message});
    }
}




module.exports = { addAddress, getAddress, updateAddress, deleteAddress };