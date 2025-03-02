import admin, { db, auth } from "../src/config/firebaseAdminConfig";
import dotenv from "dotenv";

dotenv.config();

interface UserResponse {
  message: string;
  userId?: string;
  token?: string;
}

const validateFields = (...fields: any[]) => {
  if (fields.some((field) => !field)) {
    throw new Error("All required fields must be provided");
  }
};

const signupUser = async (
  fullName: string,
  email: string,
  password: string
): Promise<UserResponse> => {
  try {
    validateFields(fullName, email, password);

    const userCredential = await admin.auth().createUser({
      displayName: fullName,
      email,
      password,
    });

    await admin
      .auth()
      .updateUser(userCredential.uid, { displayName: fullName });

    await db.collection("users").doc(userCredential.uid).set({
      fullName,
      email,
      bio: "",
      profileImage: "",
      posts: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { message: "User created successfully", userId: userCredential.uid };
  } catch (error: any) {
    throw new Error(`Signup failed: ${error.message}`);
  }
};

const googleSignupUser = async (idToken: string): Promise<UserResponse> => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    let userCredential;

    try {
      userCredential = await auth.getUserByEmail(email!);
    } catch (error) {
      userCredential = await auth.createUser({
        displayName: name,
        email,
      });
    }

    await db.collection("users").doc(userCredential.uid).set({
      fullName: name,
      email,
      bio: "",
      profileImage: picture,
      posts: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { message: "User created successfully", userId: userCredential.uid };
  } catch (error: any) {
    throw new Error(`Signup failed: ${error.message}`);
  }
};

const signinUser = async (
  email: string,
  password: string
): Promise<UserResponse> => {
  try {
    validateFields(email, password);

    const userCredential = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection("users").doc(userCredential.uid).get();
    if (!userDoc.exists) throw new Error("User data not found");

    const customToken = await admin
      .auth()
      .createCustomToken(userCredential.uid);

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || "Failed to get ID token");

    return {
      message: "User signed in successfully",
      token: data.idToken,
      userId: userCredential.uid,
    };
  } catch (error: any) {
    throw new Error(`Error creating login user: ${error.message}`);
  }
};

const googleSigninUser = async (idToken: string): Promise<UserResponse> => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { email } = decodedToken;

    const userCredential = await auth.getUserByEmail(email!);
    const userDoc = await db.collection("users").doc(userCredential.uid).get();
    if (!userDoc.exists) throw new Error("User data not found");

    const customToken = await admin
      .auth()
      .createCustomToken(userCredential.uid);

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || "Failed to get ID token");

    return {
      message: "User signed in successfully",
      token: data.idToken,
      userId: userCredential.uid,
    };
  } catch (error: any) {
    throw new Error(`Error creating login user: ${error.message}`);
  }
};

const getUser = async (uid: string) => {
  try {
    validateFields(uid);

    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) throw new Error("User data not found in database");

    const postsSnapshot = await db
      .collection("posts")
      .where("ownerId", "==", uid)
      .get();
    const posts = postsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      uid,
      fullName:
        userDoc.data()?.fullName || userRecord.displayName || "Unknown User",
      email: userDoc.data()?.email || userRecord.email || "",
      bio: userDoc.data()?.bio || "",
      profileImage: userDoc.data()?.profileImage,
      posts,
    };
  } catch (error: any) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

const updateUser = async (
  uid: string,
  fullName: string,
  bio: string,
  profileImage: string
): Promise<{ message: string }> => {
  try {
    validateFields(uid, bio);

    await db
      .collection("users")
      .doc(uid)
      .update({ fullName, bio, profileImage });

    const postsSnapshot = await db
      .collection("posts")
      .where("ownerId", "==", uid)
      .get();
    const batch = db.batch();

    postsSnapshot.forEach((doc) => {
      batch.update(doc.ref, { "postOwner.displayName": fullName });
    });

    await batch.commit();

    return { message: "User profile updated successfully" };
  } catch (error: any) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const changePassword = async (uid: string, newPassword: string) => {
  try {
    validateFields(newPassword);

    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return {
      message: "Password updated successfully",
    };
  } catch (error: any) {
    throw new Error(`Error updaing password ${error.message}`);
  }
};

const deleteUser = async (uid: string) => {
  try {
    validateFields(uid);

    await admin.auth().deleteUser(uid);

    await db.collection("users").doc(uid).delete();

    const postsSnapshot = await db
      .collection("posts")
      .where("ownerId", "==", uid)
      .get();

    const batch = db.batch();
    postsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return {
      message: "User and his/her posts deleted successfully",
    };
  } catch (error: any) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
};

export {
  signupUser,
  googleSignupUser,
  signinUser,
  googleSigninUser,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
};
