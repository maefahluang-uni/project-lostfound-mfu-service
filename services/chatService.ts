import { CHAT_MESSAGE_TYPE } from "../enums/chat";
import { io } from "../src";
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
    chatDocs.docs.map(async (doc, index) => {
        const chatData = doc.data()
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

        const chatProfileId = chatData.user_1_id === user.uid ? chatData.user_2_id : chatData.user_1_id
        const userDoc = await db.collection("users").doc(chatProfileId).get()
        const chatProfile = userDoc.exists ? userDoc.data() : null

        return {
            id: doc.id,
            lastMessage: {
                messageType: lastMessage?.type,
                content: lastMessage?.content,
                createdAt: new Date(lastMessage?.timestamp?.seconds * 1000)
            },
            chatProfile: {
                id: chatProfileId,
                fullName: chatProfile?.fullName
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

export const getChatRoom = async(chatRoomId: string, userId: string) => {
    try {
        const user = await admin.auth().getUser(userId);
        if(!user){
            console.log("Must sign in!")
            return;
        }
        const chatRoomDoc = await db.collection('chat_room').doc(chatRoomId).get()
        const chatRoomData = chatRoomDoc.exists ? chatRoomDoc.data() : null

        const chatRoomMessagesDoc = await db.collection('chat_message').where('room_id','==',chatRoomId).orderBy('timestamp','asc').get()
        if (chatRoomMessagesDoc.empty) {
            return [];
        }

        const chatProfileId = chatRoomData?.user_1_id === user.uid ? chatRoomData?.user_2_id : chatRoomData?.user_1_id
        const userDoc = await db.collection("users").doc(chatProfileId).get()
        const chatProfile = userDoc.exists ? userDoc.data() : null

        const messages = chatRoomMessagesDoc.docs.map((doc) => ({
            id: doc.id,
            type: doc.data().type,
            sender_id: doc.data().sender_id,
            content: doc.data().content,
            attachmentUrl: doc.data().attachmentUrl,
            room_id: doc.data().room_id,
            createdAt: new Date(doc.data().timestamp?.seconds * 1000)
        }));


        const payload = {
            id: chatRoomId,
            chatProfile: chatProfile,
            chatRoomMessages: messages
        }
        return payload
    }catch(err){
        console.error("Error getting chat room", err)
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
                room_id: newChatRoom.id,
                sender_id: payload.senderId,
                content: payload.messageType === CHAT_MESSAGE_TYPE.TEXT ? payload.message : "",
                attachmentUrl: payload.messageType === CHAT_MESSAGE_TYPE.IMAGE ? payload.message : "",
                timestamp: admin.firestore.Timestamp.now()
            })
            await emitChatRefresh(payload.chatRoomId!)
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
            await emitChatRefresh(payload.chatRoomId!)
            return newMessage
        }    
    }catch (err: any) {
        console.error("Message Error:", err.message, err.stack); 
        throw new Error("Error sending message: " + err.message); 
    }
}

const emitChatRefresh = async(roomId: string) => {
    await io.to(roomId).emit('refresh', roomId)
}