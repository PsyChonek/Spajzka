# Database Migrations

This folder contains database migration scripts for the Spajzka application.

## Migration File Naming Convention

Migration files should follow this naming pattern:
```
{number}_{descriptive_name}.js
```

Examples:
- `001_groups_and_items_schema.js`
- `002_add_user_preferences.js`
- `003_recipe_categories.js`

The number prefix ensures migrations run in the correct order.

## Migration File Structure

Each migration file must export two functions:

```javascript
async function up(db) {
  // Migration logic to apply changes
  console.log('Applying migration...');
  // Your database changes here
}

async function down(db) {
  // Migration logic to rollback changes
  console.log('Rolling back migration...');
  // Your rollback logic here
}

module.exports = { up, down };
```

## Running Migrations

### Apply all pending migrations
```bash
npm run db:migrate
```

### Rollback last migration
```bash
node migrate.js down
```

## Best Practices

1. **Always make migrations idempotent**: Check if a migration has already been applied before making changes
2. **Use upsert operations**: Prevent duplicate key errors when re-running migrations
3. **Add descriptive console logs**: Help track migration progress
4. **Implement down() function**: Even if it's just a warning, document what rollback would require
5. **Test migrations**: Always test migrations on a copy of production data before running in production
6. **Backup before migrating**: Especially for destructive operations

## Migration Tracking

Applied migrations are tracked in the `migrations` collection with the following structure:
```javascript
{
  name: "001_groups_and_items_schema.js",
  appliedAt: ISODate("2025-01-16T10:30:00.000Z")
}
```

This ensures each migration only runs once.
