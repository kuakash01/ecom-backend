const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const FindUser = await User.findOne({ email });
        if (!FindUser) return res.status(404).json({ error: "User not found" });
        const isMatch = await FindUser.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT or session token here
        const token = jwt.sign(
            { id: FindUser._id, role: FindUser.role, email: FindUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        FindUser.tokens.push({ token });
        await FindUser.save();

       

        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production', // Set to true in production
        //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // for cross-site
        //     maxAge: 24 * 60 * 60 * 1000, // 1 days
        //     path: '/',
        // });

        res.status(200).json({
            message: "Login successful",
            user: FindUser.email,
            token: token
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });

    }
}
const signup = async (req, res) => {
    const { name, email, password, cnfPassword, role } = req.body;
    try {
        if (password !== cnfPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
        const newUser = new User({ name, email, role, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
const signout = async (req, res) => {
    const token = req.cookies.token;
    const userEmail = req.user.email;
    // res.status(200).json({ message: "Signout successful", user: user });
    try {
        const FindUser = await User.findOne({ email: userEmail });
        if (!FindUser) return res.status(404).json({ error: "User not found" });
        FindUser.tokens = FindUser.tokens.filter(t => t.token !== token);
        await FindUser.save();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Important: must match the path used when setting the cookie
    });
    res.status(200).json({ "response": "success", "type": "signout" });
}

const checkAuth = async (req, res) => {


    const { email } = req.user;
    // res.status(200).json({ email });
    try {
        const FindUser = await User.findOne({ email });
        if (!FindUser) return res.status(404).json({ error: "User not found" });

        res.status(200).json({
            message: "Authenticated",
            user: req.user.email // This will contain the decoded JWT payload
        });


    } catch (error) {
        res.status(500).json({ status: "failed", message: "error in user authentication" })
    }

}
module.exports = { signin, signup, checkAuth, signout }