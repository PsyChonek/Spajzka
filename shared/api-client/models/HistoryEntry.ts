/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type HistoryEntry = {
    _id?: string;
    groupId?: string;
    userId?: string;
    userEmail?: string | null;
    action?: HistoryEntry.action;
    entityType?: HistoryEntry.entityType;
    entityId?: string;
    entityName?: string;
    changes?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    } | null;
    metadata?: Record<string, any> | null;
    timestamp?: string;
};
export namespace HistoryEntry {
    export enum action {
        CREATE = 'create',
        UPDATE = 'update',
        DELETE = 'delete',
        JOIN = 'join',
        LEAVE = 'leave',
        KICK = 'kick',
        ROLE_CHANGE = 'role_change',
    }
    export enum entityType {
        PANTRY = 'pantry',
        SHOPPING = 'shopping',
        MEAL_PLAN = 'mealPlan',
        RECIPE = 'recipe',
        TAG = 'tag',
        ITEM = 'item',
        GROUP = 'group',
    }
}

