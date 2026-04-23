# Spajzka MCP Server — Agent Guide

This workspace is a **remote Model Context Protocol (MCP) server** that exposes Spajzka pantry/shopping/recipes/items/tags/groups/meal-plan to AI assistants (Claude Desktop, Claude Code, Claude.ai, or any MCP-compatible client).

Read this before touching `mcp/` — the architecture has invariants that are not obvious from the code alone.

## What this is

- Streamable HTTP MCP server built on `@modelcontextprotocol/sdk`.
- Holds no data. Every tool call forwards to the Spajzka REST API on `http://api:3000`.
- Auth is a **personal access token (PAT)** the user generates from the web app (Profile → MCP access). PAT is exchanged for a short-lived JWT on the first request of each session.
- Runs as a Docker service (`mcp`) on port **3001** in both `docker-compose.yml` and `docker-compose.dev.yml`.
- Public URL is `https://spajzka.vazac.dev/mcp` (TLS terminated by the host's nginx; it forwards to `http://mcp:3001/mcp` internally). Do **not** expose 3001 publicly over plain HTTP — always go through nginx.

## Client setup

URL: `https://spajzka.vazac.dev/mcp`
Auth: `Authorization: Bearer spk_mcp_…` (PAT shown once at generation time in the web UI)

Connect to verify:
```bash
curl https://spajzka.vazac.dev/mcp/healthz    # → {"ok":true,…}
```

## Layout

```
mcp/
├── src/
│   ├── server.ts          Streamable HTTP entrypoint, session + rate-limit glue
│   ├── auth.ts            PAT → JWT exchange + in-memory cache (keyed by SHA-256 of PAT)
│   ├── apiClient.ts       Axios wrapper that attaches JWT + X-Trace-Id; retries on 401
│   ├── context.ts         AsyncLocalStorage carrying per-request context into tool handlers
│   ├── errors.ts          Map REST errors to MCP tool errors
│   ├── rateLimit.ts       In-memory per-PAT token bucket
│   ├── logging.ts         pino logger + traceId factory
│   ├── config.ts          Env vars → typed config
│   └── tools/
│       ├── index.ts       Registers every tool with the McpServer instance
│       ├── helpers.ts     `registerTool(...)` wrapper: logs, error-maps, JSON-stringifies
│       ├── discovery.ts   list_groups, whoami        (2 tools)
│       ├── pantry.ts      list/add/update/remove     (4 tools)
│       ├── shopping.ts    list/add/update/remove + move_completed_to_pantry (5)
│       ├── items.ts       search + list + CRUD       (6 tools)
│       ├── recipes.ts     list + CRUD + add_ingredients_to_shopping (7 tools)
│       ├── tags.ts        list + CRUD                (4 tools)
│       └── groups.ts      get, list_members, join/leave (4 tools)
├── scripts/smoke.ts       End-to-end smoke test (needs a valid PAT)
├── Dockerfile             Prod build (repo-root context — needs shared/)
├── Dockerfile.dev         Dev build (nodemon, mcp-only context)
├── nodemon.json
├── tsconfig.json
└── package.json
```

Total tool count: **38**, across 7 domains plus discovery (meal-plan added).

## Invariants — do not break

1. **`groupId` is explicit on every group-scoped tool.** The MCP layer does not maintain a "current group" — the LLM passes `groupId` on every call after looking it up with `list_groups`. The REST API accepts `groupId` in request body/query via `api/src/utils/resolveGroup.ts` (see `resolveGroupId`). If you add a new group-scoped tool, it **must** accept `groupId` as a required Zod field. If you touch the API, the `resolveGroupId` helper must be called before reading `user.activeGroupId`.

2. **Admin / global surfaces are intentionally excluded.** No tools for: `/auth/register`, `/auth/login`, `/auth/anonymous`, `/auth/logout`, `/auth/change-password`, `/auth/profile`, `/auth/active-group`, `/roles/*`, group kick / role change / invite regenerate, global item CRUD, global recipe CRUD. Prompt-injection defense: the LLM can only modify the user's own group-scoped data. **Do not add admin tools here** — if you need them, require a separate auth flow (OAuth) and scope.

3. **Anonymous users cannot generate PATs.** Enforced at the API layer (`POST /api/auth/mcp-token` returns 403 for anonymous). Don't bypass this.

4. **The PAT never leaves memory longer than it has to.** The JWT cache is keyed by `SHA-256(pat)`, not the raw PAT. If you add logging, never log the PAT or any header value that contains it.

5. **Session auth is stashed on init.** After the MCP session handshake, subsequent requests on that session **don't re-read the `Authorization` header** — they reuse the PAT stashed in `sessionAuth`. Revoking the PAT via the web UI does not invalidate an already-open session's cached JWT until the JWT expires (~59 min). If you need immediate revocation, evict the session entries on revoke — currently out of scope.

6. **Tool handlers run inside `contextStorage.run(ctx, …)`.** Any async call a handler makes inherits the request's `pat/userId/jwt/traceId`. If you spin up a detached promise, it loses context. Use `currentContext()` inside handlers; never pass the whole ctx around manually.

## Environment

| Variable | Required? | Default | Notes |
|---|---|---|---|
| `PORT` | no | `3001` | |
| `API_URL` | no | `http://api:3000` | Set to the internal REST endpoint |
| `MCP_PUBLIC_URL` | no | — | Shown to users on the profile card, used for future OAuth |
| `JWT_SECRET` | **yes, in prod** | unset → empty | Must match the API's `JWT_SECRET` or exchanged JWTs won't verify |
| `MCP_RATE_LIMIT_PER_MINUTE` | no | `60` | Per-PAT |
| `LOG_LEVEL` | no | `info` | pino levels |

`.env.example` documents the full set.

## Error mapping (`mcp/src/errors.ts`)

| Source | MCP error |
|---|---|
| `ZodError` (invalid tool args) | `InvalidParamsError` |
| `AuthError` (bad/revoked PAT) | Plain auth error, final |
| `ForbiddenError` (RBAC deny) | Includes required permission in message |
| `NotFoundError` (on writes) | `NotFoundError` |
| `NotFoundError` (on reads, `nullOn404: true`) | Returns `{ found: false }` to the tool |
| `UpstreamError` (5xx, already retried once) | Surface as tool error |

Do not swallow errors into empty results — the LLM needs the signal.

## Adding a new tool

1. Decide the domain. Put it in the matching file under `mcp/src/tools/`. If the domain doesn't exist yet, add a new file and register it from `tools/index.ts`.
2. Use `registerTool(server, name, description, inputSchema, handler)` from `tools/helpers.ts`. The handler receives parsed Zod args and must return JSON-serializable data.
3. **Description matters** — the LLM reads it to decide when to call the tool. Write it in the imperative, describe preconditions (e.g. "call `list_groups` first to get `groupId`"), and flag destructive actions.
4. If the tool is group-scoped, include `groupId: z.string()` as a required field.
5. If the API endpoint doesn't exist yet, add it on the REST side first and regenerate the OpenAPI client (`npm run generate-api-client` from repo root).
6. Add a row to the tool count in `CLAUDE.md` if the total changes.

## Adding a new API endpoint that the MCP uses

1. Add the route in `api/src/routes/*.ts` with `@swagger` JSDoc.
2. If group-scoped, call `resolveGroupId(db, req, req.userId!)` at the start of the handler — **not** `user.activeGroupId` directly. Wrap the try/catch with `handleGroupResolutionError(error, res)` so membership-check failures return clean 403s.
3. Run `npm run generate-api-client` from repo root (regenerates `shared/api-client/`).
4. Add the MCP tool that calls it (see above).

## Deploying

1. Merge to `main`.
2. SSH to the host: `ssh opc@130.61.191.51`.
3. `cd ~/spajzka`, `git pull`.
4. `docker compose up -d --build`.
5. The `mongodb-init` container runs any pending migrations automatically.
6. If `JWT_SECRET` is being rotated, recreate **both** `api` and `mcp` at the same time (they must share the secret). Rotating invalidates all existing web-app JWTs but does **not** affect PATs (those are bcrypt-hashed independently).

Host nginx proxies `https://spajzka.vazac.dev/mcp` → `http://127.0.0.1:3001/mcp`. Config is at `/etc/nginx/sites-enabled/spajzka`. Do not expose port 3001 publicly — always go through nginx for TLS.

## Testing

- `npm run build` — type-check.
- `MCP_SMOKE_PAT=spk_mcp_... npm run smoke` — run the smoke script against a running stack. The script exercises `whoami`, `list_groups`, `list_pantry`, `list_shopping` — expand it as new tools are added.
- MCP Inspector (`npx @modelcontextprotocol/inspector`) is the interactive tool-by-tool debugger. Point it at `https://spajzka.vazac.dev/mcp` with a Bearer header.

## Known gaps (tracked, not blockers)

- No unit or integration test suite yet. The smoke script is the only automated check.
- `/api/auth/mcp-exchange` bcrypt-scans every user with an active PAT on each call. Fine at current scale; add a prefix-hash secondary index before user count grows.
- Revoking a PAT leaves existing sessions able to call tools for up to 59 minutes (JWT cache TTL).
- `move_completed_to_pantry` and `add_recipe_ingredients_to_shopping` loop item-by-item with no transaction; partial failures leave inconsistent state.
- Tool handlers use `(server as any).registerTool` in `tools/helpers.ts` because the SDK's generic Zod-shape type instantiates too deeply. Reintroducing strict typing is a refactor, not a one-line change.
