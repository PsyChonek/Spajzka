/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Item = {
    /**
     * Item ID
     */
    _id?: string;
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
     * Default unit of measurement (must be valid for the item's unitType)
     */
    defaultUnit?: string;
    /**
     * Unit family — gates which units are accepted
     */
    unitType?: Item.unitType;
    /**
     * Barcode
     */
    barcode?: string;
    /**
     * Additional names for search
     */
    searchNames?: Array<string>;
    /**
     * Item type
     */
    itemType: Item.itemType;
    /**
     * Group ID (only for group items)
     */
    groupId?: string;
    /**
     * Reference to global item if this is a copy
     */
    globalItemRef?: string;
    /**
     * Whether item is active (only for global items)
     */
    isActive?: boolean;
    /**
     * User ID who created this item (only for group items)
     */
    createdBy?: string;
    /**
     * Tag IDs associated with this item
     */
    tags?: Array<string>;
    createdAt?: string;
};
export namespace Item {
    /**
     * Unit family — gates which units are accepted
     */
    export enum unitType {
        WEIGHT = 'weight',
        VOLUME = 'volume',
        COUNT = 'count',
        LENGTH = 'length',
        CUSTOM = 'custom',
    }
    /**
     * Item type
     */
    export enum itemType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

