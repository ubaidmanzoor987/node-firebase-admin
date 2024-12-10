// src/routes/areaOfFocusRoutes.ts
import { Router } from "express";
import {
  createAreaOfFocus,
  deleteAllAreas,
} from "../controllers/areaOfFocusController";

const router = Router();

router.post("/create", createAreaOfFocus);
router.delete("/delete-all", deleteAllAreas);

export default router;
