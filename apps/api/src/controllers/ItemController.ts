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
import type { ItemDto, CreateItemDto, UpdateItemDto } from "../types/dto";
import ItemService from "../services/ItemService";

@Route("items")
@Tags("Items")
export class ItemController extends Controller {
  private itemService = new ItemService();

  /**
   * Get all items
   */
  @Get()
  @Security("jwt")
  public async getAllItems(): Promise<ItemDto[]> {
    return this.itemService.getAllItems();
  }

  /**
   * Get an item by ID
   */
  @Get("{itemId}")
  @Response(404, "Item not found")
  @Security("jwt")
  public async getItem(@Path() itemId: string): Promise<ItemDto> {
    return this.itemService.getItemById(itemId);
  }

  /**
   * Create a new item
   */
  @Post()
  @SuccessResponse(201, "Item created")
  @Response(400, "Validation error")
  @Security("jwt")
  public async createItem(@Body() requestBody: CreateItemDto): Promise<ItemDto> {
    this.setStatus(201);
    return this.itemService.createItem(requestBody);
  }

  /**
   * Update an item
   */
  @Put("{itemId}")
  @Response(404, "Item not found")
  @Response(400, "Validation error")
  @Security("jwt")
  public async updateItem(
    @Path() itemId: string,
    @Body() requestBody: UpdateItemDto
  ): Promise<ItemDto> {
    return this.itemService.updateItem(itemId, requestBody);
  }

  /**
   * Delete an item
   */
  @Delete("{itemId}")
  @SuccessResponse(204, "Item deleted")
  @Response(404, "Item not found")
  @Security("jwt")
  public async deleteItem(@Path() itemId: string): Promise<void> {
    await this.itemService.deleteItem(itemId);
    this.setStatus(204);
  }
}
