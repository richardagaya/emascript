import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalPayment } from '@/lib/paypal';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendConfirmationEmail } from '@/lib/email';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * PayPal Return URL Handler
 * This endpoint handles the redirect after user approves payment on PayPal
 * PayPal redirects here with token and PayerID query parameters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const payerId = searchParams.get('PayerID');

    if (!token) {
      console.error('PayPal return: Missing token parameter');
      return NextResponse.redirect(new URL('/marketplace/checkout?error=missing_token', req.url));
    }

    console.log('📥 PayPal return callback:', { token, payerId });

    // Get PayPal order details to extract customId (our internal orderId)
    // We need to get the full order details to access customId
    let internalOrderId = '';
    try {
      const { Client, OrdersController, Environment } = await import('@paypal/paypal-server-sdk');
      
      // Create PayPal client
      const paypalClientId = process.env.PAYPAL_CLIENT_ID;
      const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
      const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
      
      if (!paypalClientId || !paypalClientSecret) {
        throw new Error('PayPal credentials not configured');
      }
      
      const paypalClient = new Client({
        environment: paypalEnvironment === 'live' ? Environment.Production : Environment.Sandbox,
        clientCredentialsAuthCredentials: {
          oAuthClientId: paypalClientId,
          oAuthClientSecret: paypalClientSecret,
        },
      });
      
      const ordersController = new OrdersController(paypalClient);
      const orderResponse = await ordersController.getOrder({ id: token });
      
      // Extract customId from purchase_units (this is our internal orderId)
      const customId = orderResponse.result?.purchaseUnits?.[0]?.customId;
      if (customId) {
        internalOrderId = customId;
        console.log('Found internal orderId from PayPal customId:', internalOrderId);
      }
    } catch (error) {
      console.error('Error getting PayPal order details:', error);
    }

    // Find the order in Firestore
    let orderDoc = null;
    let orderId = '';
    
    try {
      const ordersRef = adminDb.collection('orders');
      
      // First try to find by internal orderId (customId) if we have it
      if (internalOrderId) {
        const orderDocRef = ordersRef.doc(internalOrderId);
        const orderDocSnapshot = await orderDocRef.get();
        if (orderDocSnapshot.exists) {
          orderDoc = orderDocSnapshot;
          orderId = internalOrderId;
        }
      }
      
      // If not found, try by transactionId (PayPal order ID)
      if (!orderDoc) {
        const orderQuery = await ordersRef.where('transactionId', '==', token).limit(1).get();
        if (!orderQuery.empty) {
          orderDoc = orderQuery.docs[0];
          orderId = orderDoc.id;
        }
      }
      
      if (!orderDoc) {
        console.error('Order not found for PayPal token:', token, 'internalOrderId:', internalOrderId);
        // Still try to capture, but handle gracefully
      }
    } catch (lookupError) {
      console.error('Error looking up order:', lookupError);
    }

    // Capture the PayPal order
    // When using CheckoutPaymentIntent.Capture, the order is auto-captured
    // But we should verify it and update our database
    const captureResult = await capturePayPalPayment(token);

    if (!captureResult.success) {
      console.error('PayPal capture failed:', captureResult.error);
      return NextResponse.redirect(new URL('/marketplace/checkout?error=capture_failed', req.url));
    }

    // If we still don't have the order, we can't proceed with updating it
    if (!orderDoc) {
      console.error('Order not found after capture. Payment was captured but order update failed.');
      return NextResponse.redirect(new URL('/dashboard?payment=success&warning=order_not_found', req.url));
    }

    const orderData = orderDoc.data();
    
    if (!orderData) {
      console.error('Order data is undefined');
      return NextResponse.redirect(new URL('/dashboard?payment=success&warning=order_data_missing', req.url));
    }

    try {
      // Update order status
      await orderDoc.ref.update({
        status: 'completed',
        transactionId: captureResult.transactionId || token,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add EA to user's account
      await addEAToUserAccount(
        orderData.email,
        orderData.botName,
        orderId
      );

      // Send confirmation email
      await sendConfirmationEmail(orderData.email, orderData.botName, orderId);

      console.log(`✅ PayPal payment completed for order ${orderId}`);

      // Redirect to success page
      return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${orderId}`, req.url));
    } catch (firestoreError: any) {
      console.error('Firestore error processing PayPal return:', firestoreError);
      // Even if Firestore fails, redirect to success (payment was captured)
      return NextResponse.redirect(new URL('/dashboard?payment=success', req.url));
    }
  } catch (error) {
    console.error('Error processing PayPal return:', error);
    return NextResponse.redirect(new URL('/marketplace/checkout?error=processing_error', req.url));
  }
}

// Helper function to add EA to user's account
async function addEAToUserAccount(
  email: string,
  botName: string,
  orderId: string
) {
  try {
    // Map bot names to EA details
    const EA_CATALOG: Record<string, any> = {
      'TrendRider EA': {
        eaId: 'trendrider-ea',
        version: '2.1.0',
        thumbnail: '📈',
        description: 'Advanced trend-following strategy',
        downloadUrl: 'https://storage.../trendrider-ea-v2.1.0.ex4',
      },
      'ScalpSwift EA': {
        eaId: 'scalpswift-ea',
        version: '1.8.3',
        thumbnail: '⚡',
        description: 'High-frequency scalping bot',
        downloadUrl: 'https://storage.../scalpswift-ea-v1.8.3.ex4',
      },
      'MeanRevert Pro': {
        eaId: 'meanrevert-pro',
        version: '3.0.1',
        thumbnail: '🎯',
        description: 'Mean reversion with grid management',
        downloadUrl: 'https://storage.../meanrevert-pro-v3.0.1.ex4',
      },
    };

    const eaDetails = EA_CATALOG[botName];
    
    if (!eaDetails) {
      console.error(`EA not found in catalog: ${botName}`);
      return;
    }

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
      eaId: eaDetails.eaId,
      eaName: botName,
      orderId,
      purchaseDate: new Date().toISOString(),
      version: eaDetails.version,
      license: 'Standard',
      thumbnail: eaDetails.thumbnail,
      description: eaDetails.description,
      downloadUrl: eaDetails.downloadUrl,
      downloadCount: 0,
      lastDownloaded: null,
    };

    await userRef.update({
      purchasedEAs: FieldValue.arrayUnion(purchasedEA),
      updatedAt: new Date().toISOString(),
    });

    console.log(`EA ${botName} added to user ${email}`);
    
  } catch (error) {
    console.error('Error adding EA to user account:', error);
    throw error;
  }
}

