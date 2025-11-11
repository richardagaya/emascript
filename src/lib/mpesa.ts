import axios from 'axios';

/**
 * M-Pesa Daraja API Integration
 * Documentation: https://developer.safaricom.co.ke/
 */

// M-Pesa Daraja API configuration
const MPESA_CONFIG = {
  baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  callbackUrl: process.env.MPESA_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/payment-webhook`,
};

export interface MpesaPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  email: string;
  description: string;
  botName: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  paymentUrl?: string; // M-Pesa STK Push doesn't return a URL
  transactionId?: string;
  checkoutRequestId?: string;
  customerMessage?: string;
  error?: string;
}

/**
 * Format phone number for M-Pesa (must be in format 254XXXXXXXXX)
 * M-Pesa requires phone numbers in international format without the +
 */
function formatMpesaPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254 (Kenya country code)
  if (digits.startsWith('0')) {
    digits = '254' + digits.substring(1);
  }
  // If doesn't start with country code, add 254
  else if (!digits.startsWith('254')) {
    digits = '254' + digits;
  }
  
  return digits;
}

/**
 * Get M-Pesa Daraja API access token
 * Uses OAuth 2.0 client credentials flow
 */
async function getMpesaAccessToken(): Promise<string> {
  try {
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }

    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.data.access_token) {
      throw new Error('Invalid response from M-Pesa OAuth endpoint');
    }

    return response.data.access_token;
  } catch (error) {
    const err = error as { response?: { data?: { error_description?: string } }; message?: string };
    console.error('Error getting M-Pesa access token:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error_description || 'Failed to get M-Pesa access token');
  }
}

/**
 * Initialize M-Pesa STK Push payment
 * STK Push sends a payment request directly to the customer's phone
 * Documentation: https://developer.safaricom.co.ke/APIs/StkPush
 */
export async function initializeMpesaPayment(
  paymentData: MpesaPaymentRequest
): Promise<MpesaPaymentResponse> {
  try {
    if (!MPESA_CONFIG.shortcode || !MPESA_CONFIG.passkey) {
      return {
        success: false,
        error: 'M-Pesa shortcode or passkey not configured',
      };
    }

    const accessToken = await getMpesaAccessToken();
    
    // Format phone number for M-Pesa (254XXXXXXXXX format)
    const formattedPhone = formatMpesaPhoneNumber(paymentData.phoneNumber);
    
    // Generate timestamp in format: YYYYMMDDHHmmss
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3); // Remove milliseconds
    
    // Generate password: base64(Shortcode + Passkey + Timestamp)
    const password = Buffer.from(
      `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');
    
    const stkPushRequest = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // For PayBill numbers
      Amount: Math.round(paymentData.amount), // Must be integer
      PartyA: formattedPhone, // Customer phone number
      PartyB: MPESA_CONFIG.shortcode, // Business shortcode
      PhoneNumber: formattedPhone, // Customer phone number
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: paymentData.orderId, // Order ID for reference
      TransactionDesc: paymentData.description, // Transaction description
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPushRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // ResponseCode '0' means success
    if (response.data.ResponseCode === '0') {
      return {
        success: true,
        transactionId: response.data.CheckoutRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        customerMessage: response.data.CustomerMessage,
        // M-Pesa STK Push doesn't return a payment URL - user receives push notification
      };
    } else {
      return {
        success: false,
        error: response.data.ResponseDescription || response.data.errorMessage || 'M-Pesa payment request failed',
        customerMessage: response.data.CustomerMessage,
      };
    }
  } catch (error) {
    const err = error as { 
      response?: { 
        data?: { 
          errorMessage?: string; 
          error_description?: string; 
          ResponseDescription?: string; 
        }; 
      }; 
      message?: string; 
    };
    console.error('Error initializing M-Pesa payment:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.errorMessage || 
                        err.response?.data?.error_description ||
                        err.response?.data?.ResponseDescription ||
                        err.message || 
                        'Failed to initialize M-Pesa payment';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Query M-Pesa STK Push payment status
 * Use this to check if a customer has completed the payment
 * Documentation: https://developer.safaricom.co.ke/APIs/StkPushQuery
 */
export async function verifyMpesaPayment(
  checkoutRequestId: string
): Promise<MpesaPaymentResponse> {
  try {
    if (!MPESA_CONFIG.shortcode || !MPESA_CONFIG.passkey) {
      return {
        success: false,
        error: 'M-Pesa shortcode or passkey not configured',
      };
    }

    const accessToken = await getMpesaAccessToken();
    
    // Generate timestamp in format: YYYYMMDDHHmmss
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    
    // Generate password: base64(Shortcode + Passkey + Timestamp)
    const password = Buffer.from(
      `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');
    
    const queryRequest = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
      queryRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // ResultCode 0 means payment completed successfully
    const resultCode = response.data.ResultCode;
    
    if (resultCode === 0) {
      return {
        success: true,
        transactionId: checkoutRequestId,
        checkoutRequestId: checkoutRequestId,
        customerMessage: response.data.ResultDesc,
      };
    } else {
      return {
        success: false,
        error: response.data.ResultDesc || 'Payment not completed',
        transactionId: checkoutRequestId,
      };
    }
  } catch (error) {
    const err = error as { 
      response?: { 
        data?: { 
          errorMessage?: string; 
          ResultDesc?: string; 
        }; 
      }; 
      message?: string; 
    };
    console.error('Error verifying M-Pesa payment:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.errorMessage || 
                        err.response?.data?.ResultDesc ||
                        err.message || 
                        'Failed to verify M-Pesa payment';
    return {
      success: false,
      error: errorMessage,
      transactionId: checkoutRequestId,
    };
  }
}

