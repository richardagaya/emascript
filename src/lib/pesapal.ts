import axios from 'axios';

/**
 * Pesapal API Integration
 * Documentation: https://developer.pesapal.com/
 */

// Pesapal API configuration
// Helper function to get base URL from environment variables
function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL || 
         process.env.NEXT_PUBLIC_APP_URL || 
         'http://localhost:3000';
}

// Pesapal Production Configuration
// Production URL: https://api.pesapal.com
// Sandbox URL: https://cybqa.pesapal.com
const PESAPAL_CONFIG = {
  baseUrl: process.env.PESAPAL_BASE_URL || 'https://api.pesapal.com', // Production URL (default)
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  // Use PESAPAL_CALLBACK_URL if set, otherwise construct from base URL
  callbackUrl: process.env.PESAPAL_CALLBACK_URL || `${getAppBaseUrl()}/api/payment-webhook`,
  // Use PESAPAL_IPN_URL if set, otherwise construct from base URL
  ipnUrl: process.env.PESAPAL_IPN_URL || `${getAppBaseUrl()}/api/payment-webhook`,
};

export interface PesapalPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  email: string;
  description: string;
  botName: string;
}

export interface PesapalPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  orderTrackingId?: string;
  error?: string;
}

/**
 * Get Pesapal API access token
 * Pesapal uses a simple token-based authentication
 */
async function getPesapalAccessToken(): Promise<string> {
  try {
    if (!PESAPAL_CONFIG.consumerKey || !PESAPAL_CONFIG.consumerSecret) {
      throw new Error('Pesapal credentials not configured');
    }

    // Handle base URL format - if it already ends with /pesapalv3, use it as-is
    let authUrl: string;
    if (PESAPAL_CONFIG.baseUrl.includes('/pesapalv3')) {
      authUrl = `${PESAPAL_CONFIG.baseUrl}/api/Auth/RequestToken`;
    } else {
      authUrl = `${PESAPAL_CONFIG.baseUrl}/pesapalv3/api/Auth/RequestToken`;
    }

    const response = await axios.post(
      authUrl,
      {
        consumer_key: PESAPAL_CONFIG.consumerKey,
        consumer_secret: PESAPAL_CONFIG.consumerSecret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (!response.data.token) {
      throw new Error('Invalid response from Pesapal auth endpoint');
    }

    return response.data.token;
  } catch (error) {
    const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    console.error('Error getting Pesapal access token:', err.response?.data || err.message);
    throw new Error(
      err.response?.data?.message || 
      err.response?.data?.error || 
      'Failed to get Pesapal access token'
    );
  }
}

/**
 * Initialize Pesapal payment
 * Creates a payment request and returns a redirect URL for the customer
 * Documentation: https://developer.pesapal.com/api3/endpoints/submit-order-request
 */
export async function initializePesapalPayment(
  paymentData: PesapalPaymentRequest
): Promise<PesapalPaymentResponse> {
  try {
    const accessToken = await getPesapalAccessToken();
    
    // Pesapal payment request payload
    // According to Pesapal API v3 documentation
    // Note: notification_id can be either:
    // 1. A registered IPN ID (from registerPesapalIPN)
    // 2. An IPN URL (Pesapal will use it directly)
    // We use the URL directly for simplicity
    const paymentRequest = {
      id: paymentData.orderId, // Unique order ID
      currency: paymentData.currency, // Currency code (KES, USD, etc.)
      amount: paymentData.amount, // Payment amount
      description: paymentData.description, // Order description
      callback_url: PESAPAL_CONFIG.callbackUrl, // URL to redirect after payment
      notification_id: process.env.PESAPAL_IPN_ID || PESAPAL_CONFIG.ipnUrl,
      billing_address: {
        phone_number: paymentData.phoneNumber,
        email_address: paymentData.email,
        country_code: 'KE', // ISO country code
      },
    };

    // Handle base URL format - if it already ends with /pesapalv3, use it as-is
    // Otherwise, append /api/Transactions/SubmitOrderRequest
    let apiUrl: string;
    if (PESAPAL_CONFIG.baseUrl.includes('/pesapalv3')) {
      // Base URL already includes /pesapalv3, append /api/...
      apiUrl = `${PESAPAL_CONFIG.baseUrl}/api/Transactions/SubmitOrderRequest`;
    } else {
      // Base URL is just the domain, construct full path
      apiUrl = `${PESAPAL_CONFIG.baseUrl}/pesapalv3/api/Transactions/SubmitOrderRequest`;
    }
    
    console.log('📤 Pesapal API Request:', {
      baseUrl: PESAPAL_CONFIG.baseUrl,
      apiUrl: apiUrl,
      payload: JSON.stringify(paymentRequest, null, 2),
    });

    const response = await axios.post(
      apiUrl,
      paymentRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    console.log('📥 Pesapal API Response:', {
      status: response.status,
      data: JSON.stringify(response.data, null, 2),
      headers: response.headers,
    });

    // Pesapal returns redirect_url for customer to complete payment
    // Check various possible response formats
    const redirectUrl = response.data?.redirect_url || 
                       response.data?.redirectUrl || 
                       response.data?.payment_url ||
                       response.data?.paymentUrl;
    
    const trackingId = response.data?.order_tracking_id || 
                      response.data?.orderTrackingId ||
                      response.data?.tracking_id ||
                      response.data?.id;

    if (redirectUrl) {
      return {
        success: true,
        paymentUrl: redirectUrl,
        transactionId: trackingId || paymentData.orderId,
        orderTrackingId: trackingId || paymentData.orderId,
      };
    } else {
      console.error('❌ Pesapal API response missing redirect URL:', {
        responseData: response.data,
        responseKeys: Object.keys(response.data || {}),
      });
      return {
        success: false,
        error: `Invalid response from Pesapal API - missing redirect URL. Response: ${JSON.stringify(response.data)}`,
      };
    }
  } catch (error) {
    const err = error as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: {
          message?: string;
          error?: string;
          error_description?: string;
          errorMessage?: string;
        };
      };
      config?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
      };
    };
    console.error('❌ Error initializing Pesapal payment:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers,
      },
    });
    
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.response?.data?.error_description ||
                        err.response?.data?.errorMessage ||
                        err.message || 
                        'Failed to initialize Pesapal payment';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Register IPN URL with Pesapal
 * Registers the IPN URL for receiving payment notifications
 * Documentation: https://developer.pesapal.com/api3/endpoints/registeripnurl
 */
export async function registerPesapalIPN(ipnUrl: string): Promise<{ success: boolean; ipnId?: string; error?: string }> {
  try {
    const accessToken = await getPesapalAccessToken();
    
    // Handle base URL format
    let registerUrl: string;
    if (PESAPAL_CONFIG.baseUrl.includes('/pesapalv3')) {
      registerUrl = `${PESAPAL_CONFIG.baseUrl}/api/URLSetup/RegisterIPN`;
    } else {
      registerUrl = `${PESAPAL_CONFIG.baseUrl}/pesapalv3/api/URLSetup/RegisterIPN`;
    }
    
    const response = await axios.post(
      registerUrl,
      {
        url: ipnUrl,
        ipn_notification_type: 'GET', // Pesapal IPN can use GET or POST
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (response.data && response.data.ipn_id) {
      return {
        success: true,
        ipnId: response.data.ipn_id,
      };
    } else {
      return {
        success: false,
        error: 'Invalid response from Pesapal IPN registration',
      };
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    console.error('Error registering Pesapal IPN:', err.response?.data || err.message);
    // IPN might already be registered, so we don't fail completely
    return {
      success: false,
      error: err.response?.data?.message || 'Failed to register Pesapal IPN',
    };
  }
}

/**
 * Verify Pesapal payment status
 * Check the status of a payment using the order tracking ID
 * Documentation: https://developer.pesapal.com/api3/endpoints/get-transaction-status
 */
export async function verifyPesapalPayment(
  orderTrackingId: string
): Promise<PesapalPaymentResponse> {
  try {
    const accessToken = await getPesapalAccessToken();
    
    // Handle base URL format
    let statusUrl: string;
    if (PESAPAL_CONFIG.baseUrl.includes('/pesapalv3')) {
      statusUrl = `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
    } else {
      statusUrl = `${PESAPAL_CONFIG.baseUrl}/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
    }
    
    const response = await axios.get(
      statusUrl,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    // Pesapal payment statuses: PENDING, COMPLETED, FAILED, etc.
    const status = response.data.payment_status || response.data.status;
    const isCompleted = status === 'COMPLETED' || status === 'COMPLETE' || status === 'SUCCESS';
    
    return {
      success: isCompleted,
      transactionId: orderTrackingId,
      orderTrackingId: orderTrackingId,
    };
  } catch (error) {
    const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    console.error('Error verifying Pesapal payment:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error ||
                        err.message || 
                        'Failed to verify Pesapal payment';
    return {
      success: false,
      error: errorMessage,
      transactionId: orderTrackingId,
    };
  }
}
