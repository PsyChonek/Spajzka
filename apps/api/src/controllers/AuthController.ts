import {
  Controller,
  Get,
  Post,
  Body,
  Path,
  Route,
  SuccessResponse,
  Response,
  Security,
  Tags
} from "tsoa";
import type { UserDto, CreateUserDto } from "../types/dto";
import UserService from "../services/UserService";

@Route("users")
@Tags("Users")
export class UserController extends Controller {
  private userService = new UserService();

  /**
   * Get a user by ID
   */
  @Get("{userId}")
  @Response(404, "User not found")
  @Security("jwt")
  public async getUser(@Path() userId: string): Promise<UserDto> {
    return this.userService.getUser(userId);
  }

  /**
   * Create a new user
   */
  @Post()
  @SuccessResponse(201, "User created")
  @Response(400, "Validation error")
  public async createUser(@Body() requestBody: CreateUserDto): Promise<UserDto> {
    return this.userService.createUser(requestBody);
  }
}
