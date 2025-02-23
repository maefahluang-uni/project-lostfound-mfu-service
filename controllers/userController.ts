import { Request, Response } from "express";
import {
  signinUser,
  signupUser,
  getUser,
  updateUser,
  changePassword,
} from "../services/userService";
import multer from "multer";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const upload = multer({ storage: multer.memoryStorage() });

const sigupUserController = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  try {
    const newUser = await signupUser(fullName, email, password);
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
    const { message, token, userId } = await signinUser(email, password);
    res.status(201).json({ message, token, user: { userId } });
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
    const user = await getUser(uid);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { fullName, bio, profileImage } = req.body;
    if (!uid) {
      res.status(400).json({ error: "User ID is required" });
    }

    const result = await updateUser(uid, fullName, bio, profileImage);
    res
      .status(200)
      .json({ message: "User created successfully", result: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const changePasswordController = async (req: Request, res: Response) => {
  try {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
      res.status(400).json({ error: "All fields are required" });
    }

    const result = await changePassword(uid, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export {
  upload,
  sigupUserController,
  signinUserController,
  getUserController,
  updateUserController,
  changePasswordController,
};
