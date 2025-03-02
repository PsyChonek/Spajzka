import { ObjectId } from "mongodb";

/**
 * Represents a group in the database.
 */
export interface Group {
	id: ObjectId; // Unique identifier for the group
	name: string; // Name of the group
	users: ObjectId[]; // List of user IDs (as ObjectId) associated with the group
}
