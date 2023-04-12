import { ItemModel, Api, RequestParams, ContentType } from '../Api';
import { Cookies } from 'react-cookie';

const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

const cookies = new Cookies;

export async function RemoveItem(item: ItemModel) {
    try {
        if (item.id == null) {
            return null;
        }

        const result = await client.user.itemDelete(item.id,cookies.get('userID'));
        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

export const GetUserItems = async () => {
    const items = await client.user.itemsDetail(cookies.get('userID'));
    return items.data;
}

export const SaveUserItem = async (item: ItemModel) => {
    try {

        const requestParams: RequestParams = {
            type: ContentType.Json,
        }

        const result = await client.user.itemCreate(cookies.get('userID'), item, requestParams);

        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Update item in database
export const UpdateUserItem = async (item: ItemModel) => {
    try {
        if (item.id == null) {
            return null;
        }

        const requestParams: RequestParams = {
            type: ContentType.Json,
        }

        const result = await client.user.itemUpdate(cookies.get('userID'),  item, requestParams);

        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}