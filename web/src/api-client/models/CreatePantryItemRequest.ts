/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePantryItemRequest = {
    itemId: string;
    itemType: CreatePantryItemRequest.itemType;
    quantity: number;
};
export namespace CreatePantryItemRequest {
    export enum itemType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

