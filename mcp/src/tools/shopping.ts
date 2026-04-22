import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

interface ShoppingItem {
  _id: string;
  itemId: string;
  itemType: 'global' | 'group';
  quantity: number;
  unit?: string;
  completed: boolean;
  name?: string;
}

const groupIdSchema = { groupId: z.string() };

export function registerShoppingTools(server: McpServer): void {
  registerTool(
    server,
    'list_shopping',
    "List items on a group's shopping list. Set includeCompleted=false to hide already-bought items.",
    {
      ...groupIdSchema,
      includeCompleted: z.boolean().optional()
    },
    async ({ groupId, includeCompleted }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/shopping',
        params: { groupId, includeCompleted }
      });
    }
  );

  registerTool(
    server,
    'add_shopping_item',
    'Add an item to the shopping list.',
    {
      ...groupIdSchema,
      itemId: z.string(),
      itemType: z.enum(['global', 'group']),
      quantity: z.number().positive(),
      unit: z.string().optional()
    },
    async ({ groupId, itemId, itemType, quantity, unit }) => {
      return apiRequest({
        method: 'POST',
        path: '/api/shopping',
        body: { groupId, itemId, itemType, quantity, unit }
      });
    }
  );

  registerTool(
    server,
    'update_shopping_item',
    "Update a shopping-list entry. Pass completed=true to mark an item as bought without removing it.",
    {
      ...groupIdSchema,
      shoppingItemId: z.string(),
      quantity: z.number().positive().optional(),
      unit: z.string().optional(),
      completed: z.boolean().optional()
    },
    async ({ groupId, shoppingItemId, quantity, unit, completed }) => {
      return apiRequest({
        method: 'PUT',
        path: `/api/shopping/${shoppingItemId}`,
        body: { groupId, quantity, unit, completed }
      });
    }
  );

  registerTool(
    server,
    'remove_shopping_item',
    'Remove an item from the shopping list.',
    {
      ...groupIdSchema,
      shoppingItemId: z.string()
    },
    async ({ groupId, shoppingItemId }) => {
      await apiRequest({
        method: 'DELETE',
        path: `/api/shopping/${shoppingItemId}`,
        params: { groupId }
      });
      return { ok: true };
    }
  );

  registerTool(
    server,
    'move_completed_to_pantry',
    'Move every completed (bought) shopping-list item into the pantry and remove it from the shopping list.',
    groupIdSchema,
    async ({ groupId }) => {
      const items = (await apiRequest<ShoppingItem[]>({
        method: 'GET',
        path: '/api/shopping',
        params: { groupId }
      })) ?? [];

      const completed = items.filter(i => i.completed);
      let moved = 0;

      for (const item of completed) {
        await apiRequest({
          method: 'POST',
          path: '/api/pantry',
          body: {
            groupId,
            itemId: item.itemId,
            itemType: item.itemType,
            quantity: item.quantity,
            unit: item.unit
          }
        });
        await apiRequest({
          method: 'DELETE',
          path: `/api/shopping/${item._id}`,
          params: { groupId }
        });
        moved += 1;
      }

      return { moved };
    }
  );
}
