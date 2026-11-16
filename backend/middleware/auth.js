// Authentication (who are you?) and authorization (are you allowed?)
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// protect: user must send "Authorization: Bearer <token>"
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not logged in. Please sign in first." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "This account no longer exists." });
    }

    req.user = user; // available in every route after this middleware
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
  }
}

// adminOnly: must come AFTER protect. Customers get 403 Forbidden.
function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Forbidden: admin access only." });
}

module.exports = { protect, adminOnly };
