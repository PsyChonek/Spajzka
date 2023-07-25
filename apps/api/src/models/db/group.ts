import { ObjectId } from "mongodb";

export interface Group {
    id: ObjectId;
    name: string;
    users: string[];
}