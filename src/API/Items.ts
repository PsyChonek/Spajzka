import * as DB from "../Other/indexDB";

export interface ItemsObject {
    Items: Array<Item>
}

export interface Item {
    name: string;
    price: number;
}

var dbName = 'Resources';
var sName = 'Items'

var jsonTestData = '{"Items":[{"id":"sd51asd","name":"JABLKO","price":25},{"id":"dsdasdasda","name":"hruška","price":35},{"id":"dasddds","name":"pomeranč","price":87},{"id":"xascass","name":"kokos","price":96}]} ';

export async function GetItems(){
    if (navigator.onLine) 
    {
        SaveItems(JSON.parse(jsonTestData).Items);
    } 
    return await DB.getAll(dbName,sName);
}

export function SaveItems(items:Item[]) {
    DB.importAll(dbName, sName, items);
}
