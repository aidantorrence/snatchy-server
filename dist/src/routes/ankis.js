"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_promise_router_1 = __importDefault(require("express-promise-router"));
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var ankis = (0, express_promise_router_1.default)();
ankis.get("/ankis", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var posts, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.post.findMany()];
            case 1:
                posts = _a.sent();
                res.json(posts);
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                res.json(e_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
ankis.post("/anki", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var posts, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.post.create({
                        data: req.body,
                    })];
            case 1:
                posts = _a.sent();
                res.status(200).send("post created");
                return [3 /*break*/, 3];
            case 2:
                e_2 = _a.sent();
                res.status(400).send("post failed");
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
ankis.get("/anki-to-review", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var post, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n\t\t\tSELECT * FROM \"Post\"\n            WHERE \"reviewDate\" = (\n\t\t\t\tSELECT min(\"reviewDate\") \n\t\t\t\tFROM \"Post\"\n\t\t\t\tWHERE (\"updatedAt\" < NOW() - INTERVAL '6 hours' OR EXTRACT (epoch from (\"updatedAt\" - \"createdAt\")) < 60)\n\t\t\t\t)\n\t\t\tLIMIT 1\n        "], ["\n\t\t\tSELECT * FROM \"Post\"\n            WHERE \"reviewDate\" = (\n\t\t\t\tSELECT min(\"reviewDate\") \n\t\t\t\tFROM \"Post\"\n\t\t\t\tWHERE (\"updatedAt\" < NOW() - INTERVAL '6 hours' OR EXTRACT (epoch from (\"updatedAt\" - \"createdAt\")) < 60)\n\t\t\t\t)\n\t\t\tLIMIT 1\n        "])))];
            case 1:
                post = _a.sent();
                res.json(post);
                return [3 /*break*/, 3];
            case 2:
                e_3 = _a.sent();
                res.json(e_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
ankis.patch("/anki", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, post, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = req.body.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma.post.update({
                        where: { id: id },
                        data: req.body,
                    })];
            case 2:
                post = _a.sent();
                res.json(post);
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                res.json(e_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
ankis.delete("/anki", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, post, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = req.body.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma.post.delete({
                        where: { id: id },
                    })];
            case 2:
                post = _a.sent();
                res.json(post);
                return [3 /*break*/, 4];
            case 3:
                e_5 = _a.sent();
                res.json(e_5);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = ankis;
var templateObject_1;
