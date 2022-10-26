import * as DB from "../Other/indexDB";
import {ObjectID} from "bson";
import {maxHeaderSize} from "http";

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

export async function GetItems() {
    if (navigator.onLine && await DB.getAll(dbName, sName).then((data) => {
        return data.length == 0;
    })) {
        await DB.getAll(dbName, sName).then((data) => {
            console.log(data.length);
        })
    }

    return await DB.getAll(dbName, sName);
}

export function SaveItems(items: Item[]) {
    DB.importAll(dbName, sName, items);
}

export function SaveItem(item: Item) {
    DB.saveItem(dbName, sName, item);
}