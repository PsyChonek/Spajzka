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

    // const items: ItemModel[] = [{ id: 1, name: 'test', price: 1, isOnBuylist: true, amount: 1 }, { id: 2, name: 'test2', price: 2, isOnBuylist: false, amount: 2 }]
    // return items;
}