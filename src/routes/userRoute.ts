// src/routes/superAdminRoutes.ts
import { Router } from "express";
import {
  createHealthcareUser,
  createUser,
  deleteUser,
  addPatientsToHealthcareProvider,
  createSupportingFriend,
  addSupportingFriendToPatient,
  addHealthCareToPatient
} from "../controllers/userController";

const router = Router();

router.post("/create", createUser);
router.post("/delete", deleteUser);
router.post("/create-health-care", createHealthcareUser);
router.post("/create-supporting-friend", createSupportingFriend);
router.post("/add-supporting-friend-to-patient", addSupportingFriendToPatient);
router.post("/add-health-care-to-patient", addHealthCareToPatient);
router.post("/add-patient-data", addPatientsToHealthcareProvider);

export default router;
