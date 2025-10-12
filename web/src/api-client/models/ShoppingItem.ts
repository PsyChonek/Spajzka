/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ShoppingItem = {
    /**
     * Item ID
     */
    _id?: string;
    /**
     * Owner user ID
     */
    userId?: string;
    /**
     * Reference to common item ID
     */
    itemId?: string;
    /**
     * Item name
     */
    name: string;
    /**
     * Item quantity
     */
    quantity?: number;
    /**
     * Unit of measurement
     */
    unit?: string;
    /**
     * Whether item is completed
     */
    completed?: boolean;
    /**
     * Item category
     */
    category?: string;
    createdAt?: string;
    updatedAt?: string;
};

