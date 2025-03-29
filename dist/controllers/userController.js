"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordController = exports.updateUserController = exports.getUserController = exports.signinUserController = exports.sigupUserController = void 0;
const userService_1 = require("../services/userService");
const sigupUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullName, email, password } = req.body;
    try {
        const newUser = yield (0, userService_1.signupUser)(fullName, email, password);
        res
            .status(201)
            .json({ message: "User created successfully", user: newUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.sigupUserController = sigupUserController;
const signinUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield (0, userService_1.signinUser)(email, password);
        res.status(201).json({ message: "User Signed in successfully", user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.signinUserController = signinUserController;
const getUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.params;
        if (!uid) {
            res.status(400).json({ error: "User ID is required" });
        }
        const user = yield (0, userService_1.getUser)(uid);
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getUserController = getUserController;
const updateUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.params;
        const { bio } = req.body;
        if (!uid) {
            res.status(400).json({ error: "User ID is required" });
        }
        if (!bio) {
            res.status(400).json({ error: "Bio is required" });
        }
        const result = yield (0, userService_1.updateUser)(uid, bio);
        res.status(201).json({ message: "User created successfully", result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.updateUserController = updateUserController;
const changePasswordController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            res.status(400).json({ error: "All fields are required" });
        }
        const result = yield (0, userService_1.changePassword)(newPassword);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.changePasswordController = changePasswordController;
