const { ObjectId } = require('mongodb');

/**
 * Migration 003: Merge globalItems and groupItems into single items collection
 *
 * This migration:
 * 1. Merges globalItems and groupItems into a unified items collection
 * 2. Adds itemType field ('global' or 'group') to distinguish between item types
 * 3. Updates all references in pantry and shopping collections
 * 4. Maintains backward compatibility by keeping globalItemRef for group items
 */

async function up(db) {
  console.log('\n=== Migration 003: Merge Items Collections ===\n');

  // Step 1: Copy all global items to the new items collection
  const globalItems = await db.collection('globalItems').find({}).toArray();
  console.log(`Found ${globalItems.length} global items to migrate`);

  const globalItemIdMap = new Map(); // Map old _id to new _id

  for (const globalItem of globalItems) {
    const oldId = globalItem._id;
    delete globalItem._id; // Remove old _id to get a new one

    const newItem = {
      ...globalItem,
      itemType: 'global',
      // Keep isActive field for global items
      isActive: globalItem.isActive !== undefined ? globalItem.isActive : true,
      createdAt: globalItem.createdAt || new Date(),
      updatedAt: globalItem.updatedAt || new Date()
    };

    const result = await db.collection('items').insertOne(newItem);
    globalItemIdMap.set(oldId.toString(), result.insertedId);
    console.log(`  ✓ Migrated global item: ${newItem.name} (${oldId} → ${result.insertedId})`);
  }

  // Step 2: Copy all group items to the new items collection
  const groupItems = await db.collection('groupItems').find({}).toArray();
  console.log(`\nFound ${groupItems.length} group items to migrate`);

  const groupItemIdMap = new Map(); // Map old _id to new _id

  for (const groupItem of groupItems) {
    const oldId = groupItem._id;
    delete groupItem._id; // Remove old _id to get a new one

    // Update globalItemRef to point to new item ID if it exists
    let newGlobalItemRef = groupItem.globalItemRef;
    if (groupItem.globalItemRef) {
      const refString = groupItem.globalItemRef.toString();
      if (globalItemIdMap.has(refString)) {
        newGlobalItemRef = globalItemIdMap.get(refString);
      }
    }

    const newItem = {
      ...groupItem,
      itemType: 'group',
      globalItemRef: newGlobalItemRef || null,
      groupId: groupItem.groupId,
      createdBy: groupItem.createdBy || null,
      createdAt: groupItem.createdAt || new Date(),
      updatedAt: groupItem.updatedAt || new Date()
    };

    // Remove isActive field from group items (only global items have it)
    delete newItem.isActive;

    const result = await db.collection('items').insertOne(newItem);
    groupItemIdMap.set(oldId.toString(), result.insertedId);
    console.log(`  ✓ Migrated group item: ${newItem.name} (${oldId} → ${result.insertedId})`);
  }

  // Step 3: Update pantry references
  console.log('\nUpdating pantry references...');
  const pantryItems = await db.collection('pantry').find({}).toArray();
  let pantryUpdated = 0;

  for (const pantryItem of pantryItems) {
    const oldItemId = pantryItem.itemId.toString();
    let newItemId = null;

    // Check if it's a global or group item and get the new ID
    if (pantryItem.itemType === 'global' && globalItemIdMap.has(oldItemId)) {
      newItemId = globalItemIdMap.get(oldItemId);
    } else if (pantryItem.itemType === 'group' && groupItemIdMap.has(oldItemId)) {
      newItemId = groupItemIdMap.get(oldItemId);
    }

    if (newItemId) {
      await db.collection('pantry').updateOne(
        { _id: pantryItem._id },
        { $set: { itemId: newItemId } }
      );
      pantryUpdated++;
    }
  }
  console.log(`  ✓ Updated ${pantryUpdated} pantry item references`);

  // Step 4: Update shopping references
  console.log('\nUpdating shopping references...');
  const shoppingItems = await db.collection('shopping').find({}).toArray();
  let shoppingUpdated = 0;

  for (const shoppingItem of shoppingItems) {
    const oldItemId = shoppingItem.itemId.toString();
    let newItemId = null;

    // Check if it's a global or group item and get the new ID
    if (shoppingItem.itemType === 'global' && globalItemIdMap.has(oldItemId)) {
      newItemId = globalItemIdMap.get(oldItemId);
    } else if (shoppingItem.itemType === 'group' && groupItemIdMap.has(oldItemId)) {
      newItemId = groupItemIdMap.get(oldItemId);
    }

    if (newItemId) {
      await db.collection('shopping').updateOne(
        { _id: shoppingItem._id },
        { $set: { itemId: newItemId } }
      );
      shoppingUpdated++;
    }
  }
  console.log(`  ✓ Updated ${shoppingUpdated} shopping item references`);

  // Step 5: Create indexes on the new items collection
  console.log('\nCreating indexes on items collection...');
  await db.collection('items').createIndex({ itemType: 1 });
  await db.collection('items').createIndex({ groupId: 1 });
  await db.collection('items').createIndex({ globalItemRef: 1 });
  await db.collection('items').createIndex({ name: 1 });
  await db.collection('items').createIndex({ category: 1 });
  await db.collection('items').createIndex({ isActive: 1 });
  console.log('  ✓ Indexes created');

  console.log('\n=== Migration 003 completed successfully ===');
  console.log('⚠️  Note: Old collections (globalItems, groupItems) are kept for safety.');
  console.log('⚠️  After verifying the migration, you can manually drop them.\n');
}

/**
 * Rollback migration 003
 *
 * This will restore the separate globalItems and groupItems collections
 * WARNING: This assumes the old collections still exist
 */
async function down(db) {
  console.log('\n=== Rolling back Migration 003 ===\n');

  // Check if old collections exist
  const collections = await db.listCollections().toArray();
  const hasGlobalItems = collections.some(c => c.name === 'globalItems');
  const hasGroupItems = collections.some(c => c.name === 'groupItems');

  if (!hasGlobalItems || !hasGroupItems) {
    console.error('❌ Cannot rollback: Original collections (globalItems, groupItems) not found');
    console.error('The old collections may have been dropped. Manual restoration required.');
    throw new Error('Rollback not possible - original collections missing');
  }

  // Get ID mappings from the items collection before we modify anything
  const items = await db.collection('items').find({}).toArray();

  const globalItemIdMap = new Map(); // new ID → old ID
  const groupItemIdMap = new Map();

  // Build reverse mappings by comparing data
  for (const item of items) {
    if (item.itemType === 'global') {
      const oldGlobalItem = await db.collection('globalItems').findOne({
        name: item.name,
        category: item.category
      });
      if (oldGlobalItem) {
        globalItemIdMap.set(item._id.toString(), oldGlobalItem._id);
      }
    } else if (item.itemType === 'group') {
      const oldGroupItem = await db.collection('groupItems').findOne({
        name: item.name,
        category: item.category,
        groupId: item.groupId
      });
      if (oldGroupItem) {
        groupItemIdMap.set(item._id.toString(), oldGroupItem._id);
      }
    }
  }

  // Restore pantry references
  console.log('Restoring pantry references...');
  const pantryItems = await db.collection('pantry').find({}).toArray();
  let pantryRestored = 0;

  for (const pantryItem of pantryItems) {
    const newItemId = pantryItem.itemId.toString();
    let oldItemId = null;

    if (pantryItem.itemType === 'global' && globalItemIdMap.has(newItemId)) {
      oldItemId = globalItemIdMap.get(newItemId);
    } else if (pantryItem.itemType === 'group' && groupItemIdMap.has(newItemId)) {
      oldItemId = groupItemIdMap.get(newItemId);
    }

    if (oldItemId) {
      await db.collection('pantry').updateOne(
        { _id: pantryItem._id },
        { $set: { itemId: oldItemId } }
      );
      pantryRestored++;
    }
  }
  console.log(`  ✓ Restored ${pantryRestored} pantry item references`);

  // Restore shopping references
  console.log('Restoring shopping references...');
  const shoppingItems = await db.collection('shopping').find({}).toArray();
  let shoppingRestored = 0;

  for (const shoppingItem of shoppingItems) {
    const newItemId = shoppingItem.itemId.toString();
    let oldItemId = null;

    if (shoppingItem.itemType === 'global' && globalItemIdMap.has(newItemId)) {
      oldItemId = globalItemIdMap.get(newItemId);
    } else if (shoppingItem.itemType === 'group' && groupItemIdMap.has(newItemId)) {
      oldItemId = groupItemIdMap.get(newItemId);
    }

    if (oldItemId) {
      await db.collection('shopping').updateOne(
        { _id: shoppingItem._id },
        { $set: { itemId: oldItemId } }
      );
      shoppingRestored++;
    }
  }
  console.log(`  ✓ Restored ${shoppingRestored} shopping item references`);

  // Drop the unified items collection
  await db.collection('items').drop();
  console.log('  ✓ Dropped items collection');

  console.log('\n=== Migration 003 rollback completed ===\n');
}

module.exports = { up, down };
