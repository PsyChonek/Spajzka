/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecipeIngredient } from './RecipeIngredient';
export type CreateGlobalRecipeRequest = {
    name: string;
    description?: string;
    icon?: string;
    servings: number;
    ingredients: Array<RecipeIngredient>;
    instructions: Array<string>;
    /**
     * Tag IDs to associate with this recipe
     */
    tags?: Array<string>;
};

