import express from "express";

import { getDoctorsDirectory } from "../controllers/userController.js";
import { authorizeRoles, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/doctors", authorizeRoles("admin", "receptionist"), getDoctorsDirectory);

export default router;
