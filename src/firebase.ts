import * as admin from "firebase-admin";

import * as dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin SDK with environment variables
admin.initializeApp({
  credential: admin.credential.cert(require("./firebase-service-account.json")),
  storageBucket: "healthy-mind-map-c3523.appspot.com"
});

const db = admin.firestore();
const storage = admin.storage().bucket();

export { admin, db , storage};
