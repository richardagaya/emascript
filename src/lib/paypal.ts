import { 
  Client, 
  OrdersController, 
  OrderRequest, 
  OrderApplicationContext,
  CheckoutPaymentIntent,
  OrderCaptureRequest,
  Environment
} from '@paypal/paypal-server-sdk';

/**
 * PayPal API Integration
 * Documentation: https://developer.paypal.com/docs/api/orders/v2/
 */

// PayPal configuration
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox', // 'sandbox' or 'live'
  baseUrl: process.env.PAYPAL_BASE_URL || 'https://api.sandbox.paypal.com',
  returnUrl: process.env.PAYPAL_RETURN_URL || `${process.env.NEXTAUTH_URL}/api/paypal/return`,
  cancelUrl: process.env.PAYPAL_CANCEL_URL || `${process.env.NEXTAUTH_URL}/marketplace/checkout`,
};

export interface PayPalPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  email: string;
  description: string;
  botName: string;
}

export interface PayPalPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  orderId?: string;
  error?: string;
}

/**
 * Initialize PayPal API client
 * Uses OAuth 2.0 client credentials
 */
function getPayPalClient(): Client {
  if (!PAYPAL_CONFIG.clientId || !PAYPAL_CONFIG.clientSecret) {
    throw new Error('PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your environment variables.');
  }

  console.log('Creating PayPal client:', {
    environment: PAYPAL_CONFIG.environment,
    hasClientId: !!PAYPAL_CONFIG.clientId,
    hasClientSecret: !!PAYPAL_CONFIG.clientSecret,
    clientIdLength: PAYPAL_CONFIG.clientId?.length,
  });

  return new Client({
    environment: PAYPAL_CONFIG.environment === 'live' ? Environment.Production : Environment.Sandbox,
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CONFIG.clientId,
      oAuthClientSecret: PAYPAL_CONFIG.clientSecret,
    },
  });
}

/**
 * Initialize PayPal payment order
 * Creates a PayPal order and returns approval URL for customer to complete payment
 * Documentation: https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
export async function initializePayPalPayment(
  paymentData: PayPalPaymentRequest
): Promise<PayPalPaymentResponse> {
  try {
    const paypalClient = getPayPalClient();
    const ordersController = new OrdersController(paypalClient);

    // Validate return URL - must be absolute and HTTPS (except localhost)
    if (!PAYPAL_CONFIG.returnUrl || !PAYPAL_CONFIG.returnUrl.includes('http')) {
      throw new Error(`Invalid PayPal return URL: ${PAYPAL_CONFIG.returnUrl}. Please set PAYPAL_RETURN_URL or NEXTAUTH_URL in your environment variables.`);
    }

    // Validate cancel URL
    if (!PAYPAL_CONFIG.cancelUrl || !PAYPAL_CONFIG.cancelUrl.includes('http')) {
      throw new Error(`Invalid PayPal cancel URL: ${PAYPAL_CONFIG.cancelUrl}. Please set PAYPAL_CANCEL_URL or NEXTAUTH_URL in your environment variables.`);
    }

    // Validate amount - PayPal requires minimum $0.01 USD
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error(`Invalid payment amount: ${paymentData.amount}. Amount must be greater than 0.`);
    }

    // PayPal minimum amount check
    if (paymentData.currency === 'USD' && paymentData.amount < 0.01) {
      throw new Error(`PayPal requires minimum amount of $0.01 USD. Current amount: ${paymentData.amount}`);
    }

    // PayPal Order Request according to Orders API v2
    // Note: Ensure return/cancel URLs are absolute URLs
    const orderRequest: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture, // Capture payment immediately after approval
      purchaseUnits: [
        {
          referenceId: paymentData.orderId,
          amount: {
            currencyCode: paymentData.currency,
            value: paymentData.amount.toFixed(2), // Format to 2 decimal places (required by PayPal)
          },
          description: paymentData.description.substring(0, 127), // PayPal max 127 chars
          customId: paymentData.orderId,
        },
      ],
      applicationContext: {
        brandName: 'EmaScript Trading Bots',
        returnUrl: PAYPAL_CONFIG.returnUrl,
        cancelUrl: PAYPAL_CONFIG.cancelUrl,
        shippingPreference: 'NO_SHIPPING', // Digital goods - no shipping needed
        locale: 'en-US',
        userAction: 'PAY_NOW', // Show "Pay Now" button instead of "Continue"
      } as OrderApplicationContext,
    };

    console.log('Creating PayPal order with request:', {
      intent: orderRequest.intent,
      amount: orderRequest.purchaseUnits?.[0]?.amount,
      returnUrl: orderRequest.applicationContext?.returnUrl,
      cancelUrl: orderRequest.applicationContext?.cancelUrl,
    });

    const response = await ordersController.createOrder({ body: orderRequest });
    
    console.log('PayPal order creation response:', {
      hasResult: !!response.result,
      orderId: response.result?.id,
      status: response.result?.status,
      links: response.result?.links?.map((l: { rel?: string; href?: string }) => ({ rel: l.rel, href: l.href })),
    });
    
    if (response.result?.id) {
      // Find the approval URL from the links array
      const approvalUrl = response.result.links?.find((link: { rel?: string; href?: string }) => link.rel === 'approve')?.href;
      
      if (!approvalUrl) {
        return {
          success: false,
          error: 'Failed to get PayPal approval URL from order response',
        };
      }
      
      return {
        success: true,
        paymentUrl: approvalUrl,
        transactionId: response.result.id,
        orderId: response.result.id,
      };
    } else {
      return {
        success: false,
        error: 'Failed to create PayPal order - invalid response',
      };
    }
  } catch (error) {
    const err = error as {
      message?: string;
      response?: {
        data?: { message?: string; details?: Array<{ description?: string; issue?: string }>; error?: string; error_description?: string };
        status?: number;
        statusText?: string;
      };
    };
    console.error('Error initializing PayPal payment:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      statusText: err.response?.statusText,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    
    // Extract detailed error message
    let errorMessage = 'Failed to initialize PayPal payment';
    
    if (err.response?.data) {
      // PayPal API error response
      if (err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response.data.details && err.response.data.details.length > 0) {
        errorMessage = err.response.data.details[0].description || err.response.data.details[0].issue || errorMessage;
      } else if (err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.data.error_description) {
        errorMessage = err.response.data.error_description;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Capture PayPal payment
 * Captures the payment after customer approves the order
 * Documentation: https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
export async function capturePayPalPayment(
  orderId: string
): Promise<PayPalPaymentResponse> {
  try {
    const paypalClient = getPayPalClient();
    const ordersController = new OrdersController(paypalClient);

    const response = await ordersController.captureOrder({
      id: orderId,
      body: {} as OrderCaptureRequest,
    });

    const status = response.result?.status;
    const captureId = response.result?.purchaseUnits?.[0]?.payments?.captures?.[0]?.id;
    
    return {
      success: status === 'COMPLETED',
      transactionId: captureId || orderId,
      orderId: orderId,
    };
  } catch (error) {
    const err = error as { message?: string; response?: { data?: { message?: string } } };
    console.error('Error capturing PayPal payment:', error);
    const errorMessage = err.message || 
                        err.response?.data?.message ||
                        'Failed to capture PayPal payment';
    return {
      success: false,
      error: errorMessage,
      orderId: orderId,
    };
  }
}

/**
 * Get PayPal order details
 * Retrieve order information to check payment status
 * Documentation: https://developer.paypal.com/docs/api/orders/v2/#orders_get
 */
export async function getPayPalOrderDetails(
  orderId: string
): Promise<PayPalPaymentResponse> {
  try {
    const paypalClient = getPayPalClient();
    const ordersController = new OrdersController(paypalClient);

    const response = await ordersController.getOrder({ id: orderId });
    const status = response.result?.status;
    
    return {
      success: status === 'COMPLETED',
      transactionId: orderId,
      orderId: orderId,
    };
  } catch (error) {
    const err = error as { message?: string; response?: { data?: { message?: string } } };
    console.error('Error getting PayPal order details:', error);
    const errorMessage = err.message || 
                        err.response?.data?.message ||
                        'Failed to get PayPal order details';
    return {
      success: false,
      error: errorMessage,
      orderId: orderId,
    };
  }
}

/**
 * Verify PayPal webhook signature
 * Validates that webhook requests are from PayPal
 * Documentation: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/
 * 
 * Note: Full webhook verification requires additional implementation
 * This is a placeholder - implement full signature verification for production
 */
export async function verifyPayPalWebhook(
  _headers: Record<string, string>, 
  _body: string
): Promise<boolean> {
  try {
    // TODO: Implement full webhook signature verification
    // This should verify:
    // 1. PayPal-Transmission-Id header
    // 2. PayPal-Transmission-Time header
    // 3. PayPal-Cert-Url header
    // 4. PayPal-Transmission-Sig header
    // 5. Certificate chain validation
    // See: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-webhook-signatures
    
    // For development, return true
    // In production, implement proper signature verification
    return true;
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}
