/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecipeIngredient } from './RecipeIngredient';
export type CreateGroupRecipeRequest = {
    name: string;
    description?: string;
    icon?: string;
    servings: number;
    ingredients: Array<RecipeIngredient>;
    instructions: Array<string>;
};

