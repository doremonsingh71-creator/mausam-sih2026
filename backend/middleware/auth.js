const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sih2026_mausam_byteforce02_secure_secret_key";

/**
 * Express Middleware to verify Bearer JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access Denied: Missing Bearer Authentication Token."
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Invalid or expired token session."
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Issues signed JWT token valid for 30 days
 */
function generateUserToken(userId, phone) {
  return jwt.sign(
    { userId, phone, role: "citizen" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

module.exports = {
  authenticateToken,
  generateUserToken,
  JWT_SECRET
};
