import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify Firebase configuration
 * GET /api/test-firebase-config
 */
export async function GET() {
  try {
    const config = {
      hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
      
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.substring(0, 30) + '...',
      privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    };

    // Try to initialize Firestore
    let firestoreStatus = 'not_initialized';
    let firestoreError = null;
    
    try {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      
      // Try a simple operation
      const testRef = adminDb.collection('_test_connection');
      await testRef.limit(1).get();
      
      firestoreStatus = 'connected';
    } catch (error) {
      firestoreStatus = 'failed';
      firestoreError = String(error);
    }

    return NextResponse.json({
      config,
      firestore: {
        status: firestoreStatus,
        error: firestoreError,
      },
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Configuration check failed',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

