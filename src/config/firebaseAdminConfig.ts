import { initializeApp, getApps, cert } from "firebase-admin/app";
import admin from "firebase-admin";
import "dotenv/config";

const apps = getApps();

if (!apps.length) {
  initializeApp({
    credential: cert("./service_account.json"),
    // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
