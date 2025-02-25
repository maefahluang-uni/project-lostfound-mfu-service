import { Router } from "express";
import {
  getAllPostsController,
  getSinglePostController,
  uploadPostController,
} from "../controllers/postController";

export const PostRouter = Router();

PostRouter.post("/upload-post", uploadPostController);
PostRouter.get("/get-posts", getAllPostsController);
PostRouter.get("/get-single-post/:postId", getSinglePostController);
