import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "../src/config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
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

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      fullName,
      email,
      bio: "",
      profileImage: "",
      posts: [],
    }).catch((error) => {
      console.error("Firestore write failed:", error);
    });
    return { message: "User created successfully", userId: user.uid };
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

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const token = await user.getIdToken();

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) throw new Error("User data not found");

    return { message: "User signed in successfully", token, userId: user.uid };
  } catch (error: any) {
    throw new Error(`Error creating login user: ${error.message}`);
  }
};

const getUser = async (uid: string) => {
  try {
    validateFields(uid);

    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) throw new Error("User data not found in database");

    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", uid)
    );
    const postsSnapshot = await getDocs(postsQuery);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      uid,
      fullName: userDoc.data()?.fullName || "Unknown User",
      email: userDoc.data()?.email || "",
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
    await updateDoc(doc(db, "users", uid), { fullName, bio, profileImage });

    return { message: "User profile updated successfully" };
  } catch (error: any) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const changePassword = async (newPassword: string) => {
  try {
    validateFields(newPassword);

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User must be authenticated");

    await updatePassword(currentUser, newPassword);
    return {
      message: "Password updated successfully",
    };
  } catch (error: any) {
    throw new Error(`Error updaing password ${error.message}`);
  }
};

export { signupUser, signinUser, getUser, updateUser, changePassword };
