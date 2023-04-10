import { Group } from "src/models/group";
import { Item } from "src/models/item";
import { DatabaseService } from "./databaseService";
import { ObjectId } from "mongodb";
import { ItemCollection } from "src/collections/itemCollection";

export class ItemService {

    // Get items from database, by user key and user group
    public async getItems(key: string): Promise<Item[]> {
        var itemsResult: Item[] = [];
        var userId: ObjectId | null = null;
        var groupId: ObjectId | null = null;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ key: key }).then((user) => {
            if (user == null) {
                console.log('User not found');
                return;
            }
            else {
                userId = user._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (userId == null) {
            console.log('User not found');
            return [];
        }

        // Find group containing user
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ users: userId }).then((group) => {
            if (group == null) {
                console.log('Group not found');
                return;
            }
            else {
                groupId = group._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (groupId == null) {
            console.log('Group not found');
            return [];
        }

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('items').find({ groupId: groupId }).toArray().then((items) => {
            if (items == null) {
                console.log('Items not found');
                return;
            }
            else {
                itemsResult = <ItemCollection[]>items;
            }

        }).catch((err) => {
            console.log(err);
        }
        );
        
        return itemsResult;
    }

    // Store item to database, response with item id
    public async storeItem(userKey: string, item: ItemCollection): Promise<string | null> {
        var insertedId: string | null = null;
        var userId: ObjectId | null = null;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ key: userKey }).then((user) => {
            if (user == null) {
                console.log('User not found');
                item.groupId = null;
            }
            else {
                userId = user._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (userId == null) {
            return null;
        }

        // Find group containing user
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ users: userId }).then((group) => {
            if (group == null) {
                console.log('Group not found');
                item.groupId = null;
            }
            else {
                item.groupId = group._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        var itemToInsert: ItemCollection = item;
        itemToInsert.groupId = item.groupId;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('items').insertOne(itemToInsert).then((result) => {
            if (result == null) {
                console.log('Item not stored');
            }
            else {
                insertedId = result.insertedId.toString();
            }
        }).catch((err) => {
            console.log(err);
        });

        return insertedId;
    }
}