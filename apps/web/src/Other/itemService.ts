import { ItemModel, Api } from '../Api';
import { Cookies } from 'react-cookie';

const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

const cookies = new Cookies;

export async function RemoveItem(item: ItemModel) {
}

export async function GetItem(id: number) {
}

export const GetUserItems = async () => {
    const items = await client.user.itemsDetail(cookies.get('userID'));
    return items.data;
}

export const SaveUserItem = async (item: ItemModel) => {
    const id = await client.user.itemCreate(cookies.get('userID'), item);
    return id.data;
}