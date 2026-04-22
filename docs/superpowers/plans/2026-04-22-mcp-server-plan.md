# Spajzka MCP Server — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-04-22-mcp-server-design.md`
**Date:** 2026-04-22

## How to use this plan

Work through steps in order. Each step ends with a **verification** bullet — run it before moving on. Each step is sized to be one focused commit. Steps 1–3 must be sequential; steps 4–9 are independent and can be parallelized across worktrees/agents if desired. Step 10 is the final integration.

---

## Step 1 — Extract generated API client to `shared/`

**Goal:** one typed client consumed by both `web/` and (soon) `mcp/`.

**Changes:**
- Create `shared/api-client/` at repo root (new workspace entry).
- Update `api/generate-spec.js` / `api/package.json` `generate-client` script to output there.
- Update `web/src/services/api.ts` and every import of `@/api-client/*` in `web/src/` to point at the shared package (path alias or workspace dependency — whichever causes fewer tsconfig headaches).
- Add `shared` to root `package.json` `workspaces`.
- Regenerate the client (`npm run generate-api-client`) and commit the output.

**Verification:** `npm run build:web` passes, web dev server starts, a page that uses the API (e.g. pantry) still loads.

---

## Step 2 — Add personal access token fields + REST endpoints

**Goal:** users can generate/revoke a PAT; internal exchange endpoint works.

**Changes:**
- `db/migrate.js`: add `mcpTokenHash`, `mcpTokenCreatedAt`, `mcpTokenLastUsedAt` (all `null`) to every user document.
- `api/src/routes/auth.ts`: add `POST /auth/mcp-token`, `DELETE /auth/mcp-token`, `GET /auth/mcp-token`, `POST /auth/mcp-exchange` with full `@openapi` annotations. Use bcrypt at same cost as existing password hashing. Token format: `spk_mcp_` + `crypto.randomBytes(32).toString('base64url')`. Reject PAT generation for anonymous users (403 with clear message).
- Add rate limit to `/auth/mcp-exchange` — simple in-memory token bucket keyed by IP, 10/minute.
- Unit tests for each endpoint in `api/`.
- Regenerate OpenAPI client (re-runs step 1's script).

**Verification:** Integration test — register a user, `POST /auth/mcp-token` returns a token, `POST /auth/mcp-exchange` with it returns a JWT, `DELETE /auth/mcp-token` then exchange returns 401.

---

## Step 3 — Web UI: MCP access card on profile page

**Goal:** users can manage their PAT from the web app.

**Changes:**
- New Pinia store `web/src/stores/mcpTokenStore.ts` wrapping the three user-facing endpoints.
- New component `web/src/components/profile/McpAccessCard.vue` with three states (not-generated / just-generated / exists).
- Integrate into `web/src/pages/ProfilePage.vue`.
- Show connection URL from `VITE_MCP_PUBLIC_URL` env var (add to `web/.env.example`).
- Disable for anonymous users with explanatory text.

**Verification:** Manual smoke — log in, generate token, token shown once, refresh page, state shows "exists" with `createdAt`. Regenerate replaces it. Revoke clears it. Anonymous user sees disabled state.

---

## Step 4 — Bootstrap `mcp/` workspace

**Goal:** new workspace builds and runs an empty MCP server over Streamable HTTP.

**Changes:**
- Create `mcp/package.json` with deps: `@modelcontextprotocol/sdk`, `express`, `zod`, `bcrypt`, `pino` (or whatever the API uses for logging), `node-fetch` or built-in fetch, `dotenv`.
- Add `mcp` to root `package.json` `workspaces` and add `dev:mcp`, `build:mcp` scripts.
- `mcp/tsconfig.json` — extend whatever `api/tsconfig.json` does; path alias to `shared/api-client`.
- `mcp/src/server.ts` — MCP server instance, Streamable HTTP transport on `POST /mcp`, stub health endpoint `GET /healthz`. Reads env vars per spec §3.5.
- `mcp/src/logging.ts` — pino logger matching API format, `traceId` per request.
- `mcp/Dockerfile` (prod) and `mcp/Dockerfile.dev` (with volume mount + ts-node-dev) mirroring `api/`.

**Verification:** `npm run dev:mcp` starts, `curl http://localhost:3001/healthz` returns 200, MCP Inspector (`npx @modelcontextprotocol/inspector`) can connect to `http://localhost:3001/mcp` and sees zero tools.

---

## Step 5 — Implement auth layer in `mcp/`

**Goal:** `Authorization: Bearer spk_mcp_…` header → cached JWT → attached to outbound REST calls.

**Changes:**
- `mcp/src/auth.ts`: `getJwtForPat(pat): Promise<{ jwt, userId }>` that checks in-memory cache (keyed by PAT hash to avoid keeping raw PATs in memory longer than a request), calls `POST ${API_URL}/auth/mcp-exchange` on miss, caches with TTL = `expiresAt - 60s`.
- `mcp/src/apiClient.ts`: thin wrapper around the shared client that injects the JWT + `X-Trace-Id` into every request.
- MCP server middleware: extract bearer, reject missing/malformed with `AuthError` before dispatching to any tool.
- Unit tests with mocked fetch: cache hit, cache miss, 401 → re-exchange, 401 twice → throws.

**Verification:** Integration test — start real API + MCP containers, call a placeholder `whoami` tool (added here as the first tool) with a valid PAT, get back userId. Invalid PAT → auth error.

---

## Step 6 — Implement discovery + pantry + shopping tools

**Goal:** 11 tools covering §6.1–§6.3 of the spec.

**Changes:**
- `mcp/src/tools/discovery.ts` — `list_groups`, `whoami`.
- `mcp/src/tools/pantry.ts` — 4 tools.
- `mcp/src/tools/shopping.ts` — 5 tools (including `move_completed_to_pantry` aggregate).
- Each tool: Zod input schema → validate → call shared API client → map errors per spec §7.1 → return typed output.
- Register in `mcp/src/tools/index.ts`.
- Unit tests per tool with mocked API client.
- Integration tests for representative flows (`list_groups` → `add_pantry_item` → `list_pantry`; shopping-to-pantry roundtrip).

**Verification:** MCP Inspector shows 11 tools. Integration suite passes. Manually via Inspector: add a pantry item to a test group and see it in `list_pantry`.

---

## Step 7 — Implement items + recipes tools

**Goal:** 13 tools covering §6.4–§6.5.

**Changes:**
- `mcp/src/tools/items.ts` — 6 tools (search + list global/group + group CRUD).
- `mcp/src/tools/recipes.ts` — 7 tools (list merged/global/group + group CRUD + `add_recipe_ingredients_to_shopping`).
- Unit + integration tests including the recipe-to-shopping aggregate with `missingOnly: true`.

**Verification:** MCP Inspector: create a group recipe, call `add_recipe_ingredients_to_shopping`, verify shopping list.

---

## Step 8 — Implement tags + groups tools

**Goal:** 8 tools covering §6.6–§6.7.

**Changes:**
- `mcp/src/tools/tags.ts` — 4 tools.
- `mcp/src/tools/groups.ts` — 4 tools (get, list_members, join, leave).
- Unit + integration tests including RBAC-denied path (member attempting a moderator-gated action).

**Verification:** MCP Inspector: join a group by invite code, list members, leave. Total tool count is 32.

---

## Step 9 — Rate limiting + structured logging polish

**Goal:** per-PAT rate limit and production-grade logging.

**Changes:**
- `mcp/src/rateLimit.ts` — in-memory token bucket per PAT hash, configurable via `MCP_RATE_LIMIT_PER_MINUTE`.
- Wire into the MCP middleware chain (after auth, before dispatch).
- Log every tool call: `{ts, level, traceId, userId, tool, groupId?, durationMs, ok}`.
- `RateLimitError` mapped to the appropriate MCP error.
- Tests: exceed the bucket → error; under the bucket → succeeds.

**Verification:** Stress a single PAT past the limit with a script; see rate-limit errors and log lines.

---

## Step 10 — Docker compose integration + smoke script + CI

**Goal:** one-command dev/prod deploy; end-to-end confidence.

**Changes:**
- `docker-compose.dev.yml` and `docker-compose.yml`: add `mcp` service on port 3001, depends_on `api`, shares network, reads env from `.env` / compose env.
- `mcp/scripts/smoke.ts` — connects with `MCP_SMOKE_PAT` env, calls every tool once against a seeded dev DB. `npm run smoke:mcp` at root.
- Root `package.json`: add `mcp` to `build`, add `test:mcp`, add `dev:mcp` to the concurrent `dev` script (rename colors block).
- Update root `CLAUDE.md` with a short "MCP server" section (port, how to get a PAT, how to connect Claude Desktop).
- CI workflow: add `mcp` build + test jobs matching existing API workflow.

**Verification:** `npm run docker:dev:build` brings up api + web + mongo + mcp. Smoke script passes. MCP Inspector connected to the running container exercises every tool. CI green on a throwaway PR.

---

## Risks & watchpoints

- **Shared client extraction (Step 1)** is the biggest risk for breaking the web app — the mechanical import rewrite needs to cover every file. Do it in one commit with a full `npm run build:web` check.
- **Bcrypt on every request** is expensive. The in-memory JWT cache (Step 5) means bcrypt runs only on cache miss; confirm cache hit rate in logs during step 6.
- **`X-Trace-Id` pass-through** requires the API to *accept* the header. If it currently ignores it, Step 2 or Step 5 should also add forwarding on the API side so traces are end-to-end.
- **Prompt injection**: admin surfaces excluded by design. Resist requests to add them under the same MCP server — require OAuth first.
