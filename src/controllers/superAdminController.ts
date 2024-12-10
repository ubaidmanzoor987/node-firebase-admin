import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { admin, db } from "../firebase";
import { EUserRole, EUserSubscription, User } from "../schema";

async function createSuperAdmin() {
  try {
    const authUser = await admin.auth().createUser({
      email: "superadmin2@gmail.com",
      password: "123456789", // Consider securely storing passwords
      displayName: "Super Admin",
      phoneNumber: "+923073381911",
    });

    console.log("Firebase Authentication user created with UID:", authUser.uid);

    const usersCollection = db.collection("users");

    // Define the super admin user object
    const superAdminUser: User = {
      id: db.doc(`users/${authUser.uid}`) as DocumentReference,
      role: EUserRole.Admin,
      isSuperAdmin: true,
      email: "superadmin2@example.com",
      phone: "+923075596875",
      password: "securepassword", // Consider hashing passwords
      firstName: "John",
      lastName: "Doe",
      avatarUrl: "https://example.com/avatar.jpg",
      areasOfFocus: [],
      subscription: EUserSubscription.Subscribed,
      presetActivities: [],
      healthcareProviders: [],
      supportingFriends: [],
      favorites: {
        type: "resource",
        ref: [],
      },
      contactInfo: null,
      professionalCredentials: null,
      areasOfExpertise: [],
      notificationSettings: null,
      patients: [],
      currentStatus: { status: "active", date: Timestamp.now() },
      statusHistory: [
        {
          status: "active",
          date: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add the user to the Firestore collection
    const userRef = await usersCollection.add(superAdminUser);
    console.log("Super admin user added with ID:", userRef.id);
  } catch (error) {
    console.error("Error adding super admin user:", error);
  }
}

async function deleteNonChopdawgUsers() {
  try {
    // Step 1: Fetch all users from Firebase Authentication
    const usersToDelete: string[] = [];
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

      listUsersResult.users.forEach((user) => {
        if (!user.email?.includes("chopdawg.com")) {
          usersToDelete.push(user.uid);
        }
      });

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Found ${usersToDelete.length} users to delete.`);

    // Step 2: Delete each user from Firebase Authentication and Firestore
    for (const uid of usersToDelete) {
      try {
        // Delete user from Firebase Authentication
        await admin.auth().deleteUser(uid);
        console.log(
          `Deleted user with UID: ${uid} from Firebase Authentication`
        );

        // Delete user document from Firestore
        await db.collection("users").doc(uid).delete();
        console.log(`Deleted user document with UID: ${uid} from Firestore`);
      } catch (error) {
        console.error(`Failed to delete user with UID: ${uid}`, error);
      }
    }

    console.log("Deletion process completed.");
  } catch (error) {
    console.error("Error deleting users:", error);
  }
}

export { deleteNonChopdawgUsers, createSuperAdmin };
