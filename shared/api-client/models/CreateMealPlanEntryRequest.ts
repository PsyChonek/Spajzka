/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMealPlanEntryRequest = {
    recipeId: string;
    recipeType: CreateMealPlanEntryRequest.recipeType;
    cookDate: string;
    /**
     * Defaults to recipe.servings if omitted
     */
    servings?: number;
    /**
     * Defaults to [cookDate] if omitted
     */
    eatDates?: Array<string>;
    mealTypes?: Array<string>;
    notes?: string;
    /**
     * Optional override; defaults to active group
     */
    groupId?: string;
};
export namespace CreateMealPlanEntryRequest {
    export enum recipeType {
        GLOBAL = 'global',
        GROUP = 'group',
    }
}

