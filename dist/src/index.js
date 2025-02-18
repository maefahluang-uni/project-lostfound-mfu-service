"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("../routes");
const app = express();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express.json());
app.use("/api", routes_1.apiRouter);
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
