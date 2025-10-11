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
exports.UserController = void 0;
const tsoa_1 = require("tsoa");
const UserService_1 = __importDefault(require("../services/UserService"));
const ItemService_1 = __importDefault(require("../services/ItemService"));
const GroupService_1 = __importDefault(require("../services/GroupService"));
let UserController = class UserController extends tsoa_1.Controller {
    userService = new UserService_1.default();
    itemService = new ItemService_1.default();
    groupService = new GroupService_1.default();
    /**
     * Get all users
     */
    async getAllUsers() {
        return this.userService.getAllUsers();
    }
    /**
     * Get a user by ID
     */
    async getUser(userId) {
        return this.userService.getUser(userId);
    }
    /**
     * Update a user
     */
    async updateUser(userId, requestBody) {
        return this.userService.updateUser(userId, requestBody);
    }
    /**
     * Delete a user
     */
    async deleteUser(userId) {
        await this.userService.deleteUser(userId);
        this.setStatus(204);
    }
    /**
     * Get all items for a user
     */
    async getUserItems(userId) {
        return this.itemService.getItemsByUserId(userId);
    }
    /**
     * Get all groups for a user
     */
    async getUserGroups(userId) {
        return this.groupService.getGroupsByUserId(userId);
    }
};
exports.UserController = UserController;
__decorate([
    (0, tsoa_1.Get)(),
    (0, tsoa_1.Security)("jwt"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllUsers", null);
__decorate([
    (0, tsoa_1.Get)("{userId}"),
    (0, tsoa_1.Response)(404, "User not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    (0, tsoa_1.Put)("{userId}"),
    (0, tsoa_1.Response)(404, "User not found"),
    (0, tsoa_1.Response)(400, "Validation error"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, tsoa_1.Delete)("{userId}"),
    (0, tsoa_1.SuccessResponse)(204, "User deleted"),
    (0, tsoa_1.Response)(404, "User not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
__decorate([
    (0, tsoa_1.Get)("{userId}/items"),
    (0, tsoa_1.Response)(404, "User not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserItems", null);
__decorate([
    (0, tsoa_1.Get)("{userId}/groups"),
    (0, tsoa_1.Response)(404, "User not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserGroups", null);
exports.UserController = UserController = __decorate([
    (0, tsoa_1.Route)("users"),
    (0, tsoa_1.Tags)("Users")
], UserController);
//# sourceMappingURL=UserController.js.map