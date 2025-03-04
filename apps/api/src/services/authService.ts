import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/Users";
import {
  CreateUserDto,
  LoginDto,
  TokenResponseDto,
  UserDto,
} from "../types/dto";
import config from "../config/config";

class AuthService {
  async createUser(userData: CreateUserDto): Promise<UserDto> {
    const { email, password, displayName } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create salt and hash
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);

    // Create and save user
    const user: IUser = new User({
      email,
      passHash,
      salt,
      displayName,
    });

    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    };
  }

  async login(loginData: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginData;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return {
      token,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }
}

export default AuthService;
