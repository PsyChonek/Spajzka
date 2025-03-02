export interface CreateInput {
	name: string;
	password: string;
	email: string;
}

export interface CreateOutput {
	id: string;
}

export interface GetUserInput {
	id: string;
}

export interface GetUserOutput {
	id: string;
	name: string;
	email: string;
	/**
	 * @ref UserItem
	 */
	items: UserItem[];
}

export interface LoginUserInput {
	name: string;
	email: string;
	password: string;
}

export interface LoginUserOutput {
	id: string;
	jwt: string;
}

export interface GetUserGroupInput {
	id: string;
}

export interface GetUserGroupOutput {
	id: string;
	name: string;
}

export interface GetUserItemInput {
	id: string;
}

export interface GetUserItemOutput {
	id: string;
	/**
	 * @ref UserItem
	 */
	items: UserItem[];
}

export interface UpdateUserInput {
	id: string;
	name: string;
	password: string;
	email: string;
}

export interface UpdateUserOutput {
	id: string;
}

export interface DeleteUserInput {
	id: string;
}

export interface DeleteUserOutput {
	id: string;
}

export interface AddUserItemInput {
	id: string;
	itemId: string;
}

export interface AddUserItemOutput {
	id: string;
	itemId: string;
}

export interface RemoveUserItemInput {
	id: string;
	itemId: string;
}

export interface RemoveUserItemOutput {
	id: string;
	itemId: string;
}

export interface UpdateUserItemInput {
	id: string;
	/**
	 * @ref UserItem
	 */
	items: UserItem;
}

export interface UpdateUserItemOutput {
	id: string;
	itemId: string;
}

//#region Base Interfaces
export interface UserItem {
	itemId: string; // item id
	quantity: number; // quantity of item
	favoriteTier: number; // 0-5
	toBuyQuantity: number; // quantity of item to buy
	minToHave: number; // minimum quantity of item to have before is marked as "to buy"
}

export interface User {
	id: string;
	name: string;
	password: string;
	email: string;
	/**
	 * @ref UserItem
	 */
	items: UserItem[];
}
//#endregion Base Interfaces
