"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Groups_1 = __importDefault(require("../models/Groups"));
const mongoose_1 = require("mongoose");
class GroupService {
    async getAllGroups() {
        const groups = await Groups_1.default.find();
        return groups.map(this.mapToDto);
    }
    async getGroupById(groupId) {
        if (!mongoose_1.Types.ObjectId.isValid(groupId)) {
            throw new Error("Invalid group ID");
        }
        const group = await Groups_1.default.findById(groupId);
        if (!group) {
            throw new Error("Group not found");
        }
        return this.mapToDto(group);
    }
    async getGroupsByUserId(userId) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }
        const groups = await Groups_1.default.find({ userIds: new mongoose_1.Types.ObjectId(userId) });
        return groups.map(this.mapToDto);
    }
    async createGroup(groupData) {
        const userIds = groupData.userIds?.map(id => {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid user ID: ${id}`);
            }
            return new mongoose_1.Types.ObjectId(id);
        }) || [];
        const group = new Groups_1.default({
            name: groupData.name,
            description: groupData.description,
            userIds,
        });
        await group.save();
        return this.mapToDto(group);
    }
    async updateGroup(groupId, groupData) {
        if (!mongoose_1.Types.ObjectId.isValid(groupId)) {
            throw new Error("Invalid group ID");
        }
        const updateData = {};
        if (groupData.name !== undefined)
            updateData.name = groupData.name;
        if (groupData.description !== undefined)
            updateData.description = groupData.description;
        const group = await Groups_1.default.findByIdAndUpdate(groupId, updateData, { new: true });
        if (!group) {
            throw new Error("Group not found");
        }
        return this.mapToDto(group);
    }
    async deleteGroup(groupId) {
        if (!mongoose_1.Types.ObjectId.isValid(groupId)) {
            throw new Error("Invalid group ID");
        }
        const result = await Groups_1.default.findByIdAndDelete(groupId);
        if (!result) {
            throw new Error("Group not found");
        }
    }
    async addUserToGroup(groupId, userData) {
        if (!mongoose_1.Types.ObjectId.isValid(groupId)) {
            throw new Error("Invalid group ID");
        }
        if (!mongoose_1.Types.ObjectId.isValid(userData.userId)) {
            throw new Error("Invalid user ID");
        }
        const group = await Groups_1.default.findById(groupId);
        if (!group) {
            throw new Error("Group not found");
        }
        const userObjectId = new mongoose_1.Types.ObjectId(userData.userId);
        // Check if user is already in the group
        if (group.userIds.some(id => id.equals(userObjectId))) {
            throw new Error("User is already in the group");
        }
        group.userIds.push(userObjectId);
        await group.save();
        return this.mapToDto(group);
    }
    async removeUserFromGroup(groupId, userId) {
        if (!mongoose_1.Types.ObjectId.isValid(groupId)) {
            throw new Error("Invalid group ID");
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }
        const group = await Groups_1.default.findById(groupId);
        if (!group) {
            throw new Error("Group not found");
        }
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        group.userIds = group.userIds.filter(id => !id.equals(userObjectId));
        await group.save();
        return this.mapToDto(group);
    }
    mapToDto(group) {
        return {
            id: group._id.toString(),
            name: group.name,
            description: group.description,
            userIds: group.userIds.map(id => id.toString()),
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
        };
    }
}
exports.default = GroupService;
//# sourceMappingURL=GroupService.js.map