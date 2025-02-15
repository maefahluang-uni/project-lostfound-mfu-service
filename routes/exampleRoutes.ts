import { Router } from "express";
import { getExample } from "../controllers/exampleController";

export const ExampleRouter = Router();

ExampleRouter.get("/", getExample)