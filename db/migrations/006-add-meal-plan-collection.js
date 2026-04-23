const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

async function up(db) {
  console.log('Creating mealPlan collection and index...');

  const existing = await db.listCollections({ name: 'mealPlan' }).toArray();
  if (existing.length === 0) {
    await db.createCollection('mealPlan');
    console.log('✓ mealPlan collection created');
  } else {
    console.log('✓ mealPlan collection already exists');
  }

  await db.collection('mealPlan').createIndex(
    { groupId: 1, cookDate: 1 },
    { name: 'groupId_1_cookDate_1' }
  );
  console.log('✓ Index { groupId: 1, cookDate: 1 } ensured on mealPlan');

  // Supports cascade-delete: DELETE /api/meal-plan/:id with removeShoppingItems
  // filters shopping by mealPlanRefs.batchId. Sparse because the field is
  // absent on shopping items not originating from meal-plan generation.
  await db.collection('shopping').createIndex(
    { 'mealPlanRefs.batchId': 1 },
    { name: 'mealPlanRefs_batchId_1', sparse: true }
  );
  console.log('✓ Index { mealPlanRefs.batchId: 1 } ensured on shopping (sparse)');
}

async function down(db) {
  console.log('Dropping mealPlan collection and shopping meal-plan index...');

  const existing = await db.listCollections({ name: 'mealPlan' }).toArray();
  if (existing.length > 0) {
    await db.collection('mealPlan').drop();
    console.log('✓ mealPlan collection dropped');
  } else {
    console.log('✓ mealPlan collection already absent');
  }

  try {
    await db.collection('shopping').dropIndex('mealPlanRefs_batchId_1');
    console.log('✓ Index mealPlanRefs_batchId_1 dropped from shopping');
  } catch (err) {
    if (err && err.codeName !== 'IndexNotFound') throw err;
  }
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
