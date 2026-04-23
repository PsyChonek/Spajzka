# web/src/stores/

## Purpose
Pinia stores. Every store is the single source of truth for its domain, handles offline queueing, optimistic updates, and sync on reconnect.

## Conventions
- One store per domain (pantry, shopping, items, auth, groups, tags, recipes, mcpToken, navigation).
- `defineStore('name', { state, getters, actions, persist: true })` — composition syntax is fine too, use whichever matches neighbours.
- Required fields in state: `items`, `loading`, `lastSynced`, `pendingChanges: Map<id, change>`.
- ID convention: server-assigned strings; optimistic creates use `temp_${uuid}`.

## Rules
- **Mutate local state first**, then call the API. On success, reconcile (swap `temp_` IDs for real ones). On failure while offline, enqueue into `pendingChanges`.
- **Never call `axios` / the API client directly from components.** All I/O goes through a store action.
- **Every store that syncs must expose `syncPending()`** — `useOnlineSync` calls this when `online` fires.
- **Persistence is opt-in per field**, but default is "persist everything". Don't persist secrets (e.g. tokens — `authStore` handles token storage separately in localStorage with a different key).
- **Skip `temp_*` IDs in requests to the server.** Server calls that need a stable ID must filter or wait.
- Pass parsed objects to components via getters; avoid leaking raw API-client response types.

## Examples
- `pantryStore.ts` — canonical offline-first CRUD store; use as template for new stores
- `authStore.ts` — token + profile; handles its own persistence edge cases
- `mcpTokenStore.ts` — write-once PAT reveal flow (the generated PAT is only shown once)

## When adding a new store
1. Copy the shape of `pantryStore.ts`.
2. Register it in `useOnlineSync` so its `syncPending()` runs on reconnect.
3. If it exposes state to multiple views, add it to `useStores.ts`.
