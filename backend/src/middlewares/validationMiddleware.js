import { body, param, query, validationResult } from "express-validator";

const validRoles = ["admin", "doctor", "receptionist", "patient"];
const appointmentStatuses = ["confirmed", "completed", "cancelled"];
const supportedExplanationLanguages = ["English", "Urdu"];

const patientCreateValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Patient name is required."),
  body("age")
    .notEmpty()
    .withMessage("Patient age is required.")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Patient age must be a non-negative integer."),
  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Patient gender is required."),
  body("contact")
    .trim()
    .notEmpty()
    .withMessage("Patient contact is required.")
];

const patientUpdateValidationRules = [
  param("id")
    .isMongoId()
    .withMessage("A valid patient ID is required."),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Patient name cannot be empty."),
  body("age")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Patient age must be a non-negative integer."),
  body("gender")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Patient gender cannot be empty."),
  body("contact")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Patient contact cannot be empty.")
];

const patientIdParamValidationRules = [
  param("id")
    .isMongoId()
    .withMessage("A valid patient ID is required.")
];

const paginationValidationRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100.")
];

const registerValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required.")
    .bail()
    .isIn(validRoles)
    .withMessage("Role must be one of: admin, doctor, receptionist, patient."),
  body("patientProfile")
    .optional()
    .isMongoId()
    .withMessage("Patient profile must be a valid MongoDB ObjectId.")
];

const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
];

const appointmentCreateValidationRules = [
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required.")
    .bail()
    .isMongoId()
    .withMessage("Patient ID must be a valid MongoDB ObjectId."),
  body("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required.")
    .bail()
    .isMongoId()
    .withMessage("Doctor ID must be a valid MongoDB ObjectId."),
  body("date")
    .notEmpty()
    .withMessage("Appointment date is required.")
    .bail()
    .isISO8601()
    .withMessage("Appointment date must be a valid ISO 8601 date.")
    .toDate()
];

const appointmentStatusUpdateValidationRules = [
  param("id")
    .isMongoId()
    .withMessage("A valid appointment ID is required."),
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Appointment status is required.")
    .bail()
    .isIn(appointmentStatuses)
    .withMessage("Status must be one of: confirmed, completed, cancelled.")
];

const doctorScheduleValidationRules = [
  param("doctorId")
    .isMongoId()
    .withMessage("A valid doctor ID is required."),
  query("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date.")
    .toDate()
];

const patientHistoryValidationRules = [
  param("patientId")
    .isMongoId()
    .withMessage("A valid patient ID is required.")
];

const prescriptionCreateValidationRules = [
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required.")
    .bail()
    .isMongoId()
    .withMessage("Patient ID must be a valid MongoDB ObjectId."),
  body("medicines")
    .isArray({ min: 1 })
    .withMessage("At least one medicine entry is required."),
  body("medicines.*.name")
    .trim()
    .notEmpty()
    .withMessage("Medicine name is required."),
  body("medicines.*.dosage")
    .trim()
    .notEmpty()
    .withMessage("Medicine dosage is required."),
  body("medicines.*.duration")
    .trim()
    .notEmpty()
    .withMessage("Medicine duration is required."),
  body("medicines.*.notes")
    .optional()
    .trim(),
  body("instructions")
    .trim()
    .notEmpty()
    .withMessage("Prescription instructions are required.")
];

const smartDiagnosisValidationRules = [
  body("symptoms")
    .trim()
    .notEmpty()
    .withMessage("Symptoms are required."),
  body("age")
    .notEmpty()
    .withMessage("Age is required.")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Age must be a non-negative integer."),
  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required."),
  body("patientId")
    .optional()
    .isMongoId()
    .withMessage("Patient ID must be a valid MongoDB ObjectId.")
];

const prescriptionExplainValidationRules = [
  param("prescriptionId")
    .isMongoId()
    .withMessage("A valid prescription ID is required."),
  body("language")
    .optional()
    .trim()
    .isIn(supportedExplanationLanguages)
    .withMessage("Language must be either English or Urdu.")
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Validation failed.",
    errors: errors.array().map((error) => ({
      field: error.path,
      message: error.msg
    }))
  });
};

export {
  appointmentCreateValidationRules,
  appointmentStatusUpdateValidationRules,
  doctorScheduleValidationRules,
  handleValidationErrors,
  loginValidationRules,
  paginationValidationRules,
  patientCreateValidationRules,
  patientHistoryValidationRules,
  patientIdParamValidationRules,
  patientUpdateValidationRules,
  prescriptionCreateValidationRules,
  prescriptionExplainValidationRules,
  registerValidationRules,
  smartDiagnosisValidationRules
};
