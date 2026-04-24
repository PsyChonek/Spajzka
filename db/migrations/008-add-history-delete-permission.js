const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

async function up(db) {
  console.log('Granting history:delete to admin + moderator roles...');

  const result = await db.collection('roles').updateMany(
    { _id: { $in: ['admin', 'moderator'] } },
    { $addToSet: { permissions: 'history:delete' } }
  );
  console.log(`✓ Granted history:delete to ${result.modifiedCount} role(s)`);
}

async function down(db) {
  console.log('Revoking history:delete from all roles...');
  const result = await db.collection('roles').updateMany(
    { permissions: 'history:delete' },
    { $pull: { permissions: 'history:delete' } }
  );
  console.log(`✓ Revoked history:delete from ${result.modifiedCount} role(s)`);
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
