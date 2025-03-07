import { CHAT_MESSAGE_TYPE } from "../enums/chat";
import { io } from "../src";
import cloudinary from "../src/config/cloudinary";
import admin, {db} from "../src/config/firebaseAdminConfig";
import { Filter } from "firebase-admin/firestore";

export const getAllChats = async(userId: string, searchQuery?: string) => {
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

        const unreadMessagesCount = await db.collection("chat_message")
            .where("room_id", "==", doc.id)
            .where("sender_id", "!=", user.uid) 
            .where("seen_at", "==", null) 
            .get()
            .then(snapshot => snapshot.size);
        return {
            id: doc.id,
            lastMessage: {
                messageType: lastMessage?.type,
                content: lastMessage?.content,
                createdAt: lastMessage?.timestamp ? new Date(lastMessage?.timestamp .toDate().getTime() - (lastMessage?.timestamp .toDate().getTimezoneOffset() * 60000)).toISOString() : null
            },
            unread_count: unreadMessagesCount,
            chatProfile: {
                id: chatProfileId,
                fullName: chatProfile?.fullName
            },
            ...doc.data()
        }
    }))
    const filteredChatRooms = searchQuery
    ? chatRooms.filter(chat => chat.chatProfile.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatRooms;

    return filteredChatRooms;
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
        const chatProfileData = userDoc.exists ? userDoc.data() : null
        const chatProfile = {
            "id": chatProfileId,
            ...chatProfileData
        }
        const messages = chatRoomMessagesDoc.docs.map((doc) => ({
            id: doc.id,
            type: doc.data().type,
            sender_id: doc.data().sender_id,
            content: doc.data().content,
            attachmentUrl: doc.data().attachmentUrl,
            room_id: doc.data().room_id,
            createdAt: doc.data().timestamp ? new Date(doc.data().timestamp?.toDate().getTime() - (doc.data().timestamp?.toDate().getTimezoneOffset() * 60000)).toISOString() : null
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
export interface ISendMessage {
    messageType: CHAT_MESSAGE_TYPE,
    message?: string,
    senderId: string,
    receiverId: string,
    chatRoomId?: string,
    file?: Express.Multer.File
}
export const sendMessage = async(payload: ISendMessage) => {
    try{
        if(payload.messageType && payload.messageType === 'TEXT'){
            if (!payload.senderId || !payload.receiverId || !payload.messageType || !payload.message) {
                throw new Error("Missing required fields: senderId, receiverId, or messageType");
            }
        }else{
            if (!payload.file) {
                throw new Error("Missing required fields: file");
            }
        }

        let chatRoomId = payload.chatRoomId;

        if (!chatRoomId) {
            const existingChatRoom = await db.collection("chat_room")
                .where("user_1_id", "in", [payload.senderId, payload.receiverId])
                .where("user_2_id", "in", [payload.senderId, payload.receiverId])
                .get();

            if (!existingChatRoom.empty) {
                chatRoomId = existingChatRoom.docs[0].id;
            }
        }
        if (!chatRoomId) {
            const newChatRoom = await db.collection("chat_room").add({
                user_1_id: payload.senderId,
                user_2_id: payload.receiverId,
                timestamp: admin.firestore.Timestamp.now()
            });

            chatRoomId = newChatRoom.id;
        }
        let fileUrl: string = ''
        if(payload.file){
            const uploadPhoto = async (file:any) => {

                const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
              
                try {

                  const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                      {
                        folder: "chat",
                        resource_type: "auto", 
                        public_id: file.originalname.split(".")[0], 
                      },
                      (error, result) => {
                        if (error) {
                          reject(error);
                        } else {
                          resolve(result as { secure_url: string });
                        }
                      }
                    );
                    uploadStream.end(buffer);
                  });
              
                  console.log("Cloudinary upload result:", result);
                  return (result as { secure_url: string }).secure_url; 
                } catch (cloudinaryError) {
                  console.error("Cloudinary upload error:", cloudinaryError);
                  throw new Error("Failed to upload image to Cloudinary");
                }
              };
              fileUrl = await uploadPhoto(payload?.file)
        }
        const newMessage = await db.collection("chat_message").add({
            type: payload.messageType,
            sender_id: payload.senderId,
            room_id: chatRoomId,
            content: payload.messageType === CHAT_MESSAGE_TYPE.TEXT ? payload.message : "",
            attachmentUrl: payload.messageType === CHAT_MESSAGE_TYPE.IMAGE ? fileUrl : "",
            timestamp: admin.firestore.Timestamp.now(),
            seen_at: null
        });
        await sendPushNotification(payload.receiverId, payload.senderId, payload.message || "You have a new message", chatRoomId);

        await emitChatRefresh(chatRoomId);

        return newMessage;  
    }catch (err: any) {
        console.error("Message Error:", err.message, err.stack); 
        throw new Error("Error sending message: " + err.message); 
    }
}

export const markMessagesAsRead = async (userId: string, chatRoomId: string) => {
    try {
        const unreadMessages = await db.collection("chat_message")
            .where("room_id", "==", chatRoomId)
            .where("sender_id", "!=", userId) 
            .where("seen_at", "==", null) 
            .get();

        const batch = db.batch();
        const timestamp = admin.firestore.Timestamp.now(); 
        unreadMessages.forEach((doc) => {
            batch.update(doc.ref, { seen_at: timestamp }); 
        });

        await batch.commit();

        await emitChatRefresh(chatRoomId)

        return { success: true, seen_at: timestamp };
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return { success: false, error };
    }
};

const sendPushNotification = async (receiverId: string, senderId: string, message: string, chatRoomId: string) => {
    try {
      const receiverDoc = await db.collection("users").doc(receiverId).get();
      if (!receiverDoc.exists) {
        console.log("Receiver not found.");
        return;
      }
  
      const receiverData = receiverDoc.data();
      const fcmToken = receiverData?.fcmToken;
  
      if (!fcmToken) {
        console.log("No FCM token found for user.");
        return;
      }
  
      const senderDoc = await db.collection("users").doc(senderId).get();
      const senderName = senderDoc.exists ? senderDoc.data()?.fullName || "Someone" : "Someone";
  
      const messagePayload = {
        notification: {
          title: `${senderName} sent you a message`,
          body: message,
        },
        data: {
          chatRoomId: chatRoomId,
          senderId: senderId,
          receiverId: receiverId,
        },
        token: fcmToken, 
      };
  
      await admin.messaging().send(messagePayload);
      console.log(`Notification sent to ${receiverId}`);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

const emitChatRefresh = async(roomId: string) => {
    await io.to(roomId).emit('refresh', roomId)
}
