// Quick diagnostic script to check Firebase/Firestore setup
// Run: node check_firestore.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

async function checkFirestore() {
  try {
    console.log('\n🔍 Checking Firebase/Firestore configuration...\n');
    
    // Check if credentials exist
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('❌ FIREBASE_PROJECT_ID not found in .env.local');
      return;
    }
    
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('❌ FIREBASE_CLIENT_EMAIL not found in .env.local');
      return;
    }
    
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.error('❌ FIREBASE_PRIVATE_KEY not found in .env.local');
      return;
    }
    
    console.log('✅ Firebase credentials found in .env.local');
    
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    
    const db = getFirestore(app);
    
    console.log('✅ Firebase Admin initialized');
    console.log(`📁 Project ID: ${process.env.FIREBASE_PROJECT_ID}\n`);
    
    // Try to access Firestore
    console.log('🔍 Testing Firestore connection...');
    
    // Try to list collections (this will fail if database doesn't exist)
    try {
      const collections = await db.listCollections();
      console.log(`✅ Firestore database exists! Found ${collections.length} collection(s)`);
      
      // Check if 'orders' collection exists
      const hasOrders = collections.some(col => col.id === 'orders');
      if (hasOrders) {
        console.log('✅ "orders" collection exists');
        
        // Try to read from orders
        const ordersSnapshot = await db.collection('orders').limit(1).get();
        console.log(`✅ Can read from "orders" collection (${ordersSnapshot.size} document(s) found)`);
      } else {
        console.log('⚠️  "orders" collection does not exist yet (will be created on first order)');
      }
    } catch (error) {
      if (error.code === 5 || error.code === 'NOT_FOUND') {
        console.error('\n❌ Firestore database NOT FOUND!');
        console.error('\n💡 To fix this:');
        console.error('   1. Go to https://console.firebase.google.com/');
        console.error('   2. Select your project:', process.env.FIREBASE_PROJECT_ID);
        console.error('   3. Click "Firestore Database" in the sidebar');
        console.error('   4. Click "Create database"');
        console.error('   5. Choose "Start in test mode" (for development)');
        console.error('   6. Select a location for your database');
        console.error('   7. Click "Enable"\n');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
    if (error.code === 7) {
      console.error('\n💡 This usually means invalid Firebase credentials. Check your .env.local file.');
    }
  }
}

checkFirestore();
