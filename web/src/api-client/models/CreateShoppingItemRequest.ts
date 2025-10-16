/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateShoppingItemRequest = {
    itemId: string;
    itemType: CreateShoppingItemRequest.itemType;
    quantity?: number;
};
export namespace CreateShoppingItemRequest {
    export enum itemType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

