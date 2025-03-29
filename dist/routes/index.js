"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const exampleRoutes_1 = require("./exampleRoutes");
const userRoutes_1 = require("./userRoutes");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use("/example", exampleRoutes_1.ExampleRouter);
exports.apiRouter.use("/users", userRoutes_1.UserRouter);
//put more routes here
