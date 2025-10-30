#!/usr/bin/env node

/**
 * Quick Firebase Storage Configuration Checker
 * Run: node quick-storage-check.js
 */

console.log('\n🔍 Firebase Storage Configuration Checker\n');
console.log('='.repeat(50));

// Check if service account file exists
const fs = require('fs');
const path = require('path');

console.log('\n📋 Checking for service account JSON file...\n');

// Common locations to check
const possiblePaths = [
  './serviceAccountKey.json',
  './firebase-service-account.json',
  './firebase-adminsdk.json',
];

let serviceAccountPath = null;

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    console.log(`✅ Found: ${p}`);
    break;
  }
}

if (!serviceAccountPath) {
  console.log('❌ Service account JSON file not found in:');
  possiblePaths.forEach(p => console.log(`   - ${p}`));
  console.log('\n💡 Download it from:');
  console.log('   Firebase Console → Project Settings → Service Accounts');
  console.log('   → Generate New Private Key\n');
  process.exit(1);
}

// Read and parse service account
try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  console.log('\n📦 Your Firebase Storage Configuration:\n');
  console.log(`Project ID: ${serviceAccount.project_id}`);
  console.log(`Storage Bucket: ${serviceAccount.project_id}.appspot.com`);
  console.log(`Client Email: ${serviceAccount.client_email}`);
  
  console.log('\n📝 Add this to your .env.local:\n');
  console.log('─'.repeat(50));
  console.log(`FIREBASE_ADMIN_PROJECT_ID=${serviceAccount.project_id}`);
  console.log(`FIREBASE_ADMIN_CLIENT_EMAIL=${serviceAccount.client_email}`);
  console.log(`FIREBASE_ADMIN_PRIVATE_KEY="${serviceAccount.private_key.replace(/\n/g, '\\n')}"`);
  console.log(`FIREBASE_STORAGE_BUCKET=${serviceAccount.project_id}.appspot.com`);
  console.log('─'.repeat(50));
  
  console.log('\n✅ Configuration looks good!');
  console.log('\n📤 To upload EA files:');
  console.log('   1. Go to: https://console.firebase.google.com/');
  console.log('   2. Select your project');
  console.log('   3. Click "Storage" in the sidebar');
  console.log('   4. Click "Upload file" or "Create folder"');
  console.log('   5. Create structure: eas/ea-name/version/file.ex4');
  console.log('\n📖 Full guide: FIREBASE_STORAGE_GUIDE.md\n');
  
} catch (error) {
  console.error('❌ Error reading service account file:', error.message);
  process.exit(1);
}

