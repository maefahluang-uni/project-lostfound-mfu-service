import { Router } from "express";
import { sigupUserController } from "../controllers/userController";

export const UserRouter = Router();

UserRouter.post("/signup", sigupUserController);
