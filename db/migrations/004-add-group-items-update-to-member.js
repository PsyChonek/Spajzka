const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

async function up(db) {
  console.log('Adding group_items:update permission to member role...');
  
  const result = await db.collection('roles').updateOne(
    { _id: 'member' },
    {
      $addToSet: {
        permissions: 'group_items:update'
      }
    }
  );

  if (result.modifiedCount > 0) {
    console.log('✓ Successfully added group_items:update permission to member role');
  } else {
    console.log('✓ Member role already has group_items:update permission or role not found');
  }
}

async function down(db) {
  console.log('Removing group_items:update permission from member role...');
  
  const result = await db.collection('roles').updateOne(
    { _id: 'member' },
    {
      $pull: {
        permissions: 'group_items:update'
      }
    }
  );

  if (result.modifiedCount > 0) {
    console.log('✓ Successfully removed group_items:update permission from member role');
  } else {
    console.log('✓ Member role permission already removed or role not found');
  }
}

module.exports = { up, down };

// If run directly
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
