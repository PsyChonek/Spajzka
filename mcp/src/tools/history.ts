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
}
