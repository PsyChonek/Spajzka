import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { config } from './config';
import { logger, newTraceId } from './logging';
import { AuthError, extractBearer, getJwtForPat, verifyOAuthJwt } from './auth';
import { type RequestContext } from './context';
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
// `cachedJwt` is set for OAuth sessions so we skip re-verification after init.
const sessionAuth = new Map<string, { token: string; tokenType: 'pat' | 'oauth'; userId: string; cachedJwt?: string }>();

function createServer(): McpServer {
  const server = new McpServer({
    name: 'spajzka-mcp',
    version: '1.0.0'
  });
  registerAllTools(server);
  return server;
}

// Computed once at startup from stable config values.
const MCP_URL = config.publicUrl || 'http://localhost:3001/mcp';
const API_ORIGIN = config.publicOrigin || 'http://localhost:3000';
const RESOURCE_METADATA_URL = `${MCP_URL}/.well-known/oauth-protected-resource`;

// ── OAuth 2.0 Protected Resource Metadata (RFC 9728) ─────────────────────────
// Served at /mcp/.well-known/oauth-protected-resource so that after nginx
// forwards https://spajzka.vazac.dev/mcp/... → http://mcp:3001/mcp/... the
// path remains intact.
app.get('/mcp/.well-known/oauth-protected-resource', (_req, res) => {
  res.json({
    resource: MCP_URL,
    authorization_servers: [`${API_ORIGIN}/api`],
    scopes_supported: ['mcp:tools'],
    bearer_methods_supported: ['header']
  });
});

function sendAuthError(res: Response, message: string) {
  res.set(
    'WWW-Authenticate',
    `Bearer realm="Spajzka MCP", resource_metadata="${RESOURCE_METADATA_URL}"`
  );
  res.status(401).json({
    jsonrpc: '2.0',
    error: { code: -32001, message }
  });
}

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  let token: string | null = null;
  let tokenType: 'pat' | 'oauth' = 'pat';
  let userId: string | undefined;
  let cachedJwt: string | undefined;

  if (sessionId && sessionAuth.has(sessionId)) {
    const prev = sessionAuth.get(sessionId)!;
    token = prev.token;
    tokenType = prev.tokenType;
    userId = prev.userId;
    cachedJwt = prev.cachedJwt;

    // OAuth access tokens expire (1h TTL). Claude clients refresh them and
    // attach the new JWT on the next request. Pick up rotated tokens so the
    // session keeps working past the original JWT's expiry.
    if (tokenType === 'oauth') {
      const extracted = extractBearer(req.headers.authorization);
      if (extracted && extracted.kind === 'oauth' && extracted.token !== token) {
        token = extracted.token;
        cachedJwt = undefined;
      }
    }
  } else {
    const extracted = extractBearer(req.headers.authorization);
    if (!extracted) {
      sendAuthError(res, 'Missing or unsupported Authorization header. Use Bearer spk_mcp_... (PAT) or a valid OAuth access token.');
      return;
    }
    token = extracted.token;
    tokenType = extracted.kind;
  }

  // Rate limit per credential.
  if (!limiter.consume(token)) {
    res.status(429).json({
      jsonrpc: '2.0',
      error: { code: -32002, message: 'Rate limit exceeded. Try again shortly.' }
    });
    return;
  }

  // Resolve JWT and userId depending on token type.
  // For OAuth sessions after init, reuse the cached JWT to avoid re-running the HMAC.
  let jwt: string;
  try {
    if (tokenType === 'oauth' && cachedJwt) {
      jwt = cachedJwt;
    } else if (tokenType === 'oauth') {
      const verified = verifyOAuthJwt(token);
      jwt = verified.jwt;
      userId = verified.userId;
      cachedJwt = jwt;
      if (sessionId && sessionAuth.has(sessionId)) {
        sessionAuth.set(sessionId, { token, tokenType, userId: userId!, cachedJwt: jwt });
      }
    } else {
      const resolved = await getJwtForPat(token);
      jwt = resolved.jwt;
      userId = resolved.userId;
    }
  } catch (err) {
    const message = err instanceof AuthError ? err.message : 'Authentication failed';
    sendAuthError(res, message);
    return;
  }

  const traceId = newTraceId();
  const ctx: RequestContext = { token, tokenType, userId: userId!, jwt, traceId };

  // Reuse transport when session exists, otherwise bootstrap a new one.
  let transport: StreamableHTTPServerTransport | undefined;
  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!;
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports.set(sid, transport!);
        sessionAuth.set(sid, {
          token: ctx.token,
          tokenType: ctx.tokenType,
          userId: ctx.userId,
          cachedJwt: ctx.tokenType === 'oauth' ? ctx.jwt : undefined
        });
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
  } else if (sessionId) {
    // Per MCP Streamable HTTP spec: unknown session ID → 404 so the client drops
    // the stale session and sends a fresh initialize request (e.g. after server restart).
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Session not found. Please reinitialize.' }
    });
    return;
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid request: expected initialize' }
    });
    return;
  }

  // Attach ctx as req.auth so SDK passes it through the Hono Node→Web adapter
  // as extra.authInfo in tool handlers (AsyncLocalStorage doesn't survive that conversion).
  (req as any).auth = ctx;
  await transport!.handleRequest(req, res, req.body);
}

// GET /mcp: used by MCP clients for SSE-based server-to-client notifications.
// Return 401 with discovery headers so Claude.ai can start the OAuth flow
// even when it probes with GET before POST.
app.get('/mcp', (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && transports.has(sessionId)) {
    // Existing session — let the transport handle SSE.
    const transport = transports.get(sessionId)!;
    transport.handleRequest(req, res, undefined as any).catch(err => {
      logger.error({ err }, 'Unhandled MCP GET error');
      if (!res.headersSent) res.status(500).end();
    });
  } else {
    sendAuthError(res, 'Authentication required. Connect with an OAuth token or MCP PAT.');
  }
});

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
