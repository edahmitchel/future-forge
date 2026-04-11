const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Authorization header is missing",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
        message: "Expected 'Authorization: Bearer <token>'",
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
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
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please provide a token",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: `This endpoint requires one of: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
