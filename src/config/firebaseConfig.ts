import dotenv from "dotenv";
import { getFirestore } from "firebase-admin/firestore";
import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import serviceAccount from "../config/firebaseServiceAccount.json";

dotenv.config();

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

export { db };
