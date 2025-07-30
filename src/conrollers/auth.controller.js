const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const FindAdmin = await Admin.findOne({ email });
        if (!FindAdmin) return res.status(404).json({ error: "Admin not found" });
        const isMatch = await FindAdmin.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT or session token here
        const token = jwt.sign(
            { id: FindAdmin._id, email: FindAdmin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        FindAdmin.tokens.push({ token });
        await FindAdmin.save();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            sameSite: 'lax', // Adjust based on your needs
            maxAge: 24 * 60 * 60 * 1000, // 1 days
            path: '/',
        });

        res.status(200).json({
            message: "Login successful",
            user: FindAdmin.email,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });

    }
}
const signup = (req, res) => {
    res.status(200).json({ "response": "ok", "type": "signup" });
}
const signout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Important: must match the path used when setting the cookie
    });
    res.status(200).json({ "response": "ok", "type": "signout" });
}

const checkAuth = (req, res) => {

    
    // const { email} = req.user;
    // try {
    //     const FindAdmin = await Admin.findOne({ email });
    //     if (!FindAdmin) return res.status(404).json({ error: "Admin not found" });
    //     const isMatch = await FindAdmin.comparePassword(password);
    //     if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    //     res.status(200).json({
    //         message: "Authenticated",
    //         user: req.user.email // This will contain the decoded JWT payload
    //     });

    // } catch (error){
    //     res.status(500).message("error in user authnetication")
    // }

    // console.log("auth chek",new Date(), req.user.email)
    res.status(200).json({
        message: "Authenticated",
        user: req.user.email // This will contain the decoded JWT payload
    });
}
module.exports = { signin, signup, checkAuth, signout }