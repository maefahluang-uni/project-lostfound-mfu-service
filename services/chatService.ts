import { CHAT_MESSAGE_TYPE } from "../enums/chat";
import admin, {db} from "../src/config/firebaseAdminConfig";
import { Filter } from "firebase-admin/firestore";

export const getAllChats = async(userId: string) => {
    try{
    const user = await admin.auth().getUser(userId);
    if(!user){
        console.log("Must sign in!")
        return;
    }

    const chatDocs = await db.collection("chat_room")
    .where(
        Filter.or(
            Filter.where("user_1_id", "==", user.uid),
            Filter.where("user_2_id", "==", user.uid),
        )
    ).get()
    if(chatDocs.empty){
        return []
    }

    const chatRooms = await Promise.all(
    chatDocs.docs.map(async (doc) => {
        const lastMessageDoc = await db.collection("chat_message")
                            .where("room_id", "==", doc.id)
                            .orderBy("timestamp", "desc")
                            .limit(1)
                            .get()
        const lastMessage:any = lastMessageDoc.empty 
            ? null 
            : {
                id: lastMessageDoc.docs[0].id,
                ...lastMessageDoc.docs[0].data()
            };
        return {
            id: doc.id,
            lastMessage: {
                messageType: lastMessage?.type,
                content: lastMessage?.content
            },
            ...doc.data()
        }
    }))
    return chatRooms
    }catch(err){
        console.error("Error in getAllChats: ", err);
        throw new Error("Error fetching chat rooms");
    }
}

interface ISendMessage {
    messageType: CHAT_MESSAGE_TYPE,
    message: string,
    senderId: string,
    receiverId: string,
    chatRoomId?: string
}
export const sendMessage = async(payload: ISendMessage) => {

    try{
        if (!payload.senderId || !payload.receiverId || !payload.messageType || !payload.message) {
            throw new Error("Missing required fields: senderId, receiverId, or messageType");
        }
        
        if(!payload.chatRoomId){
            const newChatRoom = await db.collection("chat_room").add({
                user_1_id: payload.senderId,
                user_2_id: payload.receiverId,
                timestamp: admin.firestore.Timestamp.now()
            })
            const newMessage = await db.collection("chat_message").add({
                type: payload.messageType,
                room_id: payload.chatRoomId,
                sender_id: payload.senderId,
                content: payload.messageType === CHAT_MESSAGE_TYPE.TEXT ? payload.message : "",
                attachmentUrl: payload.messageType === CHAT_MESSAGE_TYPE.IMAGE ? payload.message : "",
                timestamp: admin.firestore.Timestamp.now()
            })
            return newMessage;
        }else{
            const existingChatRoom = await db.collection('chat_room').doc(payload.chatRoomId).get()
            if(!existingChatRoom.exists){
                throw new Error("Chat room not found!")
            }
            const newMessage = await db.collection("chat_message").add({
                type: payload.messageType,
                sender_id: payload.senderId,
                content: payload.messageType === "TEXT" ? payload.message : "",
                attachmentUrl: payload.messageType === "IMAGE" ? payload.message : "",
                room_id: existingChatRoom.id,
                timestamp: admin.firestore.Timestamp.now()
            })
            return newMessage
        }    
    }catch(err){
        console.log(JSON.stringify(err))
        throw new Error("Error sending message!")
    }
}