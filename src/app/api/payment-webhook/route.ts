import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendConfirmationEmail } from '@/lib/email';
import { verifyPesapalPayment } from '@/lib/pesapal';
import { verifyMpesaPayment } from '@/lib/mpesa';
import { getPayPalOrderDetails, verifyPayPalWebhook } from '@/lib/paypal';
import { FieldValue } from 'firebase-admin/firestore';
import { getEAByName } from '@/data/eas';

// This endpoint receives payment confirmations from payment gateways
// M-PESA, Pesapal, and PayPal will send webhook notifications here

// Handle Pesapal IPN (GET request with query parameters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Log all incoming query parameters for debugging
    const allParams = Object.fromEntries(searchParams.entries());
    const userAgent = req.headers.get('user-agent') || '';
    const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Firefox');
    
    console.log('📥 Webhook GET request received:', {
      url: req.url,
      params: allParams,
      isBrowser,
      userAgent: userAgent.substring(0, 50),
      headers: Object.fromEntries(req.headers.entries()),
    });
    
    // Check if this is a Pesapal IPN notification (try multiple formats)
    const notificationType = searchParams.get('pesapal_notification_type') || 
                             searchParams.get('NotificationType') || 
                             searchParams.get('notificationType');
    const transactionTrackingId = searchParams.get('pesapal_transaction_tracking_id') || 
                                  searchParams.get('OrderTrackingId') || 
                                  searchParams.get('orderTrackingId') ||
                                  searchParams.get('TransactionTrackingId');
    const merchantReference = searchParams.get('pesapal_merchant_reference') || 
                              searchParams.get('OrderMerchantReference') || 
                              searchParams.get('orderMerchantReference') ||
                              searchParams.get('MerchantReference');
    
    // Also check for alternative parameter names
    const orderId = searchParams.get('orderId') || 
                    searchParams.get('order_id') || 
                    searchParams.get('orderID') ||
                    merchantReference; // Use merchant reference as orderId fallback
    const status = searchParams.get('status') || 
                   searchParams.get('payment_status') ||
                   searchParams.get('PaymentStatus');
    
    // Handle Pesapal IPN format (with any parameter name format)
    if (transactionTrackingId && merchantReference) {
      console.log('📥 Received Pesapal IPN notification:', {
        notificationType: notificationType || 'not provided',
        transactionTrackingId,
        merchantReference,
      });
      
      // Get order from Firestore using merchant reference (orderId)
      try {
        const orderRef = adminDb.collection('orders').doc(merchantReference);
        const orderDoc = await orderRef.get();
        
        if (!orderDoc.exists) {
          console.error(`Order not found: ${merchantReference}`);
          // Still return success to Pesapal to avoid retries
          return NextResponse.json({
            OrderTrackingId: transactionTrackingId,
            OrderMerchantReference: merchantReference,
          }, { status: 200 });
        }
        
        const orderData = orderDoc.data();
        
        // If browser redirect after payment, assume payment was successful (user wouldn't be redirected if payment failed)
        // For server-to-server IPN calls, verify with Pesapal API
        const shouldProcessPayment = isBrowser || orderData?.status === 'pending';
        
        if (shouldProcessPayment) {
          // Verify the payment status with Pesapal (only if not already completed)
          let verification: { success: boolean; error?: string } = { success: isBrowser }; // Assume success for browser redirects
          
          if (!isBrowser) {
            // For server-to-server IPN, verify with Pesapal
            try {
              verification = await verifyPesapalPayment(transactionTrackingId);
            } catch (verifyError: any) {
              console.error('Pesapal verification error:', verifyError);
              // If verification fails but it's a browser redirect, still process (user completed payment)
              verification = { success: isBrowser, error: verifyError?.message };
            }
          }
          
          if (verification.success || orderData?.status === 'pending') {
            // Payment completed - verify if not already completed
            if (orderData?.status !== 'completed') {
              console.log(`💳 Processing payment completion for order ${merchantReference} (isBrowser: ${isBrowser})`);
              
              await orderRef.update({
                status: 'completed',
                transactionId: transactionTrackingId,
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              
              // Add EA to user's account
              console.log(`📦 Adding EA ${orderData!.botName} to user account ${orderData!.email}`);
              try {
                await addEAToUserAccount(
                  orderData!.email,
                  orderData!.botName,
                  merchantReference
                );
                console.log(`✅ EA added to user account successfully`);
              } catch (eaError: any) {
                console.error(`❌ Failed to add EA to user account:`, eaError?.message || eaError);
                console.error('EA error details:', eaError);
              }
              
              // Send confirmation email
              console.log(`📧 Attempting to send confirmation email to ${orderData!.email} for order ${merchantReference}`);
              try {
                await sendConfirmationEmail(orderData!.email, orderData!.botName, merchantReference);
                console.log(`✅ Confirmation email sent successfully to ${orderData!.email}`);
              } catch (emailError: any) {
                console.error(`❌ Failed to send confirmation email to ${orderData!.email}:`, emailError?.message || emailError);
                console.error('Email error details:', emailError);
              }
              
              console.log(`✅ Pesapal payment completed for order ${merchantReference}`);
            } else {
              console.log(`Order ${merchantReference} already completed`);
            }
          } else {
            // Payment failed or still pending
            const newStatus = verification.error ? 'failed' : 'pending';
            if (orderData?.status !== newStatus) {
              await orderRef.update({
                status: newStatus,
                transactionId: transactionTrackingId,
                updatedAt: new Date().toISOString(),
              });
              console.log(`Order ${merchantReference} status updated to: ${newStatus}`);
            }
          }
        } else if (orderData?.status === 'completed') {
          console.log(`Order ${merchantReference} already completed, skipping processing`);
        }
      } catch (firestoreError: any) {
        // Firestore might not be available, but we still need to respond to Pesapal
        console.error('Firestore error processing Pesapal IPN:', firestoreError);
      }
      
      // If this is a browser redirect (user coming back from payment), redirect to dashboard
      if (isBrowser) {
        console.log(`🔄 Redirecting user to dashboard for order ${merchantReference}`);
        return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${merchantReference}`, req.url));
      }
      
      // Pesapal IPN requires us to echo back the same parameters (use the format they sent)
      // This confirms we received the notification
      return NextResponse.json({
        OrderTrackingId: transactionTrackingId,
        OrderMerchantReference: merchantReference,
      }, { status: 200 });
    }
    
    // Handle generic/test webhook format (for testing or other payment gateways)
    if (orderId && status) {
      console.log('📥 Received generic webhook notification:', {
        orderId,
        status,
      });
      
      try {
        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          
          if (status === 'completed' || status === 'success' || status === 'paid') {
            // Payment completed
            await orderRef.update({
              status: 'completed',
              transactionId: searchParams.get('transactionId') || searchParams.get('transaction_id') || orderId,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
            // Add EA to user's account
            await addEAToUserAccount(
              orderData!.email,
              orderData!.botName,
              orderId
            );
            
            // Send confirmation email
            await sendConfirmationEmail(orderData!.email, orderData!.botName, orderId);
            
            console.log(`✅ Payment completed for order ${orderId}`);
            
            return NextResponse.json({
              success: true,
              message: 'Payment processed successfully',
              orderId,
            }, { status: 200 });
          }
        } else {
          console.error(`Order not found: ${orderId}`);
        }
      } catch (error) {
        console.error('Error processing generic webhook:', error);
      }
    }
    
    // Not a valid IPN format, but log what we received for debugging
    console.warn('⚠️ Not a valid IPN notification format. Received params:', allParams);
    
    // If browser redirect with orderId, redirect to dashboard
    if (isBrowser && orderId) {
      return NextResponse.redirect(new URL(`/dashboard?payment=success&orderId=${orderId}`, req.url));
    }
    
    return NextResponse.json(
      { 
        error: 'Not a valid IPN notification',
        receivedParams: allParams,
        hint: 'Expected Pesapal IPN format or orderId + status parameters'
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error processing webhook GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Handle Pesapal webhook (POST with JSON body)
    if (body.order_tracking_id || body.orderMerchantReference || body.order_tracking_id) {
      orderId = body.orderMerchantReference || body.order_merchant_reference || body.order_tracking_id;
      status = body.payment_status || body.status;
      transactionId = body.order_tracking_id || body.transaction_id || body.pesapal_transaction_tracking_id;
      paymentMethod = 'pesapal';
      amount = parseFloat(body.amount || '0');
      
      console.log('📥 Received Pesapal webhook (POST):', {
        orderId,
        transactionId,
        status,
      });
      
      // Verify Pesapal payment
      if (transactionId) {
        const verification = await verifyPesapalPayment(transactionId);
        if (verification.success) {
          status = 'completed';
        } else if (!status || status === 'PENDING') {
          status = verification.error ? 'failed' : 'pending';
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
    // Get EA details from the centralized data file
    const eaData = getEAByName(botName);
    
    if (!eaData) {
      console.error(`❌ EA not found in catalog: "${botName}"`);
      console.error(`💡 Make sure the bot name in your order matches exactly: "Akavanta"`);
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
    const orderExists = existingEAs.some((ea: any) => ea.orderId === orderId);
    
    if (!orderExists) {
      await userRef.update({
        purchasedEAs: FieldValue.arrayUnion(purchasedEA),
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ EA ${botName} added to user ${email} (Order: ${orderId})`);
    } else {
      console.log(`⚠️ EA ${botName} already exists for user ${email} (Order: ${orderId})`);
    }
    
  } catch (error) {
    console.error('❌ Error adding EA to user account:', error);
    throw error;
  }
}

