import mongoose, { Document, Types } from "mongoose";

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  userIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGroup>("Group", GroupSchema);
