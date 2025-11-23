/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GroupItem = {
    /**
     * Item ID
     */
    _id?: string;
    /**
     * Group ID this item belongs to
     */
    groupId: string;
    /**
     * Reference to global item if this is a copy
     */
    globalItemRef?: string;
    /**
     * Item name
     */
    name: string;
    /**
     * Item category
     */
    category: string;
    /**
     * Emoji icon
     */
    icon?: string;
    /**
     * Default unit of measurement
     */
    defaultUnit?: string;
    /**
     * Barcode
     */
    barcode?: string;
    /**
     * Additional names for search
     */
    searchNames?: Array<string>;
    /**
     * User ID who created this item
     */
    createdBy?: string;
    /**
     * Tag IDs associated with this item
     */
    tags?: Array<string>;
    createdAt?: string;
};

