import { ObjectId } from "mongodb";

/**
 * Represents a user in the database.
 */
export interface User {
	id: ObjectId; // Unique identifier for the user
	name: string; // Name of the user
	password: string; // Hashed password of the user
	email: string; // Email address of the user
	items: Array<UserItem>; // List of items associated with the user
}

/**
 * Represents an item associated with a user.
 */
export interface UserItem {
	itemId: ObjectId; // Unique identifier for the item
	quantity: number; // Quantity of the item
	favoriteTier: number; // Favorite tier (0-5)
	toBuyQuantity: number; // Quantity of the item to buy
	minToHave: number; // Minimum quantity of the item to have before it's marked as "to buy"
}
