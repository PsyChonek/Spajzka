import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User, { IUser } from "../models/Users";
import Group, { IGroup } from "../models/Groups";
import {
  CreateUserDto,
  LoginDto,
  TokenResponseDto,
  UserDto,
  ResetAccessCodeResponseDto,
  UpgradeGuestDto,
} from "../types/dto";
import config from "../config/config";

class AuthService {
  async register(userData: CreateUserDto): Promise<UserDto> {
    const { username, displayName } = userData;

    // Generate unique access code
    const accessCode = uuidv4();

    // Create and save user
    const user: IUser = new User({
      username,
      displayName: displayName || username, // Use username as displayName if not provided
      accessCode,
    });

    await user.save();

    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      accessCode: user.accessCode, // Return access code on registration
    };
  }

  async login(loginData: LoginDto): Promise<TokenResponseDto> {
    const { accessCode } = loginData;

    // Find user by access code
    const user = await User.findOne({ accessCode });
    if (!user) {
      throw new Error("Invalid access code");
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwtSecret,
      { expiresIn: "30d" }
    );

    return {
      token,
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
      },
    };
  }

  async resetAccessCode(userId: string): Promise<ResetAccessCodeResponseDto> {
    // Generate new access code
    const newAccessCode = uuidv4();

    // Update user's access code
    const user = await User.findByIdAndUpdate(
      userId,
      { accessCode: newAccessCode },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return {
      accessCode: newAccessCode,
    };
  }

  async registerGuest(): Promise<TokenResponseDto> {
    // Generate unique guest username with timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const guestUsername = `guest_${timestamp}_${randomSuffix}`;
    const displayName = `Guest User`;

    // Generate unique access code
    const accessCode = uuidv4();

    // Create and save guest user
    const user: IUser = new User({
      username: guestUsername,
      displayName,
      accessCode,
    });

    await user.save();

    // Create a default personal group for the guest user
    const personalGroup: IGroup = new Group({
      name: "My Items",
      description: "Personal items",
      userIds: [user._id],
    });

    await personalGroup.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwtSecret,
      { expiresIn: "30d" }
    );

    return {
      token,
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        accessCode: user.accessCode, // Return access code for guest user
      },
    };
  }
  async upgradeGuest(userId: string, upgradeData: UpgradeGuestDto): Promise<UserDto> {
    const { username, displayName } = upgradeData;

    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("Username already taken");
    }

    // Find and update the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update username and displayName
    user.username = username;
    user.displayName = displayName || username;
    await user.save();

    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      accessCode: user.accessCode,
    };
  }
}

export default AuthService;

