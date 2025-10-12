/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGroupRequest } from '../models/CreateGroupRequest';
import type { Group } from '../models/Group';
import type { GroupMember } from '../models/GroupMember';
import type { JoinGroupRequest } from '../models/JoinGroupRequest';
import type { UpdateGroupRequest } from '../models/UpdateGroupRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GroupsService {
    /**
     * Create a new group
     * Create a new group with the authenticated user as admin
     * @param requestBody
     * @returns Group Group created successfully
     * @throws ApiError
     */
    public static postApiGroups(
        requestBody: CreateGroupRequest,
    ): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/groups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
            },
        });
    }
    /**
     * Get user's group
     * Get the group that the authenticated user is a member of
     * @returns Group User's group
     * @throws ApiError
     */
    public static getApiGroupsMy(): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/groups/my',
            errors: {
                404: `User is not in any group`,
            },
        });
    }
    /**
     * Get group by ID
     * Get a specific group (user must be a member)
     * @param id
     * @returns Group Group details
     * @throws ApiError
     */
    public static getApiGroups(
        id: string,
    ): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `User is not a member of this group`,
                404: `Group not found`,
            },
        });
    }
    /**
     * Update group
     * Update group details (admin only)
     * @param id
     * @param requestBody
     * @returns Group Group updated successfully
     * @throws ApiError
     */
    public static putApiGroups(
        id: string,
        requestBody: UpdateGroupRequest,
    ): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/groups/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Only admin can update group`,
            },
        });
    }
    /**
     * Delete group
     * Delete a group (admin only)
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiGroups(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Only admin can delete group`,
            },
        });
    }
    /**
     * Join a group
     * Join a group using an invite code
     * @param requestBody
     * @returns Group Successfully joined group
     * @throws ApiError
     */
    public static postApiGroupsJoin(
        requestBody: JoinGroupRequest,
    ): CancelablePromise<Group> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/groups/join',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid invite code or user already in group`,
            },
        });
    }
    /**
     * Leave a group
     * Leave a group (admin cannot leave if there are other members)
     * @param id
     * @returns any Successfully left group
     * @throws ApiError
     */
    public static postApiGroupsLeave(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/groups/{id}/leave',
            path: {
                'id': id,
            },
            errors: {
                400: `Admin cannot leave group with other members`,
            },
        });
    }
    /**
     * Get group members
     * Get all members of a group with their details
     * @param id
     * @returns GroupMember List of group members
     * @throws ApiError
     */
    public static getApiGroupsMembers(
        id: string,
    ): CancelablePromise<Array<GroupMember>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/groups/{id}/members',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Kick user from group
     * Remove a user from the group (admin only, cannot kick admin)
     * @param id
     * @param userId
     * @returns any User kicked successfully
     * @throws ApiError
     */
    public static deleteApiGroupsKick(
        id: string,
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/groups/{id}/kick/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                403: `Only admin can kick users`,
            },
        });
    }
    /**
     * Regenerate invite code
     * Generate a new invite code for the group (admin only)
     * @param id
     * @returns any Invite code regenerated
     * @throws ApiError
     */
    public static postApiGroupsRegenerateInvite(
        id: string,
    ): CancelablePromise<{
        inviteCode?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/groups/{id}/regenerate-invite',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Toggle invite enabled/disabled
     * Enable or disable invites for the group (admin only)
     * @param id
     * @param requestBody
     * @returns any Invite status updated
     * @throws ApiError
     */
    public static postApiGroupsToggleInvite(
        id: string,
        requestBody: {
            enabled: boolean;
        },
    ): CancelablePromise<{
        inviteEnabled?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/groups/{id}/toggle-invite',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
