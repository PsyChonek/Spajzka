import { GroupDto, CreateGroupDto, UpdateGroupDto, AddUserToGroupDto } from '../Api';
import { Cookies } from 'react-cookie';
import { getAuthenticatedClient } from './apiClient';

const cookies = new Cookies;

// Create group
export const CreateGroup = async (group: CreateGroupDto) => {
    try
    {
        const client = getAuthenticatedClient();
        const userId = cookies.get('userID');
        const groupData: CreateGroupDto = {
            ...group,
            userIds: userId ? [userId] : []
        };

        const result = await client.groups.createGroup(groupData);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Get group
export const GetGroup = async (groupId: string) => {
    try
    {
        const client = getAuthenticatedClient();
        const result = await client.groups.getGroup(groupId);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Update group
export const UpdateGroup = async (groupId: string, groupData: UpdateGroupDto) => {
    try
    {
        const client = getAuthenticatedClient();
        const result = await client.groups.updateGroup(groupId, groupData);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Add user to group
export const AddUserToGroup = async (groupId: string, userId: string) => {
    try
    {
        const client = getAuthenticatedClient();
        const data: AddUserToGroupDto = { userId };
        const result = await client.groups.addUserToGroup(groupId, data);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Remove user from group
export const RemoveUserFromGroup = async (groupId: string, userId: string) => {
    try
    {
        const client = getAuthenticatedClient();
        await client.groups.removeUserFromGroup(groupId, userId);
        return true;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}
