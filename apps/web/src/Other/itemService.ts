import { Item } from '../Api/data-contracts';
import { Item as ItemApi } from '../Api/Item';

const itemApi = new ItemApi();

export async function SaveItem(item: Item) {
}

export async function RemoveItem(item: Item) {
}

export async function GetItem(id: number) {
}

export const GetItems = async () => {
    const i = await itemApi.itemList()
    return i.data
}