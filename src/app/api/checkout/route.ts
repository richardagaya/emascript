import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendOrderPendingEmail } from '@/lib/email';
import { initializePesapalPayment } from '@/lib/pesapal';
import { initializeMpesaPayment } from '@/lib/mpesa';
import { initializePayPalPayment } from '@/lib/paypal';
import { getEAByName } from '@/data/eas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { botName, email, phone, paymentMethod, userId } = body;

    // Validate required fields
    if (!botName || !email || !phone || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate phone number (at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Get EA data to include price in order
    const eaData = getEAByName(botName);
    if (!eaData) {
      return NextResponse.json(
        { error: 'EA not found' },
        { status: 404 }
      );
    }
    
    // Generate a unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    const timestamp = new Date().toISOString();

    // Create order data
    const orderData = {
      orderId,
      botName,
      email,
      phone,
      paymentMethod,
      userId,
      price: eaData.price,
      version: eaData.version,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Save order to Firestore (non-blocking - continue even if Firestore fails)
    let firestoreSaved = false;
    try {
      await adminDb.collection('orders').doc(orderId).set(orderData);
      firestoreSaved = true;
      console.log('Order saved to Firestore:', orderId);
    } catch (firestoreError) {
      const error = firestoreError as { code?: number | string };
      if (error?.code === 5 || error?.code === 'NOT_FOUND') {
        console.warn('⚠️  Firestore not available. Order will be saved after payment. Continuing with payment initialization...');
      } else {
        console.error('Firestore save error (non-critical):', firestoreError);
      }
      // Continue with payment initialization even if Firestore fails
    }

    // Send order confirmation email (non-blocking)
    try {
      await sendOrderPendingEmail(email, botName, orderId, paymentMethod);
    } catch (emailError) {
      console.error('Email send error (non-critical):', emailError);
      // Continue with payment initialization even if email fails
    }

    // Initialize payment based on method
    let paymentResult: { success: boolean; paymentUrl?: string; transactionId?: string; error?: string } = { 
      success: false, 
      paymentUrl: '', 
      transactionId: '', 
      error: '' 
    };
    
    // Use price from EA data (already fetched above)
    const priceUSD = eaData.price;
    
    // Determine currency based on payment method
    // M-Pesa and Pesapal use KES (Kenyan Shillings), PayPal uses USD
    const currency = (paymentMethod === 'mpesa' || paymentMethod === 'pesapal') ? 'KES' : 'USD';
    // Convert USD to KES if using M-Pesa or Pesapal (approximate rate: 1 USD = 130 KES)
    const exchangeRate = 130; // TODO: Use actual exchange rate API
    const amount = (paymentMethod === 'mpesa' || paymentMethod === 'pesapal') ? priceUSD * exchangeRate : priceUSD;
    
    // Initialize payment based on method
    console.log(`Initializing ${paymentMethod} payment for order ${orderId}...`);
    console.log(`Payment details: amount=${amount}, currency=${currency}, email=${email}, phone=${phone}`);
    
    try {
      if (paymentMethod === 'mpesa') {
        paymentResult = await initializeMpesaPayment({
          orderId,
          amount,
          currency,
          phoneNumber: phone,
          email,
          description: `Purchase of ${botName} - Expert Advisor`,
          botName,
        });
      } else if (paymentMethod === 'pesapal') {
        console.log('🔵 Initializing Pesapal payment with:', {
          orderId,
          amount,
          currency,
          phoneNumber: phone,
          email,
          botName,
        });
        paymentResult = await initializePesapalPayment({
          orderId,
          amount,
          currency,
          phoneNumber: phone,
          email,
          description: `Purchase of ${botName} - Expert Advisor`,
          botName,
        });
        console.log('🔵 Pesapal payment result:', paymentResult);
      } else if (paymentMethod === 'paypal') {
        paymentResult = await initializePayPalPayment({
          orderId,
          amount,
          currency,
          phoneNumber: phone,
          email,
          description: `Purchase of ${botName} - Expert Advisor`,
          botName,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Unsupported payment method: ${paymentMethod}`,
          orderId,
        }, { status: 400 });
      }
      
      console.log(`Payment initialization result:`, {
        success: paymentResult.success,
        hasPaymentUrl: !!paymentResult.paymentUrl,
        hasTransactionId: !!paymentResult.transactionId,
        error: paymentResult.error,
      });
    } catch (paymentError) {
      const error = paymentError as { message?: string; response?: any };
      console.error(`❌ Error initializing ${paymentMethod} payment:`, {
        message: error.message,
        stack: (paymentError as Error).stack,
        response: error.response,
      });
      return NextResponse.json({
        success: false,
        error: error.message || `Failed to initialize ${paymentMethod} payment`,
        orderId,
      }, { status: 500 });
    }

    if (!paymentResult.success) {
      console.error(`❌ Payment initialization failed for ${paymentMethod}:`, {
        error: paymentResult.error,
        orderId,
        paymentMethod,
      });
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Payment initialization failed',
        orderId,
        paymentMethod,
      }, { status: 400 });
    }

    // Update order with transaction ID and payment URL if available (non-blocking)
    if (firestoreSaved) {
      try {
        const updateData: Record<string, string | undefined> = {
          transactionId: paymentResult.transactionId,
          updatedAt: new Date().toISOString(),
        };
        
        if (paymentResult.paymentUrl) {
          updateData.paymentUrl = paymentResult.paymentUrl;
        }
        
        await adminDb.collection('orders').doc(orderId).update(updateData);
      } catch (updateError) {
        console.error('Firestore update error (non-critical):', updateError);
        // Don't fail the request if Firestore update fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order created successfully',
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    }, { status: 200 });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

