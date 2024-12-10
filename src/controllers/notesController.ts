import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { HaealthCareFriend, Note } from "../schema";

const validNotes = [
  "Mood tracking over the last two weeks indicates increased irritability during weekdays, likely related to work stress. Consider discussing stress management techniques during the next session, such as breathing exercises or short breaks throughout the workday.",
  "The client reported improved sleep quality after adhering to the new medication schedule. To further enhance sleep hygiene, reducing screen time at night is recommended. Continue monitoring mood and sleep patterns to identify any triggers that might affect the medication's efficacy.",
  "The client's anxiety levels have shown a steady decrease over the past month, indicating positive progress. However, depressive symptoms remain inconsistent, with high fluctuations noted particularly during weekends. It's recommended to explore coping mechanisms for weekend stressors, such as mindfulness exercises or social activities.",
  "The client's overall progress is positive, with marked improvements in mood stability and reduction in anxiety symptoms. A follow-up assessment in two weeks will help determine if adjustments to the treatment plan are necessary. Encouraged to maintain current activities and stay consistent with mood logging for better insights.",
  "Weekly check-ins reveal that consistent exercise routines have contributed to a decrease in stress levels. Suggest exploring other forms of physical activity to maintain engagement and ensure long-term sustainability of these improvements.",
  "The client expressed difficulty managing intrusive thoughts during high-stress situations. Recommend incorporating grounding techniques, such as the 5-4-3-2-1 method, into daily routines to help manage these challenges.",
  "Therapeutic journaling practices introduced last session have been beneficial. Encourage the client to continue this habit, focusing on gratitude exercises to further enhance positive thinking.",
  "During the last session, the client demonstrated improved self-awareness and emotional regulation. Suggest exploring cognitive behavioral strategies to address negative thought patterns during the next session.",
  "The client's communication skills with family members have improved significantly since starting therapy. Recommend discussing additional strategies for conflict resolution to maintain these positive developments.",
  "Recent dietary adjustments appear to be contributing to improved energy levels and mood stability. Suggest discussing meal planning strategies during the next session to build on this progress.",
  "The client's self-reported stress levels have been steadily decreasing since implementing relaxation techniques. Suggest expanding this practice with progressive muscle relaxation exercises.",
  "The patient has expressed increased motivation and engagement in daily activities since the last session. Recommend exploring ways to sustain this momentum, such as setting short-term achievable goals.",
  "A noticeable improvement in social interactions has been observed. Suggest continuing to practice assertive communication techniques to build confidence in group settings.",
  "The patient has expressed interest in mindfulness exercises and has reported a slight improvement in managing negative emotions. Suggest incorporating these exercises into their daily routine for sustained benefits.",
  "Despite progress in managing anxiety, the client reported difficulties in maintaining a consistent sleep schedule. Suggest exploring guided sleep meditations or relaxation apps before bedtime.",
  "The client mentioned feeling overwhelmed with responsibilities during work hours. Recommend prioritization techniques such as the Eisenhower Matrix to improve time management.",
  "Positive feedback from the client indicates that journaling about achievements has helped boost self-esteem. Encourage continued use of this strategy to reinforce self-worth.",
  "The client has reported an increase in confidence during public speaking engagements. Suggest joining a local speaking club or group to further hone this skill.",
  "Increased physical activity has led to improved energy and reduced mood swings. Suggest exploring community fitness groups to maintain accountability and social interaction.",
  "The patient expressed frustration in navigating conflicts at work. Suggest discussing emotional intelligence techniques to improve workplace relationships.",
  "The client has begun exploring art as a therapeutic outlet. Recommend continuing with creative projects to help process emotions and reduce stress.",
  "A notable decrease in panic attack frequency has been observed since initiating deep breathing exercises. Suggest tracking these instances for further analysis in future sessions.",
  "The client expressed a desire to rebuild strained family relationships. Suggest drafting a letter to a family member to express feelings constructively as a first step.",
  "Progress has been observed in the client’s ability to self-soothe during stressful moments. Recommend incorporating visualization techniques to enhance coping strategies.",
  "The patient reported difficulty maintaining focus on tasks. Suggest experimenting with the Pomodoro technique to enhance productivity during work or study hours.",
  "The client has experienced positive changes in mood stability following regular outdoor walks. Recommend exploring nature trails to further enhance these benefits.",
  "A reduction in alcohol consumption has been reported, contributing to improved physical and mental health. Suggest maintaining a weekly journal to track progress.",
  "The patient has developed a strong interest in group therapy sessions. Suggest attending a local support group to foster community connections and share experiences.",
  "The client expressed difficulty staying motivated with their exercise routine. Suggest trying a new activity, such as yoga or swimming, to rekindle enthusiasm.",
  "Significant progress has been made in managing frustration during parenting moments. Recommend exploring additional parenting resources for managing challenging scenarios effectively.",
];

export const getNotesByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const notesSnapshot = await db
      .collection("notes")
      .where("userId", "==", db.doc(`users/${userId}`))
      .get();

    if (notesSnapshot.empty) {
      return res.status(404).json({ message: "No notes found for this user." });
    }

    const notes = notesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      message: "Notes retrieved successfully.",
      totalNotes: notes.length,
      notes,
    });
  } catch (error: any) {
    console.error("Error retrieving notes:", error);
    res
      .status(400)
      .json({ message: "Error getting  notes.", error: error.message });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { userId, createdBy, note } = req.body;

    if (!userId || !createdBy || !note) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const noteData: Note = {
      id: db.collection("notes").doc(),
      userId: db.doc(`users/${userId}`),
      note,
      createdBy: db.doc(`users/${createdBy}`),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await noteData.id.set(noteData);

    res.status(201).json({
      message: "Note created successfully.",
      note: noteData,
    });
  } catch (error: any) {
    console.error("Error creating note:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { noteId, note } = req.body;

    if (!noteId || !note) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const noteRef = db.collection("notes").doc(noteId);

    await noteRef.update({
      note,
      updatedAt: Timestamp.now(),
    });

    res.status(200).json({
      message: "Note updated successfully.",
    });
  } catch (error: any) {
    console.error("Error updating note:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Route to create bulk DailyActivityCheckin entries
export const createBulkNotes = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    // Fetch the patient's details
    const patientRef = db.doc(`users/${patientId}`);
    const patientDoc = await patientRef.get();

    if (!patientDoc.exists) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const healthcareProviders =
      patientDoc.data()?.healthcareProviders || ([] as HaealthCareFriend[]);

    if (healthcareProviders.length === 0) {
      return res
        .status(400)
        .json({ message: "No healthcare providers found." });
    }

    const batch = db.batch();
    const notesCollection = db.collection("notes");

    // Loop through each healthcare provider
    healthcareProviders.forEach((provider: HaealthCareFriend) => {
      // Generate daily notes for the past year
      for (let daysAgo = 0; daysAgo < 365; daysAgo++) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        // Pick a random note
        const randomNote =
          validNotes[Math.floor(Math.random() * validNotes.length)];

        // Create the note data
        const note = {
          id: notesCollection.doc(),
          userId: patientRef,
          note: randomNote,
          createdBy: provider.userId,
          createdAt: Timestamp.fromDate(date),
          updatedAt: Timestamp.now(),
        };

        // Add to batch
        batch.set(note.id, note);
      }
    });

    // Commit the batch
    await batch.commit();

    res.status(201).json({
      message: "Bulk notes for one year created successfully.",
      totalProviders: healthcareProviders.length,
      totalNotes: healthcareProviders.length * 365,
    });
  } catch (error: any) {
    console.error("Error creating bulk notes:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const deleteNotesByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const notesCollection = db.collection("notes");

    // Query all notes created by the user
    const snapshot = await notesCollection
      .where("createdBy", "==", db.doc(`users/${userId}`))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No notes found created by the specified user.",
      });
    }

    const batch = db.batch();

    // Add each note document to the batch for deletion
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: "Notes deleted successfully.",
      totalDeleted: snapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting notes:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const deleteNotesByPatientId = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "patientId ID is required." });
    }

    const notesCollection = db.collection("notes");

    // Query all notes created by the user
    const snapshot = await notesCollection
      .where("userId", "==", db.doc(`users/${patientId}`))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No notes found created by the specified user.",
      });
    }

    const batch = db.batch();

    // Add each note document to the batch for deletion
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: "Notes deleted successfully.",
      totalDeleted: snapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting notes:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
