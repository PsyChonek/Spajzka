const { ObjectId } = require('mongodb');

/**
 * Migration: Groups and Items Schema Update
 * - Migrates Groups: Convert memberIds array to members array with roles
 * - Migrates Items to GlobalItems and GroupItems
 * - Updates Pantry and Shopping item references
 * - Creates personal groups for users without groups
 */

async function up(db) {
  console.log('Running migration: 001_groups_and_items_schema');

  // 1. Migrate Groups: Convert memberIds array to members array with roles
  console.log('\n1. Migrating Groups schema...');
  const groups = await db.collection('groups').find({}).toArray();

  for (const group of groups) {
    // Check if already migrated
    if (group.members) {
      console.log(`  - Group "${group.name}" already migrated, skipping`);
      continue;
    }

    const members = [];

    // Add admin
    if (group.adminId) {
      members.push({
        userId: group.adminId,
        role: 'admin'
      });
    }

    // Add other members as 'member' role
    if (group.memberIds && Array.isArray(group.memberIds)) {
      for (const memberId of group.memberIds) {
        // Skip if already added as admin
        if (group.adminId && memberId.toString() === group.adminId.toString()) {
          continue;
        }
        members.push({
          userId: memberId,
          role: 'member'
        });
      }
    }

    // Add isPersonal flag (all existing groups are shared)
    await db.collection('groups').updateOne(
      { _id: group._id },
      {
        $set: {
          members: members,
          isPersonal: false
        },
        $unset: {
          memberIds: ""
        }
      }
    );

    console.log(`  ✓ Migrated group "${group.name}" with ${members.length} members`);
  }

  // 2. Migrate Items to GlobalItems and GroupItems
  console.log('\n2. Migrating Items to GlobalItems and GroupItems...');

  const items = await db.collection('items').find({}).toArray();

  if (items.length === 0) {
    console.log('  ℹ No items to migrate (collection is empty or already migrated)');
  } else {
    const globalItems = [];
    const groupItems = [];

    for (const item of items) {
      // If item has groupId, it's a group item, otherwise global
      if (item.groupId) {
        groupItems.push({
          _id: item._id,
          groupId: item.groupId,
          name: item.name,
          category: item.category || 'Uncategorized',
          icon: item.icon,
          defaultUnit: item.defaultUnit,
          barcode: item.barcode,
          createdBy: item.createdBy,
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date()
        });
      } else {
        globalItems.push({
          _id: item._id,
          name: item.name,
          category: item.category || 'Uncategorized',
          icon: item.icon,
          defaultUnit: item.defaultUnit,
          barcode: item.barcode,
          createdBy: item.createdBy,
          isActive: true,
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date()
        });
      }
    }

    // Use upsert to avoid duplicate key errors
    let globalInserted = 0;
    let globalUpdated = 0;
    for (const item of globalItems) {
      const result = await db.collection('globalItems').updateOne(
        { _id: item._id },
        { $set: item },
        { upsert: true }
      );
      if (result.upsertedCount > 0) globalInserted++;
      if (result.modifiedCount > 0) globalUpdated++;
    }

    let groupInserted = 0;
    let groupUpdated = 0;
    for (const item of groupItems) {
      const result = await db.collection('groupItems').updateOne(
        { _id: item._id },
        { $set: item },
        { upsert: true }
      );
      if (result.upsertedCount > 0) groupInserted++;
      if (result.modifiedCount > 0) groupUpdated++;
    }

    if (globalItems.length > 0) {
      console.log(`  ✓ Migrated ${globalInserted} global items (${globalUpdated} updated, ${globalItems.length - globalInserted - globalUpdated} unchanged)`);
    }

    if (groupItems.length > 0) {
      console.log(`  ✓ Migrated ${groupInserted} group items (${groupUpdated} updated, ${groupItems.length - groupInserted - groupUpdated} unchanged)`);
    }
  }

  // 3. Update Pantry references
  console.log('\n3. Updating Pantry item references...');
  const pantryItems = await db.collection('pantry').find({}).toArray();

  let pantryUpdated = 0;
  for (const pantryItem of pantryItems) {
    if (!pantryItem.itemId) continue;

    // Skip if already has itemType
    if (pantryItem.itemType) continue;

    // Check if this item is in groupItems or globalItems
    const groupItem = await db.collection('groupItems').findOne({ _id: pantryItem.itemId });
    const globalItem = await db.collection('globalItems').findOne({ _id: pantryItem.itemId });

    const itemType = groupItem ? 'group' : (globalItem ? 'global' : 'global');

    await db.collection('pantry').updateOne(
      { _id: pantryItem._id },
      {
        $set: {
          itemType: itemType
        }
      }
    );
    pantryUpdated++;
  }
  console.log(`  ✓ Updated ${pantryUpdated} pantry items`);

  // 4. Update Shopping references
  console.log('\n4. Updating Shopping item references...');
  const shoppingItems = await db.collection('shopping').find({}).toArray();

  let shoppingUpdated = 0;
  for (const shoppingItem of shoppingItems) {
    if (!shoppingItem.itemId) continue;

    // Skip if already has itemType
    if (shoppingItem.itemType) continue;

    const groupItem = await db.collection('groupItems').findOne({ _id: shoppingItem.itemId });
    const globalItem = await db.collection('globalItems').findOne({ _id: shoppingItem.itemId });

    const itemType = groupItem ? 'group' : (globalItem ? 'global' : 'global');

    await db.collection('shopping').updateOne(
      { _id: shoppingItem._id },
      {
        $set: {
          itemType: itemType
        }
      }
    );
    shoppingUpdated++;
  }
  console.log(`  ✓ Updated ${shoppingUpdated} shopping items`);

  // 5. Create personal groups for users without groups
  console.log('\n5. Creating personal groups for users without groups...');
  const users = await db.collection('users').find({}).toArray();

  for (const user of users) {
    // Check if user is already in a group
    const userGroup = await db.collection('groups').findOne({
      'members.userId': user._id
    });

    if (!userGroup) {
      // Create personal group
      const personalGroup = {
        name: `${user.name}'s Personal Group`,
        isPersonal: true,
        members: [{
          userId: user._id,
          role: 'admin'
        }],
        inviteEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('groups').insertOne(personalGroup);

      // Update user with personalGroupId
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            personalGroupId: result.insertedId,
            isAnonymous: false
          }
        }
      );

      console.log(`  ✓ Created personal group for user "${user.name}"`);
    }
  }

  // 6. Rename old items collection (backup)
  console.log('\n6. Backing up old items collection...');
  const itemsCollectionExists = await db.listCollections({ name: 'items' }).hasNext();
  if (itemsCollectionExists) {
    await db.collection('items').rename('items_backup_' + Date.now());
    console.log('  ✓ Old items collection backed up');
  }

  console.log('\n✅ Migration 001 completed successfully!');
}

async function down(db) {
  console.log('Rolling back migration: 001_groups_and_items_schema');
  console.log('⚠️  Warning: Rollback not fully implemented for this migration');

  // Note: Full rollback is complex and would require restoring from backup
  // This is a destructive migration that should be carefully tested before running
}

module.exports = { up, down };
