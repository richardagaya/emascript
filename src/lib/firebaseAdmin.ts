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
      console.error('FIREBASE_ADMIN_PROJECT_ID is not set');
    }
    if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      console.error('FIREBASE_ADMIN_CLIENT_EMAIL is not set');
    }
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      console.error('FIREBASE_ADMIN_PRIVATE_KEY is not set');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
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


export const adminStorage = getStorage(adminApp);

