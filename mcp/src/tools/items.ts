import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

export function registerItemsTools(server: McpServer): void {
  registerTool(
    server,
    'search_items',
    'Search the item catalog by name. Searches global items plus — if groupId is provided — the group\'s custom items. Use this to turn "milk" into an itemId before add_pantry_item or add_shopping_item.',
    {
      query: z.string().min(1),
      groupId: z.string().optional(),
      limit: z.number().int().positive().max(50).optional()
    },
    async ({ query, groupId, limit }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/items',
        params: { search: query, groupId, limit }
      });
    }
  );

  registerTool(
    server,
    'list_global_items',
    'List items from the global catalog. Supports pagination and optional category filter.',
    {
      category: z.string().optional(),
      limit: z.number().int().positive().max(100).optional(),
      offset: z.number().int().nonnegative().optional()
    },
    async ({ category, limit, offset }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/items/global',
        params: { category, limit, offset }
      });
    }
  );

  registerTool(
    server,
    'list_group_items',
    "List a group's custom items (its private extension of the catalog).",
    { groupId: z.string() },
    async ({ groupId }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/items/group',
        params: { groupId }
      });
    }
  );

  registerTool(
    server,
    'create_group_item',
    'Create a new custom item in a group. Use when the required ingredient is not in the global catalog.',
    {
      groupId: z.string(),
      name: z.string().min(1),
      category: z.string().optional(),
      icon: z.string().optional(),
      defaultUnit: z.string().optional(),
      barcode: z.string().optional(),
      searchNames: z.array(z.string()).optional()
    },
    async (args) => {
      return apiRequest({
        method: 'POST',
        path: '/api/items/group',
        body: args
      });
    }
  );

  registerTool(
    server,
    'update_group_item',
    "Update a custom group item's metadata.",
    {
      groupId: z.string(),
      itemId: z.string(),
      name: z.string().min(1).optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
      defaultUnit: z.string().optional(),
      barcode: z.string().optional(),
      searchNames: z.array(z.string()).optional()
    },
    async ({ groupId, itemId, ...fields }) => {
      return apiRequest({
        method: 'PUT',
        path: `/api/items/group/${itemId}`,
        body: { groupId, ...fields }
      });
    }
  );

  registerTool(
    server,
    'delete_group_item',
    'Delete a custom group item. Does not remove pantry/shopping entries that reference it.',
    {
      groupId: z.string(),
      itemId: z.string()
    },
    async ({ groupId, itemId }) => {
      await apiRequest({
        method: 'DELETE',
        path: `/api/items/group/${itemId}`,
        params: { groupId }
      });
      return { ok: true };
    }
  );
}
