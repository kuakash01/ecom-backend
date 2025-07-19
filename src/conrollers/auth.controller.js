const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const signin = async (req, res) => {
    // const { email, password } = req.body;
    // try {
    //     const FindAdmin = await Admin.find({ email });
    //     if (!FindAdmin) return res.status(404).json({ error: "Admin not found" });
    //     const isMatch = FindAdmin.comparePassword(password);
    //     if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    //     // Generate JWT or session token here
    //     const token = jwt.sign(
    //         { id: FindAdmin._id, email: FindAdmin.email },
    //         process.env.JWT_SECRET,
    //         { expiresIn: process.env.JWT_EXPIRATION }
    //     );
    //     res.status(200).json({
    //         message: "Login successful",
    //         token: token,
    //     });
    // } catch (error) {
    //     return res.status(500).json({ error: error.message });

    // }
    // console.log(req);
    res.status(200).json({ "response": "ok", "data": req.body || "no data" });
}
const signup = (req, res) => {
    res.status(200).json({ "response": "ok", "type": "signup" });
}
module.exports = { signin, signup }