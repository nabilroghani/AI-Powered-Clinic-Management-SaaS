import express from "express";

import {
  getAdminAnalytics,
  getDoctorAnalytics
} from "../controllers/analyticsController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/admin", authorizeRoles("admin"), getAdminAnalytics);
router.get("/doctor", authorizeRoles("doctor"), getDoctorAnalytics);

export default router;
