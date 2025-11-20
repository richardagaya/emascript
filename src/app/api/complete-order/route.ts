import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendConfirmationEmail } from '@/lib/email';
import { getEAByName } from '@/data/eas';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to add EA to user's account (same as in webhook)
async function addEAToUserAccount(
  email: string,
  botName: string,
  orderId: string
) {
  try {
    // Get EA details from the centralized data file
    const eaData = getEAByName(botName);
    
    if (!eaData) {
      console.error(`EA not found in catalog: ${botName}`);
      return;
    }

    // Generate EA ID from bot name (lowercase, replace spaces with hyphens, remove special chars)
    const eaId = botName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Find or create user document
    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', email).limit(1).get();
    
    let userRef;
    
    if (userQuery.empty) {
      // Create new user document
      userRef = usersRef.doc();
      await userRef.set({
        email,
        createdAt: new Date().toISOString(),
        purchasedEAs: [],
      });
    } else {
      userRef = userQuery.docs[0].ref;
    }

    // Add EA to user's purchased EAs
    const purchasedEA = {
      id: `${eaId}-${orderId}`, // Unique ID for this purchase
      eaId: eaId,
      eaName: botName,
      name: botName, // Display name
      orderId,
      purchaseDate: new Date().toISOString(),
      version: eaData.version,
      license: 'Standard',
      thumbnail: '🤖', // Default thumbnail
      description: eaData.desc,
      downloadCount: 0,
      lastDownloaded: null,
    };

    // Check if user already has this EA (prevent duplicates)
    const userData = userQuery.empty ? { purchasedEAs: [] } : userQuery.docs[0].data();
    const existingEAs = userData.purchasedEAs || [];
    
    // Check if this exact order already exists
    const orderExists = existingEAs.some((ea: { orderId?: string }) => ea.orderId === orderId);
    
    if (!orderExists) {
      await userRef.update({
        purchasedEAs: FieldValue.arrayUnion(purchasedEA),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ EA ${botName} added to user ${email} (Order: ${orderId})`);
      return true;
    } else {
      console.log(`⚠️ EA ${botName} already exists for user ${email} (Order: ${orderId})`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error adding EA to user account:', error);
    throw error;
  }
}

/**
 * Manual order completion endpoint
 * Use this to manually complete orders when webhooks fail
 * POST /api/complete-order?orderId=ORD-123
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required. Use ?orderId=ORD-123' },
        { status: 400 }
      );
    }

    // Get order from Firestore
    let orderDoc;
    const orderRef = adminDb.collection('orders').doc(orderId);
    try {
      orderDoc = await orderRef.get();
    } catch (firestoreError) {
      const error = firestoreError as { code?: number | string; message?: string };
      console.error('❌ Firestore error accessing order:', {
        code: error?.code,
        message: error?.message,
        orderId,
      });
      
      // Check if it's a database not found error
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        return NextResponse.json(
          { 
            error: 'Firestore database not found or not initialized',
            hint: 'Please ensure Firestore is enabled in your Firebase console: https://console.firebase.google.com/',
            orderId,
          },
          { status: 503 }
        );
      }
      
      throw firestoreError;
    }

    if (!orderDoc.exists) {
      return NextResponse.json(
        { 
          error: 'Order not found in Firestore',
          orderId,
          hint: 'The order may not have been created yet, or Firestore database might not be initialized'
        },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Check if already completed
    if (orderData?.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Order already completed',
        orderId,
      }, { status: 200 });
    }

    // Update order status
    try {
      await orderRef.update({
        status: 'completed',
        transactionId: orderData?.transactionId || `manual-${Date.now()}`,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      const error = updateError as { message?: string };
      console.error('❌ Error updating order:', updateError);
      throw new Error(`Failed to update order: ${error?.message || updateError}`);
    }

    // Add EA to user's account
    await addEAToUserAccount(
      orderData!.email,
      orderData!.botName,
      orderId
    );

    // Send confirmation email only if it hasn't already been sent
    if (!orderData?.emailSent) {
      try {
        await sendConfirmationEmail(orderData!.email, orderData!.botName, orderId);
        await orderRef.update({
          emailSent: true,
          emailError: null,
          updatedAt: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error('Email sending failed, but order completed:', emailError);
      }
    } else {
      console.log('ℹ️  Confirmation email already sent for this order, skipping duplicate send');
    }

    console.log(`✅ Order ${orderId} manually completed`);

    return NextResponse.json({
      success: true,
      message: 'Order completed successfully',
      orderId,
      email: orderData!.email,
      botName: orderData!.botName,
    }, { status: 200 });

  } catch (error) {
    const err = error as { message?: string };
    console.error('Error completing order:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: err.message 
      },
      { status: 500 }
    );
  }
}
