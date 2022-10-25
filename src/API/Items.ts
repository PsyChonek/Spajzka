import * as DB from "../Other/indexDB";
import {ObjectID} from "bson";
import {maxHeaderSize} from "http";

export interface ItemsObject {
    Items: Array<Item>
}

interface IItem {
    ID: ObjectID;
    name: string;
    price: number;
    description: string;
    image: string;
    amount: number;
}

export class Item implements IItem {
    constructor(item:Item) {
        this.ID = item.ID;
        this.name = item.name;
        this.price = item.price;
        this.description = item.description;
        this.image = item.image;
        this.buylist = item.buylist || this._buylist;
    }
    
    public ID: ObjectID = new ObjectID();
    public name: string = '';

    private _price: number = 0;
    public get price(): number {
        return Math.max(this._price, 0);
    }

    public set price(v: number) {
        this._price = Math.max(v, 0);
    }

    public description: string = '';
    public image: string = '';

    private _amount: number = 0;
    public get amount(): number {
        console.log('Buy get ' + this._amount)
        return Math.max(this._amount, 0);
    }

    public set amount(v: number) {
        console.log('Buy set ' + v)
        this._amount = Math.max(v, 0);
    }

}


var dbName = 'Resources';
var sName = 'Items'

var jsonTestData = '{"Items":[{"id":"sd51asd","name":"JABLKO","price":25, "amount":10},{"id":"dsdasdasda","name":"hruška","price":35},{"id":"dasddds","name":"pomeranč","price":87},{"id":"xascass","name":"kokos","price":96}]} ';

export async function GetItems() {
    if (navigator.onLine && await DB.getAll(dbName, sName).then((data) => {
        return data.length == 0;
    })) {
        await DB.getAll(dbName, sName).then((data) => {
            console.log(data.length);
        })

        SaveItems(JSON.parse(jsonTestData).Items);
    }

    return await DB.getAll(dbName, sName);
}

export function SaveItems(items: Item[]) {
    DB.importAll(dbName, sName, items);
}

export function SaveItem(item: Item) {
    DB.saveItem(dbName, sName, item);
}