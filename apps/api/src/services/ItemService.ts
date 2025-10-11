import Item, { IItem } from "../models/Items";
import { ItemDto, CreateItemDto, UpdateItemDto } from "../types/dto";
import { Types } from "mongoose";

class ItemService {
  async getAllItems(): Promise<ItemDto[]> {
    const items = await Item.find();
    return items.map(this.mapToDto);
  }

  async getItemById(itemId: string): Promise<ItemDto> {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new Error("Invalid item ID");
    }

    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    return this.mapToDto(item);
  }

  async getItemsByUserId(userId: string): Promise<ItemDto[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const items = await Item.find({ userId: new Types.ObjectId(userId) });
    return items.map(this.mapToDto);
  }

  async getItemsByGroupId(groupId: string): Promise<ItemDto[]> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid group ID");
    }

    const items = await Item.find({ groupId: new Types.ObjectId(groupId) });
    return items.map(this.mapToDto);
  }

  async createItem(itemData: CreateItemDto): Promise<ItemDto> {
    if (!Types.ObjectId.isValid(itemData.groupId)) {
      throw new Error("Invalid group ID");
    }
    if (!Types.ObjectId.isValid(itemData.userId)) {
      throw new Error("Invalid user ID");
    }

    const item: IItem = new Item({
      name: itemData.name,
      isOnBuylist: itemData.isOnBuylist ?? false,
      amount: itemData.amount ?? 0,
      price: itemData.price ?? 0,
      groupId: new Types.ObjectId(itemData.groupId),
      userId: new Types.ObjectId(itemData.userId),
    });

    await item.save();
    return this.mapToDto(item);
  }

  async updateItem(itemId: string, itemData: UpdateItemDto): Promise<ItemDto> {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new Error("Invalid item ID");
    }

    const updateData: any = {};
    if (itemData.name !== undefined) updateData.name = itemData.name;
    if (itemData.isOnBuylist !== undefined) updateData.isOnBuylist = itemData.isOnBuylist;
    if (itemData.amount !== undefined) updateData.amount = itemData.amount;
    if (itemData.price !== undefined) updateData.price = itemData.price;
    if (itemData.groupId !== undefined) {
      if (!Types.ObjectId.isValid(itemData.groupId)) {
        throw new Error("Invalid group ID");
      }
      updateData.groupId = new Types.ObjectId(itemData.groupId);
    }

    const item = await Item.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );

    if (!item) {
      throw new Error("Item not found");
    }

    return this.mapToDto(item);
  }

  async deleteItem(itemId: string): Promise<void> {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new Error("Invalid item ID");
    }

    const result = await Item.findByIdAndDelete(itemId);
    if (!result) {
      throw new Error("Item not found");
    }
  }

  private mapToDto(item: IItem): ItemDto {
    return {
      id: item._id.toString(),
      name: item.name,
      isOnBuylist: item.isOnBuylist,
      amount: item.amount,
      price: item.price,
      groupId: item.groupId.toString(),
      userId: item.userId.toString(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

export default ItemService;
