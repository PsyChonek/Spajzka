import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { currentContext } from '../context';
import { logger } from '../logging';
import { toToolError } from '../errors';

export function registerTool(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  handler: (args: any) => Promise<unknown>
): void {
  // Cast to any because MCP SDK's registerTool type is generic over the Zod
  // shape and instantiates deeply; we enforce correctness by construction.
  (server as any).registerTool(
    name,
    { description, inputSchema },
    async (args: any) => {
      const ctx = currentContext();
      const start = Date.now();
      const groupId = args && typeof args === 'object' ? (args as any).groupId : undefined;
      try {
        const result = await handler(args);
        logger.info(
          {
            traceId: ctx.traceId,
            userId: ctx.userId,
            tool: name,
            groupId,
            durationMs: Date.now() - start,
            ok: true
          },
          'tool_call'
        );
        return asToolResult(result);
      } catch (err) {
        logger.warn(
          {
            traceId: ctx.traceId,
            userId: ctx.userId,
            tool: name,
            groupId,
            durationMs: Date.now() - start,
            ok: false,
            err
          },
          'tool_call_failed'
        );
        return toToolError(err);
      }
    }
  );
}

function asToolResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as any
  };
}
