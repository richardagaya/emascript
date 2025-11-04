import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
let adminApp;
if (!getApps().length) {
  try {
    // Validate required environment variables
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
      console.error('❌ FIREBASE_ADMIN_PROJECT_ID is not set');
    }
    if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      console.error('❌ FIREBASE_ADMIN_CLIENT_EMAIL is not set');
    }
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      console.error('❌ FIREBASE_ADMIN_PRIVATE_KEY is not set');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`   Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`);
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    console.error('💡 Make sure:');
    console.error('   1. All Firebase environment variables are set in .env.local');
    console.error('   2. Firestore database is created in Firebase Console');
    console.error('   3. Service account has proper permissions');
    throw error; // Re-throw to prevent undefined adminApp usage
  }
} else {
  adminApp = getApps()[0];
}

if (!adminApp) {
  throw new Error('Firebase Admin app is not initialized');
}

export const adminAuth = getAuth(adminApp);

// Get Firestore instance - support named databases (default is "(default)")
// If you have a named database, set FIREBASE_DATABASE_ID in .env.local
const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
export const adminDb = getFirestore(adminApp, databaseId);

// Log database configuration
if (databaseId !== '(default)') {
  console.log(`   Database ID: ${databaseId}`);
}

export const adminStorage = getStorage(adminApp);

