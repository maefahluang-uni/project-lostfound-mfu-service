import { Router } from "express";
import { getAllUserChats, getChatRoomDetails, readChatMessage, sendChatMessage } from "../controllers/chatController";
import firebaseAuthMiddleware from "../middlewares/firebaseAuthMiddleware";
import multer from "multer";

export const ChatRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

ChatRouter.get("/get_chats", firebaseAuthMiddleware, getAllUserChats)
ChatRouter.post("/send_message", firebaseAuthMiddleware, upload.single("file"), sendChatMessage)
ChatRouter.get("/get_chat_room/:chatRoomId", firebaseAuthMiddleware, getChatRoomDetails)
ChatRouter.get("/read_chat_room/:chatRoomId", firebaseAuthMiddleware, readChatMessage)