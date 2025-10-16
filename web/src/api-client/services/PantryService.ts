/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePantryItemRequest } from '../models/CreatePantryItemRequest';
import type { PantryItem } from '../models/PantryItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PantryService {
    /**
     * Get all pantry items
     * Retrieve all pantry items for the authenticated user's group
     * @returns PantryItem A list of pantry items
     * @throws ApiError
     */
    public static getApiPantry(): CancelablePromise<Array<PantryItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pantry',
        });
    }
    /**
     * Create pantry item
     * Add a new item to the pantry (requires pantry:create permission)
     * @param requestBody
     * @returns any Item created
     * @throws ApiError
     */
    public static postApiPantry(
        requestBody: CreatePantryItemRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/pantry',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update pantry item
     * Update an existing pantry item (requires pantry:update permission)
     * @param id
     * @param requestBody
     * @returns any Item updated
     * @throws ApiError
     */
    public static putApiPantry(
        id: string,
        requestBody: {
            quantity?: number;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/pantry/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete pantry item
     * Delete a pantry item (requires pantry:delete permission)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiPantry(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/pantry/{id}',
            path: {
                'id': id,
            },
        });
    }
}
