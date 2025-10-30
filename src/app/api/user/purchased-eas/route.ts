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

  } catch (error) {
    console.error('Error fetching purchased EAs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

