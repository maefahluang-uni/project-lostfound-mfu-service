import { Router } from "express";
import {
  changePasswordController,
  getUserController,
  logoutUserController,
  signinUserController,
  sigupUserController,
  updateUserController,
} from "../controllers/userController";

export const UserRouter = Router();

UserRouter.post("/signup", sigupUserController);
UserRouter.post("/signin", signinUserController);
UserRouter.post("/logout", logoutUserController);
UserRouter.get("/user/:uid", getUserController);
UserRouter.put("/user/:uid", updateUserController);
UserRouter.post("/change-password", changePasswordController);
