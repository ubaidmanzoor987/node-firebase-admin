import { Request, Response } from "express";
import { admin, db, storage } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { EUserActivityDays } from "../schema";

// Helper to get random days of the week
const getRandomDaysOfWeek = (): EUserActivityDays[] => {
  const days = Object.values(EUserActivityDays);
  const numDays = Math.floor(Math.random() * 7) + 1; // 1 to 7 days
  return days.sort(() => Math.random() - 0.5).slice(0, numDays); // Randomly select days
};

const activityNames = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Yoga",
  "Meditation",
  "Playing Games",
  "Taking Medicine",
  "Stretching",
  "Reading",
];

const activityNamesNew = [
 
  "Yoga",
  "Meditation",
  ,
];

const activityIcons = [
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%2FbedIcon.png?alt=media&token=f62b4aaa-a985-47f3-80ba-6b3988cae72e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%2FblurIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%bookSavedIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%briefcaseIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%2FbrushIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%2FcarrotIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%2FdiscoverIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%glassIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%meditataionIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
  "https://firebasestorage.googleapis.com/v0/b/healthy-mind-map-c3523.appspot.com/o/activityIcons%musicIcon.png?alt=media&token=a0fca6f1-a750-46fd-a621-427c20ac258e",
];

const getActivityIcons = async (): Promise<{ iconUrl: string }[]> => {
  // Define icon names

  const [files] = await storage.getFiles({ prefix: "activityIcons/" }); // Fetch files from the activityIcons folder

  // Map files to names and URLs manually
  const icons = files.map((file, index) => ({
    iconUrl: file.publicUrl(),
  }));

  return icons;
};

// Route to create UserActivity entries
export const createUserActivities = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const batch = db.batch();
    const userActivitiesCollection = db.collection("userActivities");

    const createdDocIds: string[] = []; // To store the created document IDs

    // Generate 10 user activities
    for (let i = 0; i < 10; i++) {
      const randomIcon =
        activityIcons[Math.floor(Math.random() * activityIcons.length)];

      const activityRef = userActivitiesCollection.doc();
      const activityData = {
        id: db.doc(`userActivities/${patientId}`),
        name: activityNames[i] ?? "Activity" + i,
        iconUrl: randomIcon,
        daysOfWeek: getRandomDaysOfWeek(),
        sharedWith: [], // Initially, no users are shared with
        count: Math.floor(Math.random() * i),
        createdBy: db.doc(`users/${patientId}`),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      batch.set(activityRef, activityData);
      createdDocIds.push(activityRef.id); // Collect document ID
    }

    // Commit the batch
    await batch.commit();

    res.status(201).json({
      message: "User activities created successfully.",
      totalActivities: 10,
      createdDocIds, // Return created document IDs
    });
  } catch (error: any) {
    console.error("Error creating user activities:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const deleteUserActivities = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const userActivitiesCollection = db.collection("userActivities");

    // Query all activities created by the patient
    const snapshot = await userActivitiesCollection
      .where("createdBy", "==", db.doc(`users/${patientId}`))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No user activities found for the specified patient.",
      });
    }

    const batch = db.batch();

    // Add each activity document to the batch for deletion
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: "User activities deleted successfully.",
      totalDeleted: snapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting user activities:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const getUserActivities = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const userActivitiesCollection = db.collection("userActivities");

    // Query all activities created by the patient
    const snapshot = await userActivitiesCollection
      .where("createdBy", "==", db.doc(`users/${patientId}`))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No user activities found for the specified patient.",
      });
    }

    const activities = snapshot.docs.map((doc) => ({
      id: doc.id, // Firestore document ID
      ...doc.data(),
    }));

    res.status(200).json({
      message: "User activities retrieved successfully.",
      totalActivities: activities.length,
      activities,
    });
  } catch (error: any) {
    console.error("Error retrieving user activities:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Route to create bulk DailyActivityCheckin entries
export const createBulkDailyActivityCheckins = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    // Fetch user activities for the patient
    const userActivitiesSnapshot = await db
      .collection("userActivities")
      .where("createdBy", "==", db.doc(`users/${patientId}`))
      .get();

    if (userActivitiesSnapshot.empty) {
      return res
        .status(400)
        .json({ message: "No user activities found for this patient." });
    }

    const userActivities = userActivitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data(),
    }));

    const batch = db.batch();
    const dailyActivityCheckinsCollection = db.collection(
      "dailyActivityCheckins"
    );

    // Track activity counts
    const activityCounts: { [activityId: string]: number } = {};

    // Generate daily check-ins for the past year
    for (let daysAgo = 0; daysAgo < 365; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      // Randomly pick an activity for the day
      const randomActivity =
        userActivities[Math.floor(Math.random() * userActivities.length)];

      // Increment the activity count in the map
      activityCounts[randomActivity.id] =
        (activityCounts[randomActivity.id] || 0) + 1;

      const dailyActivityCheckinData = {
        id: db.doc(`users/${patientId}`),
        activityId: randomActivity.ref,
        createdAt: Timestamp.fromDate(date),
        updatedAt: Timestamp.now(),
      };

      const checkinRef = dailyActivityCheckinsCollection.doc();
      batch.set(checkinRef, dailyActivityCheckinData);
    }

    // Update activity counts in Firestore
    Object.entries(activityCounts).forEach(([activityId, count]) => {
      const activity = userActivities.find((a) => a.id === activityId); // Find the activity with the matching ID
      if (activity) {
        batch.update(activity.ref, {
          count: admin.firestore.FieldValue.increment(count),
        });
      }
    });

    // Commit the batch
    await batch.commit();

    res.status(201).json({
      message: "Bulk daily activity check-ins for 1 year created successfully.",
      totalCheckins: 365,
    });
  } catch (error: any) {
    console.error("Error creating bulk daily activity check-ins:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const deleteDailyActivityCheckins = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const dailyActivityCheckinsCollection = db.collection(
      "dailyActivityCheckins"
    );

    // Query all check-ins for the patient
    const snapshot = await dailyActivityCheckinsCollection
      .where("id", "==", db.doc(`users/${patientId}`))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No daily activity check-ins found for the specified patient.",
      });
    }

    const batch = db.batch();

    // Add each check-in document to the batch for deletion
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: "Daily activity check-ins deleted successfully.",
      totalDeleted: snapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting daily activity check-ins:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const getDailyActivityCheckins = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    const dailyActivityCheckinsCollection = db.collection(
      "dailyActivityCheckins"
    );

    // Query all check-ins for the patient
    const snapshot = await dailyActivityCheckinsCollection
      .where("id", "==", db.doc(`users/${patientId}`))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No daily activity check-ins found for the specified patient.",
      });
    }

    const checkins = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      message: "Daily activity check-ins retrieved successfully.",
      totalCheckins: checkins.length,
      checkins,
    });
  } catch (error: any) {
    console.error("Error retrieving daily activity check-ins:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
