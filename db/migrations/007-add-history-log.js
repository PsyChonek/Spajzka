const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

async function up(db) {
  console.log('Creating historyLog collection and indexes...');

  const existing = await db.listCollections({ name: 'historyLog' }).toArray();
  if (existing.length === 0) {
    await db.createCollection('historyLog');
    console.log('✓ historyLog collection created');
  } else {
    console.log('✓ historyLog collection already exists');
  }

  // Primary query: fetch a group's most recent entries
  await db.collection('historyLog').createIndex(
    { groupId: 1, timestamp: -1 },
    { name: 'groupId_1_timestamp_-1' }
  );
  console.log('✓ Index { groupId: 1, timestamp: -1 } ensured on historyLog');

  // Filter by type: fetch a group's pantry/shopping/etc entries
  await db.collection('historyLog').createIndex(
    { groupId: 1, entityType: 1, timestamp: -1 },
    { name: 'groupId_1_entityType_1_timestamp_-1' }
  );
  console.log('✓ Index { groupId: 1, entityType: 1, timestamp: -1 } ensured on historyLog');

  // Grant history:read to every existing role that already has any pantry/shopping/meal_plan
  // permission. Idempotent via $addToSet.
  const result = await db.collection('roles').updateMany(
    {
      isGlobal: { $ne: true },
      permissions: { $in: ['pantry:create', 'pantry:update', 'shopping:create', 'meal_plan:create'] }
    },
    { $addToSet: { permissions: 'history:read' } }
  );
  console.log(`✓ Granted history:read to ${result.modifiedCount} existing role(s)`);
}

async function down(db) {
  console.log('Dropping historyLog collection and revoking history:read...');

  const existing = await db.listCollections({ name: 'historyLog' }).toArray();
  if (existing.length > 0) {
    await db.collection('historyLog').drop();
    console.log('✓ historyLog collection dropped');
  } else {
    console.log('✓ historyLog collection already absent');
  }

  const result = await db.collection('roles').updateMany(
    { permissions: 'history:read' },
    { $pull: { permissions: 'history:read' } }
  );
  console.log(`✓ Revoked history:read from ${result.modifiedCount} role(s)`);
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
