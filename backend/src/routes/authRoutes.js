import express from "express";

import {
  getMe,
  loginUser,
  registerUser,
  seedTestUsers
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  handleValidationErrors,
  loginValidationRules,
  registerValidationRules
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post("/register", registerValidationRules, handleValidationErrors, registerUser);
router.post("/login", loginValidationRules, handleValidationErrors, loginUser);
router.get("/seed-test-users", seedTestUsers);
router.get("/me", protect, getMe);

export default router;
