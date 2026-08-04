import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "⚡ MedPulse AI Clinic Management SaaS API is Live & Healthy!",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      auth: "/api/auth",
      patients: "/api/patients",
      prescriptions: "/api/prescriptions",
      appointments: "/api/appointments"
    }
  });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
