import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendOrderPendingEmail } from '@/lib/email';
import { initializePesapalPayment, initializeMpesaPayment } from '@/lib/pesapal';
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

    // Save order to Firestore
    await adminDb.collection('orders').doc(orderId).set(orderData);

    console.log('Order saved to Firestore:', orderId);

    // Send order confirmation email
    await sendOrderPendingEmail(email, botName, orderId, paymentMethod);

    // Initialize payment based on method
    let paymentResult: { success: boolean; paymentUrl?: string; transactionId?: string; error?: string } = { 
      success: false, 
      paymentUrl: '', 
      transactionId: '', 
      error: '' 
    };
    
    const paymentData = {
      orderId,
      amount: 50, // Fixed price for EA
      currency: 'USD',
      phoneNumber: phone,
      email,
      description: `Purchase of ${botName} - Expert Advisor`,
      botName,
    };

    if (paymentMethod === 'mpesa') {
      paymentResult = await initializeMpesaPayment(paymentData);
    } else if (paymentMethod === 'pesapal') {
      paymentResult = await initializePesapalPayment(paymentData);
    } else if (paymentMethod === 'paypal') {
      paymentResult = await initializePayPalPayment(paymentData);
    }

    if (!paymentResult.success) {
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Payment initialization failed',
        orderId,
      }, { status: 400 });
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

