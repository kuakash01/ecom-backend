const sendEmail = require("../config/mailer");
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



    res.json({ status: "success", message: "OTP sent to email", otp: otp });

    sendEmail({
      to: email,
      subject: "Verify OTP",
      // html: `<h1>Your Login OTP</h1><p>${otp}</p>`
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <title>OTP Verification</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, sans-serif;
    }

    .container {
      width: 100%;
      padding: 30px 15px;
      background-color: #f4f6f8;
    }

    .card {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    }

    .logo {
      text-align: center;
      margin-bottom: 20px;
      font-size: 22px;
      font-weight: bold;
      color: #4f46e5;
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 10px;
      text-align: center;
    }

    .subtitle {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 25px;
      line-height: 1.5;
    }

    .otp-box {
      background: #f9fafb;
      border: 2px dashed #4f46e5;
      border-radius: 10px;
      padding: 15px;
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #4f46e5;
      margin-bottom: 25px;
    }

    .info {
      font-size: 13px;
      color: #6b7280;
      text-align: center;
      line-height: 1.5;
      margin-bottom: 25px;
    }

    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 15px;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }

    .brand {
      font-weight: 600;
      color: #4f46e5;
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="card">

      <div class="logo">
        🛍️ Ecom - Made by Akash Kumar
      </div>

      <div class="title">
        Verify Your Login
      </div>

      <div class="subtitle">
        Use the OTP below to securely sign in to your account.
      </div>

      <div class="otp-box">
        ${otp}
      </div>

      <div class="info">
        This OTP is valid for <strong>5 minutes</strong>.<br/>
        Please do not share this code with anyone.
      </div>

      <div class="footer">
        If you didn’t request this, you can safely ignore this email.<br/>
        © ${new Date().getFullYear()} <span class="brand">YourStore</span>. All rights reserved.
      </div>

    </div>

  </div>

</body>
</html>
`

    }).catch(err => console.log("Mail failed:", err));

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({ status: "failed", message: "Failed to send OTP" });
  }
};



// const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({ status: "failed", message: "Email and OTP required" });
//     }

//     const stored = otpStore[email];
//     if (!stored) {
//       return res.status(400).json({ status: "failed", message: "OTP expired or not sent" });
//     }

//     if (stored.otp !== otp) {
//       return res.status(400).json({ status: "failed", message: "Invalid OTP" });
//     }

//     if (stored.expiresAt < Date.now()) {
//       delete otpStore[email];
//       return res.status(400).json({ status: "failed", message: "OTP expired" });
//     }

//     delete otpStore[email];

//     // Check if user exists
//     let user = await Users.findOne({ email });

//     if (!user) {
//       // Create new user
//       user = await Users.create({
//         name: `user-${Date.now()}`,
//         email,
//         role: "customer",
//         tokens: []
//       });
//     }

//     // Generate token
//     const token = jwt.sign(
//       { id: user._id, role: user.role, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     // Save token into user's token array
//     user.tokens.push(token);
//     await user.save();

//     res.json({
//       status: "success",
//       message: "OTP verified",
//       email,
//       token
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       status: "failed",
//       message: "Internal server error"
//     });
//   }
// };

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: "failed",
        message: "Email and OTP required"
      });
    }

    const stored = otpStore[email];

    if (!stored) {
      return res.status(400).json({
        status: "failed",
        message: "OTP expired or not sent"
      });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid OTP"
      });
    }

    if (stored.expiresAt < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({
        status: "failed",
        message: "OTP expired"
      });
    }

    // Remove OTP
    delete otpStore[email];

    // Find user
    let user = await Users.findOne({ email });

    // Create user if not exists
    if (!user) {
      user = await Users.create({
        name: `user-${Date.now()}`,
        email,
        role: "customer",
        tokens: []
      });
    }

    /* ===============================
       🧹 CLEAN EXPIRED TOKENS HERE
       =============================== */

    const originalLength = user.tokens.length;

    user.tokens = user.tokens.filter(token => {
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        return true; // keep valid
      } catch {
        return false; // remove expired
      }
    });

    // Save only if something removed
    if (user.tokens.length !== originalLength) {
      await user.save();
    }

    /* ===============================
       🔐 CREATE NEW TOKEN
       =============================== */

    const newToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Store token
    user.tokens.push(newToken);
    await user.save();

    res.json({
      status: "success",
      message: "OTP verified",
      email,
      token: newToken
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
      cartCount
    }
    res.status(200).json({
      status: "success",
      message: "Authenticated",
      data: { isAuthenticated, userData } // This will contain the decoded JWT payload
    });


  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({ status: "failed", message: "error in user authentication" })
  }
}

const signout = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.token;
    await Users.findByIdAndUpdate(userId, { $pull: { tokens: token } });
    res.status(200).json({ status: "success", message: "Logged out successfully", data: { isAuthentcated: false, userData: null } });
  } catch (err) {
    res.status(500).json({ status: "failed", message: "Server Error", error: err.message });
  }
}


module.exports = { checkAuth, sendOtp, verifyOtp, signout };