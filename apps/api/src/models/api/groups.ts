// Create Group
export interface CreateGroupInput {
	name: string; // Name of the group
	users?: string[]; // Optional: Users to be added to the group during creation
}

export interface CreateGroupOutput {
	id: string; // ID of the newly created group
}

// Get Group
export interface GetGroupInput {
	id: string; // ID of the group to retrieve
}

export interface GetGroupOutput {
	id: string; // ID of the group
	name: string; // Name of the group
	users: string[]; // List of user IDs in the group
}

// Update Group
export interface UpdateGroupInput {
	id: string; // ID of the group to update
	name?: string; // Optional: New name for the group
	users?: string[]; // Optional: Updated list of user IDs in the group
}

export interface UpdateGroupOutput {
	id: string; // ID of the updated group
}

// Delete Group
export interface DeleteGroupInput {
	id: string; // ID of the group to delete
}

export interface DeleteGroupOutput {
	id: string; // ID of the deleted group
}

// Add User to Group
export interface AddUserToGroupInput {
	id: string; // ID of the group
	userId: string; // ID of the user to add to the group
}

export interface AddUserToGroupOutput {
	id: string; // ID of the group
	userId: string; // ID of the user added to the group
}

// Remove User from Group
export interface RemoveUserFromGroupInput {
	id: string; // ID of the group
	userId: string; // ID of the user to remove from the group
}

export interface RemoveUserFromGroupOutput {
	id: string; // ID of the group
	userId: string; // ID of the user removed from the group
}

//#region Helper Interfaces

export interface Group {
	id: string; // Unique identifier for the group
	name: string; // Name of the group
	users: string[]; // List of user IDs in the group
}

//#endregion Helper Interfaces
