/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponse } from '../models/AuthResponse';
import type { ChangePasswordRequest } from '../models/ChangePasswordRequest';
import type { LoginRequest } from '../models/LoginRequest';
import type { McpExchangeRequest } from '../models/McpExchangeRequest';
import type { McpExchangeResponse } from '../models/McpExchangeResponse';
import type { McpTokenResponse } from '../models/McpTokenResponse';
import type { McpTokenStatus } from '../models/McpTokenStatus';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Create anonymous user
     * Create a temporary anonymous user for using the app without registration
     * @returns AuthResponse Anonymous user created successfully
     * @throws ApiError
     */
    public static postApiAuthAnonymous(): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/anonymous',
        });
    }
    /**
     * Register a new user
     * Create a new user account
     * @param requestBody
     * @returns AuthResponse User registered successfully
     * @throws ApiError
     */
    public static postApiAuthRegister(
        requestBody: RegisterRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - validation error`,
                409: `Email already exists`,
            },
        });
    }
    /**
     * Login
     * Authenticate user and get JWT token
     * @param requestBody
     * @returns AuthResponse Login successful
     * @throws ApiError
     */
    public static postApiAuthLogin(
        requestBody: LoginRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
            },
        });
    }
    /**
     * Get current user
     * Get the currently authenticated user's information
     * @returns User User information
     * @throws ApiError
     */
    public static getApiAuthMe(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Logout
     * Logout user (client should remove token)
     * @returns any Logout successful
     * @throws ApiError
     */
    public static postApiAuthLogout(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
        });
    }
    /**
     * Update profile
     * Update user's name and/or email
     * @param requestBody
     * @returns User Profile updated successfully
     * @throws ApiError
     */
    public static putApiAuthProfile(
        requestBody: UpdateProfileRequest,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/auth/profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Email already exists`,
            },
        });
    }
    /**
     * Change password
     * Change user's password
     * @param requestBody
     * @returns any Password changed successfully
     * @throws ApiError
     */
    public static postApiAuthChangePassword(
        requestBody: ChangePasswordRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/change-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid old password`,
            },
        });
    }
    /**
     * Set active group
     * Set the user's active group for viewing pantry/shopping lists
     * @param requestBody
     * @returns any Active group updated
     * @throws ApiError
     */
    public static postApiAuthActiveGroup(
        requestBody: {
            groupId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/active-group',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `User is not a member of this group`,
            },
        });
    }
    /**
     * Get MCP token status
     * Returns whether an MCP personal access token exists, plus creation and last-use timestamps. The token itself is never returned.
     * @returns McpTokenStatus Token status
     * @throws ApiError
     */
    public static getApiAuthMcpToken(): CancelablePromise<McpTokenStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/mcp-token',
        });
    }
    /**
     * Generate or rotate MCP token
     * Creates a new personal access token for MCP access. Replaces any existing token. Returns the plaintext token exactly once.
     * @returns McpTokenResponse Token generated
     * @throws ApiError
     */
    public static postApiAuthMcpToken(): CancelablePromise<McpTokenResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/mcp-token',
            errors: {
                403: `Anonymous users cannot generate MCP tokens`,
            },
        });
    }
    /**
     * Revoke MCP token
     * Revokes the user's active MCP personal access token. Takes effect immediately.
     * @returns any Token revoked
     * @throws ApiError
     */
    public static deleteApiAuthMcpToken(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/auth/mcp-token',
        });
    }
    /**
     * Exchange MCP personal access token for a JWT
     * Used by the MCP server to turn a user's PAT into a short-lived JWT. Not behind JWT auth — the PAT is the credential. Rate-limited per IP.
     * @param requestBody
     * @returns McpExchangeResponse Exchange successful
     * @throws ApiError
     */
    public static postApiAuthMcpExchange(
        requestBody: McpExchangeRequest,
    ): CancelablePromise<McpExchangeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/mcp-exchange',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid or revoked PAT`,
                429: `Too many exchange attempts from this IP`,
            },
        });
    }
}
