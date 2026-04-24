import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

const ENTITY_TYPES = ['pantry', 'shopping', 'mealPlan', 'recipe', 'tag', 'item', 'group'] as const;
const ACTIONS = ['create', 'update', 'delete', 'join', 'leave', 'kick', 'role_change'] as const;

export function registerHistoryTools(server: McpServer): void {
  registerTool(
    server,
    'list_history',
    'List activity history (create/update/delete/membership events) for a group in reverse chronological order. Call list_groups first to obtain groupId. Use `entityType` to filter (e.g. only meal-plan changes) and `before` to paginate — pass the previous page\'s last timestamp to fetch older entries.',
    {
      groupId: z.string().describe('MongoDB ObjectId of the group'),
      entityType: z.array(z.enum(ENTITY_TYPES)).optional().describe('Filter to one or more entity types'),
      action: z.enum(ACTIONS).optional().describe('Filter by specific action'),
      limit: z.number().int().min(1).max(200).optional().describe('Max entries to return (default 50)'),
      before: z.string().optional().describe('ISO-8601 timestamp; only return entries strictly older than this (cursor)')
    },
    async ({ groupId, entityType, action, limit, before }) => {
      const params: Record<string, string | number> = { groupId };
      if (entityType && entityType.length > 0) params.entityType = entityType.join(',');
      if (action) params.action = action;
      if (limit !== undefined) params.limit = limit;
      if (before) params.before = before;
      return apiRequest({ method: 'GET', path: '/api/history', params });
    }
  );

  registerTool(
    server,
    'delete_history_entry',
    'Delete a single history entry by its ID. Destructive and irreversible — requires history:delete permission on the group.',
    {
      groupId: z.string().describe('MongoDB ObjectId of the group'),
      entryId: z.string().describe('MongoDB ObjectId of the history entry to delete')
    },
    async ({ groupId, entryId }) => {
      await apiRequest({ method: 'DELETE', path: `/api/history/${entryId}`, params: { groupId } });
      return { ok: true };
    }
  );

  registerTool(
    server,
    'clear_history',
    'Bulk delete history entries for a group. Destructive and irreversible — requires history:delete permission. With no time parameters, clears ALL entries. Use `before` to delete entries older than a timestamp, `after` for newer, or both to delete entries inside an inclusive time range.',
    {
      groupId: z.string().describe('MongoDB ObjectId of the group'),
      before: z.string().optional().describe('ISO-8601 timestamp; delete entries at or before this time'),
      after: z.string().optional().describe('ISO-8601 timestamp; delete entries at or after this time')
    },
    async ({ groupId, before, after }) => {
      const params: Record<string, string> = { groupId };
      if (before) params.before = before;
      if (after) params.after = after;
      return apiRequest({ method: 'DELETE', path: '/api/history', params });
    }
  );
}
