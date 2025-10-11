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
exports.ItemController = void 0;
const tsoa_1 = require("tsoa");
const ItemService_1 = __importDefault(require("../services/ItemService"));
let ItemController = class ItemController extends tsoa_1.Controller {
    itemService = new ItemService_1.default();
    /**
     * Get all items
     */
    async getAllItems() {
        return this.itemService.getAllItems();
    }
    /**
     * Get an item by ID
     */
    async getItem(itemId) {
        return this.itemService.getItemById(itemId);
    }
    /**
     * Create a new item
     */
    async createItem(requestBody) {
        this.setStatus(201);
        return this.itemService.createItem(requestBody);
    }
    /**
     * Update an item
     */
    async updateItem(itemId, requestBody) {
        return this.itemService.updateItem(itemId, requestBody);
    }
    /**
     * Delete an item
     */
    async deleteItem(itemId) {
        await this.itemService.deleteItem(itemId);
        this.setStatus(204);
    }
};
exports.ItemController = ItemController;
__decorate([
    (0, tsoa_1.Get)(),
    (0, tsoa_1.Security)("jwt"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "getAllItems", null);
__decorate([
    (0, tsoa_1.Get)("{itemId}"),
    (0, tsoa_1.Response)(404, "Item not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "getItem", null);
__decorate([
    (0, tsoa_1.Post)(),
    (0, tsoa_1.SuccessResponse)(201, "Item created"),
    (0, tsoa_1.Response)(400, "Validation error"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "createItem", null);
__decorate([
    (0, tsoa_1.Put)("{itemId}"),
    (0, tsoa_1.Response)(404, "Item not found"),
    (0, tsoa_1.Response)(400, "Validation error"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "updateItem", null);
__decorate([
    (0, tsoa_1.Delete)("{itemId}"),
    (0, tsoa_1.SuccessResponse)(204, "Item deleted"),
    (0, tsoa_1.Response)(404, "Item not found"),
    (0, tsoa_1.Security)("jwt"),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "deleteItem", null);
exports.ItemController = ItemController = __decorate([
    (0, tsoa_1.Route)("items"),
    (0, tsoa_1.Tags)("Items")
], ItemController);
//# sourceMappingURL=ItemController.js.map