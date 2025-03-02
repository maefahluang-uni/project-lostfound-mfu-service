import { Post } from "../models/post";
import admin, { db } from "../src/config/firebaseAdminConfig";

// const upload = multer({ storage: multer.memoryStorage() });

// const uploadImageToStorage = async (
//   file: Express.Multer.File
// ): Promise<string> => {
//   const fileName = `posts/${Date.now()}_${file.originalname}`;
//   const fileUpload = bucket.file(fileName);

//   return new Promise((resolve, reject) => {
//     const blobStream = fileUpload.createWriteStream({
//       metadata: { contentType: file.mimetype },
//     });

//     blobStream.on("error", (error) => reject(error));

//     blobStream.on("finish", async () => {
//       await fileUpload.makePublic();
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
//       resolve(publicUrl);
//     });

//     blobStream.end(file.buffer);
//   });
// };

const uploadPost = async (userId: string, post: Post) => {
  const user = await admin.auth().getUser(userId);
  if (!user) {
    throw new Error("Must sign in");
  }

  const { item, itemStatus, color, phone, date, time, location, desc, photos } =
    post;

  if (
    item == null ||
    itemStatus == null ||
    date == null ||
    time == null ||
    location == null
  ) {
    throw new Error("All required fields must be provided");
  }

  try {
    const postRef = db.collection("posts").doc();
    await postRef.set({
      item,
      itemStatus,
      color,
      phone,
      date,
      time,
      location,
      desc,
      photos: photos || [],
      ownerId: userId,
      postOwner: {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: postRef.id, item, itemStatus, location, ownerId: userId };
  } catch (error) {
    throw new Error("Failed to upload post");
  }
};

const getPosts = async (
  userId: string,
  itemStatus?: string,
  search?: string
) => {
  const user = await admin.auth().getUser(userId);
  if (!user) {
    throw new Error("Must sign in");
  }

  let postsQuery: admin.firestore.Query = db.collection("posts");

  postsQuery = postsQuery.where("itemStatus", "!=", "Resolved");

  if (itemStatus && ["Lost", "Found"].includes(itemStatus)) {
    postsQuery = postsQuery.where("itemStatus", "==", itemStatus);
  }

  const postsSnapshot = await postsQuery.get();
  if (postsSnapshot.empty) {
    throw new Error("No posts found");
  }

  let posts = postsSnapshot.docs.map((doc) => {
    const postData = doc.data();
    return {
      id: doc.id,
      item: postData.item || "Unknown",
      itemStatus: postData.itemStatus || "Unknown",
      color: postData.color || "Unknown",
      phone: postData.phone,
      date: postData.date,
      time: postData.time,
      location: postData.location || "Unknown",
      desc: postData.desc,
      photos: postData.photos,
      ownerId: postData.ownerId || "Unknown",
      postOwner: postData.postOwner || {
        id: "",
        email: "",
        displayName: "Unknown User",
        photoURL: "",
      },
    };
  });

  if (search) {
    const searchTerms = search.toLowerCase().split(" ");

    posts = posts.filter((post) => {
      const searchableText =
        `${post.item} ${post.color} ${post.location}`.toLowerCase();
      return searchTerms.some((term) => searchableText.includes(term));
    });
  }

  return posts;
};

const getSinglePost = async (userId: string, postId: string) => {
  const user = await admin.auth().getUser(userId);
  if (!user) {
    throw new Error("Must sign in");
  }

  const postDoc = await db.collection("posts").doc(postId).get();
  if (!postDoc.exists) {
    throw new Error("Post not found");
  }
  const postData = postDoc.data();

  const postOwner = await admin.auth().getUser(postData!.ownerId);

  const post = {
    id: postDoc.id,
    item: postData!.item || "Unknown",
    itemStatus: postData!.itemStatus || "Unknown",
    color: postData!.color || "Unknown",
    phone: postData!.phone,
    date: postData!.date,
    time: postData!.time,
    location: postData!.location || "Unknown",
    desc: postData!.desc,
    photos: postData!.photos,
    ownerId: postData!.ownerId || "Unknown",
    postOwner: {
      id: postOwner.uid || "",
      email: postOwner.email || "",
      displayName: postOwner.displayName || "",
      photoURL: postOwner.photoURL || "",
    },
  };

  return { post };
};

const deletePost = async (userId: string, postId: string) => {
  const user = await admin.auth().getUser(userId);
  if (!user) {
    throw new Error("Must sign in");
  }

  const postDoc = await db.collection("posts").doc(postId).get();
  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  const postData = postDoc.data();
  if (postData!.ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  await db.collection("posts").doc(postId).delete();
  return { message: "Post deleted successfully" };
};

const editPost = async (userId: string, postId: string, updatedPost: any) => {
  const user = await admin.auth().getUser(userId);
  if (!user) {
    throw new Error("Must sign in");
  }

  const PostDoc = await db.collection("posts").doc(postId).get();
  if (!PostDoc.exists) {
    throw new Error("Post not found");
  }

  const postData = PostDoc.data();
  if (postData!.ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  if (!updatedPost || Object.keys(updatedPost).length === 0) {
    throw new Error("No valid fields to update");
  }

  await db.collection("posts").doc(postId).update(updatedPost);
  return { message: "Post updated successfully" };
};

const getViewablePost = async (postId: string) => {
  const postDoc = await db.collection("posts").doc(postId).get();
  if (!postDoc.exists) {
    throw new Error("Post not found");
  }
  const postData = postDoc.data();

  const postOwner = await admin.auth().getUser(postData!.ownerId);

  const post = {
    id: postDoc.id,
    item: postData!.item || "Unknown",
    itemStatus: postData!.itemStatus || "Unknown",
    color: postData!.color || "Unknown",
    phone: postData!.phone,
    date: postData!.date,
    time: postData!.time,
    location: postData!.location || "Unknown",
    desc: postData!.desc,
    photos: postData!.photos,
    ownerId: postData!.ownerId || "Unknown",
    postOwner: {
      id: postOwner.uid || "",
      email: postOwner.email || "",
      displayName: postOwner.displayName || "",
      photoURL: postOwner.photoURL || "",
    },
  };

  return { post };
};

export {
  uploadPost,
  getPosts,
  getSinglePost,
  getViewablePost,
  deletePost,
  editPost,
};
