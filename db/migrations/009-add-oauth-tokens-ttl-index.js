const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

async function up(db) {
  console.log('Creating TTL index on oauth_tokens.expiresAt...');
  // MongoDB will automatically delete documents after expiresAt.
  await db.collection('oauth_tokens').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_expiresAt' }
  );

  // Index on clientId + token for fast lookup at the token endpoint.
  await db.collection('oauth_tokens').createIndex(
    { token: 1 },
    { unique: true, name: 'uniq_token' }
  );

  // Index for registered OAuth clients.
  await db.collection('oauth_clients').createIndex(
    { clientId: 1 },
    { unique: true, name: 'uniq_clientId' }
  );

  console.log('✓ OAuth indexes created');
}

async function down(db) {
  console.log('Dropping OAuth indexes...');
  await db.collection('oauth_tokens').dropIndex('ttl_expiresAt').catch(() => {});
  await db.collection('oauth_tokens').dropIndex('uniq_token').catch(() => {});
  await db.collection('oauth_clients').dropIndex('uniq_clientId').catch(() => {});
  console.log('✓ OAuth indexes dropped');
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
