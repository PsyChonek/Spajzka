import {Item} from "../API/Items"

export function importAll(dname: string, sname: string, arr: Array<Item>) {
    return new Promise(function (resolve) {
        var r = window.indexedDB.open(dname)
        r.onupgradeneeded = function () {
            var idb = r.result
            var store = idb.createObjectStore(sname, {keyPath: "ID", autoIncrement: false})
        }
        r.onsuccess = function () {
            var idb = r.result
            let tactn = idb.transaction(sname, "readwrite")
            var store = tactn.objectStore(sname)
            for (var obj of arr) {
                store.put(obj)
            }
            resolve(idb)
        }
        r.onerror = function (e) {
            alert("Enable to access IndexedDB, ");
        }
    })
}

export async function saveItem(dname: string, sname: string, item: Item) {
    return new Promise(function (resolve) {
        var r = window.indexedDB.open(dname)
        r.onupgradeneeded = function () {
            var idb = r.result
            var store = idb.createObjectStore(sname, {keyPath: "ID", autoIncrement: false})
        }
        r.onsuccess = function () {
            var idb = r.result
            let tactn = idb.transaction(sname, "readwrite")
            var store = tactn.objectStore(sname)
            let data = store.put(item)
            resolve(idb)
        }
        r.onerror = function (e) {
            alert("Enable to access IndexedDB, ");
        }
    })
}

export async function getItem(dname: string, sname: string, key: string) {
    return new Promise(function (resolve) {
        var r = indexedDB.open(dname)
        r.onsuccess = function (e) {
            var idb = r.result
            let tactn = idb.transaction(sname, "readonly")
            let store = tactn.objectStore(sname)
            let data = store.get(key)
            data.onsuccess = function () {
                resolve(data.result)
            }
            tactn.oncomplete = function () {
                idb.close()
            }
        }
    })
}

export function getAll(dname: string, sname: string): Promise<Item[]> {
    return new Promise<any>(function (resolve) {
        var db = indexedDB.open(dname)
        db.onsuccess = function (e) {
            var idb = db.result
            const tx = idb.transaction(sname, 'readonly');
            const store = tx.objectStore(sname);
            var data = store.getAll();
            data.onsuccess = function () {
                resolve(data.result)
            }
            tx.oncomplete = function (e) {
                idb.close()
            }
        }
    })
}