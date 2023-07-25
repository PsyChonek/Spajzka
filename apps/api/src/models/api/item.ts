export interface CreateItemInput {
    name: string;
    price: number;
    description: string;
    image: string;
    /**
     * @ref ItemCategory
     */
    category: ItemCategory | null;
}

export interface CreateItemOutput {
    itemId: string;
}

export interface GetItemInput {
    itemId: string;
}

export interface GetItemOutput {
    itemId: string;
    name: string;
    price: number;
    description: string;
    image: string;
    /**
     * @ref ItemCategory
     * */
    category: ItemCategory | null;
}

export interface UpdateItemInput {
    itemId: string;
    name: string;
    price: number;
    description: string;
    image: string;
    /**
     * @ref ItemCategory
     * */
    category: ItemCategory | null;
}

export interface UpdateItemOutput {
    itemId: string;
}

export interface DeleteItemInput {
    itemId: string;
}

export interface DeleteItemOutput {
    itemId: string;
}

//#region Helper Interfaces

export interface ItemCategory {
    name: string;
}

export interface Item {
    itemId: string;
    name: string;
    price: number;
    description: string;
    image: string;
    /**
     * @ref ItemCategory
     */
    category: ItemCategory | null;
}
//#endregion Helper Interfaces