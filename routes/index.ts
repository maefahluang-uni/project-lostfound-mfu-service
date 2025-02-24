import { Router } from "express";

import { ExampleRouter } from "./exampleRoutes";
import { UserRouter } from "./userRoutes";
import { ChatRouter } from "./chatRoutes";
import { PostRouter } from "./postRoutes";

export const apiRouter = Router();

apiRouter.use("/example", ExampleRouter);
apiRouter.use("/users", UserRouter);
apiRouter.use("/chats", ChatRouter);
apiRouter.use("/posts", PostRouter);
//put more routes here
