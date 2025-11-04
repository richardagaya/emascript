import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, adminStorage } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eaId = searchParams.get('eaId');

    if (!eaId) {
      return NextResponse.json(
        { error: 'EA ID is required' },
        { status: 400 }
      );
    }

    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('fb_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Check if user owns this EA
    let userQuery;
    try {
      const usersRef = adminDb.collection('users');
      userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();
    } catch (firestoreError: any) {
      // Handle Firestore connection errors
      if (firestoreError?.code === 5 || firestoreError?.code === 'NOT_FOUND') {
        console.warn('⚠️  Firestore database not found or not initialized.');
        console.warn('💡 See check-firestore.js script to diagnose the issue.');
        return NextResponse.json(
          { error: 'Database not available. Please contact support.' },
          { status: 503 }
        );
      }
      throw firestoreError;
    }

    if (userQuery.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const purchasedEAs = userData.purchasedEAs || [];

    // Find the EA in user's purchased list
    const eaIndex = purchasedEAs.findIndex((ea: any) => ea.eaId === eaId);

    if (eaIndex === -1) {
      return NextResponse.json(
        { error: 'EA not found in your purchases' },
        { status: 403 }
      );
    }

    const ea = purchasedEAs[eaIndex];

    // Update download count and last downloaded timestamp
    purchasedEAs[eaIndex] = {
      ...ea,
      downloadCount: (ea.downloadCount || 0) + 1,
      lastDownloaded: new Date().toISOString(),
    };

    await userDoc.ref.update({
      purchasedEAs,
      updatedAt: new Date().toISOString(),
    });

    // Generate a signed URL for the file from Firebase Storage
    // The file should be stored in Firebase Storage at: eas/{eaId}/{version}/{filename}
    const bucket = adminStorage.bucket();
    const fileName = `${eaId}-v${ea.version}.ex4`; // or .ex5 for MT5
    const filePath = `eas/${eaId}/${ea.version}/${fileName}`;
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    
    if (!exists) {
      console.error(`File not found in storage: ${filePath}`);
      return NextResponse.json(
        { error: 'File not found in storage. Please contact support.' },
        { status: 404 }
      );
    }

    // Generate a signed URL valid for 1 hour
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    console.log(`Download initiated for ${eaId} by ${userEmail}`);

    // Return the signed URL
    return NextResponse.json({
      downloadUrl: signedUrl,
      fileName,
      eaName: ea.eaName,
      version: ea.version,
    }, { status: 200 });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

