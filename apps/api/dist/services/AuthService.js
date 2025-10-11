"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const Users_1 = __importDefault(require("../models/Users"));
const Groups_1 = __importDefault(require("../models/Groups"));
const config_1 = __importDefault(require("../config/config"));
class AuthService {
    async register(userData) {
        const { username, displayName } = userData;
        // Generate unique access code
        const accessCode = (0, uuid_1.v4)();
        // Create and save user
        const user = new Users_1.default({
            username,
            displayName: displayName || username, // Use username as displayName if not provided
            accessCode,
        });
        await user.save();
        return {
            id: user._id.toString(),
            username: user.username,
            displayName: user.displayName,
            accessCode: user.accessCode, // Return access code on registration
        };
    }
    async login(loginData) {
        const { accessCode } = loginData;
        // Find user by access code
        const user = await Users_1.default.findOne({ accessCode });
        if (!user) {
            throw new Error("Invalid access code");
        }
        // Create JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, config_1.default.jwtSecret, { expiresIn: "30d" });
        return {
            token,
            expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
            user: {
                id: user._id.toString(),
                username: user.username,
                displayName: user.displayName,
            },
        };
    }
    async resetAccessCode(userId) {
        // Generate new access code
        const newAccessCode = (0, uuid_1.v4)();
        // Update user's access code
        const user = await Users_1.default.findByIdAndUpdate(userId, { accessCode: newAccessCode }, { new: true });
        if (!user) {
            throw new Error("User not found");
        }
        return {
            accessCode: newAccessCode,
        };
    }
    async registerGuest() {
        // Generate unique guest username with timestamp
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const guestUsername = `guest_${timestamp}_${randomSuffix}`;
        const displayName = `Guest User`;
        // Generate unique access code
        const accessCode = (0, uuid_1.v4)();
        // Create and save guest user
        const user = new Users_1.default({
            username: guestUsername,
            displayName,
            accessCode,
        });
        await user.save();
        // Create a default personal group for the guest user
        const personalGroup = new Groups_1.default({
            name: "My Items",
            description: "Personal items",
            userIds: [user._id],
        });
        await personalGroup.save();
        // Create JWT token
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, config_1.default.jwtSecret, { expiresIn: "30d" });
        return {
            token,
            expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
            user: {
                id: user._id.toString(),
                username: user.username,
                displayName: user.displayName,
                accessCode: user.accessCode, // Return access code for guest user
            },
        };
    }
    async upgradeGuest(userId, upgradeData) {
        const { username, displayName } = upgradeData;
        // Check if username is already taken
        const existingUser = await Users_1.default.findOne({ username });
        if (existingUser && existingUser._id.toString() !== userId) {
            throw new Error("Username already taken");
        }
        // Find and update the user
        const user = await Users_1.default.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        // Update username and displayName
        user.username = username;
        user.displayName = displayName || username;
        await user.save();
        return {
            id: user._id.toString(),
            username: user.username,
            displayName: user.displayName,
            accessCode: user.accessCode,
        };
    }
}
exports.default = AuthService;
//# sourceMappingURL=authService.js.map