/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type User = {
    /**
     * User ID
     */
    _id?: string;
    /**
     * User's full name
     */
    name?: string;
    /**
     * User's email address
     */
    email?: string;
    /**
     * Whether the user is an anonymous user
     */
    isAnonymous?: boolean;
    /**
     * Array of global permissions the user has
     */
    globalPermissions?: Array<string>;
    /**
     * Array of all permissions from all groups the user is a member of
     */
    groupPermissions?: Array<string>;
    /**
     * Preferred language for UI strings
     */
    interfaceLanguage?: User.interfaceLanguage;
    /**
     * Preferred language for item/tag/recipe content
     */
    itemsLanguage?: User.itemsLanguage;
    /**
     * Account creation timestamp
     */
    createdAt?: string;
};
export namespace User {
    /**
     * Preferred language for UI strings
     */
    export enum interfaceLanguage {
        EN = 'en',
        CS = 'cs',
    }
    /**
     * Preferred language for item/tag/recipe content
     */
    export enum itemsLanguage {
        EN = 'en',
        CS = 'cs',
    }
}

