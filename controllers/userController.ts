import { Request, Response } from "express";
import * as userServices from "../services/userService";
import multer from "multer";
import { getCurrentUser } from "../middlewares/firebaseAuthMiddleware";

const upload = multer({ storage: multer.memoryStorage() });

const signupUserController = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  try {
    const newUser = await userServices.signupUser(fullName, email, password);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const googleSignupController = async (req: Request, res: Response) => {
  const { googleId } = req.body;

  try {
    const newUser = await userServices.googleSignupUser(googleId);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const signinUserController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { message, token, userId } = await userServices.signinUser(
      email,
      password
    );
    res.status(201).json({ message, token, user: { userId } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const googleSigninController = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    const { message, token, userId } = await userServices.googleSigninUser(
      idToken
    );
    res.status(200).json({ message, token, user: { userId } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const getUserController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      res.status(400).json({ error: "User ID is required" });
    }
    const user = await userServices.getUser(uid);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserController = [
  upload.single("profileImage"),
  async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { fullName, bio } = req.body;

      const authToken = req.headers.authorization?.split("Bearer ")[1];
      if (!authToken) {
        throw new Error("Unauthorized");
      }

      const userId = await getCurrentUser(authToken!);
      if (!userId) {
        throw new Error("Invalid user");
      }

      const file = req.file as Express.Multer.File;
      if (!file) {
        throw new Error("Please upload a file");
      }

      const result = await userServices.updateUser(uid, fullName, bio, file);
      res
        .status(201)
        .json({ message: "User created successfully", result: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
];

const changePasswordController = async (req: Request, res: Response) => {
  const { uid, oldPassword, newPassword } = req.body;
  try {
    const result = await userServices.changePassword(
      uid,
      oldPassword,
      newPassword
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      res.status(400).json({ error: "User ID is required" });
    }
    const result = await userServices.deleteUser(uid);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export {
  upload,
  signupUserController,
  googleSignupController,
  signinUserController,
  googleSigninController,
  getUserController,
  updateUserController,
  changePasswordController,
  deleteUserController,
};
