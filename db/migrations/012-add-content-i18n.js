const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

// Default seed locale: existing data leans Czech (seed) or English (install).
// We can't reliably detect per-doc, so we copy the existing string into BOTH
// locales as a starting point — admins/users can refine via the translations
// dialog later. Keeping the original `name`/`category`/`searchNames` fields
// intact means legacy reads continue to work unchanged.

function seedTranslations(doc, fields) {
  const out = { en: {}, cs: {} };
  for (const f of fields) {
    const v = doc[f];
    if (v === undefined || v === null) continue;
    out.en[f] = v;
    out.cs[f] = v;
  }
  return out;
}

async function up(db) {
  // 1) Build categories collection from unique item.category strings
  const items = db.collection('items');
  const categories = db.collection('categories');

  const distinctCategories = await items.distinct('category', { category: { $exists: true, $ne: '' } });
  console.log(`Found ${distinctCategories.length} distinct category strings`);

  const categoryIdByName = new Map();
  for (const name of distinctCategories) {
    if (!name) continue;
    const existing = await categories.findOne({ 'translations.cs.name': name });
    if (existing) {
      categoryIdByName.set(name, existing._id);
      continue;
    }
    const inserted = await categories.insertOne({
      translations: { en: { name }, cs: { name } },
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    categoryIdByName.set(name, inserted.insertedId);
  }
  console.log(`✓ Categories collection: ${categoryIdByName.size} entries`);

  // 2) Backfill translations on items + add categoryId
  let itemCount = 0;
  const itemCursor = items.find({});
  while (await itemCursor.hasNext()) {
    const doc = await itemCursor.next();
    if (doc.translations && doc.translations.cs) continue;
    const t = seedTranslations(doc, ['name', 'searchNames']);
    const update = { $set: { translations: t, updatedAt: new Date() } };
    if (doc.category && categoryIdByName.has(doc.category)) {
      update.$set.categoryId = categoryIdByName.get(doc.category);
    }
    await items.updateOne({ _id: doc._id }, update);
    itemCount++;
  }
  console.log(`✓ Items: backfilled translations on ${itemCount} docs`);

  // 3) Backfill translations on tags
  const tags = db.collection('tags');
  let tagCount = 0;
  const tagCursor = tags.find({});
  while (await tagCursor.hasNext()) {
    const doc = await tagCursor.next();
    if (doc.translations && doc.translations.cs) continue;
    const t = seedTranslations(doc, ['name', 'searchNames']);
    await tags.updateOne({ _id: doc._id }, { $set: { translations: t, updatedAt: new Date() } });
    tagCount++;
  }
  console.log(`✓ Tags: backfilled translations on ${tagCount} docs`);

  // 4) Backfill translations on recipes
  const recipes = db.collection('recipes');
  let recipeCount = 0;
  const recipeCursor = recipes.find({});
  while (await recipeCursor.hasNext()) {
    const doc = await recipeCursor.next();
    if (doc.translations && doc.translations.cs) continue;
    const t = seedTranslations(doc, ['name', 'description', 'instructions', 'searchNames']);
    await recipes.updateOne({ _id: doc._id }, { $set: { translations: t, updatedAt: new Date() } });
    recipeCount++;
  }
  console.log(`✓ Recipes: backfilled translations on ${recipeCount} docs`);

  // 5) Indexes for fast translation lookups
  await items.createIndex({ 'translations.cs.name': 1 });
  await items.createIndex({ 'translations.en.name': 1 });
  await tags.createIndex({ 'translations.cs.name': 1 });
  await categories.createIndex({ 'translations.cs.name': 1 }, { unique: true });
  console.log('✓ Indexes created');
}

async function down(db) {
  console.log('Removing translations + categoryId from items/tags/recipes...');
  await db.collection('items').updateMany({}, { $unset: { translations: '', categoryId: '' } });
  await db.collection('tags').updateMany({}, { $unset: { translations: '' } });
  await db.collection('recipes').updateMany({}, { $unset: { translations: '' } });
  await db.collection('categories').drop().catch(() => {});
  console.log('✓ Reverted');
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
