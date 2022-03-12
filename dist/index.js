"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var routes_1 = __importDefault(require("./src/routes"));
var body_parser_1 = __importDefault(require("body-parser"));
var cors = require("cors");
var app = (0, express_1.default)();
app.use(cors());
app.use(body_parser_1.default.json());
// Routes
app.use(routes_1.default);
app.listen(process.env.PORT || 8080, function () {
    console.log("anki-server listening at http://localhost:" + (process.env.PORT || 8080));
});
