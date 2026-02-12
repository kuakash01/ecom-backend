const Address = require('../models/address.model');
const addressValidation = require('../validations/address.validation');
const User = require('../models/user.model');

const addAddress = async (req, res) => {
    try {

        // Validate request body
        const { error } = addressValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ status: 'failed', message: error.details[0].message });
        }

        const { fullName, phone, alternatePhone, addressLine1, addressLine2, landmark, city, state, country, pincode, addressType } = req.body;
        const userId = req.user.id; // verifyToken middleware adds user info to req


        const newAddress = new Address({
            user: userId,
            fullName,
            phone,
            alternatePhone,
            addressLine1,
            addressLine2,
            landmark,
            city,
            state,
            country,
            pincode,
            addressType,
            isDefault: true, // Set new address as default
        })
        await newAddress.save();

        const addresses = await Address.updateMany(
            { user: userId, _id: { $ne: newAddress._id } },
            { $set: { isDefault: false } }
        );

        res.status(200).json({ status: 'success', message: 'Address added successfully', data: newAddress });

    } catch (err) {
        console.error("Error adding address:", err);
        res.status(500).json({ status: 'failed', message: 'Server Error', error: err.message });
    }
}

const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id; // verifyToken middleware adds user info to req
        const addresses = await Address.find({ user: userId });

        res.status(200).json({ status: "success", data: addresses });
    } catch (err) {
        res.status(500).json({ status: "failed", message: "Server Error", error: err.message });
    }
}

const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.user.id;
        const { phone, alternatePhone, addressLine1, addressLine2, landmark, city, state, country, pincode, addressType } = req.body;
        const address = await Address.findOneAndUpdate(
            { _id: addressId, user: userId },
            {
                phone,
                alternatePhone,
                addressLine1,
                addressLine2,
                landmark,
                city,
                state,
                country,
                pincode,
                addressType,
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


const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const userId = req.user.id;

        const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
        if (!address) {
            return res.status(404).json({ status: "failed", message: "Address not found" });
        }
        res.status(200).json({ status: "success", message: "Address deleted successfully" });
    } catch (err) {
        res.status(500).json({ status: "failed", message: "Server Error", error: err.message });
    }
}



const setDefaultAddress = async (req, res) => {
    try {

        const userId = req.user.id;
        const addressId = req.params.addressId;


        // Check address belongs to user
        const address = await Address.findOne({
            _id: addressId,
            user: userId
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found",
            });
        }


        // Remove default from all addresses
        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );


        // Set this as default
        address.isDefault = true;
        await address.save();


        res.status(200).json({
            success: true,
            message: "Default address updated",
            data: address,
        });

    } catch (err) {

        console.error("Set Default Error:", err);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};



module.exports = { addAddress, getAddresses, updateAddress, deleteAddress, setDefaultAddress };