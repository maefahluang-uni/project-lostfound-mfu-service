import { Request, Response } from "express";
import { getPosts, uploadPost } from "../services/postService";
import { getCurrentUser } from "../middlewares/firebaseAuthMiddleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const uploadPostController = [
  upload.single("photos"),
  async (req: Request, res: Response) => {
    const post = req.body;
    // const file = req.file;

    try {
      const authToken = req.headers.authorization?.split("Bearer ")[1];
      const userId = await getCurrentUser(authToken!);

      // let photos: string[] = [];
      // if (file) {
      //   const photoURL = await uploadImageToStorage(file);
      //   photos.push(photoURL);
      // }

      // post.photos = photos;
      const newPost = await uploadPost(userId!, post);
      res
        .status(201)
        .json({ message: "Post uploaded successfully", user: newPost });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
];

const getAllPostsController = async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.split("Bearer ")[1];
    const userId = await getCurrentUser(authToken!);

    if (!userId || typeof userId !== "string" || userId.length > 128) {
      throw new Error("Invalid user ID.");
    }

    const { itemStatus } = req.query;
    const posts = await getPosts(userId!, itemStatus as string);
    res.status(200).json({ posts });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export { uploadPostController, getAllPostsController };
