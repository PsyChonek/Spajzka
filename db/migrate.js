const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Migration runner
 * - Tracks applied migrations in the database
 * - Runs pending migrations in order
 * - Supports up/down migration functions
 */

async function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.js'))
    .sort(); // Sort ensures migrations run in order (001, 002, 003, etc.)

  return files;
}

async function getAppliedMigrations(db) {
  const migrations = db.collection('migrations');
  const applied = await migrations.find({}).toArray();
  return applied.map(m => m.name);
}

async function markMigrationAsApplied(db, migrationName) {
  const migrations = db.collection('migrations');
  await migrations.insertOne({
    name: migrationName,
    appliedAt: new Date()
  });
}

async function markMigrationAsRolledBack(db, migrationName) {
  const migrations = db.collection('migrations');
  await migrations.deleteOne({ name: migrationName });
}

async function runMigrations(direction = 'up') {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB for migrations');

    const db = client.db(DB_NAME);

    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(db);

    if (direction === 'up') {
      // Run pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !appliedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('\n✓ No pending migrations to run');
        return;
      }

      console.log(`\nFound ${pendingMigrations.length} pending migration(s):\n`);

      for (const migrationFile of pendingMigrations) {
        const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
        const migration = require(migrationPath);

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Running: ${migrationFile}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
          await migration.up(db);
          await markMigrationAsApplied(db, migrationFile);
          console.log(`✓ Successfully applied: ${migrationFile}`);
        } catch (error) {
          console.error(`✗ Error running migration ${migrationFile}:`, error);
          throw error;
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ All migrations completed successfully!');
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    } else if (direction === 'down') {
      // Rollback last migration
      const lastApplied = appliedMigrations[appliedMigrations.length - 1];

      if (!lastApplied) {
        console.log('\n✓ No migrations to rollback');
        return;
      }

      const migrationPath = path.join(MIGRATIONS_DIR, lastApplied);
      const migration = require(migrationPath);

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Rolling back: ${lastApplied}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        await migration.down(db);
        await markMigrationAsRolledBack(db, lastApplied);
        console.log(`✓ Successfully rolled back: ${lastApplied}`);
      } catch (error) {
        console.error(`✗ Error rolling back migration ${lastApplied}:`, error);
        throw error;
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Rollback completed successfully!');
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const direction = args[0] === 'down' ? 'down' : 'up';

// Run migrations
runMigrations(direction);
