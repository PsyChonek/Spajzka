import { ObjectId } from "mongodb";
import { Group } from "src/models/db/group";

export interface GroupCollection extends Group {
    _id: ObjectId ;
    users: ObjectId[];
}