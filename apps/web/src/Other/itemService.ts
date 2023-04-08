import { ItemModel, Api } from '../Api';


const client = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

export async function RemoveItem(item: ItemModel) {
}

export async function GetItem(id: number) {
}

export const GetUserItems = async (id: string) => {
    const items = await client.user.itemsDetail(id);
    return items.data;
}

export const SaveUserItem = async (idUser: string, item: ItemModel) => {
    const id = await client.user.itemCreate(idUser, item);
    return id.data;
}