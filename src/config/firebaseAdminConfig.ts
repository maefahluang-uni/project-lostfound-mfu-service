import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import admin from "firebase-admin";
import "dotenv/config";

const apps = getApps();

if (!apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  const credential = serviceAccountPath
    ? cert(serviceAccountPath) 
    : applicationDefault();    

  initializeApp({ credential });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
