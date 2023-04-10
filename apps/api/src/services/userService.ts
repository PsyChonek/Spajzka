import { User } from "src/models/user";
import { DatabaseService } from "./databaseService";
import { ObjectId } from "mongodb";
import { Group } from "src/models/group";
import { UserCollection } from "src/collections/userCollection";
import { GroupCollection } from "src/collections/groupCollection";

export class UserService {
    // Create user
    public async createUser(user: User): Promise<string | null> {
        var insertedId: string | null = null;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').insertOne(user).then((result) => {
            if (result == null) {
                console.log('Error creating user');
                return;
            }
            else {
                insertedId = result.insertedId.toString();
            }
        }).catch((err) => {
            console.log(err);
        });

        return insertedId;
    }

    // Get user by key
    public async getUser(userKey: string): Promise<UserCollection | null> {
        var userResult: UserCollection | null = null;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ key: userKey }).then((user) => {
            if (user == null) {
                console.log('User not found');
                return;
            }
            else {
                userResult = <UserCollection>user;
            }
        }).catch((err) => {
            console.log(err);
        });

        return userResult;
    }

    // Add user to group, create group if it doesn't exist
    public async addUserToGroup(groupKey: string, userKey: string): Promise<boolean> {
        var groupId: ObjectId | null = null;
        var userId: ObjectId | null = null;
        var foundMatch: boolean = true;

        await this.getUser(userKey).then((user) => {
            if (user == null) {
                return;
            }
            else {
                userId = user._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (userId == null) {
            return false;
        }

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ key: groupKey }).then((group) => {
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
            var newGroup: GroupCollection = { _id: new ObjectId(), key: groupKey, users: [userId], name: groupKey };

            await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').insertOne(newGroup).then((result) => {
                if (result == null) {
                    console.log('Error creating group');
                    return;
                }
                else {
                    groupId = result.insertedId;
                }
            }).catch((err) => {
                console.log(err);
            });
        }
        else
        {   
            // Add user to group
            await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').updateOne({ _id: groupId }, { $addToSet: { users: userId } }).then((result) => {
                if (result == null) {
                    console.log('Error adding user to group');
                    return;
                }

                console.log(result);

                foundMatch = result.acknowledged;

            }).catch((err) => {
                console.log(err);
            });

            console.log(groupId);

        }

        return foundMatch;
    }
}