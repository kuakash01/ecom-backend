const sendEmail = require("../config/nodemailer");
const Users = require("../models/user.model");
const jwt = require("jsonwebtoken");
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");


const otpStore = {};


function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: "failed", message: "Email is required" });
        }

        const otp = generateOTP();
        otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

        // await sendEmail({
        //     to: email,
        //     subject: "Verify OTP",
        //     html: `<h1>Your Login OTP</h1><p>${otp}</p>`
        // });

        return res.json({ status: "success", message: "OTP sent to email", otp: otp });

    } catch (error) {
        console.error("Send OTP Error:", error);
        return res.status(500).json({ status: "failed", message: "Failed to send OTP" });
    }
};



const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ status: "failed", message: "Email and OTP required" });
        }

        const stored = otpStore[email];
        if (!stored) {
            return res.status(400).json({ status: "failed", message: "OTP expired or not sent" });
        }

        if (stored.otp !== otp) {
            return res.status(400).json({ status: "failed", message: "Invalid OTP" });
        }

        if (stored.expiresAt < Date.now()) {
            delete otpStore[email];
            return res.status(400).json({ status: "failed", message: "OTP expired" });
        }

        delete otpStore[email];

        // Check if user exists
        let user = await Users.findOne({ email });

        if (!user) {
            // Create new user
            user = await Users.create({
                name: `user-${Date.now()}`,
                email,
                role: "customer",
                tokens: []
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Save token into user's token array
        user.tokens.push(token);
        await user.save();

        res.json({
            status: "success",
            message: "OTP verified",
            email,
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "failed",
            message: "Internal server error"
        });
    }
};


const checkAuth = async (req, res) => {
    const { email } = req.user;
    // res.status(200).json({ email });
    try {
        let isAuthenticated = false;
        const FindUser = await Users.findOne({ email });
        if (!FindUser) return res.status(404).json({ status: "failed", message: "user not found", });

        // Find cart
        const cart = await Cart.findOne({ user: FindUser._id });

        let cartCount = 0;


        // If cart exists → count items
        if (cart) {

            const result = await CartItem.aggregate([
                {
                    $match: { cart: cart._id }
                },
                {
                    $group: {
                        _id: null,
                        totalQty: { $sum: "$quantity" }
                    }
                }
            ]);

            cartCount = result[0]?.totalQty || 0;
        }


        isAuthenticated = true;
        let userData = {
            email: req.user.email,
            role: req.user.role,
            profilePicture: FindUser.profilePicture,
        }
        res.status(200).json({
            status: "success",
            message: "Authenticated",
            data: { isAuthenticated, userData, cartCount } // This will contain the decoded JWT payload
        });


    } catch (error) {
        console.error("Error in checkAuth:", error);
        res.status(500).json({ status: "failed", message: "error in user authentication" })
    }
}

const logout = async (req, res) => {
    try {
        const userId = req.user.id;
        const token = req.token;
        await Users.findByIdAndUpdate(userId, { $pull: { tokens: token } });
        res.status(200).json({ status: "success", message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ status: "failed", message: "Server Error", error: err.message });
    }
}


module.exports = { checkAuth, sendOtp, verifyOtp, logout };