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

export interface LoginUserInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginUserOutput {
    userId: string;
    jwt: string;
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

export interface AddUserItemInput {
    userId: string;
    itemId: string;
}

export interface AddUserItemOutput {
    userId: string;
    itemId: string;
}

export interface RemoveUserItemInput {
    userId: string;
    itemId: string;
}

export interface RemoveUserItemOutput {
    userId: string;
    itemId: string;
}

export interface UpdateUserItemInput {
    userId: string;
    /**
    * @ref UserItem
    */
    items: UserItem;
}

export interface UpdateUserItemOutput {
    userId: string;
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
    userId: string;
    name: string;
    password: string;
    email: string;
    /**
    * @ref UserItem
    */
    items: UserItem[];
}
//#endregion Base Interfaces