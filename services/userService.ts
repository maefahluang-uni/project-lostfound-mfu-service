import { db } from "../src/config/firebaseConfig";

const signupUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  try {
    const userRef = db.collection("users").doc();
    await userRef.set({
      fullName,
      email,
      password,
    });

    return { message: "User created successfully", userId: userRef.id };
  } catch (error: any) {
    throw new Error(`Error creating new user: ${error.message}`);
  }
};

export { signupUser };
