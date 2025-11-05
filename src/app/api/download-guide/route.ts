import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
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

    // Get Firebase Storage bucket
    const bucket = adminStorage.bucket();
    
    // The PDF guide should be stored at: guides/mt5-installation-guide.pdf
    // This is the same guide for all EAs
    const filePath = 'guides/mt5-installation-guide.pdf';
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    
    if (!exists) {
      console.error(`MT5 installation guide not found in storage: ${filePath}`);
      return NextResponse.json(
        { error: 'Installation guide not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Generate a signed URL valid for 1 hour
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Return the signed URL
    return NextResponse.json({
      downloadUrl: signedUrl,
      fileName: 'mt5-installation-guide.pdf',
    }, { status: 200 });

  } catch (error) {
    console.error('Download guide error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

