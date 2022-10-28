import * as DB from "../Other/indexDB";
import {ObjectID} from "bson";

export interface ItemsObject {
    Items: Array<Item>
}

export class Item {
    public id: string = new ObjectID().toString();
    public name: string = '';
    public price: number = 0;
    public description: string = '';
    public image: string = '';
    public amount: number = 0;
}

var dbName = 'Resources';
var sName = 'Items'
var dVersion = 8;

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