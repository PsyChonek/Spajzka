const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

// Czech translations for the install fixture's global items, keyed by their
// stable `_id`. Migration 012 backfilled both locales with the English
// source, so cs.name == en.name == "Milk" everywhere. This migration only
// rewrites cs.* when the existing cs.name is identical to en.name (i.e. the
// 012 placeholder), so user-edited translations are preserved.
const ITEM_TRANSLATIONS = {
  '000000000000000000000001': { en: 'Milk',       cs: 'Mléko' },
  '000000000000000000000002': { en: 'Bread',      cs: 'Chléb' },
  '000000000000000000000003': { en: 'Eggs',       cs: 'Vejce' },
  '000000000000000000000004': { en: 'Butter',     cs: 'Máslo' },
  '000000000000000000000005': { en: 'Cheese',     cs: 'Sýr' },
  '000000000000000000000006': { en: 'Tomatoes',   cs: 'Rajčata' },
  '000000000000000000000007': { en: 'Potatoes',   cs: 'Brambory' },
  '000000000000000000000008': { en: 'Onions',     cs: 'Cibule' },
  '000000000000000000000009': { en: 'Apples',     cs: 'Jablka' },
  '00000000000000000000000a': { en: 'Bananas',    cs: 'Banány' },
  '00000000000000000000000b': { en: 'Rice',       cs: 'Rýže' },
  '00000000000000000000000c': { en: 'Pasta',      cs: 'Těstoviny' },
  '00000000000000000000000d': { en: 'Chicken',    cs: 'Kuřecí maso' },
  '00000000000000000000000e': { en: 'Beef',       cs: 'Hovězí maso' },
  '00000000000000000000000f': { en: 'Fish',       cs: 'Ryba' },
  '000000000000000000000010': { en: 'Sugar',      cs: 'Cukr' },
  '000000000000000000000011': { en: 'Salt',       cs: 'Sůl' },
  '000000000000000000000012': { en: 'Flour',      cs: 'Mouka' },
  '000000000000000000000013': { en: 'Oil',        cs: 'Olej' },
  '000000000000000000000014': { en: 'Coffee',     cs: 'Káva' },
  '000000000000000000000015': { en: 'Tea',        cs: 'Čaj' },
  '000000000000000000000016': { en: 'Yogurt',     cs: 'Jogurt' },
  '000000000000000000000017': { en: 'Carrots',    cs: 'Mrkev' },
  '000000000000000000000018': { en: 'Cucumbers',  cs: 'Okurky' },
  '000000000000000000000019': { en: 'Garlic',     cs: 'Česnek' },
  '00000000000000000000001a': { en: 'Oranges',    cs: 'Pomeranče' },
  '00000000000000000000001b': { en: 'Pork',       cs: 'Vepřové maso' },
  '00000000000000000000001c': { en: 'Chocolate',  cs: 'Čokoláda' },
};

// Category translations applied by exact category-name match. Multiple
// English categories map to the same Czech category — that's intentional.
const CATEGORY_TRANSLATIONS = {
  'Dairy':       { en: 'Dairy',           cs: 'Mléčné výrobky' },
  'Bakery':      { en: 'Bakery',          cs: 'Pečivo' },
  'Vegetables':  { en: 'Vegetables',      cs: 'Zelenina' },
  'Fruits':      { en: 'Fruits',          cs: 'Ovoce' },
  'Grains':      { en: 'Grains',          cs: 'Obiloviny' },
  'Meat':        { en: 'Meat',            cs: 'Maso' },
  'Seafood':     { en: 'Seafood',         cs: 'Mořské plody' },
  'Pantry':      { en: 'Pantry',          cs: 'Spajzka' },
  'Beverages':   { en: 'Beverages',       cs: 'Nápoje' },
  'Sweets':      { en: 'Sweets',          cs: 'Sladkosti' },
  'Other':       { en: 'Other',           cs: 'Ostatní' },
};

async function up(db) {
  const items = db.collection('items');
  let touched = 0;

  for (const [oid, { en, cs }] of Object.entries(ITEM_TRANSLATIONS)) {
    const _id = new ObjectId(oid);
    // Update both the global item itself AND any group copies that reference
    // it via globalItemRef. Only touches docs whose cs.name still matches the
    // 012 placeholder (== en source) so user customizations survive.
    const docs = await items.find(
      { $or: [{ _id }, { globalItemRef: _id }] }
    ).toArray();

    for (const doc of docs) {
      const update = {};
      if (doc.translations?.cs?.name === en) {
        update['translations.cs.name'] = cs;
      }
      if (!doc.translations?.en?.name) {
        update['translations.en.name'] = en;
      }
      if (Object.keys(update).length > 0) {
        update.updatedAt = new Date();
        await items.updateOne({ _id: doc._id }, { $set: update });
        touched++;
      }
    }
  }
  console.log(`✓ Items: ${touched} translation(s) updated`);

  // Categories: update by translation match (post-012 the cs.name matches the
  // English source) and skip when already translated. Skip when the target
  // Czech name is already taken by another category — the unique index on
  // translations.cs.name (added in 012) forbids duplicates; the older entry
  // wins until an admin merges them via the categories UI.
  const categories = db.collection('categories');
  let catTouched = 0;
  let catSkipped = 0;
  for (const [enName, { en, cs }] of Object.entries(CATEGORY_TRANSLATIONS)) {
    const cat = await categories.findOne({ 'translations.en.name': enName });
    if (!cat) continue;
    if (cat.translations?.cs?.name && cat.translations.cs.name !== en) continue; // user customised
    if (cat.translations?.cs?.name === cs) continue; // already correct
    const collision = await categories.findOne({
      'translations.cs.name': cs,
      _id: { $ne: cat._id }
    });
    if (collision) {
      catSkipped++;
      continue;
    }
    await categories.updateOne(
      { _id: cat._id },
      { $set: { 'translations.cs.name': cs, 'translations.en.name': en, updatedAt: new Date() } }
    );
    catTouched++;
  }
  console.log(`✓ Categories: ${catTouched} translated, ${catSkipped} skipped (duplicate cs.name)`);
}

async function down(db) {
  // Down: restore cs.name to en.name for the items we touched. Best-effort —
  // user customisations after this migration would also be reverted.
  const items = db.collection('items');
  for (const [oid, { en }] of Object.entries(ITEM_TRANSLATIONS)) {
    const _id = new ObjectId(oid);
    const docs = await items.find({ $or: [{ _id }, { globalItemRef: _id }] }).toArray();
    for (const doc of docs) {
      await items.updateOne(
        { _id: doc._id },
        { $set: { 'translations.cs.name': en, updatedAt: new Date() } }
      );
    }
  }
  const categories = db.collection('categories');
  for (const [enName, { en }] of Object.entries(CATEGORY_TRANSLATIONS)) {
    await categories.updateMany(
      { 'translations.en.name': enName },
      { $set: { 'translations.cs.name': en, updatedAt: new Date() } }
    );
  }
  console.log('✓ Reverted Czech item/category translations');
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
