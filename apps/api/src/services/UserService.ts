import User, { IUser } from "../models/Users";
import { UserDto, UpdateUserDto } from "../types/dto";
import { Types } from "mongoose";

class UserService {
  async getAllUsers(): Promise<UserDto[]> {
    const users = await User.find();
    return users.map(user => this.mapToDto(user));
  }

  async getUser(userId: string): Promise<UserDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return this.mapToDto(user);
  }

  async getUserByUsername(username: string): Promise<UserDto> {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    return this.mapToDto(user);
  }

  async updateUser(userId: string, userData: UpdateUserDto): Promise<UserDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const updateData: any = {};
    if (userData.username !== undefined) updateData.username = userData.username;
    if (userData.displayName !== undefined) updateData.displayName = userData.displayName;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return this.mapToDto(user);
  }

  async deleteUser(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      throw new Error("User not found");
    }
  }

  private mapToDto(user: IUser, includeAccessCode: boolean = false): UserDto {
    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      ...(includeAccessCode && { accessCode: user.accessCode }),
    };
  }
}

export default UserService;
