import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Admin endpoint to manually create a missing order
 * Use this when Pesapal payment succeeded but order wasn't created in database
 * 
 * POST /api/admin/create-order
 * Body: { orderId, email, botName, phone, transactionId, adminSecret }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email, botName, phone, transactionId, adminSecret } = body;

    // Validate admin secret
    const expectedSecret = process.env.ADMIN_SECRET || 'change-me-in-production';
    if (adminSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin secret' },
        { status: 401 }
      );
    }

    if (!orderId || !email || !botName) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, email, botName' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating missing order: ${orderId}`);

    // Check if order already exists
    const orderRef = adminDb.collection('orders').doc(orderId);
    const existingOrder = await orderRef.get();

    if (existingOrder.exists) {
      return NextResponse.json(
        { 
          error: 'Order already exists',
          order: existingOrder.data(),
        },
        { status: 400 }
      );
    }

    // Create the order
    const orderData = {
      orderId,
      botName,
      email,
      phone: phone || '',
      paymentMethod: 'pesapal',
      status: 'completed',
      transactionId: transactionId || orderId,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      price: 1,
      version: '1.0.0',
      manuallyCreated: true,
    };

    await orderRef.set(orderData);
    console.log(`✅ Order created: ${orderId}`);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId,
      nextStep: `Now call POST /api/complete-order-manual with {"orderId": "${orderId}"} to deliver the EA`,
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

