import { json, Request, Response } from "express";
import {
  signinUser,
  signupUser,
  getUser,
  updateUser,
  changePassword,
} from "../services/userService";

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
    const user = await signinUser(email, password);
    res.status(201).json({ message: "User Signed in successfully", user });
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
    const { bio } = req.body;
    if (!uid) {
      res.status(400).json({ error: "User ID is required" });
    }
    if (!bio) {
      res.status(400).json({ error: "Bio is required" });
    }
    const result = await updateUser(uid, bio);
    res.status(201).json({ message: "User created successfully", result });
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
  sigupUserController,
  signinUserController,
  getUserController,
  updateUserController,
  changePasswordController,
};
