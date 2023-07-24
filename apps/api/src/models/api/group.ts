export interface CreateGroupInput {
    name: string;
    users: string[];
}

export interface CreateGroupOutput {
    groupId: string;
}

export interface GetGroupInput {
    groupId: string;
}

export interface GetGroupOutput {
    groupId: string;
    name: string;
    users: string[];
}

export interface UpdateGroupInput {
    groupId: string;
    name: string;
    users: string[];
}

export interface UpdateGroupOutput {
    groupId: string;
}

export interface DeleteGroupInput {
    groupId: string;
}

export interface DeleteGroupOutput {
    groupId: string;
}

export interface AddUserToGroupInput {
    groupId: string;
    userId: string;
}

export interface AddUserToGroupOutput {
    groupId: string;
    userId: string;
}

//#region Helper Interfaces

//#endregion Helper Interfaces