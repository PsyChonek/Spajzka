const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';

// Helper to parse MongoDB Extended JSON
function parseExtendedJSON(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(parseExtendedJSON);
  }

  if (obj.$oid) {
    const { ObjectId } = require('mongodb');
    return new ObjectId(obj.$oid);
  }

  if (obj.$date) {
    return new Date(obj.$date);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = parseExtendedJSON(value);
  }
  return result;
}

async function installSystemData() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB for system installation');

    const db = client.db(DB_NAME);

    console.log('Installing/updating system data...');

    // Install roles (upsert to update existing ones)
    const rolesPath = path.join(__dirname, 'install', 'roles.json');
    const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf-8'));
    if (rolesData.roles && rolesData.roles.length > 0) {
      const roles = rolesData.roles.map(parseExtendedJSON);

      let rolesInserted = 0;
      let rolesUpdated = 0;
      for (const role of roles) {
        const result = await db.collection('roles').updateOne(
          { _id: role._id },
          { $set: role },
          { upsert: true }
        );
        if (result.upsertedCount > 0) rolesInserted++;
        if (result.modifiedCount > 0) rolesUpdated++;
      }

      console.log(`✓ Roles: ${rolesInserted} inserted, ${rolesUpdated} updated, ${roles.length - rolesInserted - rolesUpdated} unchanged`);
    }

    // Install global items (upsert to update existing ones)
    const globalItemsPath = path.join(__dirname, 'install', 'globalItems.json');
    const globalItemsData = JSON.parse(fs.readFileSync(globalItemsPath, 'utf-8'));
    if (globalItemsData.globalItems && globalItemsData.globalItems.length > 0) {
      const globalItems = globalItemsData.globalItems.map(item => {
        const parsedItem = parseExtendedJSON(item);
        // Add itemType field for unified collection
        parsedItem.itemType = 'global';
        return parsedItem;
      });

      let itemsInserted = 0;
      let itemsUpdated = 0;
      for (const item of globalItems) {
        const result = await db.collection('items').updateOne(
          { _id: item._id, itemType: 'global' },
          { $set: item },
          { upsert: true }
        );
        if (result.upsertedCount > 0) itemsInserted++;
        if (result.modifiedCount > 0) itemsUpdated++;
      }

      console.log(`✓ Global items: ${itemsInserted} inserted, ${itemsUpdated} updated, ${globalItems.length - itemsInserted - itemsUpdated} unchanged`);
    }

    // Install global recipes (upsert to update existing ones)
    const globalRecipesPath = path.join(__dirname, 'install', 'globalRecipes.json');
    const globalRecipesData = JSON.parse(fs.readFileSync(globalRecipesPath, 'utf-8'));
    if (globalRecipesData.recipes && globalRecipesData.recipes.length > 0) {
      const globalRecipes = globalRecipesData.recipes.map(parseExtendedJSON);

      let recipesInserted = 0;
      let recipesUpdated = 0;
      for (const recipe of globalRecipes) {
        const result = await db.collection('recipes').updateOne(
          { _id: recipe._id },
          { $set: recipe },
          { upsert: true }
        );
        if (result.upsertedCount > 0) recipesInserted++;
        if (result.modifiedCount > 0) recipesUpdated++;
      }

      console.log(`✓ Global recipes: ${recipesInserted} inserted, ${recipesUpdated} updated, ${globalRecipes.length - recipesInserted - recipesUpdated} unchanged`);
    }

    console.log('System installation completed successfully!');
  } catch (error) {
    console.error('Error installing system data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run installation
installSystemData();
