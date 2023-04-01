import * as DB from "../Other/indexDB";

export interface ItemsObject {
    Items: Array<Item>
}

export class Item {
    public id: string = 'new ObjectId().toString();'
    public name: string = '';
    public price: number = 0;
    public description: string = '';
    public image: string = '';
    public amount: number = 0;
    public isOnBuylist: boolean = false;
}

var dbName = 'Resources';
var sName = 'Items'
var dVersion = 1;

export const GetItems = async (): Promise<Item[]> => {
    return await DB.getAll(dbName, dVersion, sName);
};

export function SaveItems(items: Item[]) {
    DB.importAll(dbName, dVersion, sName, items);
}

export function SaveItem(item: Item) {
    DB.saveItem(dbName, dVersion, sName, item);
}

export function DeleteItem(item: Item) {
    DB.deleteItem(dbName, dVersion, sName, item);
}