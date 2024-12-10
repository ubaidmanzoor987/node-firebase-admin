// src/routes/moduleRoutes.ts
import { Router } from "express";
import {
  createModule,
  createBulkModules,
  deleteAllModules,
} from "../controllers/moduleController";

const router = Router();

// Endpoint for creating a single module
router.post("/create", createModule);
router.post("/create-bulk", createBulkModules);
router.delete("/delete-all", deleteAllModules);

export default router;
