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
exports.changePassword = exports.updateUser = exports.getUser = exports.signinUser = exports.signupUser = void 0;
const firestore_1 = require("firebase/firestore");
const firebaseConfig_1 = require("../src/config/firebaseConfig");
const auth_1 = require("firebase/auth");
const validateFields = (...fields) => {
    if (fields.some((field) => !field)) {
        throw new Error("All required fields must be provided");
    }
};
const signupUser = (fullName, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        validateFields(fullName, email, password);
        const userCredential = yield (0, auth_1.createUserWithEmailAndPassword)(firebaseConfig_1.auth, email, password);
        const user = userCredential.user;
        yield (0, firestore_1.setDoc)((0, firestore_1.doc)(firebaseConfig_1.db, "users", user.uid), {
            fullName,
            email,
            bio: "",
            posts: [],
        });
        return { message: "User created successfully", userId: user.uid };
    }
    catch (error) {
        throw new Error(`Signup failed: ${error.message}`);
    }
});
exports.signupUser = signupUser;
const signinUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        validateFields(email, password);
        const userCredential = yield (0, auth_1.signInWithEmailAndPassword)(firebaseConfig_1.auth, email, password);
        const user = userCredential.user;
        const token = yield user.getIdToken();
        return { message: "User signed in successfully", token, userId: user.uid };
    }
    catch (error) {
        throw new Error(`Error creating login user: ${error.message}`);
    }
});
exports.signinUser = signinUser;
const getUser = (uid) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        validateFields(uid);
        const userDoc = yield (0, firestore_1.getDoc)((0, firestore_1.doc)(firebaseConfig_1.db, "users", uid));
        if (!userDoc.exists())
            throw new Error("User data not found in database");
        const postsQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, "posts"), (0, firestore_1.where)("userId", "==", uid));
        const postsSnapshot = yield (0, firestore_1.getDocs)(postsQuery);
        const posts = postsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return {
            uid,
            fullName: ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fullName) || "Unknown User",
            email: ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.email) || "",
            bio: ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.bio) || "",
            posts,
        };
    }
    catch (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
});
exports.getUser = getUser;
const updateUser = (uid, bio) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        validateFields(uid, bio);
        yield (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebaseConfig_1.db, "users", uid), { bio });
        return { message: "User profile updated successfully" };
    }
    catch (error) {
        throw new Error(`Error updating user profile: ${error.message}`);
    }
});
exports.updateUser = updateUser;
const changePassword = (newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        validateFields(newPassword);
        const currentUser = firebaseConfig_1.auth.currentUser;
        if (!currentUser)
            throw new Error("User must be authenticated");
        yield (0, auth_1.updatePassword)(currentUser, newPassword);
        return {
            message: "Password updated successfully",
        };
    }
    catch (error) {
        throw new Error(`Error updaing password ${error.message}`);
    }
});
exports.changePassword = changePassword;
