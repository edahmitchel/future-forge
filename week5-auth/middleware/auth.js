const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Authorization header is missing",
      });
    }

    // Verify format: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
        message: "Expected 'Authorization: Bearer <token>'",
      });
    }

    const token = parts[1];

    // Verify token signature and expiration
    // Throws error if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload to request object
    // Now accessible in route handlers as req.user
    req.user = decoded;

    next(); // Continue to next middleware/route handler
  } catch (error) {
    // Token is invalid or expired
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        error: "Token expired",
        message: "Please login again",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        error: "Invalid token",
        message: "Token verification failed",
      });
    }

    res.status(500).json({
      success: false,
      error: "Authentication error",
      message: error.message,
    });
  }
};
const requireRole = (allowedRoles) => {
  // If single role provided, convert to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Check if verifyToken was run before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please provide a token",
      });
    }

    // Check if user's role is in allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: `This endpoint requires one of: ${roles.join(", ")}`,
      });
    }

    next(); // User has required role, continue
  };
};
module.exports = { verifyToken, requireRole };
