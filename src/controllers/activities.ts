import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";

// Enum for moods
enum EMood {
  Great = "Great",
  Good = "Good",
  Ok = "Ok",
  Bad = "Bad",
  Terrible = "Terrible",
}

// Helper function to get a random mood
const getRandomMood = (): EMood => {
  const moods = Object.values(EMood);
  return moods[Math.floor(Math.random() * moods.length)];
};

// Route to create a single mood check-in
export const createMoodCheckin = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const moodCheckinData = {
      id: db.doc(`users/${patientId}`),
      mood: getRandomMood(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const moodCheckinRef = db.collection("dailyMoodCheckins").doc();
    await moodCheckinRef.set(moodCheckinData);

    res.status(201).json({
      message: "Mood check-in created successfully.",
      id: moodCheckinRef.id,
      moodCheckin: moodCheckinData,
    });
  } catch (error: any) {
    console.error("Error creating mood check-in:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Route to create bulk mood check-ins for one year
export const createBulkMoodCheckins = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const batch = db.batch();
    const moodCheckinsCollection = db.collection("dailyMoodCheckins");

    // Generate 365 days of mood data
    for (let daysAgo = 0; daysAgo < 365; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      const moodCheckinData = {
        id: db.doc(`users/${patientId}`),
        mood: getRandomMood(),
        createdAt: Timestamp.fromDate(date),
        updatedAt: Timestamp.now(),
      };

      const moodCheckinRef = moodCheckinsCollection.doc();
      batch.set(moodCheckinRef, moodCheckinData);
    }

    // Commit the batch
    await batch.commit();

    res.status(201).json({
      message: "Bulk mood check-ins for 1 year created successfully.",
      totalDays: 365,
    });
  } catch (error: any) {
    console.error("Error creating bulk mood check-ins:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
