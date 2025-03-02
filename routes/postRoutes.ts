import { Router } from "express";
import * as postController from "../controllers/postController";

export const PostRouter = Router();

PostRouter.post("/upload-post", postController.uploadPostController);
PostRouter.get("/get-posts", postController.getAllPostsController);
PostRouter.get(
  "/get-single-post/:postId",
  postController.getSinglePostController
);
PostRouter.delete("/delete-post/:postId", postController.deletePostController);
PostRouter.put("/edit-post/:postId", postController.editPostController);
PostRouter.get("/share/:postId", postController.getViewablePostController);
