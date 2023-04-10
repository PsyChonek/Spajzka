import { Item } from "src/models/item";
import { DatabaseService } from "./databaseService";
import { ObjectId } from "mongodb";
import { ItemCollection } from "src/collections/itemCollection";
import { UserService } from "./userService";

export class ItemService {

    // Get items from database, by user key and user group
    public async getItems(userId: string): Promise<Item[] | null> {
        var itemsResult: Item[] = [];
        var groupId: ObjectId | null = null;

        var userFound: boolean = false;

        // Check if user exists
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ _id: new ObjectId(userId) }).then((user) => {
            if (user != null) {
                userFound = true;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (userFound == null) {
            console.log('User not found');
            return null;
        }

        // Find group containing user
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ users: new ObjectId(userId) }).then((group) => {
            if (group != null) {
                groupId = group._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (groupId == null) {
            console.log('Group not found');
            return null;
        }

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('items').find({ groupId: groupId }).toArray().then((items) => {
            if (items == null) {
                console.log('Items not found');
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
    public async storeItem(userId: string, item: ItemCollection): Promise<string | null> {
        var insertedId: string | null = null;
        var userFound: boolean = false;

        // Check if user exists
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ _id: new ObjectId(userId) }).then((user) => {
            if (user != null) {
                userFound = true;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (userFound == false) {
            console.log('User not found');
            return null;
        }

        // Find group containing user
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ users: new ObjectId(userId) }).then((group) => {
            if (group == null) {
                item.groupId = null;
            }
            else {
                item.groupId = group._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (item.groupId == null) {
            console.log('Group not found');
            return null;
        }

        var itemToInsert: ItemCollection = item;
        itemToInsert.groupId = item.groupId;
        itemToInsert.userId = new ObjectId(userId);
        itemToInsert._id = new ObjectId();
        itemToInsert.id = itemToInsert._id.toString();

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

    // Delete item from database
    public async deleteItem(userId: string, itemId: string): Promise<boolean> {
        var isDeleted: boolean = false;


        var userService = new UserService();

        // Check if user exists
        if (await userService.getUser(userId) == null) {
            console.log('User not found');
            return false;
        }

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('items').deleteOne({ _id: new ObjectId(itemId) }).then((result) => {
            if (result == null) {
                console.log('Item not deleted');
            }
            else {
                isDeleted = true;
            }
        }).catch((err) => {
            console.log(err);
        }
        );
        return isDeleted;

    }
}