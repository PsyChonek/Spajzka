import { ObjectId } from "mongodb";
import { Item } from "src/models/item";

export interface ItemCollection extends Item {
    _id: ObjectId;
    userId: ObjectId;
}