# Run Tests

Run the Playwright e2e test suite.

## Skill

Before starting, read `skills/test/memory.md` for known flaky tests and environment notes.
After completing, update `skills/test/memory.md` with any new learnings.
Run any scripts in `skills/test/scripts/` as needed (test data setup, cleanup).

## Steps

Working directory: `C:\Repos\Spajzka`

### 0. Check stack is running

Tests hit the live dev stack on `http://localhost:5173` + `http://localhost:3000`. Verify with:
```bash
curl -s http://localhost:5173 > /dev/null && echo "web up"
curl -s http://localhost:3000/api/health > /dev/null && echo "api up"
```

If either is down, prompt the user to run `npm run docker:dev` or `npm run dev` first. Do **not** start the stack yourself.

### 1. Ask what to test

Use `AskUserQuestion`:
- **All** — full Playwright suite across all projects
- **Chromium** — `npm run test:chromium`
- **Mobile** — `npm run test:mobile` (Mobile Chrome + Mobile Safari)
- **Single feature** — ask which (auth / pantry / shopping / recipes / offline)
- **UI mode** — Playwright UI for interactive debugging
- **Update tests** — run all, fix failures without deleting tests

### 2. Execute

**All:**
```bash
npm test
```

**Chromium:**
```bash
npm run test:chromium
```

**Mobile:**
```bash
npm run test:mobile
```

**Single feature:**
```bash
npm run test:auth       # or test:pantry / test:shopping / test:recipes / test:offline
```

**UI mode:**
```bash
npm run test:ui
```

**Update tests:**

Run `npm test`. For each failure, inspect the Playwright trace (`playwright-report/`) and fix the test or the production code so it reflects correct behavior. Re-run after each fix. **Never delete a test to make it pass** — fix the underlying issue. Favour updating `data-testid` selectors on components over fragile text matches.

### 3. Report

Print a one-line summary per spec file:
- ✓ `auth.spec.ts` — 8 passed
- ✗ `pantry.spec.ts` — 2 failed (test name + error snippet)

If anything fails and you are not in "update" mode, stop and show the full failure output. Point the user at `npm run test:report` for the HTML report.
