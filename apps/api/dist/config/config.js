"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Load development environment variables from .env.development file
if (process.env['NODE_ENV'] === 'development') {
    dotenv_1.default.config({ path: '.env.development' });
}
// Load production environment variables from .env.production file
if (process.env['NODE_ENV'] === 'production') {
    dotenv_1.default.config({ path: '.env.production' });
}
const config = {
    port: process.env['PORT'] ? process.env['PORT'] : (() => { throw new Error("PORT must be provided"); })(),
    mongoUri: process.env['MONGO_URI'] ? process.env['MONGO_URI'] : (() => { throw new Error("MONGO_URI must be provided"); })(),
    jwtSecret: process.env['JWT_SECRET'] ? process.env['JWT_SECRET'] : (() => { throw new Error("JWT_SECRET must be provided"); })(),
    environment: process.env['NODE_ENV'] ? process.env['NODE_ENV'] : (() => { throw new Error("NODE_ENV must be provided"); })(),
};
exports.default = config;
//# sourceMappingURL=config.js.map