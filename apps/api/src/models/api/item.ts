export interface CreateItemInput {
	name: string;
	price: number;
	description: string;
	image: string;
	/**
	 * @nullable
	 * @ref ItemCategory
	 */
	category?: ItemCategory | null;
}

export interface CreateItemOutput {
	id: string;
}

export interface GetItemInput {
	id: string;
}

export interface GetItemOutput {
	id: string;
	name: string;
	price: number;
	description: string;
	image: string;
	/**
	 * @nullable
	 * @ref ItemCategory
	 */
	category?: ItemCategory | null;
}

export interface UpdateItemInput {
	id: string;
	name: string;
	price: number;
	description: string;
	image: string;
	/**
	 * @nullable
	 * @ref ItemCategory
	 */
	category: ItemCategory | null;
}

export interface UpdateItemOutput {
	id: string;
}

export interface DeleteItemInput {
	id: string;
}

export interface DeleteItemOutput {
	id: string;
}

//#region Helper Interfaces
export interface ItemCategory {
	name: string;
}

export interface Item {
	id: string;
	name: string;
	price: number;
	description: string;
	image: string;
	/**
	 * @nullable
	 * @ref ItemCategory
	 */
	category: ItemCategory | null;
}
//#endregion Helper Interfaces
