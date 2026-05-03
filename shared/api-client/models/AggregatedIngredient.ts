/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AggregatedIngredient = {
    itemId?: string;
    itemType?: AggregatedIngredient.itemType;
    itemName?: string;
    unit?: string;
    quantity?: number;
    inPantry?: number;
    toAdd?: number;
    icon?: string;
    category?: string;
    defaultUnit?: string;
    unitType?: AggregatedIngredient.unitType;
};
export namespace AggregatedIngredient {
    export enum itemType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
    export enum unitType {
        WEIGHT = 'weight',
        VOLUME = 'volume',
        COUNT = 'count',
        LENGTH = 'length',
        CUSTOM = 'custom',
    }
}

