import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

export function registerTagTools(server: McpServer): void {
  registerTool(
    server,
    'list_tags',
    "List the tags defined in a group.",
    { groupId: z.string() },
    async ({ groupId }) => {
      const tags = await apiRequest({
        method: 'GET',
        path: '/api/tags',
        params: { groupId }
      });
      return { tags };
    }
  );

  registerTool(
    server,
    'create_tag',
    'Create a new tag in a group. color is a hex code (e.g. #FF5722). searchNames lists localized/alternate labels so the tag is discoverable in multiple languages.',
    {
      groupId: z.string(),
      name: z.string().min(1),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      icon: z.string().optional(),
      searchNames: z.array(z.string()).optional()
    },
    async (args) => {
      return apiRequest({
        method: 'POST',
        path: '/api/tags',
        body: args
      });
    }
  );

  registerTool(
    server,
    'update_tag',
    'Update a tag. searchNames replaces the whole list of alternate search labels.',
    {
      groupId: z.string(),
      tagId: z.string(),
      name: z.string().min(1).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      icon: z.string().optional(),
      searchNames: z.array(z.string()).optional()
    },
    async ({ groupId, tagId, ...fields }) => {
      return apiRequest({
        method: 'PUT',
        path: `/api/tags/${tagId}`,
        body: { groupId, ...fields }
      });
    }
  );

  registerTool(
    server,
    'delete_tag',
    'Delete a tag.',
    {
      groupId: z.string(),
      tagId: z.string()
    },
    async ({ groupId, tagId }) => {
      await apiRequest({
        method: 'DELETE',
        path: `/api/tags/${tagId}`,
        params: { groupId }
      });
      return { ok: true };
    }
  );
}
