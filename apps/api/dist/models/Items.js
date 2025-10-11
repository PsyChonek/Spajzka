"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ItemSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    isOnBuylist: {
        type: Boolean,
        default: false,
    },
    amount: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        default: 0,
    },
    groupId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Item", ItemSchema);
//# sourceMappingURL=Items.js.map