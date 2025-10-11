import Group, { IGroup } from "../models/Groups";
import { GroupDto, CreateGroupDto, UpdateGroupDto, AddUserToGroupDto } from "../types/dto";
import { Types } from "mongoose";

class GroupService {
  async getAllGroups(): Promise<GroupDto[]> {
    const groups = await Group.find();
    return groups.map(this.mapToDto);
  }

  async getGroupById(groupId: string): Promise<GroupDto> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    return this.mapToDto(group);
  }

  async getGroupsByUserId(userId: string): Promise<GroupDto[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const groups = await Group.find({ userIds: new Types.ObjectId(userId) });
    return groups.map(this.mapToDto);
  }

  async createGroup(groupData: CreateGroupDto): Promise<GroupDto> {
    const userIds = groupData.userIds?.map(id => {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
      return new Types.ObjectId(id);
    }) || [];

    const group: IGroup = new Group({
      name: groupData.name,
      description: groupData.description,
      userIds,
    });

    await group.save();
    return this.mapToDto(group);
  }

  async updateGroup(groupId: string, groupData: UpdateGroupDto): Promise<GroupDto> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const updateData: any = {};
    if (groupData.name !== undefined) updateData.name = groupData.name;
    if (groupData.description !== undefined) updateData.description = groupData.description;

    const group = await Group.findByIdAndUpdate(
      groupId,
      updateData,
      { new: true }
    );

    if (!group) {
      throw new Error("Group not found");
    }

    return this.mapToDto(group);
  }

  async deleteGroup(groupId: string): Promise<void> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const result = await Group.findByIdAndDelete(groupId);
    if (!result) {
      throw new Error("Group not found");
    }
  }

  async addUserToGroup(groupId: string, userData: AddUserToGroupDto): Promise<GroupDto> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }
    if (!Types.ObjectId.isValid(userData.userId)) {
      throw new Error("Invalid user ID");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const userObjectId = new Types.ObjectId(userData.userId);

    // Check if user is already in the group
    if (group.userIds.some(id => id.equals(userObjectId))) {
      throw new Error("User is already in the group");
    }

    group.userIds.push(userObjectId);
    await group.save();

    return this.mapToDto(group);
  }

  async removeUserFromGroup(groupId: string, userId: string): Promise<GroupDto> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const userObjectId = new Types.ObjectId(userId);
    group.userIds = group.userIds.filter(id => !id.equals(userObjectId));
    await group.save();

    return this.mapToDto(group);
  }

  private mapToDto(group: IGroup): GroupDto {
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      userIds: group.userIds.map(id => id.toString()),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}

export default GroupService;
