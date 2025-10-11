"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Items_1 = __importDefault(require("../models/Items"));
const mongoose_1 = require("mongoose");
class ItemService {
    async getAllItems() {
        const items = await Items_1.default.find();
        return items.map(this.mapToDto);
    }
    async getItemById(itemId) {
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            throw new Error("Invalid item ID");
        }
        const item = await Items_1.default.findById(itemId);
        if (!item) {
            throw new Error("Item not found");
        }
        return this.mapToDto(item);
    }
    async getItemsByUserId(userId) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }
        const items = await Items_1.default.find({ userId: new mongoose_1.Types.ObjectId(userId) });
        return items.map(this.mapToDto);
    }
    async getItemsByGroupId(groupId) {
        if (!mongoose_1.Types.ObjectId.isValid(groupId)) {
            throw new Error("Invalid group ID");
        }
        const items = await Items_1.default.find({ groupId: new mongoose_1.Types.ObjectId(groupId) });
        return items.map(this.mapToDto);
    }
    async createItem(itemData) {
        if (!mongoose_1.Types.ObjectId.isValid(itemData.groupId)) {
            throw new Error("Invalid group ID");
        }
        if (!mongoose_1.Types.ObjectId.isValid(itemData.userId)) {
            throw new Error("Invalid user ID");
        }
        const item = new Items_1.default({
            name: itemData.name,
            isOnBuylist: itemData.isOnBuylist ?? false,
            amount: itemData.amount ?? 0,
            price: itemData.price ?? 0,
            groupId: new mongoose_1.Types.ObjectId(itemData.groupId),
            userId: new mongoose_1.Types.ObjectId(itemData.userId),
        });
        await item.save();
        return this.mapToDto(item);
    }
    async updateItem(itemId, itemData) {
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            throw new Error("Invalid item ID");
        }
        const updateData = {};
        if (itemData.name !== undefined)
            updateData.name = itemData.name;
        if (itemData.isOnBuylist !== undefined)
            updateData.isOnBuylist = itemData.isOnBuylist;
        if (itemData.amount !== undefined)
            updateData.amount = itemData.amount;
        if (itemData.price !== undefined)
            updateData.price = itemData.price;
        if (itemData.groupId !== undefined) {
            if (!mongoose_1.Types.ObjectId.isValid(itemData.groupId)) {
                throw new Error("Invalid group ID");
            }
            updateData.groupId = new mongoose_1.Types.ObjectId(itemData.groupId);
        }
        const item = await Items_1.default.findByIdAndUpdate(itemId, updateData, { new: true });
        if (!item) {
            throw new Error("Item not found");
        }
        return this.mapToDto(item);
    }
    async deleteItem(itemId) {
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            throw new Error("Invalid item ID");
        }
        const result = await Items_1.default.findByIdAndDelete(itemId);
        if (!result) {
            throw new Error("Item not found");
        }
    }
    mapToDto(item) {
        return {
            id: item._id.toString(),
            name: item.name,
            isOnBuylist: item.isOnBuylist,
            amount: item.amount,
            price: item.price,
            groupId: item.groupId.toString(),
            userId: item.userId.toString(),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
}
exports.default = ItemService;
//# sourceMappingURL=ItemService.js.map