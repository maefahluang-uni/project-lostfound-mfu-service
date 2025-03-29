import { Request, Response } from "express";
import { getAllChats, getChatRoom, markMessagesAsRead, sendMessage } from "../services/chatService";
import { getCurrentUser } from "../middlewares/firebaseAuthMiddleware";

export const getAllUserChats = async(req: Request, res: Response) => {
    try{
        const authToken = req.headers.authorization?.split("Bearer ")[1]; 
        const userId = await getCurrentUser(authToken!)
        const searchQuery = req.query.searchQuery as string | undefined;
        console.log(JSON.stringify("Search query is " + searchQuery))
        const allChats = await getAllChats(userId!, searchQuery)
        res.status(200).json(allChats)
    }catch(err){
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const sendChatMessage = async(req: Request, res: Response) => {
    try{
        const {messageType, message, senderId, receiverId, chatRoomId} = req.body
        const file = req.file
        const messagePayload = {
            messageType,
            message,
            senderId,
            receiverId,
            chatRoomId,
            file
        }
        const sentMessage = await sendMessage(messagePayload)
        res.status(200).json(sentMessage)
    }catch(err){
        res.status(500).json({message:"Error sending message"})
    }
}

export const readChatMessage = async(req: Request, res: Response) => {
    try {
        const authToken = req.headers.authorization?.split("Bearer ")[1]; 
        const userId = await getCurrentUser(authToken!)
        const {chatRoomId} = req.params
        await markMessagesAsRead(userId!, chatRoomId)
        res.status(200).json("Messages read!")
    }catch(err){
        res.status(500).json({message:"Error reading chat messages"})
    }
}

export const getChatRoomDetails = async(req:Request, res:Response) => {
    try{
        const authToken = req.headers.authorization?.split("Bearer ")[1]; 
        const userId = await getCurrentUser(authToken!)
        const {chatRoomId} = req.params
        const chatRoom = await getChatRoom(chatRoomId, userId!)
        res.status(200).json(chatRoom)
    }catch(err){
        res.status(500).json({message:"Error getting chat room"})
    }
}