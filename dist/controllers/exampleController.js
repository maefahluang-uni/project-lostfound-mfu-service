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
exports.getExample = void 0;
const exampleService_1 = require("../services/exampleService");
const getExample = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exampleLog = yield (0, exampleService_1.getExampleLog)();
        res.status(200).json({ exampleLog: exampleLog });
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getExample = getExample;
