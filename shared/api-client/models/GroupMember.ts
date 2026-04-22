/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GroupMember = {
    _id?: string;
    name?: string;
    email?: string;
    role?: GroupMember.role;
};
export namespace GroupMember {
    export enum role {
        ADMIN = 'admin',
        MODERATOR = 'moderator',
        MEMBER = 'member',
    }
}

