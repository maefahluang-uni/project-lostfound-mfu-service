import { Router } from "express";

import { ExampleRouter } from "./exampleRoutes";

export const apiRouter = Router();

apiRouter.use('/example', ExampleRouter)
//put more routes here