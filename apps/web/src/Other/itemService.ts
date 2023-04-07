import { ItemModel } from '../Api/data-contracts';
import { Item as ItemApi } from '../Api/Item';

const itemApi = new ItemApi();

export async function SaveItem(item: ItemModel) {
}

export async function RemoveItem(item: ItemModel) {
}

export async function GetItem(id: number) {
}

export const GetItems = async () => {
    const items = await itemApi.itemList();
    return items.data;
}