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
    /**
     * Bulk delete history entries
     * Delete history entries for the active group (requires history:delete
     * permission). Scope is defined by query parameters:
     * - no parameters → **clear all** entries for the group
     * - `before` only → delete entries strictly older than this timestamp
     * - `after` only → delete entries strictly newer than this timestamp
     * - `before` + `after` → delete entries inside the inclusive time range
     *
     * @param before
     * @param after
     * @param groupId
     * @returns any Number of entries deleted
     * @throws ApiError
     */
    public static deleteApiHistory(
        before?: string,
        after?: string,
        groupId?: string,
    ): CancelablePromise<{
        deletedCount?: number;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/history',
            query: {
                'before': before,
                'after': after,
                'groupId': groupId,
            },
        });
    }
    /**
     * Delete a single history entry
     * Remove one history log entry by ID (requires history:delete permission).
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiHistory1(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/history/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Entry not found`,
            },
        });
    }
}
