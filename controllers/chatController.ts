import { Request, Response } from "express";
import { getAllChats, sendMessage } from "../services/chatService";
import { getCurrentUser } from "../middlewares/firebaseAuthMiddleware";

export const getAllUserChats = async(req: Request, res: Response) => {
    try{
        const authToken = req.headers.authorization?.split("Bearer ")[1]; 
        const userId = await getCurrentUser(authToken!)
        const allChats = await getAllChats(userId!)
        res.status(200).json(allChats)
    }catch(err){
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const sendChatMessage = async(req: Request, res: Response) => {
    try{
        const {messageType, message, senderId, receiverId, chatRoomId} = req.body
        const messagePayload = {
            messageType,
            message,
            senderId,
            receiverId,
            chatRoomId
        }
        const sentMessage = await sendMessage(messagePayload)
        res.status(200).json(sentMessage)
    }catch(err){
        res.status(500).json({message:"Error sending message"})
    }
}