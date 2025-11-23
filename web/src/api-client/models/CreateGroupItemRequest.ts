/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateGroupItemRequest = {
    name: string;
    category: string;
    icon?: string;
    defaultUnit?: string;
    barcode?: string;
    /**
     * Additional names for search
     */
    searchNames?: Array<string>;
    /**
     * Tag IDs to associate with this item
     */
    tags?: Array<string>;
};

