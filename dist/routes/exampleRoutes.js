"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleRouter = void 0;
const express_1 = require("express");
const exampleController_1 = require("../controllers/exampleController");
exports.ExampleRouter = (0, express_1.Router)();
exports.ExampleRouter.get("/", exampleController_1.getExample);
