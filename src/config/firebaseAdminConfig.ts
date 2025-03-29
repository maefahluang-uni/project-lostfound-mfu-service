import { initializeApp, getApps, cert } from "firebase-admin/app";
import admin from "firebase-admin";
import "dotenv/config";

const apps = getApps();

if (!apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error(
      "Service account JSON file path is missing in environment variables"
    );
  }

  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
