import { DatabaseService } from "./databaseService";
import { ObjectId } from "mongodb";
import { UserCollection } from "src/collections/userCollection";
import { GroupCollection } from "src/collections/groupCollection";
import { Group } from "src/models/group";

export class UserService {
    // Create user
    public async createUser(user: UserCollection): Promise<string | null> {
        var insertedId: string | null = null;

        // Check if user already exists
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ name: user.name }).then((user) => {
            if (user == null) {
                return;
            }
            else {
                insertedId = user._id.toString();
            }
        }).catch((err) => {
            console.log(err);
        });

        if (insertedId != null) {
            console.log('User already exists');
            return null;
        }

        user._id = new ObjectId();
        user.id = user._id.toString();

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
    public async getUser(userName: string): Promise<UserCollection | null> {
        var userResult: UserCollection | null = null;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ name: userName }).then((user) => {
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

    // Get user by name
    public async getUserByName(userName: string): Promise<UserCollection | null> {
        var userResult: UserCollection | null = null;

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ name: userName }).then((user) => {
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

    // Create group
    public async createGroup(group: GroupCollection): Promise<string | null> {
        var insertedId: string | null = null;

        // Check if group already exists
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ name: group.name }).then((group) => {
            if (group != null) {
                insertedId = group._id.toString();
            }
        }
        ).catch((err) => {
            console.log(err);
        });

        if (insertedId != null) {
            console.log('Group already exists');
            return null;
        }

        group._id = new ObjectId();
        group.id = group._id.toString();

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').insertOne(group).then((result) => {
            if (result == null) {
                console.log('Error creating group');
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

    // Add user to group
    public async addUserToGroup(groupName: string, userId: string): Promise<string | null> {
        var foundUser: boolean = false;

        var groupId: ObjectId | null = null;

        await this.getUser(userId).then((user) => {
            if (user != null) {
                foundUser = true;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (foundUser == false) {
            console.log('User not found');
            return null;
        }

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ name: groupName }).then((group) => {
            if (group != null) {
                groupId = group._id;
            }
        }).catch((err) => {
            console.log(err);
        });

        if (groupId == null) {
            return null;
        }

        // Add user to group
        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').updateOne({ _id: groupId }, { $addToSet: { users: new ObjectId(userId) } }).then((result) => {
            if (result == null) {
                console.log('Error adding user to group');
                return null;
            }

        }).catch((err) => {
            console.log(err);
        });

        return groupId;
    }

    // Get groups by userID
    public async getUserGroups(userId: string): Promise<Group[] | null> {
        var groups: Group[] = [];

        await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').find({ users: new ObjectId(userId) }).toArray().then((result) => {
            if (result == null) {
                console.log('Error getting groups');
                return null;
            }
            else {
                groups = <GroupCollection[]>result;
            }
        }).catch((err) => {
            console.log(err);
        });

        return groups;
    }
}