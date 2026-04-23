# Release

Cut a Spajzka release: bump version, tag, push to `main`, deploy to production host.

## Skill

Before starting, read `skills/release/memory.md` for past release gotchas and deploy notes.
After completing, update `skills/release/memory.md` with new learnings.
Run any scripts in `skills/release/scripts/` as needed.

## Arguments

`$ARGUMENTS` format: `[bump-type]`
- **bump-type**: `major`, `minor`, or `patch`. Default: `patch`.

---

## Steps

Execute in order. Stop on first failure.

---

### Step 0 — Confirm release

Use `AskUserQuestion` to confirm:
- **Bump type** — `patch` / `minor` / `major` (pre-select `$ARGUMENTS`)

Wait for confirmation.

---

### Step 1 — Local checks

Working tree must be clean:
```bash
git status --porcelain
```
If dirty, stop and ask user to commit/stash first.

Type-check everything:
```bash
npm run build
```

Run the Playwright e2e suite against the dev stack:
```bash
npm test
```
If anything fails, stop and report. Do not release broken code.

---

### Step 2 — Bump version

```
/bump $ARGUMENTS
```

Creates the `chore: bump version to vX.Y.Z` commit on `main`.

---

### Step 3 — Tag and push

```bash
VERSION=$(node -p "require('./package.json').version")
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin main
git push origin "v${VERSION}"
```

---

### Step 4 — Deploy

There is no CI/CD yet. Deploy is manual via SSH to the production host.

**Ask the user to run** (do not SSH yourself):

```bash
ssh opc@130.61.191.51
cd ~/spajzka
git pull
docker compose up -d --build
```

The `mongodb-init` container runs pending migrations automatically. If `JWT_SECRET` rotates, recreate `api` and `mcp` together.

Host nginx proxies `https://spajzka.vazac.dev` (web) and `https://spajzka.vazac.dev/mcp` → internal containers.

Ask the user to confirm the deploy succeeded (`curl https://spajzka.vazac.dev/api/health` and `curl https://spajzka.vazac.dev/mcp/healthz`).

---

### Step 5 — Summary

Report:
- New version + git tag
- Deploy status (pending user confirmation, ✓ live, or ✗ failed)
- Anything rolled into this release worth flagging (breaking change, new env var, schema migration)
