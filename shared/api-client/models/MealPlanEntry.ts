/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MealPlanEntry = {
    _id?: string;
    groupId?: string;
    recipeId?: string;
    recipeType?: MealPlanEntry.recipeType;
    /**
     * Denormalized snapshot of recipe name at creation time
     */
    recipeName?: string;
    cookDate?: string;
    servings?: number;
    eatDates?: Array<string>;
    /**
     * Zero or more free-form labels (e.g. "breakfast", "lunch", "dinner"). A single meal can belong to several.
     */
    mealTypes?: Array<string>;
    notes?: string;
    shoppingGeneratedAt?: string | null;
    shoppingBatchId?: string | null;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
};
export namespace MealPlanEntry {
    export enum recipeType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

