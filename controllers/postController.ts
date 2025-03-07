import { Request, Response } from "express";
import * as postServices from "../services/postService";
import { getCurrentUser } from "../middlewares/firebaseAuthMiddleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const uploadPostController = [
  upload.array("photos", 5),
  async (req: Request, res: Response) => {
    const post = req.body;

    try {
      const authToken = req.headers.authorization?.split("Bearer ")[1];
      if (!authToken) {
        throw new Error("No token provided");
      }

      const userId = await getCurrentUser(authToken!);
      if (!userId) {
        throw new Error("Invalid user");
      }

      const files = req.files as Express.Multer.File[];
      // if (!files || files.length === 0) {
      //   throw new Error("At least one photo must be uploaded");
      // }

      const newPost = await postServices.uploadPost(userId!, post, files);
      res
        .status(201)
        .json({ message: "Post uploaded successfully", user: newPost });
    } catch (error: any) {
      console.error("Error uploading post:", error);
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

    const { itemStatus, search } = req.query;
    const posts = await postServices.getPosts(
      userId!,
      itemStatus as string,
      search as string
    );
    res.status(200).json({ posts });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getSinglePostController = async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.split("Bearer ")[1];
    const userId = await getCurrentUser(authToken!);

    if (!userId || typeof userId !== "string" || userId.length > 128) {
      throw new Error("Invalid user ID.");
    }
    const { postId } = req.params;
    const post = await postServices.getSinglePost(userId!, postId);
    res.status(200).json(post);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const deletePostController = async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.split("Bearer ")[1];
    const userId = await getCurrentUser(authToken!);

    if (!userId || typeof userId !== "string" || userId.length > 128) {
      throw new Error("Invalid user ID.");
    }

    const { postId } = req.params;
    const message = await postServices.deletePost(userId!, postId);
    res.status(200).json(message);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const editPostController = [
  upload.array("photos", 5),
  async (req: Request, res: Response) => {
    try {
      const authToken = req.headers.authorization?.split("Bearer ")[1];
      const userId = await getCurrentUser(authToken!);

      if (!userId || typeof userId !== "string" || userId.length > 128) {
        throw new Error("Invalid user ID.");
      }

      const { postId } = req.params;
      const post = req.body;

      const updatedPost = await postServices.editPost(userId!, postId, post);
      res.status(200).json(updatedPost);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
];

const getViewablePostController = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await postServices.getViewablePost(postId);
    res.status(200).json(post);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export {
  uploadPostController,
  getAllPostsController,
  getSinglePostController,
  deletePostController,
  editPostController,
  getViewablePostController,
};
