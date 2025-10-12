/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateItemRequest } from '../models/CreateItemRequest';
import type { Item } from '../models/Item';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ItemsService {
    /**
     * Get all items
     * Retrieve a list of all items in the pantry
     * @returns Item A list of items
     * @throws ApiError
     */
    public static getApiItems(): CancelablePromise<Array<Item>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/items',
            errors: {
                500: `Server error`,
            },
        });
    }
    /**
     * Create a new item
     * Add a new item to the pantry
     * @param requestBody
     * @returns Item Item created successfully
     * @throws ApiError
     */
    public static postApiItems(
        requestBody: CreateItemRequest,
    ): CancelablePromise<Item> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/items',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
                500: `Server error`,
            },
        });
    }
    /**
     * Get item by ID
     * Retrieve a specific item by its ID
     * @param id Item ID
     * @returns Item Item found
     * @throws ApiError
     */
    public static getApiItems1(
        id: string,
    ): CancelablePromise<Item> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/items/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Item not found`,
                500: `Server error`,
            },
        });
    }
    /**
     * Update an item
     * Update an existing item by its ID
     * @param id Item ID
     * @param requestBody
     * @returns Item Item updated successfully
     * @throws ApiError
     */
    public static putApiItems(
        id: string,
        requestBody: CreateItemRequest,
    ): CancelablePromise<Item> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/items/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Item not found`,
                500: `Server error`,
            },
        });
    }
    /**
     * Delete an item
     * Delete an item by its ID
     * @param id Item ID
     * @returns void
     * @throws ApiError
     */
    public static deleteApiItems(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/items/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Item not found`,
                500: `Server error`,
            },
        });
    }
}
