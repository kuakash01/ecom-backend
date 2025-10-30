// middleware/roleCheck.js
const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient rights" });
    }
    next();
  };
};

module.exports = roleCheck;
