import admin, {db} from "../src/config/firebaseAdminConfig";

export const getAllChats = async(userId: string) => {
    const user = await admin.auth().getUser(userId);
    if(!user){
        console.log("Must sign in!")
        return;
    }
    const chatsDoc = await db.collection("chat_room").doc(user.uid).get()
    if (!chatsDoc.exists){
        console.log("Chat room not found for user");
        return;
    }
    console.log(JSON.stringify(chatsDoc))
}