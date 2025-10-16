# Database Initialization

This directory contains all database initialization scripts and data for Spajzka.

## Structure

```
db/
├── install/           # System-critical data (always runs)
│   ├── roles.json
│   └── globalItems.json
├── seed/              # Development/test data (dev only)
│   ├── Users.json
│   ├── Groups.json
│   └── ...
├── install.js         # Install system data
├── seed.js           # Seed development data
├── migrate.js        # Run database migrations
├── Dockerfile        # Production MongoDB image (deprecated - see init containers)
├── Dockerfile.dev    # Development init container
├── Dockerfile.init   # Production init container
└── init-db.sh       # Legacy init script (deprecated)
```

## Initialization Process

The database initialization happens in three phases:

### 1. Install (System Data)
**Script:** `install.js`
**Data:** `install/*.json`
**When:** Always (dev & production)
**Purpose:** Install system-critical data required for the app to function

- Roles and permissions
- Global item catalog
- System configuration

### 2. Seed (Development Data)
**Script:** `seed.js`
**Data:** `seed/*.json`
**When:** Development only
**Purpose:** Populate database with test users, groups, and sample data

- Test users with known credentials
- Sample groups and memberships
- Example pantry and shopping items

### 3. Migrate (Schema Updates)
**Script:** `migrate.js`
**When:** Always (dev & production)
**Purpose:** Update existing database schema and data structures

- Convert old schemas to new formats
- Add missing fields with defaults
- Restructure collections

## Docker Integration

### Development Environment
The `mongodb-init` container (using `Dockerfile.dev`) runs automatically when you start the dev environment:

```bash
npm run docker:dev
```

This container:
- Waits for MongoDB to be ready
- Runs install → seed → migrate
- Exits after completion (restart: "no")
- Mounts scripts as volumes for live updates

### Production Environment
The `mongodb-init` container (using `Dockerfile.init`) runs automatically in production:

```bash
npm run docker:prod
```

This container:
- Waits for MongoDB to be ready
- Runs install → migrate (skips seed)
- Exits after completion (restart: "no")
- Uses baked-in scripts from build time

### Manual Re-initialization
You can manually re-run initialization:

```bash
# Development
npm run docker:db:init

# Production
npm run docker:db:init:prod
```

## Local Development (without Docker)

If you're running MongoDB locally, you can run scripts directly:

```bash
# Set environment variables
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="spajzka"

# Run individual scripts
npm run db:install  # Install system data
npm run db:seed     # Seed development data
npm run db:migrate  # Run migrations

# Or run all at once
npm run db:init
```

## Data File Format

All JSON files use MongoDB Extended JSON format:

```json
{
  "collectionName": [
    {
      "_id": { "$oid": "507f1f77bcf86cd799439011" },
      "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
      "name": "Example Item"
    }
  ]
}
```

**Key points:**
- `$oid` for ObjectIds
- `$date` for Date objects
- Collection name as the root key
- Array of documents as the value

## How the Init Container Works

Both `Dockerfile.dev` and `Dockerfile.init` follow this pattern:

1. **Base Image:** `node:20-alpine` (small footprint)
2. **Install Dependencies:** MongoDB driver and netcat
3. **Copy Scripts:** All initialization scripts and data files
4. **Create Startup Script:** Shell script that:
   - Waits for MongoDB to be ready (using `nc -z`)
   - Runs scripts in order: install → seed (if dev) → migrate
   - Logs progress and exits
5. **CMD:** Runs the startup script once and exits

The API service depends on `mongodb-init` with `condition: service_completed_successfully`, ensuring the database is fully initialized before the API starts.

## Adding New System Data

1. Create a JSON file in `install/` directory
2. Follow the Extended JSON format
3. The install script will automatically pick it up

## Adding New Migrations

1. Edit `migrate.js`
2. Add your migration logic
3. Make it idempotent (safe to run multiple times)
4. Check for existing data before migrating

Example:
```javascript
// Check if already migrated
if (document.newField) {
  console.log('Already migrated, skipping...');
  continue;
}

// Apply migration
await collection.updateOne(
  { _id: document._id },
  { $set: { newField: 'defaultValue' } }
);
```

## Troubleshooting

**MongoDB not ready:**
- The init container waits up to ~60 seconds for MongoDB
- Check MongoDB container logs: `docker logs spajzka-mongodb`

**Init container failing:**
- Check init container logs: `docker logs spajzka-mongodb-init`
- Verify MONGO_URL and credentials are correct
- Ensure JSON files are valid

**Need to reset database:**
```bash
# Stop containers and remove volumes
npm run docker:clean

# Restart with fresh database
npm run docker:dev:build
```
