# tests/

## Purpose
Playwright end-to-end test suite. Covers the real web UI against a running API + MongoDB stack. Cross-browser (chromium/firefox/webkit) and mobile projects configured.

## Conventions
- `tests/*.spec.ts` — one file per feature (`auth`, `pantry`, `shopping`, `recipes`, `offline-sync`, …).
- Helpers under `helpers/` — reusable login, test data builders, page objects.
- Config: `playwright.config.ts` — base URL points at the dev web server (`http://localhost:5173`).

## Rules
- **Assume the stack is running.** Tests do not bring up Docker; developer runs `npm run docker:dev` or `npm run dev` first.
- **Each test is isolated** — create its own test user or use a seeded one; never rely on residual state from a previous test.
- **Clean up after yourself** when a test mutates shared data (e.g. groups). Use `afterEach` hooks.
- **Don't hard-wait (`page.waitForTimeout`)** — use `expect(...).toBeVisible()` / `await expect(...).toHaveText(...)` with Playwright's auto-waiting.
- **Offline tests** must use `page.context().setOffline(true)` rather than disabling the API container.
- Use the **selectors already present in components** (Quasar component names, data-testid) rather than fragile text matches. If a component has no stable selector, add `data-testid` to the component before writing the test.

## Running
```bash
npm test                  # all projects
npm run test:chromium     # chromium only
npm run test:mobile       # mobile projects
npm run test:ui           # Playwright UI mode
npm run test:headed       # headed browser
npm run test:debug        # step debugger
npm run test:auth         # single spec
```

Reports land in `playwright-report/`; open with `npm run test:report`.

## When adding a feature to api/ or web/
- If the feature is user-visible, a Playwright spec is expected.
- Update or extend `helpers/` if you introduce a new cross-cutting concept (e.g. new seeded fixture, new login flow).
