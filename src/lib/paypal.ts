import { PayPalApi, OrdersApi, OrdersCreateRequest, Money, OrderRequest, ApplicationContext, PaymentSource, PaypalWallet } from '@paypal/paypal-server-sdk';

// PayPal configuration
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox', // 'sandbox' or 'live'
  baseUrl: process.env.PAYPAL_BASE_URL || 'https://api.sandbox.paypal.com',
  returnUrl: process.env.PAYPAL_RETURN_URL || `${process.env.NEXTAUTH_URL}/api/payment-webhook`,
  cancelUrl: process.env.PAYPAL_CANCEL_URL || `${process.env.NEXTAUTH_URL}/marketplace/checkout`,
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  email: string;
  description: string;
  botName: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

// Initialize PayPal client
function getPayPalClient() {
  const environment = PAYPAL_CONFIG.environment === 'live' 
    ? 'live' 
    : 'sandbox';
    
  return new PayPalApi({
    clientId: PAYPAL_CONFIG.clientId!,
    clientSecret: PAYPAL_CONFIG.clientSecret!,
    environment: environment as any,
  });
}

// Initialize PayPal payment
export async function initializePayPalPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  try {
    const paypalClient = getPayPalClient();
    const ordersApi = new OrdersApi(paypalClient);

    const orderRequest: OrderRequest = {
      intent: 'CAPTURE',
      purchaseUnits: [
        {
          referenceId: paymentData.orderId,
          amount: {
            currencyCode: paymentData.currency,
            value: paymentData.amount.toString(),
          },
          description: paymentData.description,
          customId: paymentData.orderId,
        },
      ],
      applicationContext: {
        brandName: 'EmaScript Trading Bots',
        landingPage: 'NO_PREFERENCE',
        userAction: 'PAY_NOW',
        returnUrl: PAYPAL_CONFIG.returnUrl,
        cancelUrl: PAYPAL_CONFIG.cancelUrl,
        paymentMethod: {
          paypal: {
            experienceContext: {
              paymentMethodPreference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brandName: 'EmaScript Trading Bots',
              locale: 'en-US',
              landingPage: 'NO_PREFERENCE',
              shippingPreference: 'NO_SHIPPING',
              userAction: 'PAY_NOW',
              returnUrl: PAYPAL_CONFIG.returnUrl,
              cancelUrl: PAYPAL_CONFIG.cancelUrl,
            },
          },
        } as PaymentSource,
      } as ApplicationContext,
    };

    const request: OrdersCreateRequest = {
      orderRequest,
    };

    const response = await ordersApi.ordersCreate(request);
    
    if (response.result?.id) {
      // Find the approval URL
      const approvalUrl = response.result.links?.find(link => link.rel === 'approve')?.href;
      
      return {
        success: true,
        paymentUrl: approvalUrl,
        transactionId: response.result.id,
      };
    } else {
      return {
        success: false,
        error: 'Failed to create PayPal order',
      };
    }
  } catch (error) {
    console.error('Error initializing PayPal payment:', error);
    return {
      success: false,
      error: 'Failed to initialize PayPal payment',
    };
  }
}

// Capture PayPal payment
export async function capturePayPalPayment(orderId: string): Promise<PaymentResponse> {
  try {
    const paypalClient = getPayPalClient();
    const ordersApi = new OrdersApi(paypalClient);

    const response = await ordersApi.ordersCapture({
      id: orderId,
      orderActionRequest: {
        paymentSource: {
          paypal: {
            experienceContext: {
              paymentMethodPreference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brandName: 'EmaScript Trading Bots',
              locale: 'en-US',
              landingPage: 'NO_PREFERENCE',
              shippingPreference: 'NO_SHIPPING',
              userAction: 'PAY_NOW',
            },
          },
        } as PaymentSource,
      },
    });

    const status = response.result?.status;
    
    return {
      success: status === 'COMPLETED',
      transactionId: orderId,
    };
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return {
      success: false,
      error: 'Failed to capture PayPal payment',
    };
  }
}

// Get PayPal order details
export async function getPayPalOrderDetails(orderId: string): Promise<PaymentResponse> {
  try {
    const paypalClient = getPayPalClient();
    const ordersApi = new OrdersApi(paypalClient);

    const response = await ordersApi.ordersGet({ id: orderId });
    const status = response.result?.status;
    
    return {
      success: status === 'COMPLETED',
      transactionId: orderId,
    };
  } catch (error) {
    console.error('Error getting PayPal order details:', error);
    return {
      success: false,
      error: 'Failed to get PayPal order details',
    };
  }
}

// Verify PayPal webhook signature
export async function verifyPayPalWebhook(headers: any, body: string): Promise<boolean> {
  try {
    // Note: In production, you should verify the webhook signature
    // This requires additional implementation using PayPal's webhook verification
    // For now, we'll return true for development purposes
    return true;
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}
