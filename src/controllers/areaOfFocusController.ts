// src/controllers/areaOfFocusController.ts
import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";

export async function createAreaOfFocus(req: Request, res: Response) {
  try {
    const { name, createdBy } = req.body;
    const areaOfFocusData = {
      name,
      createdBy: db.doc(`users/${createdBy}`),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const areaOfFocusRef = await db
      .collection("areasOfFocus")
      .add(areaOfFocusData);
    res.status(201).json({
      message: "Area of focus created successfully",
      id: areaOfFocusRef.id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating area of focus", error });
  }
}

export async function deleteAllAreas(req: Request, res: Response) {
  try {
    const areasOfFocusSnapshot = await db.collection("areasOfFocus").get();
    const deletePromises = areasOfFocusSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePromises);

    res.status(200).json({ message: "All areasOfFocus deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting areasOfFocus", error });
  }
}
