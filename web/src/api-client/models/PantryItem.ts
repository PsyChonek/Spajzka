/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PantryItem = {
    _id?: string;
    groupId?: string;
    itemId?: string;
    itemType?: PantryItem.itemType;
    quantity?: number;
    name?: string;
    category?: string;
    icon?: string;
    defaultUnit?: string;
    barcode?: string;
    createdAt?: string;
    updatedAt?: string;
};
export namespace PantryItem {
    export enum itemType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

