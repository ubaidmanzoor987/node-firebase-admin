// src/routes/resourceRoutes.ts
import { Router } from "express";
import {
  createBulkResources,
  createResource,
  deleteAllResources,
} from "../controllers/resourceController";

const router = Router();

// Endpoint for creating a new resource
router.post("/create", createResource);
router.post("/create-bulk", createBulkResources);
router.delete("/delete-all", deleteAllResources);

export default router;
