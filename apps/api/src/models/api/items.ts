// Create Item
export interface CreateItemInput {
	name: string; // Name of the item
	price: number; // Price of the item
	description: string; // Description of the item
	image: string; // URL or path to the item's image
	/**
	 * Optional: Category of the item
	 * @nullable
	 * @ref ItemCategory
	 */
	category?: ItemCategory | null;
}

export interface CreateItemOutput {
	id: string; // ID of the newly created item
}

// Get Item
export interface GetItemInput {
	id: string; // ID of the item to retrieve
}

export interface GetItemOutput {
	id: string; // ID of the item
	name: string; // Name of the item
	price: number; // Price of the item
	description: string; // Description of the item
	image: string; // URL or path to the item's image
	/**
	 * Optional: Category of the item
	 * @nullable
	 * @ref ItemCategory
	 */
	category?: ItemCategory | null;
}

// Update Item
export interface UpdateItemInput {
	id: string; // ID of the item to update
	name?: string; // Optional: New name for the item
	price?: number; // Optional: New price for the item
	description?: string; // Optional: New description for the item
	image?: string; // Optional: New image URL or path for the item
	/**
	 * Optional: New category for the item
	 * @nullable
	 * @ref ItemCategory
	 */
	category?: ItemCategory | null;
}

export interface UpdateItemOutput {
	id: string; // ID of the updated item
}

// Delete Item
export interface DeleteItemInput {
	id: string; // ID of the item to delete
}

export interface DeleteItemOutput {
	id: string; // ID of the deleted item
}

//#region Helper Interfaces

export interface ItemCategory {
	name: string; // Name of the category
}

export interface Item {
	id: string; // Unique identifier for the item
	name: string; // Name of the item
	price: number; // Price of the item
	description: string; // Description of the item
	image: string; // URL or path to the item's image
	/**
	 * Optional: Category of the item
	 * @nullable
	 * @ref ItemCategory
	 */
	category: ItemCategory | null;
}

//#endregion Helper Interfaces
