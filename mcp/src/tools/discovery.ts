import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

export function registerDiscoveryTools(server: McpServer): void {
  registerTool(
    server,
    'list_groups',
    "List all groups (households) the authenticated user belongs to. Always call this first in a conversation to resolve group names to IDs — most other tools require a groupId.",
    {},
    async () => {
      const groups = await apiRequest({ method: 'GET', path: '/api/groups/my' });
      return { groups };
    }
  );

  registerTool(
    server,
    'whoami',
    'Return the authenticated user: userId, name, email, and anonymous flag.',
    {},
    async () => {
      return apiRequest({ method: 'GET', path: '/api/auth/me' });
    }
  );
}
