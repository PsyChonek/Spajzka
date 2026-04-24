import axios, { AxiosError } from 'axios';
import { createHash, createHmac } from 'crypto';
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

// ─── PAT exchange flow ────────────────────────────────────────────────────────

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

// ─── OAuth JWT flow ───────────────────────────────────────────────────────────

interface OAuthPayload {
  userId: string;
  email: string;
  scope?: string;
  exp?: number;
  iat?: number;
}

/**
 * Verifies an OAuth access token (JWT signed with JWT_SECRET by the Spajzka
 * API). Returns the payload on success, throws AuthError on failure.
 *
 * We verify the HS256 signature directly using Node's built-in crypto so we
 * don't need an external JWT library here.
 */
export function verifyOAuthJwt(token: string): OAuthPayload & { jwt: string } {
  if (!config.jwtSecret) {
    throw new AuthError('JWT_SECRET not configured — cannot verify OAuth tokens.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Malformed OAuth token.');

  const [headerB64, payloadB64, sigB64] = parts;

  // Reject tokens that aren't signed with HS256 to prevent algorithm confusion.
  try {
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header.alg !== 'HS256') throw new Error();
  } catch {
    throw new AuthError('OAuth token uses unsupported signing algorithm.');
  }

  // Verify HS256 signature
  const expectedSig = createHmac('sha256', config.jwtSecret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (expectedSig !== sigB64) {
    throw new AuthError('OAuth token signature invalid.');
  }

  let payload: OAuthPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    throw new AuthError('Malformed OAuth token payload.');
  }

  if (!payload.userId) throw new AuthError('OAuth token missing userId claim.');

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AuthError('OAuth token expired. Re-authenticate with Claude.ai.');
  }

  const scope = payload.scope ?? '';
  if (!scope.split(' ').includes('mcp:tools')) {
    throw new AuthError('OAuth token missing required scope: mcp:tools.');
  }

  return { ...payload, jwt: token };
}

// ─── Generic bearer extraction ────────────────────────────────────────────────

/** Extracts the raw bearer value and detects whether it is a PAT or an OAuth JWT. */
export function extractBearer(authHeader: string | undefined): { token: string; kind: 'pat' | 'oauth' } | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const token = parts[1];
  if (!token) return null;

  if (token.startsWith('spk_mcp_')) return { token, kind: 'pat' };

  // Looks like a JWT (three base64url segments)
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return { token, kind: 'oauth' };
  }

  return null;
}
