const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

const TYPED_UNITS = {
  weight: { units: ['mg', 'g', 'dkg', 'kg'], aliases: { ks: 'pcs' } },
  volume: { units: ['ml', 'cl', 'dl', 'l'] },
  count:  { units: ['pcs'] },
  length: { units: ['cm', 'm'] },
};

const ALIASES = {
  L: 'l',
  KG: 'kg', Kg: 'kg',
  G: 'g',
  MG: 'mg', Mg: 'mg',
  ML: 'ml', Ml: 'ml',
  CL: 'cl',
  DL: 'dl',
  DKG: 'dkg', Dkg: 'dkg',
  PCS: 'pcs', Pcs: 'pcs',
  ks: 'pcs', KS: 'pcs', Ks: 'pcs',
  piece: 'pcs', pieces: 'pcs',
  CM: 'cm', Cm: 'cm',
  M: 'm',
};

function normaliseUnit(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (!trimmed) return '';
  if (ALIASES[trimmed]) return ALIASES[trimmed];
  const lower = trimmed.toLowerCase();
  for (const t of Object.values(TYPED_UNITS)) {
    if (t.units.includes(lower)) return lower;
  }
  return trimmed;
}

function classifyUnit(unit) {
  const u = normaliseUnit(unit);
  for (const [type, def] of Object.entries(TYPED_UNITS)) {
    if (def.units.includes(u)) return { unitType: type, defaultUnit: u };
  }
  return { unitType: 'custom', defaultUnit: u || 'pcs' };
}

async function up(db) {
  console.log('Classifying items by unit type and normalising units...');

  const items = db.collection('items');
  const cursor = items.find({});
  let itemCount = 0;
  let alreadyDone = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc.unitType) { alreadyDone++; continue; }
    const { unitType, defaultUnit } = classifyUnit(doc.defaultUnit);
    await items.updateOne(
      { _id: doc._id },
      { $set: { unitType, defaultUnit } }
    );
    itemCount++;
  }
  console.log(`✓ Updated ${itemCount} items (${alreadyDone} already had unitType)`);

  console.log('Normalising recipe ingredient unit casing...');
  const recipes = db.collection('recipes');
  const recCursor = recipes.find({ ingredients: { $exists: true, $ne: [] } });
  let recipeCount = 0;
  let warningCount = 0;
  const warnings = db.collection('_unitMigrationWarnings');

  while (await recCursor.hasNext()) {
    const recipe = await recCursor.next();
    if (!Array.isArray(recipe.ingredients)) continue;
    let dirty = false;
    const updated = [];
    for (const ing of recipe.ingredients) {
      const norm = normaliseUnit(ing.unit);
      if (norm !== ing.unit && norm !== '') dirty = true;
      const next = { ...ing, unit: norm || ing.unit || '' };

      if (ing.itemId) {
        const item = await items.findOne({ _id: ing.itemId });
        if (item && item.unitType && item.unitType !== 'custom') {
          const allowed = TYPED_UNITS[item.unitType]?.units || [];
          if (next.unit && !allowed.includes(next.unit)) {
            await warnings.insertOne({
              recipeId: recipe._id,
              ingredientName: ing.itemName,
              storedUnit: ing.unit,
              normalisedUnit: next.unit,
              itemUnitType: item.unitType,
              allowedUnits: allowed,
              loggedAt: new Date(),
            });
            warningCount++;
          }
        }
      }
      updated.push(next);
    }
    if (dirty) {
      await recipes.updateOne({ _id: recipe._id }, { $set: { ingredients: updated } });
      recipeCount++;
    }
  }
  console.log(`✓ Updated ${recipeCount} recipes; logged ${warningCount} unit warnings`);
}

async function down(db) {
  console.log('Removing unitType from items (defaultUnit retained as-is)...');
  await db.collection('items').updateMany({}, { $unset: { unitType: '' } });
  await db.collection('_unitMigrationWarnings').drop().catch(() => {});
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
