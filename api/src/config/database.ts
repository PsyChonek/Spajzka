import { MongoClient, Db } from 'mongodb';

let db: Db | null = null;
let client: MongoClient | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'spajzka';

  console.log(`Connecting to MongoDB at ${mongoUrl}...`);

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('Successfully connected to MongoDB');

    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log('Database connection closed');
    client = null;
    db = null;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}
