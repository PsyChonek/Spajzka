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
     * Whether this is a personal group
     */
    isPersonal?: boolean;
    /**
     * Array of members with their roles
     */
    members?: Array<{
        userId?: string;
        role?: 'admin' | 'moderator' | 'member';
    }>;
    /**
     * Invite code for joining group
     */
    inviteCode?: string;
    /**
     * Whether invite is enabled
     */
    inviteEnabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

