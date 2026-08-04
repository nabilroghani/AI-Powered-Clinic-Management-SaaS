import dotenv from "dotenv";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("⚠️ Uncaught Exception:", error);
});

const startServer = async () => {
  try {
    await connectDB();

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    setTimeout(startServer, 5000);
  }
};

startServer();

export default app;
