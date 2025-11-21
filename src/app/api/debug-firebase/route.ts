import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    console.log('🔍 Testing Firebase Admin connection...');
    
    // Test basic connection
    const testCollection = adminDb.collection('test');
    const testDoc = await testCollection.add({
      test: true,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Firebase Admin connection successful');
    
    // Clean up test document
    await testDoc.delete();
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin is working correctly',
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.substring(0, 20) + '...',
      privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length,
      privateKeyStart: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 50)
    });
  } catch (error) {
    console.error('❌ Firebase Admin error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error),
      envCheck: {
        projectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0
      }
    }, { status: 500 });
  }
}
