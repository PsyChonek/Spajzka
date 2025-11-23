const { ObjectId } = require('mongodb');

/**
 * Migration 002: Convert to Referenced Items System
 *
 * This migration:
 * 1. Copies all global items to each group with references
 * 2. Copies all global recipes to each group with references
 * 3. Adds globalItemRef and globalRecipeRef fields to track the source
 */

async function up(db) {
  console.log('\n=== Migration 002: Convert to Referenced Items System ===\n');

  // Step 1: Get all global items to copy
  const globalItems = await db.collection('globalItems').find({ isActive: true }).toArray();
  console.log(`Found ${globalItems.length} active global items`);

  // Step 2: Get all groups
  const groups = await db.collection('groups').find({}).toArray();
  console.log(`Found ${groups.length} groups`);

  // Step 3: For each group, create referenced group items for all global items
  let itemsCreated = 0;

  for (const group of groups) {
    console.log(`\nProcessing group: ${group.name} (${group._id})`);

    // Check which global items don't have a corresponding group item yet
    const existingGroupItems = await db.collection('groupItems').find({
      groupId: group._id,
      globalItemRef: { $exists: true }
    }).toArray();

    const existingRefs = new Set(
      existingGroupItems
        .filter(item => item.globalItemRef)
        .map(item => item.globalItemRef.toString())
    );

    for (const globalItem of globalItems) {
      const globalItemId = globalItem._id.toString();

      // Skip if this group already has a reference to this global item
      if (existingRefs.has(globalItemId)) {
        console.log(`  - Skipping ${globalItem.name} (already exists)`);
        continue;
      }

      // Create a group item that references the global item
      const groupItem = {
        groupId: group._id,
        globalItemRef: globalItem._id,
        name: globalItem.name,
        category: globalItem.category,
        icon: globalItem.icon || null,
        defaultUnit: globalItem.defaultUnit || null,
        barcode: globalItem.barcode || null,
        searchNames: globalItem.searchNames || [],
        tags: globalItem.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('groupItems').insertOne(groupItem);
      itemsCreated++;
      console.log(`  + Created group item for: ${globalItem.name}`);
    }
  }

  console.log(`\n✓ Created ${itemsCreated} new group items with references`);

  // Step 4: Get all global recipes to copy
  const globalRecipes = await db.collection('recipes').find({ recipeType: 'global' }).toArray();
  console.log(`\nFound ${globalRecipes.length} global recipes`);

  // Step 5: For each group, create referenced group recipes for all global recipes
  let recipesCreated = 0;

  for (const group of groups) {
    console.log(`\nProcessing recipes for group: ${group.name} (${group._id})`);

    // Check which global recipes don't have a corresponding group recipe yet
    const existingGroupRecipes = await db.collection('recipes').find({
      groupId: group._id,
      globalRecipeRef: { $exists: true }
    }).toArray();

    const existingRecipeRefs = new Set(
      existingGroupRecipes
        .filter(recipe => recipe.globalRecipeRef)
        .map(recipe => recipe.globalRecipeRef.toString())
    );

    for (const globalRecipe of globalRecipes) {
      const globalRecipeId = globalRecipe._id.toString();

      // Skip if this group already has a reference to this global recipe
      if (existingRecipeRefs.has(globalRecipeId)) {
        console.log(`  - Skipping ${globalRecipe.name} (already exists)`);
        continue;
      }

      // Create a group recipe that references the global recipe
      const groupRecipe = {
        groupId: group._id,
        globalRecipeRef: globalRecipe._id,
        name: globalRecipe.name,
        description: globalRecipe.description || null,
        icon: globalRecipe.icon || null,
        recipeType: 'group',
        servings: globalRecipe.servings || 1,
        ingredients: globalRecipe.ingredients || [],
        instructions: globalRecipe.instructions || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('recipes').insertOne(groupRecipe);
      recipesCreated++;
      console.log(`  + Created group recipe for: ${globalRecipe.name}`);
    }
  }

  console.log(`\n✓ Created ${recipesCreated} new group recipes with references`);

  console.log('\n=== Migration 002 completed successfully ===\n');
}

/**
 * Rollback migration 002
 *
 * This will remove all group items and recipes that have references to global items/recipes
 */
async function down(db) {
  console.log('\n=== Rolling back Migration 002 ===\n');

  // Remove all group items that have globalItemRef
  const itemsResult = await db.collection('groupItems').deleteMany({
    globalItemRef: { $exists: true }
  });
  console.log(`Removed ${itemsResult.deletedCount} group items with global references`);

  // Remove all group recipes that have globalRecipeRef
  const recipesResult = await db.collection('recipes').deleteMany({
    recipeType: 'group',
    globalRecipeRef: { $exists: true }
  });
  console.log(`Removed ${recipesResult.deletedCount} group recipes with global references`);

  console.log('\n=== Migration 002 rollback completed ===\n');
}

module.exports = { up, down };
