const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected successfully");
    console.log(
      `  Database: ${process.env.MONGO_URI.split("/").pop().split("?")[0]}`,
    );
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
