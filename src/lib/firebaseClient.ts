import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existing = getApps()[0];
    if (existing) {
      app = existing;
      return app;
    }

    // Validate required environment variables
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!apiKey || !authDomain || !projectId) {
      const missing = [];
      if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
      if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
      if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      
      throw new Error(
        `Firebase configuration is missing required environment variables: ${missing.join(', ')}. ` +
        `Please check your .env.local file or environment configuration.`
      );
    }

    // Validate API key format (should be a non-empty string)
    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error(
        'Firebase API key is invalid. Please check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable.'
      );
    }

    try {
      app = initializeApp({
        apiKey: apiKey.trim(),
        authDomain: authDomain.trim(),
        projectId: projectId.trim(),
      });
    } catch (initError: unknown) {
      const error = initError as Error;
      console.error('Firebase initialization error:', error);
      throw new Error(
        `Failed to initialize Firebase: ${error.message}. Please verify your Firebase configuration.`
      );
    }
  }
  return app;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}


