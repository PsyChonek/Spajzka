import { Await } from 'react-router-dom';
import { ItemModel, Api, UserModel, GroupModel } from '../Api';
import { Cookies } from 'react-cookie';

const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

const cookies = new Cookies;

// Create user
export const CreateUser = async (user: UserModel) => {
    try
    {
        const result = await client.user.userCreate(user);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Get user
export const GetUser = async (userId: string) => {
    try
    {
        const result = await client.user.userDetail(userId);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Get user groups
export const GetUserGroups = async (userId: string) => {
    try
    {
        const result = await client.user.groupsDetail(userId);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}