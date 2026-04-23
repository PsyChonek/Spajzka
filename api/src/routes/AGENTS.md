# api/src/routes/

## Purpose
One file per resource (`auth`, `groups`, `items`, `pantry`, `shopping`, `recipes`, `tags`, `roles`, `health`). Each file exports an Express `Router` registered in `src/server.ts`.

## Conventions
- File name = resource name (kebab-case if multi-word). Export: default router.
- Handler signature: `(req: AuthRequest, res: Response) => Promise<void>` for protected routes.
- Validate input inline — no shared validator library yet. Return 400 with `{ error: "…" }` on bad input.

## Rules
- **`@swagger` JSDoc is mandatory** on every handler. Include `tags`, `security`, request schema, all response codes. The OpenAPI spec generation reads these — missing blocks mean missing client methods.
- **Group-scoped endpoints:** call `resolveGroupId(db, req, req.userId!)` first. Wrap with `handleGroupResolutionError(error, res)`. Never read `user.activeGroupId`.
- **Use `authMiddleware` from `src/middleware/auth.ts`** for protected routes; it populates `req.userId` and `req.userEmail`.
- **RBAC:** use `requirePermission(...)` from `src/rbac/middleware.ts` — don't inline role checks.
- Return ObjectIds as strings (`_id.toString()`) in responses.
- Don't swallow Mongo errors — let them bubble to the global error handler in `server.ts`.

## When you finish
- Run `npm run generate-api-client` from repo root to regenerate `shared/api-client/`.
- Add a Playwright spec in `tests/tests/` if the endpoint changes user-visible behavior.

## Examples
- `auth.ts` — good JSDoc template, shows login + register + PAT flows
- `pantry.ts` — canonical group-scoped CRUD with `resolveGroupId`
