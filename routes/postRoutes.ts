import { Router } from "express";
import {
  getAllPostsController,
  uploadPostController,
} from "../controllers/postController";

export const PostRouter = Router();

PostRouter.post("/upload-post", uploadPostController);
PostRouter.get("/get-posts", getAllPostsController);
