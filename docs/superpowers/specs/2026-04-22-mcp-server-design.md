# Spajzka MCP Server — Design

**Status:** Approved (brainstorming phase)
**Date:** 2026-04-22
**Author:** Daniel Vazač (via Claude Opus 4.7 brainstorming session)

## 1. Problem & goal

Spajzka is a full-stack pantry management PWA. Users manage pantry contents, shopping lists, recipes, and tags, scoped to groups (households) they belong to.

The goal is to expose the Spajzka REST API as a **remote MCP server** so any Spajzka user can connect their own AI assistant (Claude Desktop, Claude Code, Claude.ai, or any MCP-compatible client) to their Spajzka account and manage pantry/shopping/recipes from chat.

The MCP server runs as a Docker service alongside the existing `api` and `web` services. It is reachable over HTTP. Users authenticate their MCP client with a **personal access token (PAT)** they generate from the Spajzka web UI.

## 2. Non-goals (v1)

Explicitly excluded to keep scope tight:

- No OAuth 2.1 / browser-based authorization flow. PAT only.
- No multiple tokens per user, no scopes, no expiry dates. One active PAT per user.
- No admin surface: no `roles` route, no group kick/role-change/invite management, no global-item or global-recipe mutations.
- No streaming / partial tool results.
- No MCP `prompts`, `resources`, or `sampling` capabilities — tools only.
- No anonymous-user MCP access (anonymous users can't generate a PAT).

## 3. Architecture

### 3.1 Deployment topology

```
Claude client ──HTTP/MCP──▶ mcp (container, :3001) ──HTTP/REST──▶ api (container, :3000) ──▶ mongo
                                                     (internal network)
```

A new workspace `mcp/` is added to the monorepo alongside `api/` and `web/`:

```
spajzka/
├── api/        existing
├── web/        existing
├── db/         existing
├── mcp/        NEW — MCP server
│   ├── src/
│   │   ├── server.ts           entrypoint, Streamable HTTP transport
│   │   ├── auth.ts             PAT → JWT exchange, caching, 401 retry
│   │   ├── tools/
│   │   │   ├── index.ts        registers all tools
│   │   │   ├── discovery.ts    list_groups, whoami
│   │   │   ├── pantry.ts       4 tools
│   │   │   ├── shopping.ts     5 tools
│   │   │   ├── items.ts        6 tools
│   │   │   ├── recipes.ts      7 tools
│   │   │   ├── tags.ts         4 tools
│   │   │   └── groups.ts       4 tools
│   │   └── logging.ts          structured logs + traceId
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── tsconfig.json
└── shared/     NEW — extracted generated API client (see §3.4)
    └── api-client/
```

### 3.2 Transport

**Streamable HTTP** (current MCP spec for remote servers; supersedes SSE). Implementation uses the official `@modelcontextprotocol/sdk` TypeScript package. Single endpoint: `POST /mcp`. The MCP container listens on port **3001** (configurable via `PORT`).

Stdio transport is not supported — it would require the client to spawn the process locally, incompatible with Docker deployment.

### 3.3 Auth flow

1. User generates a PAT in Spajzka → Profile → MCP access (web UI). The raw token is shown **once**; the server stores only a bcrypt hash on the user document.
2. User pastes the PAT into their MCP client as a bearer token and sets the server URL to e.g. `https://spajzka.example.com/mcp`.
3. On each MCP session, the MCP server reads `Authorization: Bearer spk_mcp_…` from the first request, calls `POST /api/auth/mcp-exchange { token }` on the REST API, and receives a short-lived JWT (1 hour) bound to the user.
4. The JWT is cached in memory keyed by PAT (TTL = JWT expiry minus 60s skew).
5. Every tool call maps to one or more REST calls authorized with that JWT.
6. On `401` from the REST layer, the MCP server evicts the cache entry, re-exchanges once, and retries. A second `401` is surfaced to the client as a terminal auth error.

The existing REST auth middleware, RBAC (`requirePermission`, `requireGlobalPermission`), and group-membership checks apply unchanged. **No authorization logic is duplicated in the MCP layer.**

### 3.4 Shared API client

Today, `web/src/api-client/` is generated from `api/openapi.json` via `openapi-typescript-codegen` and committed. The MCP server needs the same typed client, so:

- Move the generator output target to `shared/api-client/` (new directory at repo root).
- Both `web/` and `mcp/` import from there as a path alias / workspace package.
- The `generate-api-client` script is updated to write to the shared location.
- Web imports are updated in the same commit (small mechanical change).

This prevents code drift: adding an API endpoint → regenerating the client → both consumers get the new typed surface.

### 3.5 Environment variables (mcp container)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP listen port | `3001` |
| `API_URL` | Internal REST API base URL | `http://api:3000` |
| `MCP_PUBLIC_URL` | Public URL (reserved for future OAuth, logging) | none |
| `JWT_SECRET` | Shared with `api` — verifies PAT-exchanged JWTs | (required) |
| `MCP_RATE_LIMIT_PER_MINUTE` | Per-PAT request ceiling | `60` |
| `LOG_LEVEL` | `debug`/`info`/`warn`/`error` | `info` |

## 4. Authentication — personal access tokens

### 4.1 Storage

New fields added to the existing `users` collection (no new collection):

| Field | Type | Notes |
|---|---|---|
| `mcpTokenHash` | string \| null | bcrypt hash of the raw token |
| `mcpTokenCreatedAt` | Date \| null | when the active token was generated |
| `mcpTokenLastUsedAt` | Date \| null | updated on each successful exchange (best-effort, not transactional) |

A migration in `db/migrate.js` ensures existing users have these fields as `null`.

### 4.2 Token format

`spk_mcp_` + 32 random bytes, base64url-encoded. Example:

```
spk_mcp_8fJp2Nq3xR7vT5wK1mL0aB9cD4eH6iY2zU8oP3sV0wQ
```

The prefix is grep-able in logs and makes pasting the token into the wrong field obvious. The hash is bcrypt (same cost as the existing password hashing).

### 4.3 New REST endpoints

**User-facing** (mounted under existing `api/src/routes/auth.ts`, behind existing JWT middleware):

| Method | Path | Returns | Notes |
|---|---|---|---|
| `POST` | `/api/auth/mcp-token` | `{ token, createdAt }` | Plaintext returned **once**. Replaces existing token if any. |
| `DELETE` | `/api/auth/mcp-token` | `{ ok: true }` | Clears hash. Takes effect immediately. |
| `GET` | `/api/auth/mcp-token` | `{ exists, createdAt?, lastUsedAt? }` | Never returns the token itself. |

**Internal (no JWT middleware — the PAT is the credential):**

| Method | Path | Returns | Notes |
|---|---|---|---|
| `POST` | `/api/auth/mcp-exchange` | `{ jwt, userId, expiresAt }` | Body: `{ token }`. Looks up users, bcrypt-compares, returns 1-hour JWT on match. Updates `mcpTokenLastUsedAt`. Returns `401` on no match. |

Rate-limit `/api/auth/mcp-exchange` (e.g. 10/minute/IP) to make PAT brute-forcing impractical.

### 4.4 Web UI

Profile page gains an "MCP access" card with three states:

- **Not generated:** Explanation text + `[Generate token]` button.
- **Just generated:** Plaintext token in a copy-on-click field + warning "Save this now — it won't be shown again." + `[I've saved it]` button to transition to the third state.
- **Exists:** `createdAt`, `lastUsedAt` ("3 hours ago" / "never used") + `[Regenerate]` + `[Revoke]` buttons. Connection URL (`${MCP_PUBLIC_URL}/mcp`) with copy button.

Anonymous users: card is disabled with "Log in or create an account to enable MCP access."

## 5. Group context

User chose **explicit `groupId` on every group-scoped tool** (over implicit default, session-scoped, or hybrid). Rationale: unambiguous, no hidden state on the MCP server, forces the LLM to call `list_groups` at conversation start which is a small cost for a lot of clarity.

No changes to the `users` collection for this.

## 6. Tool catalog (32 tools)

Count: 2 discovery + 4 pantry + 5 shopping + 6 items + 7 recipes + 4 tags + 4 groups.

All inputs are validated with Zod before any HTTP call. All outputs are JSON-serializable; dates are ISO-8601 strings. Tool descriptions in the MCP manifest are pulled from the matching OpenAPI `summary`/`description`.

### 6.1 Discovery (2)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `list_groups` | `{}` | `Group[]` with `_id`, `name`, `isPersonal`, user's role | `GET /api/groups/my` |
| `whoami` | `{}` | `{ userId, email, displayName, isAnonymous }` | `GET /api/auth/me` |

### 6.2 Pantry (4)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `list_pantry` | `{ groupId }` | `PantryItem[]` | `GET /api/pantry?groupId=…` |
| `add_pantry_item` | `{ groupId, itemId, itemType, quantity, unit? }` | `PantryItem` | `POST /api/pantry` |
| `update_pantry_item` | `{ groupId, pantryItemId, quantity?, unit? }` | `PantryItem` | `PUT /api/pantry/:id` |
| `remove_pantry_item` | `{ groupId, pantryItemId }` | `{ ok: true }` | `DELETE /api/pantry/:id` |

### 6.3 Shopping list (5)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `list_shopping` | `{ groupId, includeCompleted? }` | `ShoppingItem[]` | `GET /api/shopping?groupId=…` |
| `add_shopping_item` | `{ groupId, itemId, itemType, quantity, unit? }` | `ShoppingItem` | `POST /api/shopping` |
| `update_shopping_item` | `{ groupId, shoppingItemId, quantity?, unit?, completed? }` | `ShoppingItem` | `PUT /api/shopping/:id` |
| `remove_shopping_item` | `{ groupId, shoppingItemId }` | `{ ok: true }` | `DELETE /api/shopping/:id` |
| `move_completed_to_pantry` | `{ groupId }` | `{ moved: number }` | Aggregate: iterate completed shopping items, `POST /api/pantry`, `DELETE /api/shopping/:id` |

### 6.4 Items catalog (7)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `search_items` | `{ query, groupId?, limit? }` | `Item[]` | `GET /api/items?search=…` (global + optional group scope) |
| `list_global_items` | `{ category?, limit?, offset? }` | `Item[]` | `GET /api/items/global` |
| `list_group_items` | `{ groupId }` | `Item[]` | `GET /api/items/group?groupId=…` |
| `create_group_item` | `{ groupId, name, category?, icon?, defaultUnit?, barcode?, searchNames? }` | `Item` | `POST /api/items/group` |
| `update_group_item` | `{ groupId, itemId, ...fields }` | `Item` | `PUT /api/items/group/:id` |
| `delete_group_item` | `{ groupId, itemId }` | `{ ok: true }` | `DELETE /api/items/group/:id` |

Global-item CRUD is intentionally excluded (admin-only).

### 6.5 Recipes (7)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `list_recipes` | `{ groupId }` | `Recipe[]` (merged global + group) | `GET /api/recipes?groupId=…` |
| `list_global_recipes` | `{ limit?, offset? }` | `Recipe[]` | `GET /api/recipes/global` |
| `list_group_recipes` | `{ groupId }` | `Recipe[]` | `GET /api/recipes/group?groupId=…` |
| `create_group_recipe` | `{ groupId, name, description?, icon?, ingredients[], instructions? }` | `Recipe` | `POST /api/recipes/group` |
| `update_group_recipe` | `{ groupId, recipeId, ...fields }` | `Recipe` | `PUT /api/recipes/group/:id` |
| `delete_group_recipe` | `{ groupId, recipeId }` | `{ ok: true }` | `DELETE /api/recipes/group/:id` |
| `add_recipe_ingredients_to_shopping` | `{ groupId, recipeId, missingOnly? }` | `{ added: ShoppingItem[] }` | Aggregate: fetch recipe, (if `missingOnly`) fetch pantry, `POST /api/shopping` for each missing ingredient |

### 6.6 Tags (4)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `list_tags` | `{ groupId }` | `Tag[]` | `GET /api/tags?groupId=…` |
| `create_tag` | `{ groupId, name, color?, icon? }` | `Tag` | `POST /api/tags` |
| `update_tag` | `{ groupId, tagId, name?, color?, icon? }` | `Tag` | `PUT /api/tags/:id` |
| `delete_tag` | `{ groupId, tagId }` | `{ ok: true }` | `DELETE /api/tags/:id` |

### 6.7 Groups (4, read + join/leave only)

| Tool | Input | Output | Maps to |
|---|---|---|---|
| `get_group` | `{ groupId }` | `Group` (with members & roles) | `GET /api/groups/:id` |
| `list_group_members` | `{ groupId }` | `Member[]` | `GET /api/groups/:id/members` |
| `join_group` | `{ inviteCode }` | `Group` | `POST /api/groups/join` |
| `leave_group` | `{ groupId }` | `{ ok: true }` | `POST /api/groups/:id/leave` |

Member kick, role change, invite regenerate/toggle are excluded (admin actions belong in the web UI).

## 7. Errors, observability, rate limiting

### 7.1 Error mapping

| REST response | MCP error | Notes |
|---|---|---|
| `400 Bad Request` | `InvalidParamsError` | Validation message forwarded so LLM can self-correct. |
| `401` from exchange | `AuthError` | "Invalid or revoked PAT. Regenerate in Spajzka → Profile → MCP access." |
| `401` mid-session | Transparent re-exchange + retry once; second `401` → `AuthError`. |
| `403 Forbidden` | `ForbiddenError` | Includes required permission name. |
| `404` on reads | Tool result `{ found: false }` | Allows the LLM to handle "not there" without an error. |
| `404` on writes | `NotFoundError` | Write target must exist. |
| `5xx` | Retry once with 250ms backoff; then `UpstreamError`. |

Input validation (Zod) runs before any HTTP call — malformed inputs never reach the REST API.

### 7.2 Logging

Structured JSON logs matching the API's format:

```json
{"ts":"...","level":"info","traceId":"...","userId":"...","tool":"add_pantry_item","groupId":"...","durationMs":42,"ok":true}
```

A `traceId` is generated per MCP request and forwarded to the REST API as `X-Trace-Id` for end-to-end tracing.

### 7.3 Rate limiting

Per-PAT token bucket (in-memory, resets on restart). Default 60 requests/minute, configurable via `MCP_RATE_LIMIT_PER_MINUTE`. Returns `RateLimitError` when exceeded. This is a soft guard against a misbehaving LLM, not a DDoS defense — that belongs at the reverse-proxy layer.

## 8. Testing

**Layered strategy:**

1. **Unit tests** (Vitest) — each tool handler is `(input, ctx) => output` with a mocked API client; Zod schemas tested against valid + invalid inputs.
2. **Integration tests** — Vitest suite against a real REST API backed by seeded Mongo (same `docker:dev` stack as existing tests). Issues MCP JSON-RPC over HTTP and asserts real behavior for representative flows:
   - `list_groups` → `add_pantry_item` → `list_pantry`
   - `add_shopping_item` → `update_shopping_item(completed: true)` → `move_completed_to_pantry`
   - `create_group_recipe` → `add_recipe_ingredients_to_shopping`
   - RBAC-denied write (member attempting a moderator-only action)
   - Invalid PAT → `AuthError`
   - Revoked PAT mid-session → `AuthError`
3. **Smoke script** (`mcp/scripts/smoke.ts`) — connects with a test PAT and exercises every tool once. Used locally before pushing.

**Not in scope:** end-to-end tests against a real LLM (flaky, expensive).

## 9. CI

- Add `mcp` to `npm run build` (root).
- Add `mcp:test` script running unit + integration tests.
- Add the `mcp` service to both `docker-compose.yml` and `docker-compose.dev.yml`.
- `generate-api-client` script updated to output to `shared/api-client/`.

## 10. Security notes

- PATs are bcrypt-hashed at rest.
- PATs are returned to the user exactly once (generation response).
- PAT exchange endpoint is rate-limited per IP to deter brute force.
- The PAT prefix (`spk_mcp_`) makes accidental leakage in logs detectable.
- The MCP server forwards user-scoped JWTs to the REST API, so all existing RBAC and group-membership checks apply.
- Prompt-injection: the MCP surface intentionally excludes admin actions (roles, global catalog, group management, invite/kick). A compromised LLM can only modify the user's own group-scoped data — the same data they can modify in the web UI.
- The MCP server does not persist any user data; tokens in its in-memory cache are keyed by PAT and evicted at JWT expiry.

## 11. Open questions for implementation

None blocking. The following will be resolved during implementation:

- Exact path layout of the shared API client import (path alias vs. workspace package — decide based on whichever causes fewer TypeScript path issues in the monorepo).
- Precise Zod schema shapes for optional update fields — align with what `PUT` endpoints actually accept today.
- Bcrypt cost factor — match the existing password-hashing cost (read from `api/src/routes/auth.ts`).
