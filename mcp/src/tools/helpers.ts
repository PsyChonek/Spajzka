import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { contextStorage } from '../context';
import type { RequestContext } from '../context';
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
    // SDK 1.x routes requests through @hono/node-server (Node→Web Standard conversion)
    // which breaks AsyncLocalStorage propagation. Auth context arrives via extra.authInfo,
    // set on req.auth in handleMcpRequest before transport.handleRequest is called. We
    // re-establish contextStorage here so apiClient and other downstream code can use
    // currentContext() without changes.
    async (args: any, extra: any) => {
      const ctx = extra?.authInfo as RequestContext | undefined;
      if (!ctx?.jwt) {
        logger.error({ tool: name }, 'Tool called without auth context');
        return { isError: true as const, content: [{ type: 'text' as const, text: 'Internal error: auth context missing' }] };
      }
      const start = Date.now();
      const groupId = args && typeof args === 'object' ? (args as any).groupId : undefined;
      return contextStorage.run(ctx, async () => {
        try {
          const result = await handler(args);
          logger.info(
            { traceId: ctx.traceId, userId: ctx.userId, tool: name, groupId, durationMs: Date.now() - start, ok: true },
            'tool_call'
          );
          return asToolResult(result);
        } catch (err) {
          logger.warn(
            { traceId: ctx.traceId, userId: ctx.userId, tool: name, groupId, durationMs: Date.now() - start, ok: false, err },
            'tool_call_failed'
          );
          return toToolError(err);
        }
      });
    }
  );
}

function asToolResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as any
  };
}
