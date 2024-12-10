import express from "express";
import {
  getNotesByUserId,
  createNote,
  updateNote,
  createBulkNotes,
  deleteNotesByUserId,
  deleteNotesByPatientId,
} from "../controllers/notesController";

const router = express.Router();

router.get("/notes/:userId", getNotesByUserId);
router.post("/notes", createNote);
router.put("/notes", updateNote);
router.post("/bulk-notes", createBulkNotes);
router.delete("/notes", deleteNotesByUserId);
router.delete("/notes-by-patient-id", deleteNotesByPatientId);

export default router;
