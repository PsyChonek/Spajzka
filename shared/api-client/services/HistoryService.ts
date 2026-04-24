/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HistoryListResponse } from '../models/HistoryListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HistoryService {
    /**
     * List activity history for a group
     * Return append-only activity history entries for the authenticated user's
     * active group (or the supplied `groupId`) in reverse chronological order.
     * Supports filtering by entity type and action, and cursor-based pagination
     * via `before` (ISO timestamp of the last entry from the previous page).
     *
     * @param groupId
     * @param entityType Comma-separated list of entity types to include
     * @param action
     * @param limit
     * @param before ISO-8601 timestamp; only return entries strictly older than this
     * @returns HistoryListResponse Paginated history entries
     * @throws ApiError
     */
    public static getApiHistory(
        groupId?: string,
        entityType?: string,
        action?: 'create' | 'update' | 'delete' | 'join' | 'leave' | 'kick' | 'role_change',
        limit: number = 50,
        before?: string,
    ): CancelablePromise<HistoryListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/history',
            query: {
                'groupId': groupId,
                'entityType': entityType,
                'action': action,
                'limit': limit,
                'before': before,
            },
        });
    }
}
