import express from "express";

import analyticsRoutes from "./analyticsRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import authRoutes from "./authRoutes.js";
import healthRoutes from "./healthRoutes.js";
import patientRoutes from "./patientRoutes.js";
import prescriptionRoutes from "./prescriptionRoutes.js";
import userRoutes from "./userRoutes.js";

const router = express.Router();

router.use("/analytics", analyticsRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/users", userRoutes);
router.use("/", healthRoutes);

export default router;
