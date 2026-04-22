import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { config } from './config';
import { logger, newTraceId } from './logging';
import { AuthError, extractBearer, getJwtForPat } from './auth';
import { contextStorage, type RequestContext } from './context';
import { createRateLimiter } from './rateLimit';
import { registerAllTools } from './tools';

const app = express();
app.use(cors({
  exposedHeaders: ['WWW-Authenticate', 'Mcp-Session-Id', 'Mcp-Protocol-Version'],
  origin: '*'
}));
app.use(express.json({ limit: '1mb' }));

const limiter = createRateLimiter(config.rateLimitPerMinute);

// Transport map, keyed by MCP session ID.
const transports = new Map<string, StreamableHTTPServerTransport>();
// Per-session auth, populated on session init and reused across requests in
// the same session (MCP clients attach the Authorization header only on the
// first request of a session).
const sessionAuth = new Map<string, { pat: string; userId: string }>();

function createServer(): McpServer {
  const server = new McpServer({
    name: 'spajzka-mcp',
    version: '1.0.0'
  });
  registerAllTools(server);
  return server;
}

function sendAuthError(res: Response, message: string) {
  res.status(401).json({
    jsonrpc: '2.0',
    error: { code: -32001, message }
  });
}

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  let pat: string | null = null;
  let userId: string | undefined;

  if (sessionId && sessionAuth.has(sessionId)) {
    const prev = sessionAuth.get(sessionId)!;
    pat = prev.pat;
    userId = prev.userId;
  } else {
    pat = extractBearer(req.headers.authorization);
    if (!pat) {
      sendAuthError(res, 'Missing Authorization: Bearer spk_mcp_... header');
      return;
    }
  }

  // Rate limit per PAT.
  if (!limiter.consume(pat)) {
    res.status(429).json({
      jsonrpc: '2.0',
      error: { code: -32002, message: 'Rate limit exceeded. Try again shortly.' }
    });
    return;
  }

  // Exchange PAT for JWT (cached).
  let jwt: string;
  try {
    const cached = await getJwtForPat(pat);
    jwt = cached.jwt;
    userId = cached.userId;
  } catch (err) {
    const message = err instanceof AuthError ? err.message : 'Authentication failed';
    sendAuthError(res, message);
    return;
  }

  const traceId = newTraceId();
  const ctx: RequestContext = { pat, userId: userId!, jwt, traceId };

  // Reuse transport when session exists, otherwise bootstrap a new one.
  let transport: StreamableHTTPServerTransport | undefined;
  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!;
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports.set(sid, transport!);
        sessionAuth.set(sid, { pat: ctx.pat, userId: ctx.userId });
      }
    });
    transport.onclose = () => {
      if (transport?.sessionId) {
        transports.delete(transport.sessionId);
        sessionAuth.delete(transport.sessionId);
      }
    };
    const server = createServer();
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid request: missing session or initialize' }
    });
    return;
  }

  await contextStorage.run(ctx, async () => {
    await transport!.handleRequest(req, res, req.body);
  });
}

app.post('/mcp', (req, res) => {
  handleMcpRequest(req, res).catch(err => {
    logger.error({ err }, 'Unhandled MCP request error');
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' }
      });
    }
  });
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'spajzka-mcp', version: '1.0.0' });
});

app.listen(config.port, () => {
  logger.info(
    { port: config.port, apiUrl: config.apiUrl, rateLimitPerMinute: config.rateLimitPerMinute },
    'MCP server listening'
  );
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  process.exit(0);
});
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down');
  process.exit(0);
});
