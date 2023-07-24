import { ObjectId } from "mongodb";

export interface Item {
    id: ObjectId
    name: string;
    price: number;
    description: string;
    image: string;
    /**
     * @ref ItemCategory
     */
    category: ItemCategory | null;
}

export interface ItemCategory {
    id: ObjectId
    name: string;
}