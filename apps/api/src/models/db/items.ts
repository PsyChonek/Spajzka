import { ObjectId } from "mongodb";

/**
 * Represents an item in the database.
 */
export interface Item {
	id: ObjectId; // Unique identifier for the item
	name: string; // Name of the item
	price: number; // Price of the item
	description: string; // Description of the item
	image: string; // URL or path to the item's image
	/**
	 * Optional: Category of the item
	 * @ref ItemCategory
	 */
	category?: ItemCategory | null; // Category of the item (nullable)
}

/**
 * Represents a category for an item.
 */
export interface ItemCategory {
	name: string; // Name of the category
}
