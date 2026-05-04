import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

// Translations are stored per-locale on items/tags/recipes. Reads return the
// user's items language; pass `include=translations` to get the full map.
// Writes accept a translations object to set both locales atomically.
const translationsInputSchema = z.record(
  z.enum(['en', 'cs']),
  z.object({
    name: z.string().optional(),
    searchNames: z.array(z.string()).optional()
  })
).optional();

export function registerItemsTools(server: McpServer): void {
  registerTool(
    server,
    'search_items',
    'Search the item catalog by name. Searches across all locales (English + Czech) — a Czech-locale user can find items by typing the English name and vice-versa. Returns items localized to the caller\'s items language. Use to turn a name like "milk" into an itemId before add_pantry_item or add_shopping_item.',
    {
      query: z.string().min(1),
      groupId: z.string().optional(),
      limit: z.number().int().positive().max(50).optional(),
      includeTranslations: z.boolean().optional().describe('When true, returns full per-locale translations object instead of localized name')
    },
    async ({ query, groupId, limit, includeTranslations }) => {
      const items = await apiRequest({
        method: 'GET',
        path: '/api/items',
        params: { search: query, groupId, limit, ...(includeTranslations ? { include: 'translations' } : {}) }
      });
      return { items };
    }
  );

  registerTool(
    server,
    'list_global_items',
    'List items from the global catalog. Names are localized to the caller\'s items language.',
    {
      category: z.string().optional(),
      limit: z.number().int().positive().max(100).optional(),
      offset: z.number().int().nonnegative().optional(),
      includeTranslations: z.boolean().optional()
    },
    async ({ category, limit, offset, includeTranslations }) => {
      const items = await apiRequest({
        method: 'GET',
        path: '/api/items/global',
        params: { category, limit, offset, ...(includeTranslations ? { include: 'translations' } : {}) }
      });
      return { items };
    }
  );

  registerTool(
    server,
    'list_group_items',
    "List a group's custom items (its private extension of the catalog). Names are localized to the caller's items language.",
    { groupId: z.string(), includeTranslations: z.boolean().optional() },
    async ({ groupId, includeTranslations }) => {
      const items = await apiRequest({
        method: 'GET',
        path: '/api/items/group',
        params: { groupId, ...(includeTranslations ? { include: 'translations' } : {}) }
      });
      return { items };
    }
  );

  registerTool(
    server,
    'create_group_item',
    'Create a new custom item in a group. Pass `translations` to set both languages at once (e.g. {en:{name:"Milk"},cs:{name:"Mléko"}}). The `name` field seeds both locales when translations are absent. unitType picks the unit family ("weight" → mg/g/kg, "volume" → ml/cl/dl/l, "count" → pcs, "length" → cm/m, "custom" for free-text). defaultUnit must belong to that family (or any string when unitType=custom).',
    {
      groupId: z.string(),
      name: z.string().min(1),
      category: z.string().min(1),
      icon: z.string().optional(),
      unitType: z.enum(['weight', 'volume', 'count', 'length', 'custom']),
      defaultUnit: z.string().min(1),
      barcode: z.string().optional(),
      searchNames: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      translations: translationsInputSchema
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
    "Update a custom group item's metadata. Changing unitType or defaultUnit re-validates them together. Pass `translations` to update locale-specific names without touching the legacy flat fields.",
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
      tags: z.array(z.string()).optional(),
      translations: translationsInputSchema
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
