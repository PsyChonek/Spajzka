export interface CreateInput {
    name: string;
    password: string;
    email: string;
}

export interface CreateOutput {
    userId: string;
}

export interface GetUserInput {
    userId: string;
}

export interface GetUserOutput {
    userId: string;
    name: string;
    email: string;
    /**
    * @ref UserItem
    */
    items: UserItem[];
}

export interface GetUserGroupInput {
    userId: string;
}

export interface GetUserGroupOutput {
    userId: string;
    name: string;
}

export interface GetUserItemInput {
    userId: string;
}

export interface GetUserItemOutput {
    userId: string;
    /**
    * @ref UserItem
    */
    items: UserItem[];
}

export interface UpdateUserInput {
    userId: string;
    name: string;
    password: string;
    email: string;
}

export interface UpdateUserOutput {
    userId: string;
}

export interface DeleteUserInput {
    userId: string;
}

export interface DeleteUserOutput {
    userId: string;
}

//#region Helper Interfaces

export interface UserItem {
    itemId: string // item id
    quantity: number; // quantity of item
    favoriteTier: number; // 0-5
    toBuyQuantity: number; // quantity of item to buy
    minToHave: number; // minimum quantity of item to have before is marked as "to buy"
}

//#endregion Helper Interfaces