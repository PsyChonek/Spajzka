import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

const groupIdSchema = { groupId: z.string().describe('MongoDB ObjectId of the group') };

export function registerPantryTools(server: McpServer): void {
  registerTool(
    server,
    'list_pantry',
    'List items currently in the pantry for a given group.',
    groupIdSchema,
    async ({ groupId }) => {
      return apiRequest({ method: 'GET', path: '/api/pantry', params: { groupId } });
    }
  );

  registerTool(
    server,
    'add_pantry_item',
    'Add an item to the pantry. itemType=global references the catalog; itemType=group references a custom item in the group.',
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
        path: '/api/pantry',
        body: { groupId, itemId, itemType, quantity, unit }
      });
    }
  );

  registerTool(
    server,
    'update_pantry_item',
    "Update a pantry entry's quantity or unit. Use list_pantry to find pantryItemId.",
    {
      ...groupIdSchema,
      pantryItemId: z.string(),
      quantity: z.number().positive().optional(),
      unit: z.string().optional()
    },
    async ({ groupId, pantryItemId, quantity, unit }) => {
      return apiRequest({
        method: 'PUT',
        path: `/api/pantry/${pantryItemId}`,
        body: { groupId, quantity, unit }
      });
    }
  );

  registerTool(
    server,
    'remove_pantry_item',
    'Remove an item entirely from the pantry. Use update_pantry_item to just change the quantity.',
    {
      ...groupIdSchema,
      pantryItemId: z.string()
    },
    async ({ groupId, pantryItemId }) => {
      await apiRequest({
        method: 'DELETE',
        path: `/api/pantry/${pantryItemId}`,
        params: { groupId }
      });
      return { ok: true };
    }
  );
}
