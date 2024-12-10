import express from "express";
import { createConnectionRequest } from "../controllers/connectionRequestsController";

const router = express.Router();

// Route to create a life event
router.post("/create", createConnectionRequest);

export default router;
