const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    // Connect to MongoDB
    // useNewUrlParser & useUnifiedTopology: modern MongoDB driver options
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✓ MongoDB connected successfully");
    console.log(
      `  Database: ${process.env.MONGO_URI.split("/").pop().split("?")[0]}`,
    );
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1); // Exit process on connection failure
  }
};

module.exports = connectDB;
