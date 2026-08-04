import express from "express";

import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient
} from "../controllers/patientController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";
import {
  handleValidationErrors,
  paginationValidationRules,
  patientCreateValidationRules,
  patientIdParamValidationRules,
  patientUpdateValidationRules
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("receptionist", "admin"),
  patientCreateValidationRules,
  handleValidationErrors,
  createPatient
);

router.get(
  "/",
  authorizeRoles("admin", "doctor", "receptionist"),
  paginationValidationRules,
  handleValidationErrors,
  getAllPatients
);

router.get(
  "/:id",
  authorizeRoles("admin", "doctor", "receptionist"),
  patientIdParamValidationRules,
  handleValidationErrors,
  getPatientById
);

router.put(
  "/:id",
  authorizeRoles("receptionist", "admin"),
  patientUpdateValidationRules,
  handleValidationErrors,
  updatePatient
);

export default router;
