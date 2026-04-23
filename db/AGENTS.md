# db/

## Purpose
MongoDB initialization, seeding, and migrations. Runs as the `mongodb-init` container in docker-compose; can also run locally against a MongoDB.

## Conventions
- Plain Node scripts (`.js`, CommonJS). Not TypeScript.
- **Install data** (`install/*.json`): system-critical — roles, global items. Runs in **every** environment.
- **Seed data** (`seed/*.json`): development fixtures — users, groups, sample items. **Dev only.**
- **Migrations** (`migrations/*.js`): idempotent transformations. Always run.
- JSON files use MongoDB Extended JSON: `{ "$oid": "…" }`, `{ "$date": "…" }`.
- Collection name = filename lowercased (`Items.json` → `items`).

## Rules
- **Install/seed must be idempotent** — use `upsert` keyed on a stable field. Never wipe + re-insert.
- **Migrations must be idempotent too** — check current schema before transforming. Running a migration twice must not corrupt data.
- **Never put secrets in install/seed JSON.** Passwords in seed users are dev-only, bcrypted, and must match the documented dev credentials.
- `NODE_ENV=production` skips seed. Do not branch on anything else.
- New migrations go in `migrations/` with a date-prefixed name (`YYYYMMDD-description.js`). The migrate runner picks them up in lexicographic order.

## Running
```bash
npm run db:install     # local — install system data
npm run db:seed        # local — dev fixtures
npm run db:migrate     # local — migrations
npm run db:init        # all three
npm run docker:db:init # re-run inside dev container
```

## Key files
- `install.js` — upserts install data
- `seed.js` — upserts seed data, Extended JSON aware
- `migrate.js` — runs migrations in order, tracks applied ones in a `_migrations` collection
- `Dockerfile.dev` — dev container (runs all three steps)
- `Dockerfile` — prod container (skips seed)
