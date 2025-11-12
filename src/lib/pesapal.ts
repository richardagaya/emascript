import axios from 'axios';

/**
 * Pesapal API Integration
 * Documentation: https://developer.pesapal.com/
 */

// Pesapal API configuration
// Helper function to get base URL from environment variables
function getAppBaseUrl(): string {
  // Priority order for base URL:
  // 1. Explicitly set callback URL (for testing on different domains)
  // 2. Vercel URL (automatically set by Vercel - for testing)
  // 3. Explicitly set app URL (for production domain like akavanta.com)
  // 4. NextAuth URL (if using NextAuth)
  // 5. Fallback to localhost for local development
  
  // Check for Vercel URL first (for testing)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for explicit app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, ''); // Remove trailing slashes
  }
  
  // Check for NextAuth URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, ''); // Remove trailing slashes
  }
  
  // Fallback to localhost for local development
  return 'http://localhost:3000';
}

// Pesapal Production Configuration
// Production URL: https://pay.pesapal.com (uses /v3/api/ path)
// Sandbox URL: https://cybqa.pesapal.com (uses /pesapalv3/api/ path)
// Helper to normalize base URL (remove trailing slashes and version paths if present)
function normalizeBaseUrl(url: string): string {
  // Remove trailing slashes
  let normalized = url.replace(/\/+$/, '');
  // Remove version paths if present (we'll add them back based on environment)
  normalized = normalized.replace(/\/(pesapalv3|v3)$/, '');
  return normalized;
}

// Helper to construct Pesapal API URLs consistently
function getPesapalApiUrl(endpoint: string): string {
  const base = normalizeBaseUrl(process.env.PESAPAL_BASE_URL || 'https://pay.pesapal.com');
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Determine if we're using production or sandbox based on base URL
  // Production: https://pay.pesapal.com uses /v3/api/
  // Sandbox: https://cybqa.pesapal.com uses /pesapalv3/api/
  const isProduction = base.includes('pay.pesapal.com');
  const apiPath = isProduction ? 'v3/api' : 'pesapalv3/api';
  
  return `${base}/${apiPath}/${cleanEndpoint}`;
}

const PESAPAL_CONFIG = {
  baseUrl: normalizeBaseUrl(process.env.PESAPAL_BASE_URL || 'https://pay.pesapal.com'), // Production URL (default)
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  // Use PESAPAL_CALLBACK_URL if set, otherwise construct from base URL
  // For testing on Vercel, you can override this to point to Vercel domain
  callbackUrl: process.env.PESAPAL_CALLBACK_URL || `${getAppBaseUrl()}/api/payment-webhook`,
  // Use PESAPAL_IPN_URL if set, otherwise construct from base URL
  // IMPORTANT: If testing on Vercel but IPN is configured for akavanta.com (Firebase),
  // set PESAPAL_IPN_URL to your Vercel URL temporarily: https://emascript.vercel.app/api/payment-webhook
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

    // Use the helper function to construct the URL consistently
    const authUrl = getPesapalApiUrl('Auth/RequestToken');

    console.log('🔐 Pesapal Auth Request:', {
      baseUrl: PESAPAL_CONFIG.baseUrl,
      envBaseUrl: process.env.PESAPAL_BASE_URL,
      authUrl: authUrl,
      hasConsumerKey: !!PESAPAL_CONFIG.consumerKey,
      hasConsumerSecret: !!PESAPAL_CONFIG.consumerSecret,
    });

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
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('🔐 Pesapal Auth Response:', {
      status: response.status,
      hasToken: !!response.data?.token,
      data: response.data,
    });

    if (!response.data.token) {
      console.error('❌ Invalid Pesapal auth response - no token:', response.data);
      throw new Error('Invalid response from Pesapal auth endpoint');
    }

    return response.data.token;
  } catch (error) {
    const err = error as { 
      response?: { 
        status?: number;
        statusText?: string;
        data?: { message?: string; error?: string; error_description?: string }; 
      }; 
      message?: string;
      code?: string;
    };
    
    console.error('❌ Error getting Pesapal access token:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data,
      baseUrl: PESAPAL_CONFIG.baseUrl,
      envBaseUrl: process.env.PESAPAL_BASE_URL,
      authUrl: getPesapalApiUrl('Auth/RequestToken'),
    });
    
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.response?.data?.error_description ||
                        err.message || 
                        'Failed to get Pesapal access token';
    
    throw new Error(errorMessage);
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
    // 1. A registered IPN ID (from registerPesapalIPN) - must be a valid UUID string
    // 2. An IPN URL (Pesapal will use it directly) - must be a valid HTTPS URL
    let notificationId: string;
    
    // Check if PESAPAL_IPN_ID is set and not empty
    const ipnId = process.env.PESAPAL_IPN_ID?.trim();
    
    if (ipnId && ipnId.length > 0) {
      // Use IPN ID if provided (should be a UUID string from Pesapal)
      notificationId = ipnId;
      // Validate IPN ID format (should be a UUID-like string, at least 10 chars)
      if (notificationId.length < 10) {
        throw new Error(`Invalid PESAPAL_IPN_ID format. IPN ID should be a valid UUID string from Pesapal. Got: "${notificationId.substring(0, 10)}..." (length: ${notificationId.length})`);
      }
    } else {
      // Use IPN URL if no IPN ID is provided
      // Priority: PESAPAL_IPN_URL env var > auto-detected URL
      notificationId = process.env.PESAPAL_IPN_URL?.trim() || PESAPAL_CONFIG.ipnUrl;
      
      // Validate URL format
      if (!notificationId) {
        throw new Error('IPN URL is not configured. Set PESAPAL_IPN_URL environment variable or ensure PESAPAL_IPN_ID is set.');
      }
      
      if (!notificationId.startsWith('http://') && !notificationId.startsWith('https://')) {
        throw new Error(`Invalid IPN URL format: "${notificationId}". Must be a valid HTTP/HTTPS URL (e.g., https://emascript.vercel.app/api/payment-webhook)`);
      }
      
      // Warn if using HTTP in production (should use HTTPS)
      if (notificationId.startsWith('http://') && !notificationId.includes('localhost')) {
        console.warn('⚠️  Using HTTP for IPN URL. HTTPS is required for production.');
      }
    }
    
    // Log IPN configuration - IMPORTANT for debugging webhook issues
    console.log('📡 Pesapal IPN Configuration:', {
      hasIPNId: !!ipnId && ipnId.length > 0,
      hasIPNUrlEnv: !!process.env.PESAPAL_IPN_URL,
      ipnUrlFromConfig: PESAPAL_CONFIG.ipnUrl,
      callbackUrl: PESAPAL_CONFIG.callbackUrl,
      notification_id: ipnId ? `IPN_ID: ${ipnId.substring(0, 8)}...` : `IPN_URL: ${notificationId}`,
      notification_id_type: ipnId ? 'IPN_ID' : 'IPN_URL',
      notification_id_length: notificationId.length,
      notification_id_preview: notificationId.substring(0, 50) + (notificationId.length > 50 ? '...' : ''),
    });
    
    // Format amount - Pesapal expects a number, ensure it's properly formatted
    // Round to 2 decimal places to avoid floating point issues
    const formattedAmount = Math.round(paymentData.amount * 100) / 100;
    
    const paymentRequest = {
      id: paymentData.orderId, // Unique order ID
      currency: paymentData.currency, // Currency code (KES, USD, etc.)
      amount: formattedAmount, // Payment amount (number, rounded to 2 decimals)
      description: paymentData.description, // Order description
      callback_url: PESAPAL_CONFIG.callbackUrl, // URL to redirect after payment
      notification_id: notificationId, // IPN ID (UUID string) or IPN URL (HTTPS URL)
      billing_address: {
        phone_number: paymentData.phoneNumber,
        email_address: paymentData.email,
        country_code: 'KE', // ISO country code
      },
    };
    
    console.log('💰 Payment Amount Details:', {
      originalAmount: paymentData.amount,
      formattedAmount: formattedAmount,
      currency: paymentData.currency,
      amountType: typeof formattedAmount,
    });

    // Use the helper function to construct the URL consistently
    const apiUrl = getPesapalApiUrl('Transactions/SubmitOrderRequest');
    
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
    
    // Use the helper function to construct the URL consistently
    const registerUrl = getPesapalApiUrl('URLSetup/RegisterIPN');
    
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
    
    // Use the helper function to construct the URL consistently
    const statusUrl = getPesapalApiUrl(`Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`);
    
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
