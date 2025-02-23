import { Request, Response } from "express";
import { getAllChats } from "../services/chatService";
import { getCurrentUser } from "../middlewares/firebaseAuthMiddleware";

export const getAllUserChats = async(req: Request, res: Response) => {
    try{
        const authToken = req.headers.authorization?.split("Bearer ")[1]; 
        const userId = await getCurrentUser(authToken!)
        await getAllChats(userId!)
        res.status(200).json()
    }catch(err){
        res.status(500).json({ message: "Internal Server Error" });
    }
}