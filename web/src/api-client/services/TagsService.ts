/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagRequest } from '../models/CreateTagRequest';
import type { Tag } from '../models/Tag';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TagsService {
    /**
     * Get user tags
     * Get all tags for the authenticated user
     * @returns Tag List of user tags
     * @throws ApiError
     */
    public static getApiTags(): CancelablePromise<Array<Tag>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tags',
        });
    }
    /**
     * Create tag
     * Create a new user tag
     * @param requestBody
     * @returns Tag Tag created
     * @throws ApiError
     */
    public static postApiTags(
        requestBody: CreateTagRequest,
    ): CancelablePromise<Tag> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tags',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update tag
     * Update a user tag
     * @param id
     * @param requestBody
     * @returns any Tag updated
     * @throws ApiError
     */
    public static putApiTags(
        id: string,
        requestBody: CreateTagRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/tags/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete tag
     * Delete a user tag
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiTags(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/tags/{id}',
            path: {
                'id': id,
            },
        });
    }
}
