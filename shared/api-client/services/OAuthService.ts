/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OAuthService {
    /**
     * OAuth 2.0 Authorization Server Metadata (RFC 8414)
     * @returns any Authorization server metadata document
     * @throws ApiError
     */
    public static getApiWellKnownOauthAuthorizationServer(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/.well-known/oauth-authorization-server',
        });
    }
    /**
     * Register an OAuth client (RFC 7591 dynamic client registration)
     * @param requestBody
     * @returns any Registered client credentials
     * @throws ApiError
     */
    public static postApiOauthRegister(
        requestBody: {
            client_name?: string;
            redirect_uris: Array<string>;
            grant_types?: Array<string>;
            scope?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/oauth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid registration request`,
            },
        });
    }
    /**
     * Confirm OAuth authorization (called by the consent UI after user approves)
     * @param requestBody
     * @returns any Returns the redirect URL containing the authorization code
     * @throws ApiError
     */
    public static postApiOauthAuthorizeConfirm(
        requestBody: {
            clientId: string;
            redirectUri: string;
            codeChallenge: string;
            codeChallengeMethod: string;
            state?: string;
            scope?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/oauth/authorize/confirm',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                403: `Client not registered or redirect_uri mismatch`,
            },
        });
    }
    /**
     * Get registered OAuth client metadata (for the consent page)
     * @param clientId
     * @returns any Client metadata
     * @throws ApiError
     */
    public static getApiOauthClient(
        clientId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/oauth/client',
            query: {
                'client_id': clientId,
            },
            errors: {
                404: `Client not found`,
            },
        });
    }
    /**
     * OAuth 2.0 Token Endpoint — exchange authorization code or refresh token
     * @param formData
     * @returns any Token response
     * @throws ApiError
     */
    public static postApiOauthToken(
        formData: {
            grant_type: 'authorization_code' | 'refresh_token';
            code?: string;
            redirect_uri?: string;
            code_verifier?: string;
            client_id?: string;
            refresh_token?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/oauth/token',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                400: `Invalid request`,
                401: `Invalid credentials`,
            },
        });
    }
    /**
     * Revoke an OAuth refresh token (RFC 7009)
     * @param formData
     * @returns any Token revoked (or was already invalid — per spec, always 200)
     * @throws ApiError
     */
    public static postApiOauthRevoke(
        formData: {
            token: string;
            client_id?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/oauth/revoke',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
}
