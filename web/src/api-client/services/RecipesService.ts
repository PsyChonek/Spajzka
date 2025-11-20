/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGlobalRecipeRequest } from '../models/CreateGlobalRecipeRequest';
import type { CreateGroupRecipeRequest } from '../models/CreateGroupRecipeRequest';
import type { GlobalRecipe } from '../models/GlobalRecipe';
import type { GroupRecipe } from '../models/GroupRecipe';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RecipesService {
    /**
     * Get all recipes
     * Get both global recipes and group recipes for user's group
     * @returns any Combined list of recipes
     * @throws ApiError
     */
    public static getApiRecipes(): CancelablePromise<{
        globalRecipes?: Array<GlobalRecipe>;
        groupRecipes?: Array<GroupRecipe>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes',
        });
    }
    /**
     * Get global recipes
     * Get all global recipes (requires global_recipes:create permission)
     * @returns GlobalRecipe List of global recipes
     * @throws ApiError
     */
    public static getApiRecipesGlobal(): CancelablePromise<Array<GlobalRecipe>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes/global',
        });
    }
    /**
     * Create global recipe
     * Create a new global recipe (requires global_recipes:create permission)
     * @param requestBody
     * @returns GlobalRecipe Global recipe created
     * @throws ApiError
     */
    public static postApiRecipesGlobal(
        requestBody: CreateGlobalRecipeRequest,
    ): CancelablePromise<GlobalRecipe> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recipes/global',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Update global recipe
     * Update a global recipe (requires global_recipes:update permission)
     * @param id
     * @param requestBody
     * @returns any Global recipe updated
     * @throws ApiError
     */
    public static putApiRecipesGlobal(
        id: string,
        requestBody: CreateGlobalRecipeRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/recipes/global/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Delete global recipe
     * Delete a global recipe (requires global_recipes:delete permission)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiRecipesGlobal(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/recipes/global/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Get group recipes
     * Get all recipes for user's active group
     * @returns GroupRecipe List of group recipes
     * @throws ApiError
     */
    public static getApiRecipesGroup(): CancelablePromise<Array<GroupRecipe>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes/group',
        });
    }
    /**
     * Create group recipe
     * Create a new group-shared recipe (requires group_recipes:create permission)
     * @param requestBody
     * @returns GroupRecipe Group recipe created
     * @throws ApiError
     */
    public static postApiRecipesGroup(
        requestBody: CreateGroupRecipeRequest,
    ): CancelablePromise<GroupRecipe> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recipes/group',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Update group recipe
     * Update a group recipe (requires group_recipes:update permission)
     * @param id
     * @param requestBody
     * @returns any Group recipe updated
     * @throws ApiError
     */
    public static putApiRecipesGroup(
        id: string,
        requestBody: CreateGroupRecipeRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/recipes/group/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Delete group recipe
     * Delete a group recipe (requires group_recipes:delete permission)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiRecipesGroup(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/recipes/group/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
}
