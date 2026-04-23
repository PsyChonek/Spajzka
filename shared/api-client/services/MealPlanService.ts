/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMealPlanEntryRequest } from '../models/CreateMealPlanEntryRequest';
import type { GenerateShoppingRequest } from '../models/GenerateShoppingRequest';
import type { GenerateShoppingResponse } from '../models/GenerateShoppingResponse';
import type { MealPlanEntry } from '../models/MealPlanEntry';
import type { ShoppingPreviewRequest } from '../models/ShoppingPreviewRequest';
import type { ShoppingPreviewResponse } from '../models/ShoppingPreviewResponse';
import type { UpdateMealPlanEntryRequest } from '../models/UpdateMealPlanEntryRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MealPlanService {
    /**
     * Get meal-plan entries
     * Retrieve meal-plan entries for the group within an optional date range
     * @param from Start of date range (inclusive, ISO date)
     * @param to End of date range (inclusive, ISO date)
     * @param groupId Optional group override
     * @returns MealPlanEntry List of meal-plan entries
     * @throws ApiError
     */
    public static getApiMealPlan(
        from?: string,
        to?: string,
        groupId?: string,
    ): CancelablePromise<Array<MealPlanEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meal-plan',
            query: {
                'from': from,
                'to': to,
                'groupId': groupId,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Create a meal-plan entry
     * Schedule a recipe on a specific cook date (requires meal_plan:create permission)
     * @param requestBody
     * @returns MealPlanEntry Meal-plan entry created
     * @throws ApiError
     */
    public static postApiMealPlan(
        requestBody: CreateMealPlanEntryRequest,
    ): CancelablePromise<MealPlanEntry> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meal-plan',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                403: `Insufficient permissions`,
                404: `Recipe not found`,
            },
        });
    }
    /**
     * Update a meal-plan entry
     * Partially update a scheduled meal (requires meal_plan:update permission)
     * @param id
     * @param requestBody
     * @returns MealPlanEntry Updated meal-plan entry
     * @throws ApiError
     */
    public static patchApiMealPlan(
        id: string,
        requestBody: UpdateMealPlanEntryRequest,
    ): CancelablePromise<MealPlanEntry> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/meal-plan/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                403: `Insufficient permissions`,
                404: `Entry not found`,
            },
        });
    }
    /**
     * Delete a meal-plan entry
     * Delete a scheduled meal (requires meal_plan:delete permission). Pass `removeShoppingItems: true` in the request body to also delete shopping items linked to this entry's batch — the user must also hold `shopping:delete` permission for this to succeed.
     *
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static deleteApiMealPlan(
        id: string,
        requestBody?: {
            removeShoppingItems?: boolean;
            groupId?: string;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/meal-plan/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                403: `Insufficient permissions`,
                404: `Entry not found`,
            },
        });
    }
    /**
     * Preview shopping list from meal plan
     * Dry-run that aggregates ingredients for scheduled meals in a date range without mutating any data
     * @param requestBody
     * @returns ShoppingPreviewResponse Aggregated ingredient list (preview only)
     * @throws ApiError
     */
    public static postApiMealPlanShoppingPreview(
        requestBody: ShoppingPreviewRequest,
    ): CancelablePromise<ShoppingPreviewResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meal-plan/shopping-preview',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                403: `Unauthorized`,
            },
        });
    }
    /**
     * Generate shopping list from meal plan
     * Aggregates ingredients for scheduled meals in a date range and inserts them into the shopping collection (requires shopping:create permission). Also stamps shoppingGeneratedAt and shoppingBatchId on the affected meal-plan entries.
     *
     * @param requestBody
     * @returns GenerateShoppingResponse Shopping items created
     * @throws ApiError
     */
    public static postApiMealPlanGenerateShopping(
        requestBody: GenerateShoppingRequest,
    ): CancelablePromise<GenerateShoppingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meal-plan/generate-shopping',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
                403: `Insufficient permissions`,
            },
        });
    }
}
