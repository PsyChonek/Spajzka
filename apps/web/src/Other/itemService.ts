import { ItemDto, CreateItemDto, UpdateItemDto } from '../Api';
import { Cookies } from 'react-cookie';
import { getAuthenticatedClient } from './apiClient';

const cookies = new Cookies;

// Get user items
export const GetUserItems = async () => {
    try {
        const client = getAuthenticatedClient();
        const userId = cookies.get('userID');
        const result = await client.users.getUserItems(userId);
        return result.data;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}

// Create item
export const CreateItem = async (item: CreateItemDto) => {
    try {
        const client = getAuthenticatedClient();
        const result = await client.items.createItem(item);
        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Get item by ID
export const GetItem = async (itemId: string) => {
    try {
        const client = getAuthenticatedClient();
        const result = await client.items.getItem(itemId);
        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Update item
export const UpdateItem = async (itemId: string, itemData: UpdateItemDto) => {
    try {
        const client = getAuthenticatedClient();
        const result = await client.items.updateItem(itemId, itemData);
        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Delete item
export const RemoveItem = async (itemId: string) => {
    try {
        const client = getAuthenticatedClient();
        await client.items.deleteItem(itemId);
        return true;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Legacy compatibility - Save/Create item (keeping the old interface for now)
export const SaveUserItem = async (item: ItemDto) => {
    try {
        const client = getAuthenticatedClient();
        const userId = cookies.get('userID');
        const groupId = cookies.get('groupID');

        const createData: CreateItemDto = {
            name: item.name,
            isOnBuylist: item.isOnBuylist,
            amount: item.amount,
            price: item.price,
            groupId: groupId || item.groupId,
            userId: userId,
        };

        const result = await client.items.createItem(createData);
        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Legacy compatibility - Update item (keeping the old interface for now)
export const UpdateUserItem = async (item: ItemDto) => {
    try {
        const client = getAuthenticatedClient();
        if (!item.id) {
            return null;
        }

        const updateData: UpdateItemDto = {
            name: item.name,
            isOnBuylist: item.isOnBuylist,
            amount: item.amount,
            price: item.price,
            groupId: item.groupId,
        };

        const result = await client.items.updateItem(item.id, updateData);
        return result;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}
