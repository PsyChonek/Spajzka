# Build

Build the Spajzka stack (api + web + mcp TypeScript compile + Vite bundle).

## Skill

Before starting, read `skills/build/memory.md` for known issues and environment notes.
After completing, update `skills/build/memory.md` with any new learnings.
Run any scripts in `skills/build/scripts/` as needed (pre-build, post-build).

## Steps

Working directory: `C:\Repos\Spajzka`

### 1. Ask build scope

Use `AskUserQuestion`:
- **All** — build api + web + mcp (matches CI)
- **API only** — `npm run build:api`
- **Web only** — `npm run build:web` (includes `vue-tsc` type-check + Vite)
- **MCP only** — `npm run build:mcp`
- **Regenerate API client + all** — run `npm run generate-api-client` then full build (use after API route changes)

### 2. Build

**All:**
```bash
npm run build
```

**API only:**
```bash
npm run build:api
```

**Web only:**
```bash
npm run build:web
```

**MCP only:**
```bash
npm run build:mcp
```

**Regenerate API client + all:**
```bash
npm run generate-api-client
npm run build
```

The full build runs sequentially: api → web → mcp. `web` and `mcp` both import from `shared/api-client/`, so the client must be up-to-date first.

Wait for completion. If any stage fails, stop and report the full error output.

### 3. Report

Report ✓ / ✗ per target with a one-line status.

Output artifacts:
- `api/dist/` — compiled API (JS)
- `web/dist/` — bundled PWA (static assets + service worker)
- `mcp/dist/` — compiled MCP server (JS)
- `shared/api-client/` — regenerated client (only if that option was chosen)
