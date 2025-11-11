import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Lazy initialization to avoid errors during build time
function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  // Check if we're in build time (no env vars available)
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.warn('Firebase Admin credentials not available - skipping initialization');
    throw new Error('Firebase Admin not configured');
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
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
      _adminAuth = getAuth(getAdminApp());
    }
    return _adminAuth[prop as keyof Auth];
  }
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_adminDb) {
      const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
      _adminDb = getFirestore(getAdminApp(), databaseId);
    }
    return _adminDb[prop as keyof Firestore];
  }
});

export const adminStorage = new Proxy({} as Storage, {
  get(_target, prop) {
    if (!_adminStorage) {
      _adminStorage = getStorage(getAdminApp());
    }
    return _adminStorage[prop as keyof Storage];
  }
});

