import { Router } from "express";
import {
  changePasswordController,
  deleteUserController,
  getUserController,
  googleSignupController,
  signinUserController,
  sigupUserController,
  updateUserController,
} from "../controllers/userController";

export const UserRouter = Router();

UserRouter.post("/signup", sigupUserController);
UserRouter.post("/google-signup", googleSignupController);
UserRouter.post("/signin", signinUserController);
UserRouter.post("/google-signin", googleSignupController);
UserRouter.get("/user/:uid", getUserController);
UserRouter.put("/user/:uid", updateUserController);
UserRouter.post("/change-password", changePasswordController);
UserRouter.delete("/user/:uid", deleteUserController);
