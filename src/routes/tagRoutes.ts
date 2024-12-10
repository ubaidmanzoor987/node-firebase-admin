// src/routes/tagRoutes.ts
import { Router } from "express";
import { createTag } from "../controllers/tagController";

const router = Router();

// Endpoint for creating a new tag
router.post("/create", createTag);

export default router;
