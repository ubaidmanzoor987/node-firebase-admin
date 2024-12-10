import express from "express";
import {
  createBulkMoodCheckins,
  createMoodCheckin,
} from "../controllers/dailyMoodCheckIns";

const router = express.Router();

// Route to create a life event
router.post("/create", createMoodCheckin);
router.post("/create-bulk-data", createBulkMoodCheckins);

export default router;
