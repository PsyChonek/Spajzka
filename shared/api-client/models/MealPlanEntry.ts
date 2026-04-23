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
     * Free-form label e.g. "dinner", "lunch"
     */
    mealType?: string;
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

