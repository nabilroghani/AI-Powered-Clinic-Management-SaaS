import express from "express";

import {
  bookAppointment,
  getDoctorSchedule,
  getPatientAppointmentHistory,
  updateAppointmentStatus
} from "../controllers/appointmentController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";
import {
  appointmentCreateValidationRules,
  appointmentStatusUpdateValidationRules,
  doctorScheduleValidationRules,
  handleValidationErrors,
  patientHistoryValidationRules
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("receptionist", "patient"),
  appointmentCreateValidationRules,
  handleValidationErrors,
  bookAppointment
);

router.put(
  "/:id/status",
  authorizeRoles("receptionist", "doctor", "admin"),
  appointmentStatusUpdateValidationRules,
  handleValidationErrors,
  updateAppointmentStatus
);

router.get(
  "/doctor/:doctorId/schedule",
  authorizeRoles("doctor", "admin"),
  doctorScheduleValidationRules,
  handleValidationErrors,
  getDoctorSchedule
);

router.get(
  "/patient/:patientId/history",
  authorizeRoles("patient", "doctor", "receptionist"),
  patientHistoryValidationRules,
  handleValidationErrors,
  getPatientAppointmentHistory
);

export default router;
