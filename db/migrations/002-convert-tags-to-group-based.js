/**
 * Migration: Convert tags from user-based to group-based
 * - Changes tags.userId to tags.groupId
 * - Migrates existing tags to use user's personal group
 * - Updates unique index from (userId, name) to (groupId, name)
 */

const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    console.log('Converting tags from user-based to group-based...');

    // Get all tags with userId
    const tags = await db.collection('tags').find({ userId: { $exists: true } }).toArray();

    if (tags.length > 0) {
      console.log(`  - Found ${tags.length} tags to migrate...`);

      // Process each tag
      for (const tag of tags) {
        // Find user's personal group
        const personalGroup = await db.collection('groups').findOne({
          'members.userId': tag.userId,
          isPersonal: true
        });

        if (!personalGroup) {
          console.warn(`    ⚠ Warning: No personal group found for userId ${tag.userId}, skipping tag ${tag._id}`);
          continue;
        }

        // Update tag to use groupId instead of userId
        await db.collection('tags').updateOne(
          { _id: tag._id },
          {
            $set: { groupId: personalGroup._id },
            $unset: { userId: "" }
          }
        );
      }

      console.log(`    ✓ Migrated ${tags.length} tags to group-based`);
    } else {
      console.log('  - No tags to migrate');
    }

    // Drop old unique index (userId + name)
    try {
      console.log('  - Dropping old unique index (userId + name)...');
      await db.collection('tags').dropIndex('userId_1_name_1');
      console.log('    ✓ Old index dropped');
    } catch (error) {
      if (error.code === 27) {
        console.log('    ℹ Old index does not exist, skipping');
      } else {
        throw error;
      }
    }

    // Create new unique index (groupId + name)
    console.log('  - Creating unique index on tags collection (groupId + name)...');
    await db.collection('tags').createIndex(
      { groupId: 1, name: 1 },
      { unique: true }
    );
    console.log('    ✓ New index created');

    console.log('✅ Tags successfully converted to group-based!');
  },

  async down(db) {
    console.log('Rolling back tags from group-based to user-based...');

    // Get all tags with groupId
    const tags = await db.collection('tags').find({ groupId: { $exists: true } }).toArray();

    if (tags.length > 0) {
      console.log(`  - Found ${tags.length} tags to rollback...`);

      // Process each tag
      for (const tag of tags) {
        // Find a user in the group (use the first admin, or first member)
        const group = await db.collection('groups').findOne({ _id: tag.groupId });

        if (!group || !group.members || group.members.length === 0) {
          console.warn(`    ⚠ Warning: No group or members found for groupId ${tag.groupId}, skipping tag ${tag._id}`);
          continue;
        }

        // Use the first admin, or first member as the owner
        const admin = group.members.find(m => m.role === 'admin');
        const userId = admin ? admin.userId : group.members[0].userId;

        // Update tag to use userId instead of groupId
        await db.collection('tags').updateOne(
          { _id: tag._id },
          {
            $set: { userId: userId },
            $unset: { groupId: "" }
          }
        );
      }

      console.log(`    ✓ Rolled back ${tags.length} tags to user-based`);
    } else {
      console.log('  - No tags to rollback');
    }

    // Drop new unique index (groupId + name)
    try {
      console.log('  - Dropping unique index (groupId + name)...');
      await db.collection('tags').dropIndex('groupId_1_name_1');
      console.log('    ✓ Index dropped');
    } catch (error) {
      if (error.code === 27) {
        console.log('    ℹ Index does not exist, skipping');
      } else {
        throw error;
      }
    }

    // Recreate old unique index (userId + name)
    console.log('  - Creating unique index on tags collection (userId + name)...');
    await db.collection('tags').createIndex(
      { userId: 1, name: 1 },
      { unique: true }
    );
    console.log('    ✓ Old index recreated');

    console.log('✅ Tags rolled back to user-based successfully!');
  }
};
