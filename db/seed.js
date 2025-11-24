const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'spajzka';
const SEED_DIR = path.join(__dirname, 'seed');

/**
 * Recursively converts MongoDB Extended JSON format to native types
 * Handles $oid, $date, etc.
 */
function convertExtendedJSON(obj) {
	if (obj === null || obj === undefined) {
		return obj;
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map(item => convertExtendedJSON(item));
	}

	// Handle objects
	if (typeof obj === 'object') {
		// Check for Extended JSON formats
		if (obj.$oid) {
			return new ObjectId(obj.$oid);
		}
		if (obj.$date) {
			return new Date(obj.$date);
		}

		// Recursively process all properties
		const result = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = convertExtendedJSON(value);
		}
		return result;
	}

	// Return primitive values as-is
	return obj;
}

async function seed() {
	const client = new MongoClient(MONGO_URL);

	try {
		await client.connect();
		console.log('Connected to MongoDB');

		const db = client.db(DB_NAME);

		// Read all JSON files from seed directory
		const files = fs.readdirSync(SEED_DIR).filter(file => file.endsWith('.json'));

		for (const file of files) {
			const collectionName = path.basename(file, '.json').toLowerCase();
			const filePath = path.join(SEED_DIR, file);

			console.log(`\nProcessing ${file}...`);

			try {
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const data = JSON.parse(fileContent);

				// Extract the array from the JSON structure
				// Expected format: { "collectionName": [...] }
				const dataKey = Object.keys(data)[0];
				const documents = data[dataKey];

				if (!Array.isArray(documents)) {
					console.error(`Error: ${file} does not contain an array of documents`);
					continue;
				}

				if (documents.length === 0) {
					console.log(`Skipping ${file} - no documents to seed`);
					continue;
				}

				// Convert MongoDB Extended JSON format ($oid) to ObjectId
				const processedDocuments = documents.map(doc => {
					const converted = convertExtendedJSON(doc);
					// Add itemType field for groupItems collection
					if (collectionName === 'groupitems') {
						converted.itemType = 'group';
					}
					return converted;
				});

				// Map groupItems to items collection
				const targetCollection = collectionName === 'groupitems' ? 'items' : collectionName;
				const collection = db.collection(targetCollection);

				// Upsert each document	
				let insertedCount = 0;
				let updatedCount = 0;

				for (const doc of processedDocuments) {
					const filter = doc._id ? { _id: doc._id } : doc;
					const result = await collection.updateOne(
						filter,
						{ $set: doc },
						{ upsert: true }
					);

					if (result.upsertedCount > 0) {
						insertedCount++;
					} else if (result.modifiedCount > 0) {
						updatedCount++;
					}
				}

				console.log(`✓ Collection "${collectionName}": ${insertedCount} inserted, ${updatedCount} updated`);

			} catch (err) {
				console.error(`Error processing ${file}:`, err.message);
			}
		}

		console.log('\n✓ Seeding completed successfully');

	} catch (err) {
		console.error('Error during seeding:', err);
		process.exit(1);
	} finally {
		await client.close();
	}
}

seed();