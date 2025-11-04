const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function testFirestore() {
  try {
    console.log('🔍 Testing Firestore connection...\n');
    
    // Check environment variables
    console.log('📋 Environment Check:');
    console.log(`   Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID || '❌ MISSING'}`);
    console.log(`   Client Email: ${process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   Private Key: ${process.env.FIREBASE_ADMIN_PRIVATE_KEY ? `✅ Set (${process.env.FIREBASE_ADMIN_PRIVATE_KEY.length} chars)` : '❌ MISSING'}`);
    console.log('');
    
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      console.error('❌ Missing required environment variables!');
      process.exit(1);
    }
    
    // Initialize Admin SDK
    console.log('🔧 Initializing Firebase Admin SDK...');
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Admin SDK initialized\n');
    
    // Get Firestore instance
    const db = admin.firestore();
    console.log('📊 Testing Firestore operations...\n');
    
    // Test 1: List collections (this will fail if database doesn't exist or permissions are wrong)
    console.log('Test 1: Listing collections...');
    try {
      const collections = await db.listCollections();
      console.log(`✅ Success! Found ${collections.length} collections:`);
      collections.forEach(col => console.log(`   - ${col.id}`));
    } catch (err) {
      console.error('❌ Failed to list collections:');
      console.error(`   Code: ${err.code}`);
      console.error(`   Message: ${err.message}`);
      if (err.code === 7 || err.code === 'PERMISSION_DENIED') {
        console.error('\n💡 PERMISSION_DENIED: Service account needs "Editor" or "Firebase Admin SDK Administrator Service Agent" role');
      } else if (err.code === 5 || err.code === 'NOT_FOUND') {
        console.error('\n💡 NOT_FOUND: Database might not exist or is in a different region');
      }
      throw err;
    }
    console.log('');
    
    // Test 2: Write a test document
    console.log('Test 2: Writing test document...');
    const testDoc = db.collection('_test').doc('connection-test');
    try {
      await testDoc.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        test: true,
      });
      console.log('✅ Successfully wrote test document');
    } catch (err) {
      console.error('❌ Failed to write document:');
      console.error(`   Code: ${err.code}`);
      console.error(`   Message: ${err.message}`);
      throw err;
    }
    console.log('');
    
    // Test 3: Read the test document
    console.log('Test 3: Reading test document...');
    try {
      const doc = await testDoc.get();
      if (doc.exists) {
        console.log('✅ Successfully read test document');
        console.log(`   Data: ${JSON.stringify(doc.data(), null, 2)}`);
      } else {
        console.error('❌ Document does not exist after write!');
      }
    } catch (err) {
      console.error('❌ Failed to read document:');
      console.error(`   Code: ${err.code}`);
      console.error(`   Message: ${err.message}`);
      throw err;
    }
    console.log('');
    
    // Test 4: Clean up test document
    console.log('Test 4: Cleaning up test document...');
    try {
      await testDoc.delete();
      console.log('✅ Test document deleted');
    } catch (err) {
      console.warn('⚠️  Could not delete test document (non-critical)');
    }
    console.log('');
    
    console.log('🎉 All Firestore tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Firestore connection test failed:');
    console.error(error);
    process.exit(1);
  }
}

testFirestore();
