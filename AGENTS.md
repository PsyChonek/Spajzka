# Spajzka

Full-stack pantry management PWA. Monorepo with **Express API**, **Vue 3 (Quasar) PWA**, **MCP server** for AI assistants, and a **MongoDB** database seeded via docker-compose.

Working directory: `C:\Repos\Spajzka`

## Setup

```bash
npm install                       # root install (hoists workspace deps)
npm run docker:dev                # Mongo + mongodb-init (install/seed/migrate)
npm run dev                       # api:3000 + web:5173 + mcp:3001 concurrently
```

Environment files: `api/.env`, `web/.env`, `mcp/.env`. See `CLAUDE.md` for required vars.

## Production

Host: Oracle ARM64 (linux-arm64-musl) at `130.61.191.51`, user `opc`, repo at `~/spajzka`. Public URL `https://spajzka.vazac.dev` (host nginx terminates TLS → forwards to internal container ports).

```bash
# Deploy (pull + rebuild + recreate containers)
ssh -i ~/.ssh/vazy-desktop opc@130.61.191.51 'cd ~/spajzka && git pull && docker compose up -d --build'

# Check container status
ssh -i ~/.ssh/vazy-desktop opc@130.61.191.51 'docker ps --format "{{.Names}}\t{{.Status}}" | grep spajzka'

# Query prod Mongo via the api container (has MONGO_URL env)
ssh -i ~/.ssh/vazy-desktop opc@130.61.191.51 'docker exec spajzka-api node -e "…"'
```

SSH key: `~/.ssh/vazy-desktop` (PC key). Do not commit secrets; redact `MONGO_URL` password if logging env.

## Architecture

REST API (`api/`) exposes the domain, persists to MongoDB, and emits an OpenAPI spec via Swagger JSDoc → generates `shared/api-client/` (committed). Both `web/` and `mcp/` consume that client. The web frontend is **offline-first**: Pinia stores apply changes locally, queue them in `pendingChanges`, and sync via `useOnlineSync` when back online. MCP server (`mcp/`) is a stateless Streamable-HTTP translator that exchanges a user PAT for a short-lived JWT and forwards calls to the API.

Components:
- `api/` — Express + JWT + RBAC, OpenAPI source of truth
- `web/` — Vue 3 + Quasar + Pinia + vite-plugin-pwa
- `mcp/` — `@modelcontextprotocol/sdk` over HTTP, 32 tools, PAT auth
- `shared/api-client/` — **generated** (never hand-edit; regen via `npm run generate-api-client`)
- `db/` — install/seed/migrate scripts + JSON fixtures
- `tests/` — Playwright e2e (chromium/firefox/webkit + mobile)

## Rules

- **Never hand-edit `shared/api-client/`.** After changing an API route or schema, run `npm run generate-api-client` from repo root.
- **Every API route needs `@swagger` JSDoc** — it feeds the OpenAPI spec and downstream clients.
- **Group-scoped routes must call `resolveGroupId(db, req, req.userId!)`** — never read `user.activeGroupId` directly.
- **Never log PATs, JWTs, or `Authorization` header values** (see `mcp/AGENTS.md` for the full invariants).
- **Frontend writes go through Pinia stores**, not direct `axios` calls in components. Stores own persistence + pending-changes queue + optimistic updates.
- **Use temporary IDs** (prefixed `temp_`) for optimistic creates until the server response arrives.
- **Bash on Windows:** this repo is developed on Windows with Git Bash — use forward slashes and Unix syntax, not cmd.exe.

## Testing

- `npm test` — Playwright e2e. Requires stack running (`npm run docker:dev` or `npm run dev`).
- Frontend regressions and route/auth changes require adding/updating a Playwright spec under `tests/tests/`.
- `MCP_SMOKE_PAT=spk_mcp_... npm run smoke:mcp` — MCP smoke test.
- No unit-test runner is wired up; do not add one without discussing.

## Stack-Specific Rules

**Security**
- JWT secret must match between `api` and `mcp` containers — rotate them together.
- Admin/global surfaces are intentionally excluded from MCP tools (see `mcp/AGENTS.md` invariant #2).
- Anonymous users cannot generate PATs (enforced at `POST /api/auth/mcp-token`).
- Always go through host nginx for TLS; never expose ports 3000/3001 publicly.

**Performance**
- MCP `move_completed_to_pantry` and recipe-ingredient bulk-adds loop without transactions — avoid adding more item-by-item loops without thinking about partial failure.
- Pinia stores persist to localStorage on every mutation; keep payloads small.

**Patterns**
- Vue 3: composition API with `<script setup>`. No Options API in new files.
- Express routes: one file per resource in `api/src/routes/`, registered in `api/src/server.ts`.
- MongoDB access via the singleton `getDatabase()` from `api/src/config/database.ts`.
- Zod schemas for every MCP tool input.

**Tooling**
- Formatter: none configured. Match existing style — 2-space indent, no trailing commas in JSON files.
- Type-check: `npm run build:api`, `npm run build:web`, `npm run build:mcp`.
- Generated client lives in `shared/api-client/` and is committed.
