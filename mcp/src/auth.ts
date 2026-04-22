import axios, { AxiosError } from 'axios';
import { createHash } from 'crypto';
import { config } from './config';
import { logger } from './logging';

interface CachedToken {
  jwt: string;
  userId: string;
  expiresAtMs: number;
}

// Cached per PAT hash so we never keep the raw PAT in memory for longer than a
// single request pass-through.
const cache = new Map<string, CachedToken>();

function keyFor(pat: string): string {
  return createHash('sha256').update(pat).digest('hex');
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

async function performExchange(pat: string): Promise<{ jwt: string; userId: string; expiresAt: string }> {
  try {
    const response = await axios.post(
      `${config.apiUrl}/api/auth/mcp-exchange`,
      { token: pat },
      { timeout: 10_000, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 401) {
      throw new AuthError('Invalid or revoked MCP token. Regenerate in Spajzka → Profile → MCP access.');
    }
    if (err instanceof AxiosError && err.response?.status === 429) {
      throw new AuthError('Too many authentication attempts. Try again shortly.');
    }
    logger.error({ err }, 'MCP exchange request failed');
    throw new AuthError('Failed to contact Spajzka API for token exchange.');
  }
}

export async function getJwtForPat(pat: string, { forceRefresh = false } = {}): Promise<CachedToken> {
  const key = keyFor(pat);
  const now = Date.now();

  if (!forceRefresh) {
    const cached = cache.get(key);
    if (cached && cached.expiresAtMs - config.jwtCacheSkewSeconds * 1000 > now) {
      return cached;
    }
  }

  const exchanged = await performExchange(pat);
  const expiresAtMs = new Date(exchanged.expiresAt).getTime();
  const entry: CachedToken = {
    jwt: exchanged.jwt,
    userId: exchanged.userId,
    expiresAtMs
  };
  cache.set(key, entry);
  return entry;
}

export function evictPat(pat: string): void {
  cache.delete(keyFor(pat));
}

export function extractBearer(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const token = parts[1];
  if (!token.startsWith('spk_mcp_')) return null;
  return token;
}
