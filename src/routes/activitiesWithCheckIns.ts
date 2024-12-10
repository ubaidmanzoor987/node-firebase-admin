import express from "express";
import {
  createUserActivities,
  createBulkDailyActivityCheckins,
  deleteDailyActivityCheckins,
  deleteUserActivities,
  getDailyActivityCheckins,
  getUserActivities
} from "../controllers/activitywithCheckIns";

const router = express.Router();

// Route to create a life event
router.get("/user-activities/:patientId", getUserActivities);
router.post("/user-activities", createUserActivities);
router.delete("/user-activities", deleteUserActivities);

router.get("/user-activity-check-ins/:patientId", getDailyActivityCheckins);
router.post("/user-activity-check-ins", createBulkDailyActivityCheckins);
router.delete("/user-activity-check-ins", deleteDailyActivityCheckins);

export default router;
