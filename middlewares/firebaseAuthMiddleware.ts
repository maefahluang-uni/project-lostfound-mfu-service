import admin from "firebase-admin";
import { auth } from "../src/config/firebaseAdminConfig";

const firebaseAuthMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized", err });
  }
};

export const getCurrentUser = async (authToken: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(authToken);
    const userId = decodedToken.uid;

    return userId;
  } catch (err) {
    console.error("Error verifying token:", err);
    return null;
  }
};

export default firebaseAuthMiddleware;
