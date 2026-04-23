/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AggregatedIngredient } from './AggregatedIngredient';
export type ShoppingPreviewResponse = {
    aggregated?: Array<AggregatedIngredient>;
    skippedFreeText?: Array<{
        recipeId?: string;
        recipeName?: string;
        itemName?: string;
    }>;
};

