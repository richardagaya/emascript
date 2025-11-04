// Quick test to verify Firestore connection
// Run: node test-firestore-connection.js

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('\n🔍 Testing Firestore Connection...\n');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.substring(0, 30) + '...');
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    
    const db = admin.firestore();
    
    // Try to access Firestore
    console.log('\n📡 Attempting to connect to Firestore...\n');
    
    // List collections - this will fail if database doesn't exist
    const collections = await db.listCollections();
    console.log('✅ Successfully connected to Firestore!');
    console.log(`📁 Found ${collections.length} collection(s):`);
    collections.forEach(col => console.log(`   - ${col.id}`));
    
    // Try to write a test document
    console.log('\n🧪 Testing write operation...');
    const testRef = db.collection('_test').doc('connection-test');
    await testRef.set({
      timestamp: new Date().toISOString(),
      test: true,
    });
    console.log('✅ Write test successful!');
    
    // Clean up
    await testRef.delete();
    console.log('✅ Cleanup successful!\n');
    
    console.log('🎉 Firestore is working correctly!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 5 || error.code === 'NOT_FOUND') {
      console.error('\n💡 This means Firestore database is not found.');
      console.error('   Possible causes:');
      console.error('   1. Database was created in a different project');
      console.error('   2. Service account doesn\'t have access');
      console.error('   3. Database location mismatch');
      console.error('\n   Please verify:');
      console.error('   1. Go to Firebase Console → Firestore Database');
      console.error('   2. Check the project name matches:', process.env.FIREBASE_ADMIN_PROJECT_ID);
      console.error('   3. Check the database exists and is in the correct location');
      console.error('   4. Verify service account has "Editor" or "Owner" role');
    } else if (error.code === 7 || error.code === 'PERMISSION_DENIED') {
      console.error('\n💡 Permission denied. Check service account permissions.');
    }
    
    process.exit(1);
  }
}

testConnection();
