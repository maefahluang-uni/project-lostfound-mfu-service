import { Router } from "express";

import { ExampleRouter } from "./exampleRoutes";
import { UserRouter } from "./userRoutes";

export const apiRouter = Router();

apiRouter.use("/example", ExampleRouter);
apiRouter.use("/users", UserRouter);
//put more routes here
