import { Router } from "express";
import { getAllUserChats, getChatRoomDetails, readChatMessage, sendChatMessage } from "../controllers/chatController";
import firebaseAuthMiddleware from "../middlewares/firebaseAuthMiddleware";

export const ChatRouter = Router();

ChatRouter.get("/get_chats", firebaseAuthMiddleware, getAllUserChats)
ChatRouter.post("/send_message", firebaseAuthMiddleware, sendChatMessage)
ChatRouter.get("/get_chat_room/:chatRoomId", firebaseAuthMiddleware, getChatRoomDetails)
ChatRouter.get("/read_chat_room/:chatRoomId", firebaseAuthMiddleware, readChatMessage)