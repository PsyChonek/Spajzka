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

    // Check if already installed
    const rolesCount = await db.collection('roles').countDocuments();
    if (rolesCount > 0) {
      console.log('System data already installed, skipping...');
      return;
    }

    console.log('Installing system data...');

    // Install roles
    const rolesPath = path.join(__dirname, 'install', 'roles.json');
    const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf-8'));
    if (rolesData.roles && rolesData.roles.length > 0) {
      const roles = rolesData.roles.map(parseExtendedJSON);
      await db.collection('roles').insertMany(roles);
      console.log(`✓ Installed ${roles.length} roles`);
    }

    // Install global items
    const globalItemsPath = path.join(__dirname, 'install', 'globalItems.json');
    const globalItemsData = JSON.parse(fs.readFileSync(globalItemsPath, 'utf-8'));
    if (globalItemsData.globalItems && globalItemsData.globalItems.length > 0) {
      const globalItems = globalItemsData.globalItems.map(parseExtendedJSON);
      await db.collection('globalItems').insertMany(globalItems);
      console.log(`✓ Installed ${globalItems.length} global items`);
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
