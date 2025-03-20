import mongoose, { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passHash: string;
  salt: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// // Password comparison method
// UserSchema.methods.comparePassword = async function (
//   password: string
// ): Promise<boolean> {
//   const user = this as IUser;
//   const hash = await bcrypt.hash(password, user.salt);
//   return hash === user.passHash;
// };

export default mongoose.model<IUser>("User", UserSchema);
