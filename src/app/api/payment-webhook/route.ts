import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendConfirmationEmail } from '@/lib/email';
import { verifyPesapalPayment, verifyMpesaPayment } from '@/lib/pesapal';
import { getPayPalOrderDetails, verifyPayPalWebhook } from '@/lib/paypal';
import { FieldValue } from 'firebase-admin/firestore';

// This endpoint receives payment confirmations from payment gateways
// M-PESA, Pesapal, and PayPal will send webhook notifications here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers = Object.fromEntries(req.headers.entries());
    
    // Determine payment gateway from headers or body
    const userAgent = headers['user-agent'] || '';
    const contentType = headers['content-type'] || '';
    
    let orderId = '';
    let status = '';
    let transactionId = '';
    let paymentMethod = '';
    let amount = 0;

    // Handle Pesapal webhook
    if (body.order_tracking_id || body.orderMerchantReference) {
      orderId = body.orderMerchantReference || body.order_tracking_id;
      status = body.payment_status || body.status;
      transactionId = body.order_tracking_id || body.transaction_id;
      paymentMethod = 'pesapal';
      amount = parseFloat(body.amount || '0');
      
      // Verify Pesapal payment
      if (orderId && transactionId) {
        const verification = await verifyPesapalPayment(transactionId);
        if (!verification.success) {
          status = 'failed';
        }
      }
    }
    // Handle M-Pesa webhook
    else if (body.Body?.stkCallback) {
      const stkCallback = body.Body.stkCallback;
      orderId = stkCallback.MerchantRequestID;
      transactionId = stkCallback.CheckoutRequestID;
      paymentMethod = 'mpesa';
      
      if (stkCallback.ResultCode === 0) {
        status = 'success';
        const callbackMetadata = stkCallback.CallbackMetadata?.Item;
        if (callbackMetadata) {
          amount = parseFloat(callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value || '0');
        }
      } else {
        status = 'failed';
      }
    }
    // Handle PayPal webhook
    else if (body.event_type && body.resource) {
      // Verify PayPal webhook signature
      const isValid = await verifyPayPalWebhook(headers, JSON.stringify(body));
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
      
      if (body.event_type === 'CHECKOUT.ORDER.APPROVED' || body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        orderId = body.resource.custom_id || body.resource.id;
        transactionId = body.resource.id;
        paymentMethod = 'paypal';
        status = 'success';
        
        const purchaseUnit = body.resource.purchase_units?.[0];
        if (purchaseUnit?.amount) {
          amount = parseFloat(purchaseUnit.amount.value || '0');
        }
      }
    }
    // Generic webhook format (fallback)
    else {
      orderId = body.orderId;
      status = body.status;
      transactionId = body.transactionId;
      amount = body.amount;
      paymentMethod = body.paymentMethod;
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order ID' },
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

    // Update order status based on payment status
    if (status === 'success' || status === 'completed') {
      const timestamp = new Date().toISOString();
      
      // Update order status to completed
      await orderRef.update({
        status: 'completed',
        transactionId,
        paidAt: timestamp,
        updatedAt: timestamp,
      });

      // Add EA to user's purchased EAs
      await addEAToUserAccount(
        orderData!.email,
        orderData!.botName,
        orderId
      );

      // Send confirmation email
      await sendConfirmationEmail(orderData!.email, orderData!.botName, orderId);

      console.log(`Order ${orderId} completed successfully`);
      
      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
      }, { status: 200 });

    } else {
      // Payment failed
      await orderRef.update({
        status: 'failed',
        failureReason: body.failureReason || 'Payment failed',
        updatedAt: new Date().toISOString(),
      });

      console.log(`Order ${orderId} failed`);
      
      return NextResponse.json({
        success: false,
        message: 'Payment failed',
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    // Map bot names to EA details
    const EA_CATALOG: Record<string, any> = {
      'TrendRider EA': {
        eaId: 'trendrider-ea',
        version: '2.1.0',
        thumbnail: '📈',
        description: 'Advanced trend-following strategy',
        downloadUrl: 'https://storage.../trendrider-ea-v2.1.0.ex4', // Update with actual URL
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
      license: 'Standard', // Update based on your pricing tiers
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

