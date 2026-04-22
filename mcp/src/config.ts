import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  apiUrl: process.env.API_URL || 'http://api:3000',
  publicUrl: process.env.MCP_PUBLIC_URL || '',
  jwtTtlSeconds: 60 * 60,
  jwtCacheSkewSeconds: 60,
  rateLimitPerMinute: Number(process.env.MCP_RATE_LIMIT_PER_MINUTE) || 60,
  logLevel: process.env.LOG_LEVEL || 'info'
};
