import {Item} from "../Schema/Items"
import {openDB} from "idb";

export function importAll(dname: string, dversion: number, sname: string, arr: Array<Item>) {
    for (let i = 0; i < arr.length; i++) {
        saveItem(dname, dversion, sname, arr[i]);
    }
}

const dbPromise = (dname: string, dversion: number, sname:string) => {
    return openDB(dname, dversion, {
        upgrade(db) {
            console.log('Database upgraded');
            if (!db.objectStoreNames.contains(sname)) {
                db.createObjectStore(sname, {keyPath: 'id'});
            }
        },
    });
}

export async function saveItem(dname: string, dversion: number, sname: string, item: Item) {
    return (await dbPromise(dname,dversion,sname)).put(sname, item);
}

export async function getItem(dname: string, dversion: number, sname: string, key: string) {
    return (await dbPromise(dname,dversion,sname)).get(sname, key);
}

export function getAll(dname: string, dversion: number, sname: string): Promise<Item[]> {
    return (dbPromise(dname,dversion,sname)).then(db => {
        return db.getAll(sname);
    });
}

export async function deleteItem(dname: string, dversion: number, sname: string, item: Item) {
    return (await dbPromise(dname,dversion,sname)).delete(sname, item.id);
}