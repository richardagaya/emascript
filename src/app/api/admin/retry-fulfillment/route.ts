import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendConfirmationEmail } from '@/lib/email';
import { getEAByName } from '@/data/eas';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Admin endpoint to manually retry EA delivery and email for failed orders
 * 
 * Usage: POST /api/admin/retry-fulfillment
 * Body: { orderId: string, adminSecret: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, adminSecret } = body;

    // Validate admin secret (set this in your environment variables)
    const expectedSecret = process.env.ADMIN_SECRET || 'change-me-in-production';
    if (adminSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin secret' },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    console.log(`🔄 Admin retry fulfillment for order: ${orderId}`);

    // Get the order from Firestore
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    if (!orderData) {
      return NextResponse.json(
        { error: 'Order data is empty' },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (orderData.status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Order payment not completed', 
          currentStatus: orderData.status,
          message: 'This endpoint can only fulfill orders with completed payments'
        },
        { status: 400 }
      );
    }

    const results = {
      orderId,
      email: orderData.email,
      botName: orderData.botName,
      eaDelivered: false,
      emailSent: false,
      eaError: null as string | null,
      emailError: null as string | null,
    };

    // Attempt to add EA to user's account
    console.log(`📦 Attempting to add EA to user account: ${orderData.email}`);
    try {
      await addEAToUserAccount(
        orderData.email,
        orderData.botName,
        orderId
      );
      results.eaDelivered = true;
      console.log(`✅ EA delivered successfully`);
    } catch (eaError) {
      results.eaError = String(eaError);
      console.error(`❌ Failed to deliver EA:`, eaError);
    }

    // Attempt to send confirmation email
    console.log(`📧 Attempting to send confirmation email: ${orderData.email}`);
    try {
      await sendConfirmationEmail(
        orderData.email,
        orderData.botName,
        orderId
      );
      results.emailSent = true;
      console.log(`✅ Email sent successfully`);
    } catch (emailError) {
      results.emailError = String(emailError);
      console.error(`❌ Failed to send email:`, emailError);
    }

    // Update order with fulfillment status
    await orderRef.update({
      eaDelivered: results.eaDelivered,
      eaDeliveryError: results.eaError,
      emailSent: results.emailSent,
      emailError: results.emailError,
      lastRetryAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Fulfillment retry completed',
      results,
    }, { status: 200 });

  } catch (error) {
    console.error('Admin retry fulfillment error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: String(error)
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
    // Get EA details from the centralized data file
    const eaData = getEAByName(botName);
    
    if (!eaData) {
      console.error(`EA not found in catalog: "${botName}"`);
      throw new Error(`EA "${botName}" not found in catalog. Please check that the bot name matches exactly.`);
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
      console.log(`📝 Created new user document for ${email}`);
    } else {
      userRef = userQuery.docs[0].ref;
      console.log(`✅ Found existing user document for ${email}`);
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
      thumbnail: '🤖',
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
      console.log(`✅ EA added to user's account`);
    } else {
      console.log(`ℹ️  User already has this EA (orderId: ${orderId})`);
    }
    
  } catch (error) {
    console.error('Error adding EA to user account:', error);
    throw error;
  }
}

/**
 * GET endpoint to check order fulfillment status
 * 
 * Usage: GET /api/admin/retry-fulfillment?orderId=xxx&adminSecret=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const adminSecret = searchParams.get('adminSecret');

    // Validate admin secret
    const expectedSecret = process.env.ADMIN_SECRET || 'change-me-in-production';
    if (adminSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin secret' },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId parameter' },
        { status: 400 }
      );
    }

    // Get the order from Firestore
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Check if user has the EA
    let userHasEA = false;
    if (orderData?.email) {
      const usersRef = adminDb.collection('users');
      const userQuery = await usersRef.where('email', '==', orderData.email).limit(1).get();
      
      if (!userQuery.empty) {
        const userData = userQuery.docs[0].data();
        const purchasedEAs = userData.purchasedEAs || [];
        userHasEA = purchasedEAs.some((ea: { orderId?: string }) => ea.orderId === orderId);
      }
    }

    return NextResponse.json({
      orderId,
      status: orderData?.status,
      email: orderData?.email,
      botName: orderData?.botName,
      eaDelivered: orderData?.eaDelivered,
      eaDeliveryError: orderData?.eaDeliveryError,
      emailSent: orderData?.emailSent,
      emailError: orderData?.emailError,
      userHasEA,
      lastRetryAt: orderData?.lastRetryAt,
      paidAt: orderData?.paidAt,
      createdAt: orderData?.createdAt,
    }, { status: 200 });

  } catch (error) {
    console.error('Check fulfillment status error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

