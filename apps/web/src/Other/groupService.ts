import { Await } from 'react-router-dom';
import { ItemModel, Api, UserModel, GroupModel } from '../Api';
import { Cookies } from 'react-cookie';

const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

const cookies = new Cookies;

// Create group
export const CreateGroup = async (group: GroupModel) => {
    try
    {
        const result = await client.group.groupCreate(group);

        await client.user.groupCreate(cookies.get('userID'), group.name);

        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}

// Add user to group
export const AddUserToGroup = async (groupName: string, userId: string) => {
    try
    {
        const result = await client.user.groupCreate(userId, groupName);
        return result;
    }
    catch (e)
    {
        console.log(e);
        return null;
    }
}