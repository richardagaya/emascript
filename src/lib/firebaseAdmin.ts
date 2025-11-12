import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Lazy initialization to avoid errors during build time
function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  // Check if we're in build time or missing credentials
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.warn('Firebase Admin credentials not available - skipping initialization');
    // Return a dummy app that won't crash but will fail gracefully when used
    throw new Error('Firebase Admin not configured - please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY environment variables');
  }

  try {
    console.log('🔑 Initializing Firebase Admin...');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
    console.log('Private Key length:', process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length);
    console.log('Private Key starts with:', process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 50));
    
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: privateKey!,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Lazy getters for Firebase services
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;
let _adminStorage: Storage | null = null;

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_adminAuth) {
      try {
        _adminAuth = getAuth(getAdminApp());
      } catch (error) {
        console.error('Failed to get Firebase Admin Auth:', error);
        throw error;
      }
    }
    return _adminAuth[prop as keyof Auth];
  }
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_adminDb) {
      try {
        const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
        _adminDb = getFirestore(getAdminApp(), databaseId);
      } catch (error) {
        console.error('Failed to get Firebase Admin Firestore:', error);
        throw error;
      }
    }
    return _adminDb[prop as keyof Firestore];
  }
});

export const adminStorage = new Proxy({} as Storage, {
  get(_target, prop) {
    if (!_adminStorage) {
      try {
        _adminStorage = getStorage(getAdminApp());
      } catch (error) {
        console.error('Failed to get Firebase Admin Storage:', error);
        throw error;
      }
    }
    return _adminStorage[prop as keyof Storage];
  }
});

