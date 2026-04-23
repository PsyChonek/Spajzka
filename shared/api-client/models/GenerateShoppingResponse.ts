/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AggregatedIngredient } from './AggregatedIngredient';
export type GenerateShoppingResponse = {
    ok?: boolean;
    batchId?: string;
    addedCount?: number;
    skippedFreeText?: Array<{
        recipeId?: string;
        recipeName?: string;
        itemName?: string;
    }>;
    aggregated?: Array<AggregatedIngredient>;
};

