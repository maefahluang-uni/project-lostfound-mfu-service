import { Router } from "express";
import { getAllUserChats } from "../controllers/chatController";
import firebaseAuthMiddleware from "../middlewares/firebaseAuthMiddleware";

export const ChatRouter = Router();

ChatRouter.get("/get_chats", firebaseAuthMiddleware, getAllUserChats)