import cloudinary from "../src/config/cloudinary";
import admin, { db, auth } from "../src/config/firebaseAdminConfig";
import dotenv from "dotenv";

dotenv.config();

interface UserResponse {
  message: string;
  userId?: string;
  token?: string;
  fcmToken?: string;
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
  password: string,
  fcmToken?:string
): Promise<UserResponse> => {
  try {
    validateFields(email, password);

    const userCredential = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection("users").doc(userCredential.uid).get();
    const userRef = await db.collection('users').doc(userCredential.uid)
    if (!userDoc.exists) throw new Error("User data not found");

    if (fcmToken) {
      await userRef.set({ fcmToken }, { merge: true });
    }
    const customToken = await admin
      .auth()
      .createCustomToken(userCredential.uid);

    // Authenticate user with Firebase
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || "Invalid credentials");

    return {
      message: "User signed in successfully",
      token: data.idToken,
      userId: data.localId, // Use localId from Firebase response
      fcmToken: fcmToken || "No FCM token provided"
    };
  } catch (error: any) {
    throw new Error(`Error creating login user: ${error.message}`);
  }
};

const googleSigninUser = async (idToken: string, fcmToken: string): Promise<UserResponse> => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { email } = decodedToken;

    const userCredential = await auth.getUserByEmail(email!);
    const userDoc = await db.collection("users").doc(userCredential.uid).get();
    const userRef = await db.collection("users").doc(userCredential.uid)
    if (!userDoc.exists) throw new Error("User data not found");
    if (fcmToken) {
      await userRef.set({ fcmToken }, { merge: true });
    }
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
  profileImage: Express.Multer.File
) => {
  try {
    // Validate required fields
    validateFields(uid, fullName, bio, profileImage);

    // Convert profile image buffer
    const buffer = Buffer.isBuffer(profileImage.buffer)
      ? profileImage.buffer
      : Buffer.from(profileImage.buffer);
    const originalName = profileImage.originalname.split(".")[0];
    const safePublicId = originalName.replace(/[^a-zA-Z0-9-_]/g, "_"); 
    const uploadedProfileImageUrl = await cloudinary.uploader.unsigned_upload(
      `data:${profileImage.mimetype};base64,${buffer.toString('base64')}`,
      'my_unsigned_uploads',
      {
        folder: 'users',
        public_id: safePublicId,
        resource_type: 'image',
      }
    )
    .then((result) => {
      if (!result || !result.secure_url) {
        console.error("Cloudinary upload failed:", result);
        throw new Error("Cloudinary upload failed - no secure URL returned");
      }
      return result.secure_url;
    })
    .catch((err) => {
      console.error("Cloudinary unsigned upload error:", err);
      throw new Error("Failed to upload image to Cloudinary");
    });
    

    // Update the user's profile in Firestore
    await db.collection("users").doc(uid).update({
      fullName,
      bio,
      profileImage: uploadedProfileImageUrl, // Store the uploaded image URL
    });

    await admin.auth().updateUser(uid, {
      displayName: fullName,
      photoURL: uploadedProfileImageUrl,
    });

    // Update the posts associated with the user to reflect the new profile image and full name
    const postsSnapshot = await db
      .collection("posts")
      .where("ownerId", "==", uid)
      .get();

    const batch = db.batch();

    postsSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        "postOwner.displayName": fullName,
        "postOwner.profileImage": uploadedProfileImageUrl,
      });
    });

    await batch.commit(); // Commit the batch update

    return { message: "User profile updated successfully" }; // Return success message
  } catch (error: any) {
    // Catch any error that occurs and return a clear error message
    console.error("Error updating user profile:", error);
    throw new Error(`Error updating user profile: ${error.message}`);
  }
};

const changePassword = async (
  uid: string,
  oldPassword: string,
  newPassword: string
) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    if (!userRecord.email) throw new Error("User email not found");

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userRecord.email,
          password: oldPassword,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await authResponse.json();
    if (!authResponse.ok) throw new Error("Old password is incorrect");

    const updateResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: authData.idToken, // Authenticated token from old password
          password: newPassword,
          returnSecureToken: false,
        }),
      }
    );

    const updateData = await updateResponse.json();
    if (!updateResponse.ok) throw new Error("Failed to update password");

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
