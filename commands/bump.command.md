# Bump Version

Bump the Spajzka version across workspace `package.json` files.

## Arguments

`$ARGUMENTS` should be `major`, `minor`, or `patch`. Default to `patch` if omitted.

## Steps

Working directory: `C:\Repos\Spajzka`

### Version files

Spajzka has no bump script — update these manually:

| File | Field |
|------|-------|
| `package.json` | `version` (root, currently `"1.0.0"`) |
| `api/package.json` | `version` |
| `mcp/package.json` | `version` |

Note: `web/package.json` is intentionally left at `"0.0.0"` (it's a private PWA, not a published package). Skip it unless the user explicitly requests otherwise.

### Compute new version

Read the root `package.json` version. Increment per `$ARGUMENTS`:
- `patch` → 1.2.3 → 1.2.4
- `minor` → 1.2.3 → 1.3.0
- `major` → 1.2.3 → 2.0.0

### Apply

Edit the `version` field in each file listed above to the new value. Keep all other fields untouched.

### Commit

```bash
git add package.json api/package.json mcp/package.json
git commit -m "chore: bump version to v<new-version>"
```

### Report

Print `old-version → new-version` and the list of files updated.
