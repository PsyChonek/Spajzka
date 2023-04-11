import { Await } from 'react-router-dom';
import { ItemModel, Api, UserModel, GroupModel } from '../Api';
import { Cookies } from 'react-cookie';

const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

const cookies = new Cookies;

// Create user
export const CreateUser = async (user: UserModel) => {
    const id = client.user.userCreate(user)
    id.then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });

    return await id;
}

// Add group
export const AddGroup = async (groupName: string) => {
    const id = await client.user.groupCreate(cookies.get('userID'), groupName);
    return id.data;
}