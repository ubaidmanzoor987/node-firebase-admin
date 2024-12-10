// src/controllers/userController.ts
import { Request, Response } from "express";
import * as admin from "firebase-admin";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { EUserRole, EUserSubscription } from "../schema";

// Helper function to randomly select an item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Sample avatar URLs for dynamic assignment
const avatarUrls = [
  "https://www.w3schools.com/w3images/avatar2.png",
  "https://www.w3schools.com/w3images/avatar6.png",
  "https://www.w3schools.com/w3images/avatar5.png",
];

// Helper function to generate a default user status
function generateDefaultUserStatus() {
  return {
    status: "active",
    date: Timestamp.now(),
  };
}

// Generate notification settings based on user role
function generateNotificationSettings(role: EUserRole) {
  if (role === EUserRole.Individual) {
    return {
      inApp: true,
      email: true,
      push: true,
      newConnectionRequest: false,
      moodDropAlert: true,
      AssessmentScoreDropAlert: true,
      assessmentReminder: true,
      loginStreakAlert: true,
      supportNetworkActivity: true,
    };
  } else if (role === EUserRole.HealthcareProvider) {
    return {
      inApp: true,
      email: true,
      push: true,
      newConnectionRequest: true,
      moodDropAlert: true,
      AssessmentScoreDropAlert: true,
      assessmentReminder: false,
      loginStreakAlert: false,
      supportNetworkActivity: false,
    };
  }
  return null;
}

const generateUniqueCode = () => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const timePart = new Date().getMilliseconds();
  const uniqueCode = `${randomPart}${timePart}`.slice(0, 6);
  return uniqueCode;
};

// Controller function to create a user
export async function createUser(req: Request, res: Response) {
  try {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      role = EUserRole.Individual, // Default role
    } = req.body;

    // Validate required fields
    if (!email || !phone || !password || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Email, phone, password, firstName, and lastName are required.",
      });
    }

    // Step 1: Create the user in Firebase Auth
    const authUser = await admin.auth().createUser({
      email,
      password,
      phoneNumber: phone,
      displayName: `${firstName} ${lastName}`,
    });

    console.log("auth created for ", email);

    // Step 2: Fetch a random area of focus
    const areasSnapshot = await db.collection("areasOfFocus").get();
    const areasOfFocus = areasSnapshot.docs.map((doc) => doc.ref);
    const selectedAreaOfFocus = getRandomItem(areasOfFocus);

    console.log("selectedAreaOfFocus ", selectedAreaOfFocus);

    // Step 3: Default data for user in Firestore
    const userData = {
      id: authUser.uid, // Use the UID from Firebase Auth
      role: role,
      isSuperAdmin: false,
      email,
      phone,
      firstName,
      lastName,
      avatarUrl: getRandomItem(avatarUrls), // Assign a random avatar URL
      areasOfFocus: [selectedAreaOfFocus], // Assign a random area of focus
      subscription: EUserSubscription.Trial, // Default to Trial subscription
      presetActivities: [], // No preset activities initially
      healthcareProviders: [], // No healthcare providers assigned initially
      supportingFriends: [], // No supporting friends initially
      favorites: {
        type: "resource",
        ref: [],
      },
      contactInfo:
        role === EUserRole.HealthcareProvider
          ? {
              organization: "Sample Organization",
              address: "123 Health St.",
              city: "Health City",
              state: "HC",
              zip: 12345,
            }
          : null,
      professionalCredentials:
        role === EUserRole.HealthcareProvider
          ? {
              types: ["General Practitioner"],
              licenseNumber: "123456",
              licenseIssuedBy: "Health Board",
              licenseType: "Medical",
              licenseExpiration: Timestamp.fromDate(new Date("2030-01-01")),
            }
          : null,
      areasOfExpertise:
        role === EUserRole.HealthcareProvider ? [selectedAreaOfFocus] : [], // Assign as expertise if HealthcareProvider
      notificationSettings: generateNotificationSettings(role), // Generate based on role
      patients: role === EUserRole.HealthcareProvider ? [] : null, // Only HealthcareProvider can have patients
      currentStatus: generateDefaultUserStatus(),
      statusHistory: [generateDefaultUserStatus()],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isOnboardingComplete: true,
      moodStreak: 0,
      invitationCode: generateUniqueCode(),
    };

    console.log("User data is prepared", JSON.stringify(userData));

    // Step 4: Add user profile to Firestore
    const userRef = db.collection("users").doc(authUser.uid);
    await userRef.set(userData);

    res.status(201).json({
      message: "User created successfully",
      id: userRef.id,
      authId: authUser.uid,
    });
  } catch (error) {
    console.error({ error });
    res.status(500).json({ message: "Error creating user", error });
  }
}

// Controller function to delete a user by ID from both Auth and Firestore
export async function deleteUser(req: Request, res: Response) {
  try {
    const { userId, authId } = req.body;

    if (!userId || !authId) {
      return res
        .status(400)
        .json({ message: "User ID and Auth ID are required for deletion." });
    }

    // Step 1: Delete the user from Firebase Auth
    await admin.auth().deleteUser(authId);

    // Step 2: Delete the user document from Firestore
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found in Firestore." });
    }

    await userRef.delete();
    res
      .status(200)
      .json({ message: "User deleted successfully from Auth and Firestore" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
}

export async function createHealthcareUser(req: Request, res: Response) {
  try {
    const { email, phone, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !phone || !password || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Missing required fields: email, phone, password, firstName, lastName.",
      });
    }

    // Step 1: Create user in Firebase Auth
    const authUser = await admin.auth().createUser({
      email,
      password,
      phoneNumber: phone,
      displayName: `${firstName} ${lastName}`,
    });

    // Step 2: Fetch areas of focus for expertise
    const areasSnapshot = await db.collection("areasOfFocus").limit(2).get();
    const areasOfFocus = areasSnapshot.docs.map((doc) => doc.ref);

    if (areasOfFocus.length === 0) {
      return res.status(400).json({
        message:
          "No areas of focus available to assign to the Healthcare Provider.",
      });
    }

    // Step 3: Create user data for Firestore
    const userData = {
      id: authUser.uid,
      role: EUserRole.HealthcareProvider,
      email,
      phone,
      firstName,
      lastName,
      avatarUrl: avatarUrls[0], // Sample avatar URL
      areasOfFocus: areasOfFocus, // Assign areas of focus
      subscription: EUserSubscription.Subscribed, // Default to Subscribed
      presetActivities: [], // No preset activities initially
      healthcareProviders: [], // Healthcare Providers do not link to others
      supportingFriends: [], // No supporting friends initially
      favorites: {
        type: "resource",
        ref: [],
      },
      contactInfo: {
        organization: "Healthcare Center",
        address: "123 Wellness St.",
        city: "Health City",
        state: "HC",
        zip: 54321,
      },
      professionalCredentials: {
        types: ["General Practitioner"],
        licenseNumber: "HC-123456",
        licenseIssuedBy: "Medical Board",
        licenseType: "License Type Example",
        licenseExpiration: Timestamp.fromDate(new Date("2030-01-01")),
      },
      areasOfExpertise: areasOfFocus, // Same as areas of focus
      notificationSettings: {
        inApp: true,
        email: true,
        push: true,
        newConnectionRequest: true,
        moodDropAlert: false,
        AssessmentScoreDropAlert: true,
        assessmentReminder: false,
        loginStreakAlert: false,
        supportNetworkActivity: false,
      },
      patients: [], // No patients initially
      currentStatus: {
        status: "active",
        date: Timestamp.now(),
      },
      statusHistory: [
        {
          status: "active",
          date: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isOnboardingComplete: false,
      moodStreak: 0,
      invitationCode: generateUniqueCode(),
    };

    // Step 4: Add user profile to Firestore
    const userRef = db.collection("users").doc(authUser.uid);
    await userRef.set(userData);

    res.status(201).json({
      message: "Healthcare Provider user created successfully.",
      id: userRef.id,
      authId: authUser.uid,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating Healthcare Provider user.", error });
  }
}

export const createSupportingFriend = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, patientId } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !patientId) {
      return res.status(400).json({
        message:
          "Email, password, firstName, lastName, and patientId are required.",
      });
    }

    // Step 1: Create the user in Firebase Auth
    const authUser = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    const supportingFriendId = authUser.uid;

    // Step 2: Create Firestore document for the Supporting Friend
    const supportingFriendData = {
      id: supportingFriendId,
      role: EUserRole.SupportingFriend,
      email,
      firstName,
      lastName,
      subscription: EUserSubscription.Trial, // Default to trial subscription
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      moodStreak: 0,
      invitationCode: generateUniqueCode(),
    };

    // Add the Supporting Friend to Firestore
    const supportingFriendRef = db.collection("users").doc(supportingFriendId);
    await supportingFriendRef.set(supportingFriendData);

    // Step 3: Update the patient to add the Supporting Friend reference
    const patientRef = db.collection("users").doc(patientId);
    const patientDoc = await patientRef.get();

    if (!patientDoc.exists) {
      return res.status(404).json({ message: "Patient not found." });
    }

    await patientRef.update({
      supportingFriends: admin.firestore.FieldValue.arrayUnion({
        userId: supportingFriendRef,
        permissions: {
          mood: true, // Example: Supporting friend can view mood
          assessments: [], // Example: Supporting friend-specific assessment permissions
          activities: [], // Example: Permissions for activities
        },
      }),
    });

    res.status(201).json({
      message: "Supporting Friend created successfully.",
      supportingFriendId,
    });
  } catch (error: any) {
    console.error("Error creating Supporting Friend:", error.message);
    res.status(500).json({
      message: "Failed to create Supporting Friend.",
      error: error.message,
    });
  }
};

export const addSupportingFriendToPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, patientId } = req.body;

    // Validate input
    if (!userId || !patientId) {
      return res.status(400).json({
        message: "Both userId and patientId are required.",
      });
    }

    // Step 1: Get references for the supporting friend and patient
    const supportingFriendRef = db.collection("users").doc(userId);
    const patientRef = db.collection("users").doc(patientId);

    // Fetch patient document to ensure it exists
    const patientDoc = await patientRef.get();

    if (!patientDoc.exists) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Fetch supporting friend document to ensure it exists
    const supportingFriendDoc = await supportingFriendRef.get();

    if (!supportingFriendDoc.exists) {
      return res.status(404).json({ message: "Supporting Friend not found." });
    }

    // Step 2: Add the supporting friend's reference to the patient's supportingFriends array
    const supportingFriendData = {
      userId: supportingFriendRef, // Reference to the supporting friend
      permissions: {
        mood: true, // Example permission: view mood
        assessments: [], // Example permission: specific assessments
        activities: [], // Example permission: activities
      },
    };

    await patientRef.update({
      supportingFriends:
        admin.firestore.FieldValue.arrayUnion(supportingFriendData),
    });

    res.status(200).json({
      message: "Supporting friend added successfully to the patient.",
      supportingFriendId: userId,
      patientId: patientId,
    });
  } catch (error: any) {
    console.error("Error adding supporting friend:", error.message);
    res.status(500).json({
      message: "Failed to add supporting friend.",
      error: error.message,
    });
  }
};

export const addHealthCareToPatient = async (req: Request, res: Response) => {
  try {
    const { userId, patientId } = req.body;

    // Validate input
    if (!userId || !patientId) {
      return res.status(400).json({
        message: "Both userId and patientId are required.",
      });
    }

    // Step 1: Get references for the supporting friend and patient
    const haealthCareRef = db.collection("users").doc(userId);
    const patientRef = db.collection("users").doc(patientId);

    // Fetch patient document to ensure it exists
    const patientDoc = await patientRef.get();

    if (!patientDoc.exists) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Fetch supporting friend document to ensure it exists
    const haealthCareDoc = await haealthCareRef.get();

    if (!haealthCareDoc.exists) {
      return res
        .status(404)
        .json({ message: "haealthCareDoc Friend not found." });
    }

    // Step 2: Add the supporting friend's reference to the patient's supportingFriends array
    const healthFriendData = {
      userId: haealthCareRef, // Reference to the supporting friend
      permissions: {
        mood: true, // Example permission: view mood
        assessments: [
          db.collection("assessments").doc("GRk0TraqsbilBuCSCqRz"),
          db.collection("assessments").doc("MCKcdig3jG7ptX3VLgrq"),
        ], // Example permission: specific assessments
        activities: [], // Example permission: activities
      },
    };

    await patientRef.update({
      healthcareProviders:
        admin.firestore.FieldValue.arrayUnion(healthFriendData),
    });

    res.status(200).json({
      message: "HealthCare added successfully to the patient.",
      healthCareId: userId,
      patientId: patientId,
    });
  } catch (error: any) {
    console.error("Error adding HealthCare friend:", error.message);
    res.status(500).json({
      message: "Failed to add HealthCare friend.",
      error: error.message,
    });
  }
};

// Controller to add patients and update the healthcare provider
export async function addPatientsToHealthcareProvider(
  req: Request,
  res: Response
) {
  try {
    const healthcareProviderId = "Om7cuwFQqoNrDl61rsDYFu4hvIs2";
    const patientEmails = ["ubaidmanzoor789@gmail.com", "ubaidworx@gmail.com"];
    const newPatientsRefs = [];

    // Step 1: Fetch Healthcare Provider Document
    const healthcareProviderRef = db
      .collection("users")
      .doc(healthcareProviderId);
    const healthcareProviderDoc = await healthcareProviderRef.get();

    if (!healthcareProviderDoc.exists) {
      return res.status(404).json({ message: "Healthcare provider not found" });
    }

    const healthcareProviderData = healthcareProviderDoc.data();

    // Step 2: Create Patient Users
    for (const email of patientEmails) {
      const firstName = email.split("@")[0]; // Extract a name from the email
      const password = "145632Asd@"; // Use a secure default password or generate one dynamically

      // Step 2: Fetch a random area of focus
      const areasSnapshot = await db.collection("areasOfFocus").get();
      const areasOfFocus = areasSnapshot.docs.map((doc) => doc.ref);
      const selectedAreaOfFocus = getRandomItem(areasOfFocus);

      // Step 2.1: Create user in Firebase Auth
      const authUser = await admin.auth().createUser({
        email,
        password,
        displayName: firstName,
      });

      console.log("auth created for ", email);

      // Step 2.2: Prepare patient user data for Firestore
      const patientData = {
        id: authUser.uid,
        role: EUserRole.Individual, // Role for patients
        email,
        phone: "", // Placeholder, you can add phone if needed
        password, // Consider hashing in production
        firstName,
        lastName: "",
        avatarUrl: avatarUrls[0], // Add a default avatar URL or leave blank
        areasOfFocus: selectedAreaOfFocus,
        subscription: EUserSubscription.Trial,
        presetActivities: [],
        healthcareProviders: [healthcareProviderRef], // Assign healthcare provider's reference
        supportingFriends: [],
        favorites: {
          type: "resource",
          ref: [],
        },
        contactInfo: null,
        professionalCredentials: null,
        areasOfExpertise: [],
        notificationSettings: {
          inApp: true,
          email: true,
          push: true,
          newConnectionRequest: true,
          moodDropAlert: true,
          AssessmentScoreDropAlert: true,
          assessmentReminder: true,
          loginStreakAlert: true,
          supportNetworkActivity: true,
        },
        patients: null,
        currentStatus: {
          status: "active",
          date: Timestamp.now(),
        },
        statusHistory: [
          {
            status: "active",
            date: Timestamp.now(),
          },
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isOnboardingComplete: false,
      };
      console.log("User data is prepared", JSON.stringify(patientData));

      // Step 2.3: Save patient user data to Firestore
      const patientRef = db.collection("users").doc(authUser.uid);
      await patientRef.set(patientData);

      // Collect the patient's reference for updating healthcare provider
      newPatientsRefs.push(patientRef);

      console.log("doctor ref is prepared", JSON.stringify(patientData));
    }

    // Step 3: Update Healthcare Provider's `patients` array
    await healthcareProviderRef.update({
      patients: admin.firestore.FieldValue.arrayUnion(...newPatientsRefs),
    });

    res.status(200).json({
      message: "Patients added and healthcare provider updated successfully.",
      healthcareProviderId,
      newPatients: newPatientsRefs.map((ref) => ref.id),
    });
  } catch (error) {
    console.error("Error adding patients:", error);
    res.status(500).json({
      message: "Failed to add patients to healthcare provider.",
      error,
    });
  }
}
