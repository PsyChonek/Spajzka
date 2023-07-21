// Settings for local database
const UserName = 'spajzkaadmin';
const UserPass = 'spajzkaadmin';
const PORTS = "27017:27017";
const DBName = 'spajzka';
const sampleFolder = './sample';

// Edit docker-compose.yml file to change ports and login credentials
const yaml = require('js-yaml');
const fs = require('fs');

const file = yaml.load(fs.readFileSync('./docker-compose.yml', 'utf8'));

file.services.mongo.ports = [PORTS];
file.services.mongo.environment.MONGO_INITDB_ROOT_USERNAME = UserName;
file.services.mongo.environment.MONGO_INITDB_ROOT_PASSWORD = UserPass;

// Write docker-compose.yml
fs.writeFileSync('./docker-compose.yml', yaml.dump(file), 'utf8');

// Start docker-compose
const exec = require('node:child_process').exec;
exec("docker compose up");

console.log('Database started!');

// Seed DB with sample data

// Open database connection
const MongoClient = require("mongodb").MongoClient;

// Connection URL
const url = `mongodb://${UserName}:${UserPass}@localhost:${PORTS.split(':')[0]}/?authMechanism=DEFAULT`;

console.log('Starting to connect to database...');


async function dbconnect() {
    db = await MongoClient.connect(url, { useUnifiedTopology: true });
    console.log('Connected to database!');

    // Create database
    const dbo = db.db(DBName);

    // Create collections
    const fs = require('fs');
    fs.readdir(sampleFolder, (err, files) => {
        if (err) throw err;

        files.forEach(file => {
            console.log(file);
            const collectionName = file.split('.')[1];
            col = dbo.collection(collectionName);
            console.log(`Collection ${col.collectionName} created!`);

            data = fs.readFileSync(`${sampleFolder}/${file}`, 'utf8');
            data = data.replace("$oid", "oid");

            json = JSON.parse(data);

            col.updateMany(json);
        });

        console.log('Sample data inserted!');
    });
};
dbconnect();


