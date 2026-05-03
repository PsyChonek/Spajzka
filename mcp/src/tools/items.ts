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
      const items = await apiRequest({
        method: 'GET',
        path: '/api/items',
        params: { search: query, groupId, limit }
      });
      return { items };
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
      const items = await apiRequest({
        method: 'GET',
        path: '/api/items/global',
        params: { category, limit, offset }
      });
      return { items };
    }
  );

  registerTool(
    server,
    'list_group_items',
    "List a group's custom items (its private extension of the catalog).",
    { groupId: z.string() },
    async ({ groupId }) => {
      const items = await apiRequest({
        method: 'GET',
        path: '/api/items/group',
        params: { groupId }
      });
      return { items };
    }
  );

  registerTool(
    server,
    'create_group_item',
    'Create a new custom item in a group. Use when the required ingredient is not in the global catalog. unitType picks the unit family ("weight" → mg/g/dkg/kg, "volume" → ml/cl/dl/l, "count" → pcs, "length" → cm/m, "custom" for free-text units). defaultUnit must be a member of that family (or any string when unitType=custom).',
    {
      groupId: z.string(),
      name: z.string().min(1),
      category: z.string().min(1),
      icon: z.string().optional(),
      unitType: z.enum(['weight', 'volume', 'count', 'length', 'custom']),
      defaultUnit: z.string().min(1),
      barcode: z.string().optional(),
      searchNames: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional()
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
    "Update a custom group item's metadata. Changing unitType or defaultUnit re-validates them together.",
    {
      groupId: z.string(),
      itemId: z.string(),
      name: z.string().min(1).optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
      unitType: z.enum(['weight', 'volume', 'count', 'length', 'custom']).optional(),
      defaultUnit: z.string().optional(),
      barcode: z.string().optional(),
      searchNames: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional()
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
