import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendConfirmationEmail } from '@/lib/email';
import { getEAByName } from '@/data/eas';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Manual order completion endpoint
 * Use this to manually complete orders when the webhook fails
 * POST /api/complete-order-manual
 * Body: { orderId: "ORD-xxx" }
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }
    
    console.log(`🔧 Manual order completion requested for: ${orderId}`);
    
    // Get order from Firestore
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.error(`❌ Order not found: ${orderId}`);
      return NextResponse.json(
        { error: 'Order not found', orderId },
        { status: 404 }
      );
    }
    
    const orderData = orderDoc.data();
    
    if (!orderData) {
      return NextResponse.json(
        { error: 'Order data is empty', orderId },
        { status: 400 }
      );
    }
    
    console.log('📦 Order data:', {
      orderId,
      botName: orderData.botName,
      email: orderData.email,
      currentStatus: orderData.status,
    });
    
    // Update order status
    await orderRef.update({
      status: 'completed',
      paidAt: orderData.paidAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manuallyCompleted: true,
    });
    
    console.log('✅ Order status updated to completed');
    
    // Add EA to user's account
    try {
      console.log('📦 Adding EA to user account...');
      await addEAToUserAccount(
        orderData.email,
        orderData.botName,
        orderId
      );
      console.log('✅ EA added successfully');
    } catch (eaError) {
      console.error('❌ Error adding EA:', eaError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add EA to user account',
          details: (eaError as Error).message,
          orderId 
        },
        { status: 500 }
      );
    }
    
    // Send confirmation email ONLY if it hasn't already been sent
    if (!orderData.emailSent) {
      try {
        console.log('📧 Sending confirmation email (manual completion)...');
        await sendConfirmationEmail(orderData.email, orderData.botName, orderId);
        console.log('✅ Email sent successfully');
        await orderRef.update({
          emailSent: true,
          emailError: null,
          updatedAt: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError);
        return NextResponse.json(
          { 
            success: true, 
            warning: 'EA added but email failed to send',
            emailError: (emailError as Error).message,
            orderId 
          },
          { status: 200 }
        );
      }
    } else {
      console.log('ℹ️  Confirmation email already sent for this order, skipping manual resend');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order completed successfully',
      orderId,
      email: orderData.email,
      botName: orderData.botName,
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error completing order manually:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// Helper function to add EA to user's account
async function addEAToUserAccount(
  email: string,
  botName: string,
  orderId: string
) {
  try {
    console.log(`📦 Starting EA addition for ${email}`);
    
    // Get EA details from the centralized data file
    const eaData = getEAByName(botName);
    
    if (!eaData) {
      console.error(`EA not found in catalog: "${botName}"`);
      throw new Error(`EA "${botName}" not found in catalog. Please check that the bot name matches exactly.`);
    }
    
    console.log(`✅ EA found in catalog: ${botName}`);

    // Generate EA ID from bot name (lowercase, replace spaces with hyphens, remove special chars)
    const eaId = botName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Find or create user document
    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', email).limit(1).get();
    
    let userRef;
    
    if (userQuery.empty) {
      // Create new user document
      console.log('📝 Creating new user document');
      userRef = usersRef.doc();
      await userRef.set({
        email,
        createdAt: new Date().toISOString(),
        purchasedEAs: [],
      });
      console.log('✅ User document created');
    } else {
      userRef = userQuery.docs[0].ref;
      console.log('✅ User document found');
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
      license: 'Standard', // Update based on your pricing tiers
      thumbnail: '🤖', // Default thumbnail, can be customized
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
      console.log('📦 Adding EA to user purchased EAs array');
      await userRef.update({
        purchasedEAs: FieldValue.arrayUnion(purchasedEA),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ EA added to user account');
    } else {
      console.log('ℹ️  EA already exists in user account (skipping duplicate)');
    }
    
  } catch (error) {
    console.error('❌ Error adding EA to user account:', error);
    throw error;
  }
}

