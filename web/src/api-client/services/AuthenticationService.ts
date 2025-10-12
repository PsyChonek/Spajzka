/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponse } from '../models/AuthResponse';
import type { ChangePasswordRequest } from '../models/ChangePasswordRequest';
import type { LoginRequest } from '../models/LoginRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
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
}
