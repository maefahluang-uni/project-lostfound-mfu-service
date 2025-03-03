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
    // Log files to check the file paths
    console.log("Files to upload:", files);

    // Check and upload files to Cloudinary
    const uploadPhotos = await Promise.all(
      files.map(async (file) => {
        // Ensure file.buffer is of type Buffer
        const buffer = Buffer.isBuffer(file.buffer)
          ? file.buffer
          : Buffer.from(file.buffer);

        try {
          // Upload the file buffer to Cloudinary
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "posts",
                resource_type: "auto", // Automatically detects file type (image, video, etc.)
                public_id: file.originalname.split(".")[0], // Optional: Specify a custom public ID
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
          return (result as { secure_url: string }).secure_url; // Return the URL of the uploaded file
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          throw new Error("Failed to upload image to Cloudinary");
        }
      })
    );

    // Filter out any null values in case any file upload failed
    const validPhotos = uploadPhotos.filter((url) => url !== null);

    if (validPhotos.length === 0) {
      throw new Error("No valid files uploaded");
    }

    // Create the post document in Firestore
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
      photos: validPhotos, // Store only successfully uploaded URLs
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
