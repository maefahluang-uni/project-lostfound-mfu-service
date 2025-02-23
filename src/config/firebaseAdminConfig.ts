import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import admin from "firebase-admin";

const apps = getApps();

if(!apps.length){
  initializeApp({
    credential: cert("./service_account.json")
  })
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;