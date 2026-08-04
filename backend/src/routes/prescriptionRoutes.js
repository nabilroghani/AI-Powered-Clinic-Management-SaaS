import express from "express";

import {
  createPrescription,
  getDoctorPrescriptions,
  getPatientMedicalHistory,
  runAntigravityAiAssistant,
  runPrescriptionExplanation,
  runSmartDiagnosis
} from "../controllers/prescriptionController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";
import { checkProPlan } from "../middlewares/saasMiddleware.js";
import {
  handleValidationErrors,
  patientHistoryValidationRules,
  prescriptionCreateValidationRules,
  prescriptionExplainValidationRules,
  smartDiagnosisValidationRules
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("doctor"),
  prescriptionCreateValidationRules,
  handleValidationErrors,
  createPrescription
);

router.get(
  "/doctor",
  authorizeRoles("doctor"),
  getDoctorPrescriptions
);

router.get(
  "/history/:patientId",
  authorizeRoles("doctor", "admin", "receptionist", "patient"),
  patientHistoryValidationRules,
  handleValidationErrors,
  getPatientMedicalHistory
);

router.post(
  "/ai-diagnose",
  authorizeRoles("doctor"),
  checkProPlan,
  smartDiagnosisValidationRules,
  handleValidationErrors,
  runSmartDiagnosis
);

router.post(
  "/ai-explain/:prescriptionId",
  authorizeRoles("doctor", "patient"),
  checkProPlan,
  prescriptionExplainValidationRules,
  handleValidationErrors,
  runPrescriptionExplanation
);

router.post("/ai-assistant", runAntigravityAiAssistant);

export default router;
