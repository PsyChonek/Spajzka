export interface CreateGroupInput {
	name: string;
	users: string[];
}

export interface CreateGroupOutput {
	id: string;
}

export interface GetGroupInput {
	id: string;
}

export interface GetGroupOutput {
	id: string;
	name: string;
	users: string[];
}

export interface UpdateGroupInput {
	id: string;
	name: string;
	users: string[];
}

export interface UpdateGroupOutput {
	id: string;
}

export interface DeleteGroupInput {
	id: string;
}

export interface DeleteGroupOutput {
	id: string;
}

export interface AddUserToGroupInput {
	id: string;
	userId: string;
}

export interface AddUserToGroupOutput {
	id: string;
	userId: string;
}

export interface RemoveUserFromGroupInput {
	id: string;
	userId: string;
}

export interface RemoveUserFromGroupOutput {
	id: string;
	userId: string;
}

//#region Helper Interfaces

export interface Group {
	id: string;
	name: string;
	users: string[];
}

//#endregion Helper Interfaces
