import express from "express";
import { createLifeEvent, createBulkLifeEvents } from "../controllers/lifeEventController";

const router = express.Router();

// Route to create a life event
router.post("/create", createLifeEvent);
router.post("/create-bulk-data", createBulkLifeEvents);

export default router;
