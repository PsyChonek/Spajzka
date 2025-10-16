/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGlobalItemRequest } from '../models/CreateGlobalItemRequest';
import type { CreateGroupItemRequest } from '../models/CreateGroupItemRequest';
import type { GlobalItem } from '../models/GlobalItem';
import type { GroupItem } from '../models/GroupItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ItemsService {
    /**
     * Get all items
     * Get both global items and group items for user's group
     * @returns any Combined list of items
     * @throws ApiError
     */
    public static getApiItems(): CancelablePromise<{
        globalItems?: Array<GlobalItem>;
        groupItems?: Array<GroupItem>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/items',
        });
    }
    /**
     * Get all global items
     * Get all active global items
     * @returns GlobalItem List of global items
     * @throws ApiError
     */
    public static getApiItemsGlobal(): CancelablePromise<Array<GlobalItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/items/global',
        });
    }
    /**
     * Create global item
     * Create a new global item (requires global_items:create permission)
     * @param requestBody
     * @returns GlobalItem Global item created
     * @throws ApiError
     */
    public static postApiItemsGlobal(
        requestBody: CreateGlobalItemRequest,
    ): CancelablePromise<GlobalItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/items/global',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Update global item
     * Update a global item (requires global_items:update permission)
     * @param id
     * @param requestBody
     * @returns any Global item updated
     * @throws ApiError
     */
    public static putApiItemsGlobal(
        id: string,
        requestBody: CreateGlobalItemRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/items/global/{id}',
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
     * Delete global item
     * Deactivate a global item (requires global_items:delete permission)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiItemsGlobal(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/items/global/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Get group items
     * Get all items for user's group
     * @returns GroupItem List of group items
     * @throws ApiError
     */
    public static getApiItemsGroup(): CancelablePromise<Array<GroupItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/items/group',
        });
    }
    /**
     * Create group item
     * Create a new group-specific item (requires group_items:create permission)
     * @param requestBody
     * @returns GroupItem Group item created
     * @throws ApiError
     */
    public static postApiItemsGroup(
        requestBody: CreateGroupItemRequest,
    ): CancelablePromise<GroupItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/items/group',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Update group item
     * Update a group item (requires group_items:update permission)
     * @param id
     * @param requestBody
     * @returns any Group item updated
     * @throws ApiError
     */
    public static putApiItemsGroup(
        id: string,
        requestBody: CreateGroupItemRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/items/group/{id}',
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
     * Delete group item
     * Delete a group item (requires group_items:delete permission)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiItemsGroup(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/items/group/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
}
