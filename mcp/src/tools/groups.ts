import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

export function registerGroupTools(server: McpServer): void {
  registerTool(
    server,
    'get_group',
    'Get detailed information about a group the user belongs to, including members and roles.',
    { groupId: z.string() },
    async ({ groupId }) => {
      return apiRequest({
        method: 'GET',
        path: `/api/groups/${groupId}`
      });
    }
  );

  registerTool(
    server,
    'list_group_members',
    "List a group's members with their roles.",
    { groupId: z.string() },
    async ({ groupId }) => {
      const members = await apiRequest({
        method: 'GET',
        path: `/api/groups/${groupId}/members`
      });
      return { members };
    }
  );

  registerTool(
    server,
    'join_group',
    'Join a group using an invite code.',
    { inviteCode: z.string().min(1) },
    async ({ inviteCode }) => {
      return apiRequest({
        method: 'POST',
        path: '/api/groups/join',
        body: { inviteCode }
      });
    }
  );

  registerTool(
    server,
    'leave_group',
    "Leave a group. Only works if the user is not the group's sole admin.",
    { groupId: z.string() },
    async ({ groupId }) => {
      await apiRequest({
        method: 'POST',
        path: `/api/groups/${groupId}/leave`
      });
      return { ok: true };
    }
  );
}
