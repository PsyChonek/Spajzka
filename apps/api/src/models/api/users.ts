// Create User
export interface CreateUserInput {
	name: string; // Name of the user
	password: string; // Password for the user
	email: string; // Email address of the user
}

export interface CreateUserOutput {
	id: string; // ID of the newly created user
}

// Get User
export interface GetUserInput {
	id: string; // ID of the user to retrieve
}

export interface GetUserOutput {
	id: string; // ID of the user
	name: string; // Name of the user
	email: string; // Email address of the user
	/**
	 * List of items associated with the user
	 * @type array
	 * @ref UserItem
	 */
	items: Array<UserItem>; // Explicitly define as an array
}

// Get User Groups
export interface GetUserGroupInput {
	id: string; // ID of the user
}

export interface GetUserGroupOutput {
	id: string; // ID of the group
	name: string; // Name of the group
}

// Get User Items
export interface GetUserItemInput {
	id: string; // ID of the user
}

export interface GetUserItemOutput {
	id: string; // ID of the user
	/**
	 * List of items associated with the user
	 * @ref UserItem
	 */
	items: Array<UserItem>; // Explicitly define as an array
}

// Update User
export interface UpdateUserInput {
	id: string; // ID of the user to update
	name?: string; // Optional: New name for the user
	password?: string; // Optional: New password for the user
	email?: string; // Optional: New email address for the user
}

export interface UpdateUserOutput {
	id: string; // ID of the updated user
}

// Delete User
export interface DeleteUserInput {
	id: string; // ID of the user to delete
}

export interface DeleteUserOutput {
	id: string; // ID of the deleted user
}

// Add User Item
export interface AddUserItemInput {
	id: string; // ID of the user
	itemId: string; // ID of the item to add
}

export interface AddUserItemOutput {
	id: string; // ID of the user
	itemId: string; // ID of the added item
}

// Remove User Item
export interface RemoveUserItemInput {
	id: string; // ID of the user
	itemId: string; // ID of the item to remove
}

export interface RemoveUserItemOutput {
	id: string; // ID of the user
	itemId: string; // ID of the removed item
}

// Update User Item
export interface UpdateUserItemInput {
	id: string; // ID of the user
	/**
	 * List of items to update
	 * @type array
	 * @ref UserItem
	 */
	items: Array<UserItem>; // Explicitly define as an array
}

export interface UpdateUserItemOutput {
	id: string; // ID of the user
	itemId: string; // ID of the updated item
}

//#region Base Interfaces

export interface UserItem {
	itemId: string; // ID of the item
	quantity: number; // Quantity of the item
	favoriteTier: number; // Favorite tier (0-5)
	toBuyQuantity: number; // Quantity of the item to buy
	minToHave: number; // Minimum quantity of the item to have before it's marked as "to buy"
}

export interface User {
	id: string; // Unique identifier for the user
	name: string; // Name of the user
	password: string; // Password for the user
	email: string; // Email address of the user
	/**
	 * List of items associated with the user
	 * @ref UserItem
	 * @type array
	 */
	items: Array<UserItem>; // Explicitly define as an array
}

//#endregion Base Interfaces
