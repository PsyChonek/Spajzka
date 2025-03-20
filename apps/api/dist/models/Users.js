"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    passHash: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
// // Password comparison method
// UserSchema.methods.comparePassword = async function (
//   password: string
// ): Promise<boolean> {
//   const user = this as IUser;
//   const hash = await bcrypt.hash(password, user.salt);
//   return hash === user.passHash;
// };
exports.default = mongoose_1.default.model("User", UserSchema);
//# sourceMappingURL=Users.js.map