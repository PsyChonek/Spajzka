/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecipeIngredient } from './RecipeIngredient';
export type GroupRecipe = {
    /**
     * Recipe ID
     */
    _id?: string;
    /**
     * Recipe name
     */
    name: string;
    /**
     * Recipe description
     */
    description?: string;
    /**
     * Emoji icon
     */
    icon?: string;
    /**
     * Recipe type
     */
    recipeType: GroupRecipe.recipeType;
    /**
     * Group ID this recipe belongs to
     */
    groupId: string;
    /**
     * User ID who created this recipe
     */
    userId: string;
    /**
     * Number of servings
     */
    servings: number;
    ingredients: Array<RecipeIngredient>;
    /**
     * Step-by-step instructions
     */
    instructions: Array<string>;
    createdAt?: string;
    updatedAt?: string;
};
export namespace GroupRecipe {
    /**
     * Recipe type
     */
    export enum recipeType {
        GROUP = 'group',
    }
}

