// src/controllers/assessmentController.ts
import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  EAssessmentFrequency,
  EAssessmentQuestionType,
  Assessment,
  AssessmentSessionQAs,
  AssessmentSession,
} from "../schema";

// Utility function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getNextQuestionFlow(responseIndex: number): string {
  const flows = ["standard-flow", "2", "3", "4"]; // Options for nextQuestion
  if (responseIndex === 0) {
    return "standard-flow"; // Default for the first response
  }
  return flows[Math.floor(Math.random() * flows.length)];
}

// Generate varied scoring parameters for the assessment
function generateScoringParameters(): any[] {
  const scoringParameters = [];
  const parameterCount = 4;

  for (let i = 1; i <= parameterCount; i++) {
    scoringParameters.push({
      parameter: `Score Category ${i}`,
      range: {
        from: (i - 1) * 25,
        to: i * 25,
      },
    });
  }

  return scoringParameters;
}

// Generate responses based on question type with varied titles and weights
function generateResponses(questionType: EAssessmentQuestionType): any[] {
  switch (questionType) {
    case EAssessmentQuestionType.TrueFalse:
      return [
        {
          value: "Yes",
          weight: 10,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
        },
        {
          value: "No",
          weight: 5,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
        },
      ];

    case EAssessmentQuestionType.LikertScale:
      return [
        {
          value: "Strongly Disagree",
          weight: 0,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
          id: "1",
        },
        {
          value: "Disagree",
          weight: 1,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
          id: "2",
        },
        {
          value: "Neutral",
          weight: 2,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
          id: "3",
        },
        {
          value: "Agree",
          weight: 3,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
          id: "4",
        },
        {
          value: "Strongly Agree",
          weight: 4,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
          id: "5",
        },
      ];

    case EAssessmentQuestionType.MultipleChoice:
      return [
        {
          value: "A Little",
          weight: 2,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
        },
        {
          value: "Somewhat",
          weight: 5,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
        },
        {
          value: "Moderately",
          weight: 8,
          isSelfHarm: false,
          nextQuestion: "standard-flow",
        },
        {
          value: "Extremely",
          weight: 10,
          isSelfHarm: true,
          nextQuestion: "standard-flow",
        },
      ];

    case EAssessmentQuestionType.OpenEnded:
    default:
      return []; // No predefined responses for OpenEnded questions
  }
}

// Generate dynamic questions with varied titles, types, and responses
function generateQuestions(): any[] {
  const questions = [];
  const questionTypes = [
    EAssessmentQuestionType.TrueFalse,
    EAssessmentQuestionType.LikertScale,
    EAssessmentQuestionType.MultipleChoice,
    EAssessmentQuestionType.OpenEnded,
  ];
  const questionTitles = [
    "Do you often feel anxious?",
    "How satisfied are you with your work-life balance?",
    "How would you rate your stress level?",
    "How are you feeling today?",
    "Did you have trouble sleeping last night?",
    "How often do you feel overwhelmed?",
  ];

  const questionCount = Math.floor(Math.random() * 4) + 3; // Generate 3 to 6 questions

  for (let i = 1; i <= questionCount; i++) {
    const questionType = getRandomItem(questionTypes);
    const questionTitle = getRandomItem(questionTitles);

    questions.push({
      id: `${i}`,
      questionNumber: getNextQuestionFlow(i),
      type: questionType,
      question: `${questionTitle}`,
      responses: generateResponses(questionType),
    });
  }

  return questions;
}

// Function to generate a single assessment with dynamic data
function generateAssessmentData(
  title: string,
  createdBy: string,
  areaOfFocus: string
) {
  return {
    title,
    areaOfFocus: db.doc(`areasOfFocus/${areaOfFocus}`),
    frequency: getRandomItem([
      EAssessmentFrequency.EveryWeek,
      EAssessmentFrequency.EveryTwoWeeks,
      EAssessmentFrequency.EveryThreeWeeks,
      EAssessmentFrequency.EveryMonth,
    ]),
    credits: "100",
    scoringParameters: generateScoringParameters(),
    questions: generateQuestions(),
    createdBy: db.doc(`users/${createdBy}`),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// Controller function to create a single assessment
export async function createAssessment(req: Request, res: Response) {
  try {
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "Admin")
      .where("isSuperAdmin", "==", true)
      .limit(1)
      .get();
    const areasSnapshot = await db.collection("areasOfFocus").limit(1).get();
    if (usersSnapshot.empty || areasSnapshot.empty) {
      return res
        .status(400)
        .json({ message: "No super admin user or area of focus found" });
    }

    const superAdminId = usersSnapshot.docs[0].id;
    const areaOfFocusId = areasSnapshot.docs[0].id;

    const assessmentData = generateAssessmentData(
      "Dynamic Assessment",
      superAdminId,
      areaOfFocusId
    );
    const assessmentRef = await db
      .collection("assessments")
      .add(assessmentData);
    res.status(201).json({
      message: "Assessment created successfully",
      id: assessmentRef.id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating assessment", error });
  }
}

// Controller function to create multiple assessments (bulk)
export async function createBulkAssessments(req: Request, res: Response) {
  try {
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "Admin")
      .where("isSuperAdmin", "==", true)
      .limit(1)
      .get();
    const areasSnapshot = await db.collection("areasOfFocus").limit(1).get();

    if (usersSnapshot.empty || areasSnapshot.empty) {
      return res
        .status(400)
        .json({ message: "No super admin user or area of focus found" });
    }

    const superAdminId = usersSnapshot.docs[0].id;
    const areaOfFocusDoc = areasSnapshot.docs[0];
    const areaOfFocusId = areaOfFocusDoc.id;
    const areaOfFocusName = areaOfFocusDoc.data().name; // Assuming areaOfFocus has a "name" field

    const assessmentPromises = [];
    for (let i = 0; i < 4; i++) {
      // Creating at least 4 assessments
      const title = `${areaOfFocusName} Self-Assessment`;
      const assessmentData = generateAssessmentData(
        title,
        superAdminId,
        areaOfFocusId
      );
      assessmentPromises.push(db.collection("assessments").add(assessmentData));
    }

    const assessmentRefs = await Promise.all(assessmentPromises);
    res.status(201).json({
      message: `${assessmentRefs.length} assessments created successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating assessments", error });
  }
}

// Controller function to delete all assessments
export async function deleteAllAssessments(req: Request, res: Response) {
  try {
    const assessmentsSnapshot = await db.collection("assessments").get();
    const deletePromises = assessmentsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePromises);

    res.status(200).json({ message: "All assessments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assessments", error });
  }
}

export const generateYearlyAssessments = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    // Step 1: Fetch all assessments
    const assessmentsSnapshot = await db.collection("assessments").get();

    if (assessmentsSnapshot.empty) {
      return res.status(404).json({ message: "No assessments found." });
    }

    const assessments = assessmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Assessment[];

    const now = new Date();

    // Step 2: Loop through assessments and generate records
    const batch = db.batch();

    for (const assessment of assessments) {
      const { id: assessmentId, frequency, questions } = assessment;
      if (!questions || questions.length === 0) {
        console.warn(`Assessment ${assessmentId} has no questions. Skipping.`);
        continue;
      }

      const intervalDays = getFrequencyInterval(frequency);

      if (!intervalDays) {
        console.warn(
          `Invalid frequency for assessment ${assessmentId}: ${frequency}`
        );
        continue;
      }

      const sessionDates = generateSessionDates(now, intervalDays);

      // Generate sessions for the patient
      for (const date of sessionDates) {
        const qas = generateAssessmentSessionQAs(questions);
        const totalScore = calculateTotalScore(qas);

        const sessionRef = db.collection("assessment_sessions").doc();

        const sessionData: AssessmentSession = {
          id: sessionRef, // Firestore DocumentReference
          assessmentId: db.doc(`assessments/${assessmentId}`),
          qas, // Array of AssessmentSessionQAs
          score: totalScore,
          createdBy: db.doc(`users/${patientId}`), // Reference to patient
          createdAt: Timestamp.fromDate(date), // Use past session date as createdAt
          updatedAt: Timestamp.fromDate(date), // Use the same past session date for updatedAt
        };

        // Add session to batch
        batch.set(sessionRef, sessionData);
      }
    }

    // Commit the batch
    await batch.commit();

    res.status(200).json({
      message: "Yearly assessments with historical data created successfully.",
    });
  } catch (error: any) {
    console.error("Error generating yearly assessments:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const deleteAssessmentSessionsByPatientId = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required." });
    }

    // Step 1: Query all assessment sessions for the patient
    const assessmentSessionsRef = db.collection("assessment_sessions");
    const querySnapshot = await assessmentSessionsRef
      .where("createdBy", "==", db.doc(`users/${patientId}`))
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "No assessment sessions found." });
    }

    // Step 2: Use a batch to delete all matching documents
    const batch = db.batch();

    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.status(200).json({
      message: "All assessment sessions for the patient deleted successfully.",
      count: querySnapshot.size,
    });
  } catch (error: any) {
    console.error("Error deleting assessment sessions:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// Helper: Get interval in days based on frequency
const getFrequencyInterval = (frequency: string): number | null => {
  switch (frequency) {
    case EAssessmentFrequency.EveryWeek:
      return 7;
    case EAssessmentFrequency.EveryTwoWeeks:
      return 14;
    case EAssessmentFrequency.EveryThreeWeeks:
      return 21;
    case EAssessmentFrequency.EveryMonth:
      return 30;
    default:
      return null;
  }
};

// Helper: Generate session dates based on interval
const generateSessionDates = (startDate: Date, interval: number): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < Math.floor(365 / interval); i++) {
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() - i * interval); // Subtract days to create past dates
    dates.push(sessionDate);
  }
  return dates;
};

// Helper: Generate QAs for an assessment session
let responseIndexTracker: { [questionId: string]: number } = {};

const generateAssessmentSessionQAs = (
  questions: any[]
): AssessmentSessionQAs[] => {
  return questions.map((question: any) => {
    // Validate if the question has valid responses
    if (!question.responses || question.responses.length === 0) {
      console.warn(
        `Question ${
          question.questionNumber || "unknown"
        } has no valid responses.`
      );
      return {
        questionNumber: question.questionNumber || 0, // Ensure questionNumber is provided
        type: question.type || EAssessmentQuestionType.OpenEnded, // Default to OpenEnded if type is missing
        question: question.question || "No question provided", // Provide fallback text
        response: {
          value: "No Response",
          weight: 0,
          isSelfHarm: false,
        },
      } as AssessmentSessionQAs;
    }

    // Track response index for each question
    const questionId =
      question.id || question.questionNumber || `q${Math.random()}`;
    if (!responseIndexTracker[questionId]) {
      responseIndexTracker[questionId] = 0; // Initialize tracker for this question
    }

    // Get the current index and cycle through responses
    const responseIndex = responseIndexTracker[questionId];
    const selectedResponse = question.responses[responseIndex];

    if (!selectedResponse) {
      console.error(`Invalid response index for question ${questionId}.`);
      return {
        questionNumber: question.questionNumber || 0,
        type: question.type || EAssessmentQuestionType.OpenEnded,
        question: question.question || "Invalid question",
        response: {
          value: "No Response",
          weight: 0,
          isSelfHarm: false,
        },
      } as AssessmentSessionQAs;
    }

    // Increment index for the next session (cycling through responses)
    responseIndexTracker[questionId] =
      (responseIndex + 1) % question.responses.length;

    return {
      questionNumber: question.questionNumber,
      type: question.type,
      question: question.question,
      response: {
        value: selectedResponse.value,
        weight: selectedResponse.weight,
        isSelfHarm: selectedResponse.isSelfHarm || false,
      },
    };
  });
};

// Helper: Calculate total score
const calculateTotalScore = (qas: AssessmentSessionQAs[]): number => {
  return qas.reduce((total, qa) => total + qa.response.weight, 0);
};
