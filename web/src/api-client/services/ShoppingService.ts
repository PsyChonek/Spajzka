/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateShoppingItemRequest } from '../models/CreateShoppingItemRequest';
import type { ShoppingItem } from '../models/ShoppingItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ShoppingService {
    /**
     * Get all shopping items
     * Retrieve all shopping list items for the authenticated user's group
     * @returns ShoppingItem A list of shopping items
     * @throws ApiError
     */
    public static getApiShopping(): CancelablePromise<Array<ShoppingItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shopping',
        });
    }
    /**
     * Create shopping item
     * Add a new item to the shopping list (requires shopping:create permission)
     * @param requestBody
     * @returns any Item created
     * @throws ApiError
     */
    public static postApiShopping(
        requestBody: CreateShoppingItemRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/shopping',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update shopping item
     * Update an existing shopping item (requires shopping:update permission)
     * @param id
     * @param requestBody
     * @returns any Item updated
     * @throws ApiError
     */
    public static putApiShopping(
        id: string,
        requestBody: {
            quantity?: number;
            completed?: boolean;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/shopping/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete shopping item
     * Delete a shopping item (requires shopping:delete permission)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiShopping(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/shopping/{id}',
            path: {
                'id': id,
            },
        });
    }
}
