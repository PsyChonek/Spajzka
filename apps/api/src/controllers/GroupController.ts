import {
  Controller,
  Get,
  Post,
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
import type { GroupDto, CreateGroupDto, UpdateGroupDto, AddUserToGroupDto } from "../types/dto";
import GroupService from "../services/GroupService";

@Route("groups")
@Tags("Groups")
export class GroupController extends Controller {
  private groupService = new GroupService();

  /**
   * Get all groups
   */
  @Get()
  @Security("jwt")
  public async getAllGroups(): Promise<GroupDto[]> {
    return this.groupService.getAllGroups();
  }

  /**
   * Get a group by ID
   */
  @Get("{groupId}")
  @Response(404, "Group not found")
  @Security("jwt")
  public async getGroup(@Path() groupId: string): Promise<GroupDto> {
    return this.groupService.getGroupById(groupId);
  }

  /**
   * Create a new group
   */
  @Post()
  @SuccessResponse(201, "Group created")
  @Response(400, "Validation error")
  @Security("jwt")
  public async createGroup(@Body() requestBody: CreateGroupDto): Promise<GroupDto> {
    this.setStatus(201);
    return this.groupService.createGroup(requestBody);
  }

  /**
   * Update a group
   */
  @Put("{groupId}")
  @Response(404, "Group not found")
  @Response(400, "Validation error")
  @Security("jwt")
  public async updateGroup(
    @Path() groupId: string,
    @Body() requestBody: UpdateGroupDto
  ): Promise<GroupDto> {
    return this.groupService.updateGroup(groupId, requestBody);
  }

  /**
   * Delete a group
   */
  @Delete("{groupId}")
  @SuccessResponse(204, "Group deleted")
  @Response(404, "Group not found")
  @Security("jwt")
  public async deleteGroup(@Path() groupId: string): Promise<void> {
    await this.groupService.deleteGroup(groupId);
    this.setStatus(204);
  }

  /**
   * Add a user to a group
   */
  @Post("{groupId}/users")
  @Response(404, "Group not found")
  @Response(400, "Validation error")
  @Security("jwt")
  public async addUserToGroup(
    @Path() groupId: string,
    @Body() requestBody: AddUserToGroupDto
  ): Promise<GroupDto> {
    return this.groupService.addUserToGroup(groupId, requestBody);
  }

  /**
   * Remove a user from a group
   */
  @Delete("{groupId}/users/{userId}")
  @SuccessResponse(204, "User removed from group")
  @Response(404, "Group not found")
  @Security("jwt")
  public async removeUserFromGroup(
    @Path() groupId: string,
    @Path() userId: string
  ): Promise<void> {
    await this.groupService.removeUserFromGroup(groupId, userId);
    this.setStatus(204);
  }
}
