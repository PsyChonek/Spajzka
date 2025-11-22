/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Role = {
    /**
     * Role ID
     */
    _id?: string;
    /**
     * Role display name
     */
    name?: string;
    /**
     * Role description
     */
    description?: string;
    /**
     * Whether this is a global role or group role
     */
    isGlobal?: boolean;
    /**
     * Array of permissions for this role
     */
    permissions?: Array<string>;
};

