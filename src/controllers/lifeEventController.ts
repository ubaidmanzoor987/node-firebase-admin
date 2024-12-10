import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";

// Valid titles for life events
const VALID_LIFE_EVENT_TITLES = [
  "Graduation",
  "Marriage",
  "First Job",
  "Childbirth",
  "Diagnosis",
  "Recovery",
  "Major Achievement",
  "Retirement",
  "Started Therapy",
  "Promotion Achieved",
  "Health Scare",
  "Vacation Abroad",
  "Moved Cities",
  "Adopted Pet",
  "Divorce Finalized",
  "Lost Job",
  "Death of Aunt",
  "Began Ketamine Treatment",
  "Marriage Anniversary",
  "Started New Business",
];

export const createLifeEvent = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      event,
      showInAnalytics = false,
      sharedWith = [],
    } = req.body;

    if (!patientId || !event) {
      return res
        .status(400)
        .json({ message: "Patient ID and event are required." });
    }

    // Validate event title
    if (!VALID_LIFE_EVENT_TITLES.includes(event)) {
      return res.status(400).json({ message: "Invalid event title." });
    }

    // Validate sharedWith references (if provided)
    const sharedWithRefs = sharedWith.map((userId: string) =>
      db.doc(`users/${userId}`)
    );

    // Generate past date
    const pastDate = generatePastDate();

    // Create life event data
    const lifeEventData = {
      event,
      date: pastDate,
      showInAnalytics,
      sharedWith: sharedWithRefs,
      createdBy: db.doc(`users/${patientId}`),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to Firestore
    const lifeEventRef = db.collection("lifeEvents").doc();
    await lifeEventRef.set(lifeEventData);

    res.status(201).json({
      message: "Life event created successfully.",
      id: lifeEventRef.id,
      lifeEvent: lifeEventData,
    });
  } catch (error: any) {
    console.error("Error creating life event:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const createBulkLifeEvents = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const batch = db.batch();
    const lifeEventsCollection = db.collection("lifeEvents");

    const now = new Date();

    // Generate life events for 12 months, 3-5 events per month
    for (let month = 0; month < 12; month++) {
      const numberOfEvents = Math.floor(Math.random() * 3) + 5; // 5 to 7 events per month

      for (let i = 0; i < numberOfEvents; i++) {
        const event = getRandomEventTitle();

        // Generate a random date within the past year
        const randomDaysAgo = Math.floor(Math.random() * 365); // Random number of days in the past
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - randomDaysAgo);

        const lifeEventData = {
          event,
          date: Timestamp.fromDate(
            new Date(
              eventDate.getFullYear(),
              eventDate.getMonth(),
              eventDate.getDate()
            )
          ),
          showInAnalytics: Math.random() > 0.3, // Randomly set showInAnalytics to true/false
          sharedWith: [db.doc(`users/Om7cuwFQqoNrDl61rsDYFu4hvIs2`)], // Example user reference
          createdBy: db.doc(`users/${patientId}`),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const lifeEventRef = lifeEventsCollection.doc();
        batch.set(lifeEventRef, lifeEventData);
      }
    }

    // Commit the batch
    await batch.commit();

    res.status(201).json({
      message: "Bulk life events for 1 year created successfully.",
      totalEvents: 12 * 4, // Average ~48 events
    });
  } catch (error: any) {
    console.error("Error creating bulk life events:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Helper to pick a random life event title
const getRandomEventTitle = (): string => {
  return VALID_LIFE_EVENT_TITLES[
    Math.floor(Math.random() * VALID_LIFE_EVENT_TITLES.length)
  ];
};

// Helper to generate past dates
const generatePastDate = (): { day: number; month: number; year: number } => {
  const date = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 365); // Random date in the past year
  date.setDate(date.getDate() - randomDaysAgo);

  return {
    day: date.getDate(),
    month: date.getMonth() + 1, // Month is 0-indexed
    year: date.getFullYear(),
  };
};
