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
     * Array of global permissions the user has
     */
    globalPermissions?: Array<string>;
    /**
     * Account creation timestamp
     */
    createdAt?: string;
};

