# Dev — Start Development Environment

Start the Spajzka hot-reload dev stack (api + web + mcp + MongoDB).

## Working directory: `C:\Repos\Spajzka`

---

## Step 1 — Ask target

Use `AskUserQuestion`:
- **Full stack (Docker)** — `npm run docker:dev` — MongoDB + mongodb-init + api + web + mcp in containers
- **Full stack (local Node)** — `npm run dev` — api + web + mcp concurrently (assumes MongoDB already running, typically via `docker compose up mongodb mongodb-init -d`)
- **API only** — `npm run dev:api` (port 3000)
- **Web only** — `npm run dev:web` (port 5173)
- **MCP only** — `npm run dev:mcp` (port 3001)

---

## Step 2 — Start infrastructure

For **Full stack (Docker)**: `npm run docker:dev` brings everything up including MongoDB + mongodb-init (which runs install + seed + migrate automatically in dev).

For **Full stack (local Node)**: ensure MongoDB is available first:
```bash
docker compose -f docker-compose.dev.yml up mongodb mongodb-init -d
```
Wait for `mongodb-init` to complete (exits with code 0) before starting the Node services — otherwise the API hits an empty database.

Verify with:
```bash
docker ps --filter "name=spajzka-mongodb"
docker logs spajzka-mongodb-init --tail 20
```

---

## Step 3 — Start the app

**Full stack (Docker):**
```bash
npm run docker:dev
```

**Full stack (local Node):**
```bash
npm run dev
```

**API only / Web only / MCP only** — use the matching `npm run dev:*` script.

Run in background so further prompts don't block on the dev server's output.

---

## Step 4 — Print connection info

```
Spajzka dev environment ready:
  Web:   http://localhost:5173
  API:   http://localhost:3000     (Swagger: http://localhost:3000/api-docs)
  MCP:   http://localhost:3001/mcp (health: http://localhost:3001/healthz)
  Mongo: mongodb://admin:password@localhost:27018
```

Dev seed credentials live in `db/seed/users.json` — report the test login if the user asks.

---

## Output

Report:
- Which services are running
- Connection URLs + ports
- Any warnings (port conflicts, missing env vars, mongodb-init failures)
