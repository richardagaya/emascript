#!/usr/bin/env node

/**
 * EA Upload Script
 * 
 * This script helps you upload EA files to Firebase Storage
 * and update the EA data file with the correct paths.
 * 
 * Usage:
 *   node scripts/upload-ea.js <ea-name> <version> <file-path>
 * 
 * Example:
 *   node scripts/upload-ea.js trendrider-ea 2.1.0 ./trendrider-ea.ex4
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('\n❌ Missing arguments\n');
  console.log('Usage: node scripts/upload-ea.js <ea-name> <version> <file-path>\n');
  console.log('Example:');
  console.log('  node scripts/upload-ea.js trendrider-ea 2.1.0 ./trendrider-ea.ex4\n');
  process.exit(1);
}

const [eaName, version, filePath] = args;

// Validate inputs
if (!eaName || !version || !filePath) {
  console.error('❌ All arguments are required');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// Validate version format (semantic versioning)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(version)) {
  console.error('❌ Version must be in format: X.Y.Z (e.g., 2.1.0)');
  process.exit(1);
}

// Get file extension
const fileExt = path.extname(filePath).toLowerCase();
if (!['.ex4', '.ex5'].includes(fileExt)) {
  console.error('❌ File must be .ex4 or .ex5');
  process.exit(1);
}

// Construct Firebase Storage path
const fileName = `${eaName}-v${version}${fileExt}`;
const storagePath = `eas/${eaName}/${version}/${fileName}`;

console.log('\n📤 Uploading EA to Firebase Storage...\n');
console.log(`EA Name: ${eaName}`);
console.log(`Version: ${version}`);
console.log(`File: ${filePath}`);
console.log(`Storage Path: ${storagePath}\n`);

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Firebase CLI not installed');
  console.log('\nInstall it with: npm install -g firebase-tools\n');
  process.exit(1);
}

// Check if logged in
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Not logged in to Firebase');
  console.log('\nLogin with: firebase login\n');
  process.exit(1);
}

// Upload file
try {
  console.log('Uploading...');
  execSync(`firebase storage:upload "${filePath}" "${storagePath}"`, {
    stdio: 'inherit'
  });
  console.log('\n✅ Upload successful!\n');
} catch (error) {
  console.error('\n❌ Upload failed');
  console.error('Make sure you are logged in and have the correct permissions\n');
  process.exit(1);
}

// Display next steps
console.log('📋 Next Steps:\n');
console.log('1. Upload EA image to: public/eas/');
console.log(`   Suggested name: ${eaName}.png\n`);
console.log('2. Update src/data/eas.ts with:');
console.log(`   - name: "${eaName}"`);
console.log(`   - version: "${version}"`);
console.log(`   - image: "/eas/${eaName}.png"`);
console.log(`   - lastUpdated: "${new Date().toISOString().split('T')[0]}"\n`);
console.log('3. Verify the EA appears in the marketplace\n');

console.log('✅ Done!\n');

