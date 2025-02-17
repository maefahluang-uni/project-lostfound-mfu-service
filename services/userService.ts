import { db, auth } from "../src/config/firebaseConfig";

interface UserResponse {
  message: string;
  userId?: string;
  token?: string;
}

const signupUser = async (
  fullName: string,
  email: string,
  password: string
): Promise<UserResponse> => {
  try {
    if (!fullName || !email || !password) {
      throw new Error("All fields are required");
    }

    const existingUser = await auth.getUserByEmail(email).catch(() => null);
    if (existingUser) {
      throw new Error("Email is already in use");
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    await db.collection("users").doc(userRecord.uid).set({
      fullName,
      email,
      bio: "",
      posts: [],
    });

    return { message: "User created successfully", userId: userRecord.uid };
  } catch (error: any) {
    throw new Error(`Error creating new user: ${error.message}`);
  }
};

const signinUser = async (
  email: string,
  password: string
): Promise<UserResponse> => {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await auth.getUserByEmail(email);
    if (!user) throw new Error("User not found");

    const token = await auth.createCustomToken(user.uid);

    return {
      message: "User signed in successfully",
      token,
      userId: user.uid,
    };
  } catch (error: any) {
    throw new Error(`Error creating login user: ${error.message}`);
  }
};

const getUser = async (uid: string) => {
  try {
    if (!uid) throw new Error("User ID is required");
    const userRecord = await auth.getUser(uid);
    if (!userRecord) throw new Error("User not found");

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists)
      throw new Error("User data is not found in the database");

    const postsSnapshot = await db
      .collection("posts")
      .where("userId", "==", uid)
      .get();
    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      uid: userRecord.uid,
      fullName: userDoc.data()?.fullName || userRecord.displayName,
      email: userRecord.email,
      bio: userDoc.data()?.bio || "",
      posts,
      createdAt: userRecord.metadata.creationTime,
    };
  } catch (error: any) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

const updateUser = async (
  uid: string,
  bio: string
): Promise<{ message: string }> => {
  try {
    if (!uid || !bio) throw new Error("User ID and bio are required");
    await auth.getUser(uid);

    await db.collection("users").doc(uid).update({
      bio,
    });
    return { message: "User profile updated successfully" };
  } catch (error: any) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const changePassword = async (uid: string, newPassword: string) => {
  try {
    if (!uid || !newPassword)
      throw new Error("User ID and new password are required");
    // await auth.getUser(uid);

    await auth.updateUser(uid, { password: newPassword });

    await auth.revokeRefreshTokens(uid);

    // const user = await auth.getUser(uid);
    return {
      message: "Password updated successfully",
    };
  } catch (error: any) {
    throw new Error(`Error updaing password ${error.message}`);
  }
};

export { signupUser, signinUser, getUser, updateUser, changePassword };
