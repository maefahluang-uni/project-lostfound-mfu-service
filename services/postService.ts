import { Post } from "../models/post";
import cloudinary from "../src/config/cloudinary";
import admin, { db } from "../src/config/firebaseAdminConfig";

const uploadPost = async (
  userId: string,
  post: Post,
  files: Express.Multer.File[]
) => {
  const user = await admin.auth().getUser(userId);

  if (!user) {
    throw new Error("Must sign in");
  }

  const { item, itemStatus, color, phone, date, time, location, desc } = post;

  if (!item || !itemStatus || !date || !time || !location) {
    throw new Error("All required fields must be provided");
  }

  try {
    const uploadPhotos = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.isBuffer(file.buffer)
          ? file.buffer
          : Buffer.from(file.buffer);

        const originalName = file.originalname.split(".")[0] || "uploaded_file";
        const safePublicId = originalName.replace(/[^a-zA-Z0-9-_]/g, "_");

        try {
          const secureUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "posts",
                resource_type: "auto",
                public_id: safePublicId,
              },
              (error, result) => {
                if (error) {
                  return reject(error);
                }
                if (!result || !result.secure_url) {
                  return reject(new Error("Cloudinary upload failed - no secure URL returned"));
                }
                resolve(result.secure_url);
              }
            );
            uploadStream.end(buffer);
          });

          return secureUrl;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          throw new Error("Failed to upload image to Cloudinary");
        }
      })
    );

    const validPhotos = uploadPhotos.filter((url) => url !== null);

    if (validPhotos.length === 0) {
      throw new Error("No valid files uploaded");
    }

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
      photos: validPhotos,
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
    console.error("Error in uploadPost service:", error);
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
    throw new Error("User not found. Please sign in.");
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
