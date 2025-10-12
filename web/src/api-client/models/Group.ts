/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Group = {
    /**
     * Group ID
     */
    _id?: string;
    /**
     * Group name
     */
    name: string;
    /**
     * Admin user ID
     */
    adminId?: string;
    /**
     * Invite code for joining group
     */
    inviteCode?: string;
    /**
     * Whether invite is enabled
     */
    inviteEnabled?: boolean;
    /**
     * Array of member user IDs
     */
    memberIds?: Array<string>;
    createdAt?: string;
    updatedAt?: string;
};

