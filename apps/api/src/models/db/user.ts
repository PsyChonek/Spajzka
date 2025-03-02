import { ObjectId } from "mongodb";

export interface User {
	id: ObjectId;
	name: string;
	password: string;
	email: string;
	items: UserItem[];
}

export interface UserItem {
	itemId: ObjectId; // item id
	quantity: number; // quantity of item
	favoriteTier: number; // 0-5
	toBuyQuantity: number; // quantity of item to buy
	minToHave: number; // minimum quantity of item to have before is marked as "to buy"
}
