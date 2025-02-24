import { Router } from "express";
import { getAllUserChats, sendChatMessage } from "../controllers/chatController";
import firebaseAuthMiddleware from "../middlewares/firebaseAuthMiddleware";

export const ChatRouter = Router();

ChatRouter.get("/get_chats", firebaseAuthMiddleware, getAllUserChats)
ChatRouter.post("/send_message", firebaseAuthMiddleware, sendChatMessage)