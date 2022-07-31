export function importIDB(dname: string, sname: string, arr: Array<any>) {
    return new Promise(function (resolve) {
        var r = window.indexedDB.open(dname)
        r.onupgradeneeded = function () {
            var idb = r.result
            var store = idb.createObjectStore(sname, { keyPath: "id" })
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

export async function getIDB(dname: string, sname: string, key: string) {
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