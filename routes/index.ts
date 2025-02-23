import { Router } from "express";

import { ExampleRouter } from "./exampleRoutes";
import { UserRouter } from "./userRoutes";
import { ChatRouter } from "./chatRoutes";

export const apiRouter = Router();

apiRouter.use("/example", ExampleRouter);
apiRouter.use("/users", UserRouter);
apiRouter.use("/chats", ChatRouter)
//put more routes here
