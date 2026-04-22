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
     * Account creation timestamp
     */
    createdAt?: string;
};

