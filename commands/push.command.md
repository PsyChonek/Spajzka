# Commit and Push

Stage, commit, and push current changes to `origin`.

## Steps

Working directory: `C:\Repos\Spajzka`

### 1. Inspect current state

Run in parallel:
```
git status
git diff
git log --oneline -5
```

### 2. Stage changes

Add modified and new files relevant to the current work. Prefer naming files explicitly over `git add -A`. Never stage:
- `.env`, `api/.env`, `web/.env`, `mcp/.env` or any file containing secrets
- Build artifacts (`api/dist/`, `web/dist/`, `mcp/dist/`, `node_modules/`)
- IDE/editor state (`.idea/`, `.vscode/*.user`)
- Playwright artifacts (`tests/playwright-report/`, `tests/test-results/`)

`shared/api-client/` **is** committed — include it when the API changed.

If untracked files look unrelated to the current task, skip them and note that in the commit message.

### 3. Commit

Write a concise imperative commit message (≤72 chars subject) that explains *why*, not just *what*. Follow the style of recent commits shown in step 1.

```bash
git commit -m "$(cat <<'EOF'
<subject line>

<optional body>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### 4. Push

```bash
git push
```

If the push is rejected (diverged remote), show the error and ask the user whether to rebase or force-push. **Do not force-push without explicit confirmation.** Never force-push `main`.

### 5. Report

```
✓ 3fa1c2d  feat: add recipe ingredient search endpoint
✓ pushed to origin/main
```
