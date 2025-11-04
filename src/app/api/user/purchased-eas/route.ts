import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
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

    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Fetch user's purchased EAs from Firestore
    try {
      const usersRef = adminDb.collection('users');
      const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();

      if (userQuery.empty) {
        // User exists but hasn't purchased anything yet
        return NextResponse.json({
          purchasedEAs: [],
        }, { status: 200 });
      }

      const userData = userQuery.docs[0].data();
      const purchasedEAs = userData.purchasedEAs || [];

      return NextResponse.json({
        purchasedEAs,
      }, { status: 200 });
    } catch (firestoreError: any) {
      // Handle Firestore connection errors gracefully
      if (firestoreError?.code === 5 || firestoreError?.code === 'NOT_FOUND') {
        console.warn('⚠️  Firestore database not found or not initialized.');
        console.warn('💡 To fix this:');
        console.warn('   1. Go to https://console.firebase.google.com/');
        console.warn('   2. Select your project');
        console.warn('   3. Click "Firestore Database" in the sidebar');
        console.warn('   4. Click "Create database" if it doesn\'t exist');
        console.warn('   5. Choose "Production mode" and select a location');
        console.warn('   6. Verify your FIREBASE_ADMIN_PROJECT_ID matches your Firebase project');
        console.warn('   Returning empty array for now.');
        return NextResponse.json({
          purchasedEAs: [],
        }, { status: 200 });
      }
      // Re-throw other Firestore errors to be caught by outer catch block
      throw firestoreError;
    }

  } catch (error) {
    console.error('Error fetching purchased EAs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

