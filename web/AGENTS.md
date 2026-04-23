# web/

## Purpose
Vue 3 + Quasar PWA frontend. Offline-first via Pinia stores + `pinia-plugin-persistedstate`, auto-sync via `useOnlineSync`. Consumes the generated API client from `shared/api-client/`.

## Conventions
- TypeScript strict, ESM (`"type": "module"`).
- **Composition API only** (`<script setup lang="ts">`). No Options API in new components.
- Components: PascalCase files under `src/components/`. Views: `*View.vue` under `src/views/`.
- Quasar components (`q-*`) for layout + inputs — don't re-skin raw HTML when a Quasar equivalent exists.
- SCSS/Sass for styles. Theme variables in `src/quasar-variables.sass`.

## Rules
- **API calls go through Pinia stores**, not components. Components read state + call store actions.
- **Never import from `shared/api-client/` directly in components** — re-export via `src/services/api.ts` (this keeps the swap-point single).
- **New stores must follow the offline-first pattern** (see `src/stores/AGENTS.md`).
- **Temporary IDs:** newly created entities get IDs prefixed with `temp_` until the server assigns a real one. Any code that passes IDs to the server must check and skip `temp_*`.
- **Persist carefully:** `{ persist: true }` dumps the whole state to localStorage on every mutation. Keep state small; derive with `computed` instead of caching.
- Router lazy-loads views — keep view components free of top-level side effects.
- PWA: `vite-plugin-pwa` config is in `vite.config.ts`. Don't register service workers manually.

## Testing
- Type-check: `npm run build` (from `web/`) or `npm run build:web` (from root). `vue-tsc` runs before Vite.
- Behaviour tested through Playwright in `tests/`. No component-level test runner wired up.

## Key files
- `src/main.ts` — app init, Quasar + Pinia setup, OpenAPI token injection
- `src/router/index.ts` — route table
- `src/services/api.ts` — re-exports generated client
- `src/composables/useOnlineSync.ts` — sync orchestrator
- `src/composables/useStores.ts` — aggregate store accessor
- `vite.config.ts` — PWA + build config
