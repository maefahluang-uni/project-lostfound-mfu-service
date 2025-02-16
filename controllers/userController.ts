import { Request, Response } from "express";
import { signupUser } from "../services/userService";

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

export { sigupUserController };
