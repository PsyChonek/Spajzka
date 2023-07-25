import { DatabaseService } from "./databaseService";
import { ObjectId } from "mongodb";
import { Group } from "src/models/db/group";
import { UserService } from "./userService";

export class GroupService {
    // constructor(userService: UserService) {
    //     this.userService = userService
    // }

    // userService:UserService;

    // // Add user to group
    // public async addUserToGroup(groupName: string, userId: string): Promise<string | null> {
    //     var foundUser: boolean = false;

    //     var groupId: ObjectId | null = null;

    //     await this.userService.getUser(userId).then((user) => {
    //         if (user != null) {
    //             foundUser = true;
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     if (foundUser == false) {
    //         console.log('User not found');
    //         return null;
    //     }

    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ name: groupName }).then((group) => {
    //         if (group != null) {
    //             groupId = group._id;
    //         }
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     if (groupId == null) {
    //         return null;
    //     }

    //     // Add user to group
    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').updateOne({ _id: groupId }, { $addToSet: { users: new ObjectId(userId) } }).then((result) => {
    //         if (result == null) {
    //             console.log('Error adding user to group');
    //             return null;
    //         }

    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     return groupId;
    // }

    // // Create group
    // public async createGroup(group: GroupCollection): Promise<string | null> {
    //     var insertedId: string | null = null;

    //     // Check if group already exists
    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').findOne({ name: group.name }).then((group) => {
    //         if (group != null) {
    //             insertedId = group._id.toString();
    //         }
    //     }
    //     ).catch((err) => {
    //         console.log(err);
    //     });

    //     if (insertedId != null) {
    //         console.log('Group already exists');
    //         return null;
    //     }

    //     group._id = new ObjectId();
    //     group.id = group._id.toString();

    //     await DatabaseService.instance.client.db(process.env.DATABASE).collection('groups').insertOne(group).then((result) => {
    //         if (result == null) {
    //             console.log('Error creating group');
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
}