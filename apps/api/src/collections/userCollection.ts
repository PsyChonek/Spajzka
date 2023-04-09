import { ObjectId } from "mongodb";
import { User } from "src/models/user";

export interface UserCollection extends User {
    _id: ObjectId | undefined;
}