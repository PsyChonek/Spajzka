# api/

## Purpose
Express REST API. JWT auth, RBAC, MongoDB persistence, Swagger/OpenAPI source of truth for `shared/api-client/`.

## Conventions
- TypeScript, CommonJS (`"type": "commonjs"`), strict mode.
- One route file per resource under `src/routes/`.
- Use `getDatabase()` from `src/config/database.ts` — do not create new Mongo clients.
- Responses: `{ ok: true, data }` on success, standard HTTP error codes otherwise.
- Naming: camelCase for fields, ObjectId for IDs (stringify at the boundary).

## Rules
- **Every route handler needs `@swagger` JSDoc** describing request body, params, responses, and security. Missing JSDoc = missing from the generated client.
- **After adding/changing a route or schema, run `npm run generate-api-client` from repo root.** Commit the regenerated `shared/api-client/`.
- **Group-scoped routes must call `resolveGroupId(db, req, req.userId!)`** from `src/utils/resolveGroup.ts` before reading group data. Never touch `user.activeGroupId` directly.
- Wrap `resolveGroupId` errors with `handleGroupResolutionError(error, res)` to get clean 403s.
- Protected routes extend `AuthRequest` for typed `userId` / `userEmail`.
- RBAC checks go through `src/rbac/middleware.ts` — don't inline permission checks in handlers.
- Never log `JWT_SECRET`, tokens, or password hashes.

## Testing
- Type-check: `npm run build` (from `api/`) or `npm run build:api` (from root).
- No unit-test runner wired. E2E via Playwright in `tests/` covers API indirectly.

## Key files
- `src/server.ts` — app setup, middleware chain, route registration
- `src/config/database.ts` — singleton Mongo client + `getDatabase()`
- `src/config/swagger.ts` — OpenAPI config
- `src/middleware/auth.ts` — JWT verification
- `src/rbac/permissions.ts` — permission constants
- `src/utils/resolveGroup.ts` — group resolution helper
- `generate-spec.js` — compiles JSDoc into `openapi.json`
