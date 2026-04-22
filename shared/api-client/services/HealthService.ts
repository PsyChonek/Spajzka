/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Health check endpoint
     * Returns the health status of the API and database connection
     * @returns any API is healthy
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<{
        status?: string;
        timestamp?: string;
        database?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
            errors: {
                503: `Service unavailable`,
            },
        });
    }
}
