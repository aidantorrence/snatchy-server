"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var ankis_1 = __importDefault(require("./ankis"));
var tasks_1 = __importDefault(require("./tasks"));
var router = (0, express_1.Router)();
router.use(ankis_1.default);
router.use(tasks_1.default);
exports.default = router;
