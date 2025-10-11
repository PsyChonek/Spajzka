"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Users_1 = __importDefault(require("../models/Users"));
const mongoose_1 = require("mongoose");
class UserService {
    async getAllUsers() {
        const users = await Users_1.default.find();
        return users.map(user => this.mapToDto(user));
    }
    async getUser(userId) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }
        const user = await Users_1.default.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return this.mapToDto(user);
    }
    async getUserByUsername(username) {
        const user = await Users_1.default.findOne({ username });
        if (!user) {
            throw new Error("User not found");
        }
        return this.mapToDto(user);
    }
    async updateUser(userId, userData) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }
        const updateData = {};
        if (userData.username !== undefined)
            updateData.username = userData.username;
        if (userData.displayName !== undefined)
            updateData.displayName = userData.displayName;
        const user = await Users_1.default.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
            throw new Error("User not found");
        }
        return this.mapToDto(user);
    }
    async deleteUser(userId) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }
        const result = await Users_1.default.findByIdAndDelete(userId);
        if (!result) {
            throw new Error("User not found");
        }
    }
    mapToDto(user, includeAccessCode = false) {
        return {
            id: user._id.toString(),
            username: user.username,
            displayName: user.displayName,
            ...(includeAccessCode && { accessCode: user.accessCode }),
        };
    }
}
exports.default = UserService;
//# sourceMappingURL=UserService.js.map