import { Request, Response } from "express";
import { getExampleLog } from "../services/exampleService";

export const getExample = async(req: Request, res: Response) => {
    try{
        const exampleLog = await getExampleLog()
        res.status(200).json({exampleLog: exampleLog})
    }catch(err){
        res.status(500).json({ message: "Internal Server Error" });
    }
}