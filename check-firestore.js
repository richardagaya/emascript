#!/usr/bin/env node

/**
 * Firestore Database Connection Checker
 * Run: node check-firestore.js
 * 
 * This script checks if Firestore is properly configured and accessible.
 */

require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

console.log('\n🔍 Firestore Database Connection Checker\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Checking environment variables...\n');

const requiredVars = {
  'FIREBASE_ADMIN_PROJECT_ID': process.env.FIREBASE_ADMIN_PROJECT_ID,
  'FIREBASE_ADMIN_CLIENT_EMAIL': process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  'FIREBASE_ADMIN_PRIVATE_KEY': process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  'FIREBASE_STORAGE_BUCKET': process.env.FIREBASE_STORAGE_BUCKET,
};

let allVarsPresent = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allVarsPresent = false;
  }
}

if (!allVarsPresent) {
  console.log('\n❌ Missing required environment variables!');
  console.log('💡 Make sure all Firebase Admin variables are set in .env.local');
  console.log('   See SETUP_GUIDE.md for instructions.\n');
  process.exit(1);
}

// Initialize Firebase Admin
console.log('\n🔧 Initializing Firebase Admin SDK...\n');

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  
  console.log('✅ Firebase Admin SDK initialized');
  console.log(`   Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`);
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  console.error('\n💡 Check your credentials in .env.local\n');
  process.exit(1);
}

// Test Firestore connection
console.log('\n🗄️  Testing Firestore connection...\n');

const db = admin.firestore();

async function testFirestore() {
  try {
    // Try to read from a test collection
    // This will fail with NOT_FOUND if Firestore database doesn't exist
    const testRef = db.collection('_test').doc('connection');
    
    // Try to get the document (expect it to not exist, but collection should be accessible)
    await testRef.get();
    
    console.log('✅ Firestore database is accessible!');
    
    // Try to write a test document
    try {
      await testRef.set({ 
        test: true, 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      });
      console.log('✅ Firestore write operation successful!');
      
      // Clean up test document
      await testRef.delete();
      console.log('✅ Test document cleaned up');
    } catch (writeError) {
      if (writeError.code === 7) {
        console.log('⚠️  Firestore is read-only (permission issue)');
        console.log('💡 Check your service account permissions in Firebase Console');
      } else {
        throw writeError;
      }
    }
    
    console.log('\n✅ All Firestore checks passed!');
    console.log('\n📝 Your Firestore database is ready to use.\n');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 5 || error.code === 'NOT_FOUND') {
      console.error('❌ Firestore database NOT FOUND');
      console.error('\n💡 To fix this:');
      console.error('   1. Go to https://console.firebase.google.com/');
      console.error('   2. Select your project:', process.env.FIREBASE_ADMIN_PROJECT_ID);
      console.error('   3. Click "Firestore Database" in the sidebar');
      console.error('   4. Click "Create database" if it doesn\'t exist');
      console.error('   5. Choose "Production mode" and select a location');
      console.error('   6. Click "Enable"');
      console.error('\n📖 See SETUP_GUIDE.md for detailed instructions.\n');
    } else if (error.code === 7 || error.code === 'PERMISSION_DENIED') {
      console.error('❌ Permission denied accessing Firestore');
      console.error('\n💡 Check your service account permissions:');
      console.error('   1. Go to Firebase Console → Project Settings → Service Accounts');
      console.error('   2. Make sure your service account has Editor or Owner role');
      console.error('   3. Verify the service account email matches your FIREBASE_ADMIN_CLIENT_EMAIL\n');
    } else {
      console.error('❌ Firestore connection error:', error.message);
      console.error('   Error code:', error.code);
      console.error('\n💡 Check your Firebase project configuration\n');
    }
    
    process.exit(1);
  }
}

testFirestore();

