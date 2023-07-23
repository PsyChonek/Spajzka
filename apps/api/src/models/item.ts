import { ItemCategory } from "./itemCategory";

export interface Item {
    id: string | undefined | null;
    name: string;
    price: number;
    description: string;
    image: string;
    /**
     * @ref ItemCategory
     */
    category: ItemCategory | string | undefined | null;
}