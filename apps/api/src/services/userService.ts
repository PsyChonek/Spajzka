import { DatabaseService } from "./databaseService";
import { ObjectId } from "mongodb";
import { Group } from "src/models/db/group";

export class UserService {
    // // Create user
    // public async createUser(user: UserCollection): Promise<string | null> {
    //     var insertedId: string | null = null;

    //     // Check if user already exists
    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ name: user.name }).then((user) => {
    //         if (user == null) {
    //             return;
    //         }
    //         else {
    //             insertedId = user._id.toString();
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     if (insertedId != null) {
    //         console.log('User already exists');
    //         return null;
    //     }

    //     user._id = new ObjectId();
    //     user.id = user._id.toString();

    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').insertOne(user).then((result) => {
    //         if (result == null) {
    //             console.log('Error creating user');
    //             return;
    //         }
    //         else {
    //             insertedId = result.insertedId.toString();
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     return insertedId;
    // }

    // // Get user by key
    // public async getUser(userId: string): Promise<UserCollection | null> {
    //     var userResult: UserCollection | null = null;

    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ _id: new ObjectId(userId) }).then((user) => {
    //         if (user == null) {
    //             console.log('User not found');
    //             return;
    //         }
    //         else {
    //             userResult = <UserCollection>user;
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     return userResult;
    // }

    // // Get user by name
    // public async getUserByName(userName: string): Promise<UserCollection | null> {
    //     var userResult: UserCollection | null = null;

    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('users').findOne({ name: userName }).then((user) => {
    //         if (user == null) {
    //             console.log('User not found');
    //             return;
    //         }
    //         else {
    //             userResult = <UserCollection>user;
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     return userResult;
    // }

    // // Get groups by userID
    // public async getUserGroups(userId: string): Promise<Group[] | null> {
    //     var groups: Group[] = [];

    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').find({ users: new ObjectId(userId) }).toArray().then((result) => {
    //         if (result == null) {
    //             console.log('Error getting groups');
    //             return null;
    //         }
    //         else {
    //             groups = <GroupCollection[]>result;
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     return groups;
    // }
}