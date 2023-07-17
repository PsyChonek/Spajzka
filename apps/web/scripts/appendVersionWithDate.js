// get package.json version and append version with date
// version format '0.1.6 - 20230717'

// Open file
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Get version from package.json
const version = packageJson.version;

// Get date
const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

// Remove date from version
const versionWithoutDate = version.split(' - ')[0];

// Append date to version
const versionWithDate = `${versionWithoutDate} - ${date}`;

// Update package.json version
packageJson.version = versionWithDate;

// Write package.json
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

console.log(`versionWithDate: ${versionWithDate}`);