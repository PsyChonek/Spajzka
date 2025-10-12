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
     * Retrieve all shopping list items for the authenticated user
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
     * Add a new item to the shopping list
     * @param requestBody
     * @returns ShoppingItem Item created
     * @throws ApiError
     */
    public static postApiShopping(
        requestBody: CreateShoppingItemRequest,
    ): CancelablePromise<ShoppingItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/shopping',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get shopping item by ID
     * Retrieve a specific shopping item
     * @param id
     * @returns ShoppingItem Shopping item found
     * @throws ApiError
     */
    public static getApiShopping1(
        id: string,
    ): CancelablePromise<ShoppingItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shopping/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update shopping item
     * Update an existing shopping item
     * @param id
     * @param requestBody
     * @returns ShoppingItem Item updated
     * @throws ApiError
     */
    public static putApiShopping(
        id: string,
        requestBody: {
            name?: string;
            quantity?: number;
            unit?: string;
            completed?: boolean;
            category?: string;
        },
    ): CancelablePromise<ShoppingItem> {
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
     * Delete a shopping item
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
