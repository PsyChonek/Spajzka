const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

// dkg is being removed. Convert all dkg quantities to grams (1 dkg = 10 g).

async function up(db) {
  const items = db.collection('items');
  const pantry = db.collection('pantry');
  const shopping = db.collection('shopping');
  const recipes = db.collection('recipes');

  console.log('Finding items with defaultUnit "dkg"...');
  const dkgItems = await items.find({ defaultUnit: 'dkg' }).toArray();
  console.log(`Found ${dkgItems.length} items using dkg.`);

  for (const item of dkgItems) {
    const updates = pantry.updateMany(
      { itemId: item._id },
      { $mul: { quantity: 10 } }
    );
    const shoppingUpdates = shopping.updateMany(
      { itemId: item._id },
      { $mul: { quantity: 10 } }
    );
    await Promise.all([updates, shoppingUpdates]);
    await items.updateOne({ _id: item._id }, { $set: { defaultUnit: 'g' } });
  }
  if (dkgItems.length) {
    console.log(`✓ Converted ${dkgItems.length} items + their pantry/shopping rows from dkg → g`);
  }

  console.log('Converting recipe ingredient units from dkg to g...');
  const recCursor = recipes.find({ 'ingredients.unit': { $in: ['dkg', 'DKG', 'Dkg'] } });
  let recipeCount = 0;
  while (await recCursor.hasNext()) {
    const recipe = await recCursor.next();
    if (!Array.isArray(recipe.ingredients)) continue;
    let dirty = false;
    const updated = recipe.ingredients.map((ing) => {
      const unit = (ing.unit || '').toString().trim();
      if (unit.toLowerCase() === 'dkg') {
        dirty = true;
        const qty = typeof ing.quantity === 'number' ? ing.quantity * 10 : ing.quantity;
        return { ...ing, unit: 'g', quantity: qty };
      }
      return ing;
    });
    if (dirty) {
      await recipes.updateOne({ _id: recipe._id }, { $set: { ingredients: updated } });
      recipeCount++;
    }
  }
  console.log(`✓ Updated ${recipeCount} recipes with dkg ingredients`);
}

async function down(db) {
  // Non-reversible: dkg has been removed from the supported unit set.
  console.log('No-op: dkg removal is not reversible.');
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
