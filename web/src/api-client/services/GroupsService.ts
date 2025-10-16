/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignRoleRequest } from '../models/AssignRoleRequest';
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
     * Create a new shared group with the authenticated user as admin
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
     * Get user's groups
     * Get all groups that the authenticated user is a member of
     * @returns Group User's groups
     * @throws ApiError
     */
    public static getApiGroupsMy(): CancelablePromise<Array<Group>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/groups/my',
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
     * Update group details (requires group:update permission)
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
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Delete group
     * Delete a group (requires group:delete permission)
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
                403: `Insufficient permissions`,
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
     * Remove a user from the group (requires group:manage_members permission)
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
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Assign role to member
     * Change a member's role (requires group:manage_roles permission)
     * @param id
     * @param userId
     * @param requestBody
     * @returns any Role assigned successfully
     * @throws ApiError
     */
    public static putApiGroupsMembersRole(
        id: string,
        userId: string,
        requestBody: AssignRoleRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/groups/{id}/members/{userId}/role',
            path: {
                'id': id,
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Regenerate invite code
     * Generate a new invite code for the group (requires group:update permission)
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
     * Enable or disable invites for the group (requires group:update permission)
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
