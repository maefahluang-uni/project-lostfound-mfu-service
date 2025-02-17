import { db, auth } from "../src/config/firebaseConfig";

const signupUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  try {
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

const signinUser = async (email: string, password: string) => {
  try {
    const user = await auth.getUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

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

const logoutUser = async (uid: string) => {
  try {
    await auth.revokeRefreshTokens(uid);
    return { message: "User logout successfully" };
  } catch (error: any) {
    throw new Error(`Error logging out user: ${error.message}`);
  }
};

const getUser = async (uid: string) => {
  try {
    const userRecord = await auth.getUser(uid);
    if (!userRecord) {
      throw new Error("User not found");
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new Error("User data is not found in the database");
    }

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

const updateUser = async (uid: string, bio: string) => {
  try {
    const userRecord = await auth.getUser(uid);
    if (!userRecord) {
      throw new Error("User not found");
    }
    const userDoc = db.collection("users").doc(uid);
    await userDoc.update({
      bio,
    });
    return { message: "User profile updated successfully" };
  } catch (error: any) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const changePassword = async (
  uid: string,
  currentPassword: string,
  newPassword: string
) => {
  try {
    const userRecord = await auth.getUser(uid);
    if (!userRecord) {
      throw new Error("User not found");
    }
    const userEmail = userRecord.email;
    if (!userEmail) {
      throw new Error("Email not found");
    }

    const user = await auth.getUserByEmail(userEmail);
    if (!user) {
      throw new Error("Invalid current password");
    }

    await auth.updateUser(uid, { password: newPassword });
    return { message: "Password updated successfully" };
  } catch (error: any) {
    throw new Error(`Error updaing password ${error.message}`);
  }
};

export {
  signupUser,
  signinUser,
  logoutUser,
  getUser,
  updateUser,
  changePassword,
};
