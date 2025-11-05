import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Save email to Firestore
    try {
      // Check if email already exists
      const existingQuery = await adminDb
        .collection('newsletter_signups')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        // Email already exists, update timestamp
        const doc = existingQuery.docs[0];
        await doc.ref.update({
          updatedAt: timestamp,
        });
        return NextResponse.json(
          { success: true, message: 'Email already registered' },
          { status: 200 }
        );
      }

      // Create new signup document
      const signupData = {
        email: email.toLowerCase(),
        createdAt: timestamp,
        updatedAt: timestamp,
        source: 'popup',
      };

      await adminDb.collection('newsletter_signups').add(signupData);

      return NextResponse.json(
        { success: true, message: 'Email saved successfully' },
        { status: 200 }
      );
    } catch (firestoreError: any) {
      // Handle Firestore errors gracefully
      if (firestoreError?.code === 5 || firestoreError?.code === 'NOT_FOUND') {
        console.warn('⚠️  Firestore database not found or not initialized.');
        return NextResponse.json(
          { error: 'Database not available. Please try again later.' },
          { status: 503 }
        );
      }
      throw firestoreError;
    }
  } catch (error: any) {
    console.error('Error saving newsletter signup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

