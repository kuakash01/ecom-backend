const jwt = require("jsonwebtoken");

// const verifyToken = (req, res, next) => {
//   const token = req.cookies.token; // requires cookie-parser

//   if (!token) return res.status(401).json({ error: "Unauthorized" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // set user in request
//     next();
//   } catch (err) {
//     return res.status(403).json({ error: "Invalid token" });
//   }
// };


const verifyToken = (req, res, next) => {
  // Expect header: Authorization: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized, token missing" });
  }

  // Extract token
  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Unauthorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;