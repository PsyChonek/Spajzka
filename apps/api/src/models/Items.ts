import mongoose, { Document, Types } from "mongoose";

export interface IItem extends Document {
  _id: Types.ObjectId;
  name: string;
  isOnBuylist: boolean;
  amount: number;
  price: number;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IItem>("Item", ItemSchema);
