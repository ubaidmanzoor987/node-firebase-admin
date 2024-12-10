// src/routes/superAdminRoutes.ts
import { Router } from "express";
import {
  createSuperAdmin,
  deleteNonChopdawgUsers,
} from "../controllers/superAdminController";

const router = Router();

router.post("/create", createSuperAdmin);
router.delete("/delete-users", deleteNonChopdawgUsers);

export default router;
