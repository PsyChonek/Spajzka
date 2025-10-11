import { UserDto, CreateUserDto, UpdateUserDto } from '../Api';
import { Cookies } from 'react-cookie';
import { getAuthenticatedClient, getPublicClient } from './apiClient';

const cookies = new Cookies;

// Create user (via auth/register) - does not require authentication
export const CreateUser = async (userData: CreateUserDto) => {
    try
    {
        const client = getPublicClient();
        const result = await client.auth.register(userData);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Create guest user - does not require authentication
export const CreateGuestUser = async () => {
    try
    {
        const client = getPublicClient();
        const result = await client.auth.registerGuest();
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Get user - requires authentication
export const GetUser = async (userId: string) => {
    try
    {
        const client = getAuthenticatedClient();
        const result = await client.users.getUser(userId);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Update user - requires authentication
export const UpdateUser = async (userId: string, userData: UpdateUserDto) => {
    try
    {
        const client = getAuthenticatedClient();
        const result = await client.users.updateUser(userId, userData);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Get user groups - requires authentication
export const GetUserGroups = async (userId: string) => {
    try
    {
        const client = getAuthenticatedClient();
        const result = await client.users.getUserGroups(userId);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Get user items - requires authentication
export const GetUserItems = async (userId: string) => {
    try
    {
        const client = getAuthenticatedClient();
        const result = await client.users.getUserItems(userId);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}
