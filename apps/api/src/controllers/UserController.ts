import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Path,
  Route,
  SuccessResponse,
  Response,
  Security,
  Tags,
} from "tsoa";
import type { UserDto, UpdateUserDto } from "../types/dto";
import type { ItemDto } from "../types/dto";
import type { GroupDto } from "../types/dto";
import UserService from "../services/UserService";
import ItemService from "../services/ItemService";
import GroupService from "../services/GroupService";

@Route("users")
@Tags("Users")
export class UserController extends Controller {
  private userService = new UserService();
  private itemService = new ItemService();
  private groupService = new GroupService();

  /**
   * Get all users
   */
  @Get()
  @Security("jwt")
  public async getAllUsers(): Promise<UserDto[]> {
    return this.userService.getAllUsers();
  }

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
   * Update a user
   */
  @Put("{userId}")
  @Response(404, "User not found")
  @Response(400, "Validation error")
  @Security("jwt")
  public async updateUser(
    @Path() userId: string,
    @Body() requestBody: UpdateUserDto
  ): Promise<UserDto> {
    return this.userService.updateUser(userId, requestBody);
  }

  /**
   * Delete a user
   */
  @Delete("{userId}")
  @SuccessResponse(204, "User deleted")
  @Response(404, "User not found")
  @Security("jwt")
  public async deleteUser(@Path() userId: string): Promise<void> {
    await this.userService.deleteUser(userId);
    this.setStatus(204);
  }

  /**
   * Get all items for a user
   */
  @Get("{userId}/items")
  @Response(404, "User not found")
  @Security("jwt")
  public async getUserItems(@Path() userId: string): Promise<ItemDto[]> {
    return this.itemService.getItemsByUserId(userId);
  }

  /**
   * Get all groups for a user
   */
  @Get("{userId}/groups")
  @Response(404, "User not found")
  @Security("jwt")
  public async getUserGroups(@Path() userId: string): Promise<GroupDto[]> {
    return this.groupService.getGroupsByUserId(userId);
  }
}
