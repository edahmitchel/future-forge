// Central error-handling middleware.
// Must have exactly 4 parameters so Express recognises it as an error handler.
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code was set
  const statusCode = err.statusCode || 500;
  const status = `${statusCode}`.startsWith("4") ? "fail" : "error";

  if (process.env.NODE_ENV === "development") {
    // In development include the full stack trace to aid debugging
    return res.status(statusCode).json({
      success: false,
      status,
      message: err.message,
      stack: err.stack,
    });
  }

  // In production only expose intentional (operational) errors
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      status,
      message: err.message,
    });
  }

  // Unknown / programming errors — hide detail from client
  console.error("UNHANDLED ERROR 💥", err);
  res.status(500).json({
    success: false,
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
};

module.exports = errorHandler;
