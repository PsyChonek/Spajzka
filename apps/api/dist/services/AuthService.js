"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Users_1 = __importDefault(require("../models/Users"));
const config_1 = __importDefault(require("../config/config"));
class AuthService {
    async createUser(userData) {
        const { email, password, displayName } = userData;
        // Check if user already exists
        const existingUser = await Users_1.default.findOne({ email });
        if (existingUser) {
            throw new Error("User already exists");
        }
        // Create salt and hash
        const salt = await bcrypt_1.default.genSalt(10);
        const passHash = await bcrypt_1.default.hash(password, salt);
        // Create and save user
        const user = new Users_1.default({
            email,
            passHash,
            salt,
            displayName,
        });
        await user.save();
        return {
            id: user._id.toString(),
            email: user.email,
            displayName: user.displayName,
        };
    }
    async login(loginData) {
        const { email, password } = loginData;
        // Find user
        const user = await Users_1.default.findOne({ email });
        if (!user) {
            throw new Error("Invalid credentials");
        }
        // Verify password
        const isMatch = password === user.passHash;
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }
        // Create JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id }, config_1.default.jwtSecret, { expiresIn: "7d" });
        return {
            token,
            expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        };
    }
}
exports.default = AuthService;
//# sourceMappingURL=AuthService.js.map