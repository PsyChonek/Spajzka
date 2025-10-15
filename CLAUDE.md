# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spajzka is a full-stack pantry management application built as a Progressive Web App (PWA). It allows users to track items in their pantry and shopping list with offline-first capabilities and automatic synchronization when online.

**Tech Stack:**
- **Frontend**: Vue 3 + TypeScript + Quasar UI Framework + Pinia (state management) + Vite
- **Backend**: Express.js + TypeScript + Swagger/OpenAPI
- **Database**: MongoDB
- **Deployment**: Docker + Docker Compose

## Project Structure

This is a monorepo with three main workspaces:

- `api/` - Express.js REST API server with OpenAPI specification
- `web/` - Vue 3 PWA frontend application
- `db/` - MongoDB database seeding scripts

## Development Commands

### Full Stack Development
```bash
# Start both API and web dev servers concurrently
npm run dev

# Start individual services
npm run dev:api    # API server on port 3000
npm run dev:web    # Web dev server on port 5173
```

### Building
```bash
# Build both API and web
npm run build

# Build individual services
npm run build:api
npm run build:web
```

### API Client Generation
```bash
# Generate TypeScript client from OpenAPI spec
npm run generate-api-client
# This runs from the api workspace and outputs to web/src/api-client/
```

### Docker
```bash
# Development with hot-reload
npm run docker:dev
npm run docker:dev:build  # Rebuild images

# Production
npm run docker:prod
npm run docker:prod:build

# Cleanup
npm run docker:down
npm run docker:clean  # Remove volumes
```

### Database Seeding
The database is automatically seeded when the MongoDB container starts. Seed data is located in `db/seed/*.json`.

## Architecture

### Offline-First PWA Pattern

The frontend implements an **offline-first architecture** where all data operations work locally first, then sync with the server when available:

1. **Pinia Stores with Persistence**: All stores (`pantryStore`, `shoppingStore`, `itemsStore`, `authStore`) use `pinia-plugin-persistedstate` to persist state to localStorage
2. **Optimistic UI Updates**: Changes are applied to local state immediately for responsive UX
3. **Pending Changes Queue**: Each store tracks pending changes in a `pendingChanges` Map when offline
4. **Automatic Sync**: The `useOnlineSync` composable listens for online/offline events and syncs pending changes when connectivity is restored
5. **Temporary IDs**: Newly created items get temporary IDs (prefixed with `temp_`) until synced with server

**Key Implementation Files:**
- `web/src/stores/pantryStore.ts` - Example store with offline-first pattern
- `web/src/composables/useOnlineSync.ts` - Global sync orchestration
- `web/src/services/api.ts` - Re-exports generated API client

### API Client Generation Workflow

The API uses Swagger JSDoc annotations to define endpoints, which generates an OpenAPI spec that auto-generates a TypeScript client:

1. API routes in `api/src/routes/*.ts` use JSDoc `@swagger` comments
2. `npm run generate-spec` (via `api/generate-spec.js`) compiles these into `api/openapi.json`
3. `npm run generate-client` uses `openapi-typescript-codegen` to generate `web/src/api-client/`
4. Frontend imports types and services from `web/src/services/api.ts`

**When adding/modifying API endpoints:**
- Add proper `@swagger` JSDoc annotations to route handlers
- Run `npm run generate-api-client` from root to regenerate client
- The generated client is committed to the repo

### Authentication

- JWT-based authentication with 7-day expiration
- Middleware in `api/src/middleware/auth.ts` validates tokens
- OpenAPI client configured in `web/src/main.ts` to automatically attach token from localStorage
- Protected routes extend `AuthRequest` interface for type-safe `userId` and `userEmail` access

### Database Connection

- MongoDB connection managed via singleton pattern in `api/src/config/database.ts`
- Uses `getDatabase()` to access the connection throughout the API
- Graceful shutdown handling on SIGTERM/SIGINT

### State Management

All state is managed through Pinia stores with the following pattern:
- `items` - reactive array of data
- `loading` - loading state
- `lastSynced` - timestamp of last successful sync
- `pendingChanges` - Map tracking items waiting to sync
- Computed properties for sorted/filtered data
- Actions for CRUD operations with offline handling

## Important Patterns

### Adding New API Endpoints

1. Create/update route file in `api/src/routes/`
2. Add comprehensive `@swagger` JSDoc annotations including:
   - `@openapi` tags with full request/response schemas
   - Security requirements if authentication needed
3. Register route in `api/src/server.ts`
4. Run `npm run generate-api-client` to regenerate TypeScript client
5. Use generated service in frontend stores/components

### Adding New Store/Entity

1. Create store in `web/src/stores/` following the offline-first pattern from `pantryStore.ts`
2. Add persistence: `{ persist: true }` in `defineStore` options
3. Implement pending changes tracking for offline support
4. Add sync method callable from `useOnlineSync` composable
5. Use temporary IDs pattern for optimistic creates

### Database Seeding

Seed files in `db/seed/*.json` follow MongoDB Extended JSON format:
- `{ "$oid": "..." }` for ObjectIds
- `{ "$date": "..." }` for Dates
- Collection name derived from filename (e.g., `Items.json` → `items` collection)
- Upsert-based seeding preserves existing data

## Environment Variables

### API (.env in api/)
- `PORT` - API server port (default: 3000)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: spajzka)
- `JWT_SECRET` - JWT signing secret (MUST change in production)

### Web (.env in web/)
- `VITE_API_URL` - API base URL (default: http://localhost:3000)

### Docker Compose
- `MONGO_USERNAME` - MongoDB root username (default: admin)
- `MONGO_PASSWORD` - MongoDB root password (default: password)

## Key Files Reference

- `api/src/server.ts` - Express app setup, middleware, route registration
- `api/src/config/swagger.ts` - Swagger/OpenAPI configuration
- `api/generate-spec.js` - OpenAPI spec generation script
- `web/src/main.ts` - Vue app initialization, Quasar setup, PWA registration
- `web/src/router/index.ts` - Vue Router configuration
- `web/vite.config.ts` - Vite build configuration with PWA plugin
- `db/seed.js` - Database seeding script with Extended JSON support
