"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const GroupSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    userIds: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        }],
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Group", GroupSchema);
//# sourceMappingURL=Groups.js.map