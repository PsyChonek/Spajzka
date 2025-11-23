/**
 * Migration: Add tags support
 * - Adds tags field to recipes, globalItems, and groupItems collections
 * - Creates tags collection with unique index
 */

module.exports = {
  async up(db) {
    console.log('Adding tags support...');

    // Add tags field to recipes collection (empty array for existing documents)
    const recipesCount = await db.collection('recipes').countDocuments({ tags: { $exists: false } });
    if (recipesCount > 0) {
      console.log(`  - Adding tags field to ${recipesCount} recipes...`);
      await db.collection('recipes').updateMany(
        { tags: { $exists: false } },
        { $set: { tags: [] } }
      );
      console.log(`    ✓ Updated ${recipesCount} recipes`);
    }

    // Add tags field to globalItems collection
    const globalItemsCount = await db.collection('globalItems').countDocuments({ tags: { $exists: false } });
    if (globalItemsCount > 0) {
      console.log(`  - Adding tags field to ${globalItemsCount} global items...`);
      await db.collection('globalItems').updateMany(
        { tags: { $exists: false } },
        { $set: { tags: [] } }
      );
      console.log(`    ✓ Updated ${globalItemsCount} global items`);
    }

    // Add tags field to groupItems collection
    const groupItemsCount = await db.collection('groupItems').countDocuments({ tags: { $exists: false } });
    if (groupItemsCount > 0) {
      console.log(`  - Adding tags field to ${groupItemsCount} group items...`);
      await db.collection('groupItems').updateMany(
        { tags: { $exists: false } },
        { $set: { tags: [] } }
      );
      console.log(`    ✓ Updated ${groupItemsCount} group items`);
    }

    // Create unique index on tags collection (userId + name)
    console.log('  - Creating unique index on tags collection...');
    await db.collection('tags').createIndex(
      { userId: 1, name: 1 },
      { unique: true }
    );
    console.log('    ✓ Index created');

    console.log('✅ Tags support added successfully!');
  },

  async down(db) {
    console.log('Rolling back tags support...');

    // Remove tags field from recipes
    console.log('  - Removing tags field from recipes...');
    await db.collection('recipes').updateMany(
      {},
      { $unset: { tags: "" } }
    );

    // Remove tags field from globalItems
    console.log('  - Removing tags field from globalItems...');
    await db.collection('globalItems').updateMany(
      {},
      { $unset: { tags: "" } }
    );

    // Remove tags field from groupItems
    console.log('  - Removing tags field from groupItems...');
    await db.collection('groupItems').updateMany(
      {},
      { $unset: { tags: "" } }
    );

    // Drop tags collection
    console.log('  - Dropping tags collection...');
    await db.collection('tags').drop();

    console.log('✅ Tags support rolled back successfully!');
  }
};
