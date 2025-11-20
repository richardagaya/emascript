import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Debug endpoint to check order status
 * Usage: GET /api/debug/order?orderId=ORD-XXX&secret=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const secret = searchParams.get('secret');

    // Simple auth check
    const expectedSecret = process.env.ADMIN_SECRET || 'debug-secret';
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!orderId) {
      // List recent orders if no orderId provided
      try {
        const ordersSnapshot = await adminDb
          .collection('orders')
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();

        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        return NextResponse.json({
          recentOrders: orders,
          count: orders.length,
        });
      } catch (error) {
        return NextResponse.json({
          error: 'Failed to fetch orders',
          details: String(error),
        }, { status: 500 });
      }
    }

    // Get specific order
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found', orderId },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Check if user has the EA
    let userHasEA = false;
    let userEAs = [];
    if (orderData?.email) {
      const usersRef = adminDb.collection('users');
      const userQuery = await usersRef.where('email', '==', orderData.email).limit(1).get();
      
      if (!userQuery.empty) {
        const userData = userQuery.docs[0].data();
        userEAs = userData.purchasedEAs || [];
        userHasEA = userEAs.some((ea: { orderId?: string }) => ea.orderId === orderId);
      }
    }

    return NextResponse.json({
      order: {
        id: orderId,
        ...orderData,
      },
      userCheck: {
        email: orderData?.email,
        hasEA: userHasEA,
        totalEAs: userEAs.length,
        eas: userEAs,
      },
      diagnostics: {
        orderExists: true,
        paymentStatus: orderData?.status,
        eaDelivered: orderData?.eaDelivered || false,
        eaDeliveryError: orderData?.eaDeliveryError || null,
        emailSent: orderData?.emailSent || false,
        emailError: orderData?.emailError || null,
        lastRetryAt: orderData?.lastRetryAt || null,
      },
    });

  } catch (error) {
    console.error('Debug order error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

