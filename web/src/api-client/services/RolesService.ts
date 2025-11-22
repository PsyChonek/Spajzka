/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Role } from '../models/Role';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RolesService {
    /**
     * Get all roles
     * Retrieve all available roles with their permissions
     * @returns Role List of roles
     * @throws ApiError
     */
    public static getApiRoles(): CancelablePromise<Array<Role>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/roles',
        });
    }
    /**
     * Get role by ID
     * Retrieve a specific role with its permissions
     * @param id Role ID (e.g., admin, moderator, member, system_moderator)
     * @returns Role Role details
     * @throws ApiError
     */
    public static getApiRoles1(
        id: string,
    ): CancelablePromise<Role> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/roles/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Role not found`,
            },
        });
    }
}
