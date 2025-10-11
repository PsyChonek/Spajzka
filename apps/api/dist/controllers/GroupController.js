"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupController = void 0;
const tsoa_1 = require("tsoa");
const GroupService_1 = __importDefault(require("../services/GroupService"));
let GroupController = class GroupController extends tsoa_1.Controller {
    groupService = new GroupService_1.default();
    /**
     * Get all groups
     */
    async getAllGroups() {
        return this.groupService.getAllGroups();
    }
    /**
     * Get a group by ID
     */
    async getGroup(groupId) {
        return this.groupService.getGroupById(groupId);
    }
    /**
     * Create a new group
     */
    async createGroup(requestBody) {
        this.setStatus(201);
        return this.groupService.createGroup(requestBody);
    }
    /**
     * Update a group
     */
    async updateGroup(groupId, requestBody) {
        return this.groupService.updateGroup(groupId, requestBody);
    }
    /**
     * Delete a group
     */
    async deleteGroup(groupId) {
        await this.groupService.deleteGroup(groupId);
        this.setStatus(204);
    }
    /**
     * Add a user to a group
     */
    async addUserToGroup(groupId, requestBody) {
        return this.groupService.addUserToGroup(groupId, requestBody);
    }
    /**
     * Remove a user from a group
     */
    async removeUserFromGroup(groupId, userId) {
        await this.groupService.removeUserFromGroup(groupId, userId);
        this.setStatus(204);
    }
};
exports.GroupController = GroupController;
__decorate([
    (0, tsoa_1.Get)(),
    (0, tsoa_1.Security)("jwt"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getAllGroups", null);
__decorate([
    (0, tsoa_1.Get)("{groupId}"),
    (0, tsoa_1.Response)(404, "Group not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getGroup", null);
__decorate([
    (0, tsoa_1.Post)(),
    (0, tsoa_1.SuccessResponse)(201, "Group created"),
    (0, tsoa_1.Response)(400, "Validation error"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "createGroup", null);
__decorate([
    (0, tsoa_1.Put)("{groupId}"),
    (0, tsoa_1.Response)(404, "Group not found"),
    (0, tsoa_1.Response)(400, "Validation error"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "updateGroup", null);
__decorate([
    (0, tsoa_1.Delete)("{groupId}"),
    (0, tsoa_1.SuccessResponse)(204, "Group deleted"),
    (0, tsoa_1.Response)(404, "Group not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "deleteGroup", null);
__decorate([
    (0, tsoa_1.Post)("{groupId}/users"),
    (0, tsoa_1.Response)(404, "Group not found"),
    (0, tsoa_1.Response)(400, "Validation error"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "addUserToGroup", null);
__decorate([
    (0, tsoa_1.Delete)("{groupId}/users/{userId}"),
    (0, tsoa_1.SuccessResponse)(204, "User removed from group"),
    (0, tsoa_1.Response)(404, "Group not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "removeUserFromGroup", null);
exports.GroupController = GroupController = __decorate([
    (0, tsoa_1.Route)("groups"),
    (0, tsoa_1.Tags)("Groups")
], GroupController);
//# sourceMappingURL=GroupController.js.map