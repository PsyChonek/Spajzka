import dotenv from 'dotenv';

dotenv.config();

// publicUrl = public MCP endpoint, e.g. https://spajzka.vazac.dev/mcp
const publicUrl = process.env.MCP_PUBLIC_URL || '';

// Derive the root origin from the MCP public URL so we can build auth-server URLs.
// e.g. https://spajzka.vazac.dev/mcp → https://spajzka.vazac.dev
const publicOrigin = publicUrl ? publicUrl.replace(/\/mcp\/?$/, '') : '';

export const config = {
  port: Number(process.env.PORT) || 3001,
  apiUrl: process.env.API_URL || 'http://api:3000',
  publicUrl,
  publicOrigin,
  jwtSecret: process.env.JWT_SECRET || '',
  jwtTtlSeconds: 60 * 60,
  jwtCacheSkewSeconds: 60,
  rateLimitPerMinute: Number(process.env.MCP_RATE_LIMIT_PER_MINUTE) || 60,
  logLevel: process.env.LOG_LEVEL || 'info'
};
