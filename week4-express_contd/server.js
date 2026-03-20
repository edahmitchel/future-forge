require("dotenv").config();
const express = require("express");
const userRouter = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/appError");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/users", userRouter);

// 404 Handler for undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
