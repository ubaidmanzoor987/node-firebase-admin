// src/routes/resourceRoutes.ts
import { Router } from "express";
import {
  createBulkAssessments,
  createAssessment,
  deleteAllAssessments,
  generateYearlyAssessments,
  deleteAssessmentSessionsByPatientId
} from "../controllers/assessmentController";

const router = Router();

// Endpoint for creating a new resource
router.post("/create", createAssessment);
router.post("/create-bulk", createBulkAssessments);
router.post("/create-assesment-response-yearly", generateYearlyAssessments);
router.delete("/delete-all", deleteAllAssessments);
router.delete("/assessmentSessions", deleteAssessmentSessionsByPatientId);

export default router;
