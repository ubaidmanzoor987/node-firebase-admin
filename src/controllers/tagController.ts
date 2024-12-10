// src/controllers/tagController.ts
import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";

export async function createTag(req: Request, res: Response) {
  try {
    const { name, createdBy } = req.body;

    // Validate request body
    if (!name || !createdBy) {
      return res
        .status(400)
        .json({ message: "Name and createdBy are required" });
    }

    // Define the tag data structure
    const tagData = {
      name,
      createdBy: db.doc(`users/${createdBy}`), // Reference to the user who created the tag
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add the new tag to the tags collection
    const tagRef = await db.collection("tags").add(tagData);
    res
      .status(201)
      .json({ message: "Tag created successfully", id: tagRef.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating tag", error });
  }
}

export async function deleteAllTags(req: Request, res: Response) {
  try {
    const tagsSnapshot = await db.collection("tags").get();
    const deletePromises = tagsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    res.status(200).json({ message: "All tags deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting tags", error });
  }
}
