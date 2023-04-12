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

// Add group
export const AddGroup = async (groupName: string) => {
    const id = await client.user.groupCreate(cookies.get('userID'), groupName);
    return id.data;
}