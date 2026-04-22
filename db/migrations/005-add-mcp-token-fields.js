const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

async function up(db) {
  console.log('Adding mcpToken fields to all users...');

  const result = await db.collection('users').updateMany(
    { mcpTokenHash: { $exists: false } },
    {
      $set: {
        mcpTokenHash: null,
        mcpTokenCreatedAt: null,
        mcpTokenLastUsedAt: null
      }
    }
  );

  console.log(`✓ mcpToken fields added to ${result.modifiedCount} user(s)`);
}

async function down(db) {
  console.log('Removing mcpToken fields from all users...');

  const result = await db.collection('users').updateMany(
    {},
    {
      $unset: {
        mcpTokenHash: '',
        mcpTokenCreatedAt: '',
        mcpTokenLastUsedAt: ''
      }
    }
  );

  console.log(`✓ mcpToken fields removed from ${result.modifiedCount} user(s)`);
}

module.exports = { up, down };

if (require.main === module) {
  const client = new MongoClient(MONGO_URL);

  client.connect()
    .then(async () => {
      const db = client.db(DB_NAME);
      await up(db);
      await client.close();
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
