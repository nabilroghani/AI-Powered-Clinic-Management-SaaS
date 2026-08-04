import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting auto-reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB successfully reconnected!");
    });

    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
