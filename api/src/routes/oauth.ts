import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { createRateLimiter } from '../utils/rateLimit';

const router = Router();

const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://spajzka.vazac.dev').replace(/\/$/, '');

// Per-IP rate limit for the token and register endpoints (brute-force guard).
const tokenLimiter = createRateLimiter(20);
const registerLimiter = createRateLimiter(10);

const OAUTH_ACCESS_TOKEN_TTL = 60 * 60;       // 1 hour
const OAUTH_REFRESH_TOKEN_TTL = 30 * 24 * 3600; // 30 days
const AUTH_CODE_TTL_MS = 10 * 60 * 1000;        // 10 minutes

// In-memory store for short-lived authorization codes (lost on restart, which
// is fine — the client just needs to re-initiate the flow).
interface PendingCode {
  clientId: string;
  userId: string;
  email: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  expiresAt: number;
}
const authCodes = new Map<string, PendingCode>();

// Prune expired codes every 5 minutes.
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of authCodes) {
    if (entry.expiresAt <= now) authCodes.delete(code);
  }
}, 5 * 60 * 1000);

function issueAccessToken(userId: string, email: string, clientId: string, scope: string): string {
  return jwt.sign(
    { userId, email, scope, client_id: clientId },
    JWT_SECRET,
    { expiresIn: `${OAUTH_ACCESS_TOKEN_TTL}s` } as jwt.SignOptions
  );
}

async function issueRefreshToken(userId: string, email: string, clientId: string, scope: string): Promise<string> {
  const token = 'spk_rt_' + crypto.randomBytes(32).toString('base64url');
  const db = getDatabase();
  await db.collection('oauth_tokens').insertOne({
    token,
    userId,
    email,
    clientId,
    scope,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + OAUTH_REFRESH_TOKEN_TTL * 1000),
    revokedAt: null
  });
  return token;
}

function verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean {
  if (method !== 'S256') return false;
  const digest = crypto.createHash('sha256').update(codeVerifier).digest();
  return Buffer.from(digest).toString('base64url') === codeChallenge;
}

// ─── Authorization Server Metadata (RFC 8414) ─────────────────────────────────
// Served at /api/.well-known/oauth-authorization-server because the issuer is
// configured as PUBLIC_URL/api, and RFC 8414 path-insertion discovery looks
// for {origin}/.well-known/oauth-authorization-server{path}.

/**
 * @openapi
 * /api/.well-known/oauth-authorization-server:
 *   get:
 *     summary: OAuth 2.0 Authorization Server Metadata (RFC 8414)
 *     tags:
 *       - OAuth
 *     responses:
 *       200:
 *         description: Authorization server metadata document
 */
router.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
  res.json({
    issuer: `${PUBLIC_URL}/api`,
    authorization_endpoint: `${PUBLIC_URL}/oauth/authorize`,
    token_endpoint: `${PUBLIC_URL}/api/oauth/token`,
    registration_endpoint: `${PUBLIC_URL}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp:tools'],
    revocation_endpoint: `${PUBLIC_URL}/api/oauth/revoke`
  });
});

// ─── Dynamic Client Registration (RFC 7591) ───────────────────────────────────

/**
 * @openapi
 * /api/oauth/register:
 *   post:
 *     summary: Register an OAuth client (RFC 7591 dynamic client registration)
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - redirect_uris
 *             properties:
 *               client_name:
 *                 type: string
 *               redirect_uris:
 *                 type: array
 *                 items:
 *                   type: string
 *               grant_types:
 *                 type: array
 *                 items:
 *                   type: string
 *               scope:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registered client credentials
 *       400:
 *         description: Invalid registration request
 */
router.post('/oauth/register', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!registerLimiter.consume(ip)) {
    return res.status(429).json({ error: 'rate_limited', error_description: 'Too many registration attempts' });
  }

  const { client_name, redirect_uris, grant_types, scope } = req.body ?? {};

  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return res.status(400).json({ error: 'invalid_client_metadata', error_description: 'redirect_uris is required' });
  }

  for (const uri of redirect_uris) {
    if (typeof uri !== 'string') {
      return res.status(400).json({ error: 'invalid_client_metadata', error_description: 'redirect_uris must be strings' });
    }
  }

  const clientId = crypto.randomUUID();
  const db = getDatabase();
  await db.collection('oauth_clients').insertOne({
    clientId,
    clientName: typeof client_name === 'string' ? client_name : 'Unknown Client',
    redirectUris: redirect_uris,
    grantTypes: Array.isArray(grant_types) ? grant_types : ['authorization_code', 'refresh_token'],
    scope: typeof scope === 'string' ? scope : 'mcp:tools',
    createdAt: new Date()
  });

  res.status(201).json({
    client_id: clientId,
    client_name: client_name ?? 'Unknown Client',
    redirect_uris,
    grant_types: grant_types ?? ['authorization_code', 'refresh_token'],
    scope: scope ?? 'mcp:tools',
    token_endpoint_auth_method: 'none'
  });
});

// ─── Authorization Confirm ────────────────────────────────────────────────────
// Called by the Vue consent page after the user clicks "Allow". Generates an
// authorization code and returns the redirect URL for the client.

/**
 * @openapi
 * /api/oauth/authorize/confirm:
 *   post:
 *     summary: Confirm OAuth authorization (called by the consent UI after user approves)
 *     tags:
 *       - OAuth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - redirectUri
 *               - codeChallenge
 *               - codeChallengeMethod
 *             properties:
 *               clientId:
 *                 type: string
 *               redirectUri:
 *                 type: string
 *               codeChallenge:
 *                 type: string
 *               codeChallengeMethod:
 *                 type: string
 *               state:
 *                 type: string
 *               scope:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns the redirect URL containing the authorization code
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Client not registered or redirect_uri mismatch
 */
router.post('/oauth/authorize/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { clientId, redirectUri, codeChallenge, codeChallengeMethod, state, scope } = req.body ?? {};

  if (!clientId || !redirectUri || !codeChallenge || !codeChallengeMethod) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing required parameters' });
  }

  const db = getDatabase();
  const client = await db.collection('oauth_clients').findOne({ clientId });
  if (!client) {
    return res.status(403).json({ error: 'unauthorized_client', error_description: 'Client not registered' });
  }

  if (!client.redirectUris.includes(redirectUri)) {
    return res.status(403).json({ error: 'invalid_request', error_description: 'redirect_uri not registered for this client' });
  }

  if (codeChallengeMethod !== 'S256') {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Only S256 code_challenge_method is supported' });
  }

  // Look up user email (req.userId is set by authMiddleware).
  const { ObjectId } = await import('mongodb');
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(req.userId!) },
    { projection: { email: 1 } }
  );
  if (!user) {
    return res.status(401).json({ error: 'invalid_request', error_description: 'User not found' });
  }

  const code = crypto.randomBytes(32).toString('base64url');
  authCodes.set(code, {
    clientId,
    userId: req.userId!,
    email: user.email,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    scope: typeof scope === 'string' ? scope : 'mcp:tools',
    expiresAt: Date.now() + AUTH_CODE_TTL_MS
  });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  res.json({ redirectUrl: redirectUrl.toString() });
});

// ─── Client info (used by the consent UI) ────────────────────────────────────

/**
 * @openapi
 * /api/oauth/client:
 *   get:
 *     summary: Get registered OAuth client metadata (for the consent page)
 *     tags:
 *       - OAuth
 *     parameters:
 *       - in: query
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client metadata
 *       404:
 *         description: Client not found
 */
router.get('/oauth/client', async (req: Request, res: Response) => {
  const { client_id } = req.query;
  if (!client_id || typeof client_id !== 'string') {
    return res.status(400).json({ error: 'invalid_request', error_description: 'client_id is required' });
  }

  const db = getDatabase();
  const client = await db.collection('oauth_clients').findOne({ clientId: client_id });
  if (!client) {
    return res.status(404).json({ error: 'invalid_client', error_description: 'Client not found' });
  }

  res.json({ clientId: client.clientId, clientName: client.clientName, scope: client.scope });
});

// ─── Token Endpoint ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/oauth/token:
 *   post:
 *     summary: OAuth 2.0 Token Endpoint — exchange authorization code or refresh token
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - grant_type
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [authorization_code, refresh_token]
 *               code:
 *                 type: string
 *               redirect_uri:
 *                 type: string
 *               code_verifier:
 *                 type: string
 *               client_id:
 *                 type: string
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token response
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid credentials
 */
router.post('/oauth/token', express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!tokenLimiter.consume(ip)) {
    return res.status(429).json({ error: 'rate_limited', error_description: 'Too many token requests' });
  }

  // Accept both JSON and form-encoded bodies (spec requires form-encoded).
  const body: Record<string, string> = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const { grant_type, code, redirect_uri, code_verifier, client_id, refresh_token } = body;

  res.set('Cache-Control', 'no-store');

  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri || !code_verifier || !client_id) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing required parameters' });
    }

    const pending = authCodes.get(code);
    if (!pending || pending.expiresAt <= Date.now()) {
      authCodes.delete(code);
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired or invalid' });
    }

    if (pending.clientId !== client_id) {
      return res.status(401).json({ error: 'invalid_client', error_description: 'client_id mismatch' });
    }

    if (pending.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
    }

    if (!verifyPkce(code_verifier, pending.codeChallenge, pending.codeChallengeMethod)) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
    }

    authCodes.delete(code);

    const accessToken = issueAccessToken(pending.userId, pending.email, client_id, pending.scope);
    const refreshToken = await issueRefreshToken(pending.userId, pending.email, client_id, pending.scope);

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: OAUTH_ACCESS_TOKEN_TTL,
      refresh_token: refreshToken,
      scope: pending.scope
    });
  }

  if (grant_type === 'refresh_token') {
    if (!refresh_token || !client_id) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing required parameters' });
    }

    const db = getDatabase();
    const stored = await db.collection('oauth_tokens').findOne({
      token: refresh_token,
      clientId: client_id,
      revokedAt: null
    });

    if (!stored) {
      return res.status(401).json({ error: 'invalid_grant', error_description: 'Refresh token invalid or revoked' });
    }

    if (stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'invalid_grant', error_description: 'Refresh token expired' });
    }

    const accessToken = issueAccessToken(stored.userId, stored.email, client_id, stored.scope);

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: OAUTH_ACCESS_TOKEN_TTL,
      scope: stored.scope
    });
  }

  res.status(400).json({ error: 'unsupported_grant_type', error_description: `Unsupported grant_type: ${grant_type}` });
});

// ─── Token Revocation (RFC 7009) ──────────────────────────────────────────────

/**
 * @openapi
 * /api/oauth/revoke:
 *   post:
 *     summary: Revoke an OAuth refresh token (RFC 7009)
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               client_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token revoked (or was already invalid — per spec, always 200)
 */
router.post('/oauth/revoke', express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
  const { token } = typeof req.body === 'object' && req.body !== null ? req.body : {} as Record<string, string>;
  if (token && typeof token === 'string') {
    const db = getDatabase();
    await db.collection('oauth_tokens').updateOne(
      { token },
      { $set: { revokedAt: new Date() } }
    );
  }
  // RFC 7009 §2.2: always respond 200 regardless of whether the token existed.
  res.json({ ok: true });
});

export default router;
