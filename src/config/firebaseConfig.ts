import dotenv from "dotenv";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import serviceAccount from "./firebaseServiceAccount.json";

dotenv.config();

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();
const auth = getAuth();

export { db, auth };
