/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ShoppingItem = {
    _id?: string;
    groupId?: string;
    itemId?: string;
    itemType?: ShoppingItem.itemType;
    quantity?: number;
    completed?: boolean;
    name?: string;
    category?: string;
    icon?: string;
    defaultUnit?: string;
    createdAt?: string;
    updatedAt?: string;
};
export namespace ShoppingItem {
    export enum itemType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

