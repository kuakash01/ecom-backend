const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// const verifyToken = (req, res, next) => {
//   // Expect header: Authorization: "Bearer <token>"
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).json({ error: "Unauthorized, token missing" });
//   }

//   // Extract token
//   const token = authHeader.split(' ')[1]; // "Bearer <token>"

//   if (!token) {
//     return res.status(401).json({ error: "Unauthorized, token missing" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // attach user info to request
//     next();
//   } catch (err) {
//     return res.status(403).json({ error: "Invalid token" });
//   }
// };



// const verifyToken = async (req, res, next) => {
//   try {
//     // Expect header: Authorization: "Bearer <token>"
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({ error: "Unauthorized, token missing" });
//     }

//     // Extract token
//     const token = authHeader.split(' ')[1]; // "Bearer <token>"

//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized, token missing" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({
//       _id: decoded._id,
//       "tokens.token": token // 🔥 IMPORTANT
//     });

//     if (!user) {
//       return res.status(403).json({ error: "Invalid token" });
//     }

//     req.user = decoded; // attach user info to request
//     req.token = token;
//     next();
//   } catch (err) {
//     return res.status(403).json({ error: "Invalid token" });
//   }
// };


const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {

      // 🔥 Token expired
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please login again."
        });
      }

      // 🔥 Invalid token
      return res.status(401).json({
        message: "Invalid token"
      });
    }

    // DB check
    const user = await User.findOne({
      _id: decoded.id,
      tokens: token
    });


    if (!user) {
      return res.status(401).json({
        message: "Token revoked"
      });
    }

    req.user = user;
    req.token = token;

    next();

  } catch (err) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = verifyToken;