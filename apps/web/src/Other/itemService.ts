import { ItemModel, Api } from '../Api';

const idUser = '1';

const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

export async function RemoveItem(item: ItemModel) {
}

export async function GetItem(id: number) {
}

export const GetUserItems = async () => {
    const items = await client.user.itemsDetail(idUser);
    return items.data;
}

export const SaveUserItem = async (item: ItemModel) => {
    const id = await client.user.itemCreate(idUser, item);
    return id.data;
}