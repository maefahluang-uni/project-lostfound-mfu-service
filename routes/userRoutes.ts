import { Router } from "express";
import * as userController from "../controllers/userController";

export const UserRouter = Router();

UserRouter.post("/signup", userController.signupUserController);
UserRouter.post("/google-signup", userController.googleSignupController);
UserRouter.post("/signin", userController.signinUserController);
UserRouter.post("/google-signin", userController.googleSignupController);
UserRouter.get("/user/:uid", userController.getUserController);
UserRouter.put("/user/:uid", userController.updateUserController);
UserRouter.post("/change-password", userController.changePasswordController);
UserRouter.delete("/user/:uid", userController.deleteUserController);
