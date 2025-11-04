import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendOrderPendingEmail } from '@/lib/email';
import { initializePesapalPayment } from '@/lib/pesapal';
import { initializeMpesaPayment } from '@/lib/mpesa';
import { initializePayPalPayment } from '@/lib/paypal';

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
    } catch (firestoreError: any) {
      if (firestoreError?.code === 5 || firestoreError?.code === 'NOT_FOUND') {
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
    
    // Determine currency based on payment method
    // M-Pesa uses KES (Kenyan Shillings), others use USD
    const currency = paymentMethod === 'mpesa' ? 'KES' : 'USD';
    // Convert USD to KES if using M-Pesa (approximate rate: 1 USD = 130 KES)
    const exchangeRate = 130; // TODO: Use actual exchange rate API
    const amount = paymentMethod === 'mpesa' ? 50 * exchangeRate : 50;
    
    // Initialize payment based on method
    console.log(`Initializing ${paymentMethod} payment for order ${orderId}...`);
    console.log(`Payment details: amount=${amount}, currency=${currency}, email=${email}`);
    
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
        paymentResult = await initializePesapalPayment({
          orderId,
          amount,
          currency,
          phoneNumber: phone,
          email,
          description: `Purchase of ${botName} - Expert Advisor`,
          botName,
        });
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
    } catch (paymentError: any) {
      console.error(`Error initializing ${paymentMethod} payment:`, paymentError);
      return NextResponse.json({
        success: false,
        error: paymentError.message || `Failed to initialize ${paymentMethod} payment`,
        orderId,
      }, { status: 500 });
    }

    if (!paymentResult.success) {
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Payment initialization failed',
        orderId,
      }, { status: 400 });
    }

    // Update order with transaction ID and payment URL if available (non-blocking)
    if (firestoreSaved) {
      try {
        const updateData: any = {
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

