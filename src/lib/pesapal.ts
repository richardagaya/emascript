import axios from 'axios';

// Pesapal Daraja API configuration
const PESAPAL_CONFIG = {
  baseUrl: process.env.PESAPAL_BASE_URL || 'https://api.pesapal.com',
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  callbackUrl: process.env.PESAPAL_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/payment-webhook`,
  ipnUrl: process.env.PESAPAL_IPN_URL || `${process.env.NEXTAUTH_URL}/api/payment-webhook`,
};

// M-Pesa Daraja API configuration
const MPESA_CONFIG = {
  baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  callbackUrl: process.env.MPESA_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/payment-webhook`,
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

// Get Pesapal access token
async function getPesapalAccessToken(): Promise<string> {
  try {
    const response = await axios.post(`${PESAPAL_CONFIG.baseUrl}/api/Auth/RequestToken`, {
      consumer_key: PESAPAL_CONFIG.consumerKey,
      consumer_secret: PESAPAL_CONFIG.consumerSecret,
    });

    return response.data.token;
  } catch (error) {
    console.error('Error getting Pesapal access token:', error);
    throw new Error('Failed to get Pesapal access token');
  }
}

// Get M-Pesa access token
async function getMpesaAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
}

// Initialize Pesapal payment
export async function initializePesapalPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  try {
    const accessToken = await getPesapalAccessToken();
    
    const paymentRequest = {
      id: paymentData.orderId,
      currency: paymentData.currency,
      amount: paymentData.amount,
      description: paymentData.description,
      callback_url: PESAPAL_CONFIG.callbackUrl,
      notification_id: PESAPAL_CONFIG.ipnUrl,
      billing_address: {
        phone_number: paymentData.phoneNumber,
        email_address: paymentData.email,
        country_code: 'KE',
      },
    };

    const response = await axios.post(
      `${PESAPAL_CONFIG.baseUrl}/api/Transactions/SubmitOrderRequest`,
      paymentRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      paymentUrl: response.data.redirect_url,
      transactionId: response.data.order_tracking_id,
    };
  } catch (error) {
    console.error('Error initializing Pesapal payment:', error);
    return {
      success: false,
      error: 'Failed to initialize Pesapal payment',
    };
  }
}

// Initialize M-Pesa STK Push
export async function initializeMpesaPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  try {
    const accessToken = await getMpesaAccessToken();
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    
    const stkPushRequest = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(paymentData.amount),
      PartyA: paymentData.phoneNumber,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: paymentData.phoneNumber,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: paymentData.orderId,
      TransactionDesc: paymentData.description,
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

    if (response.data.ResponseCode === '0') {
      return {
        success: true,
        transactionId: response.data.CheckoutRequestID,
      };
    } else {
      return {
        success: false,
        error: response.data.ResponseDescription || 'M-Pesa payment failed',
      };
    }
  } catch (error) {
    console.error('Error initializing M-Pesa payment:', error);
    return {
      success: false,
      error: 'Failed to initialize M-Pesa payment',
    };
  }
}

// Verify Pesapal payment status
export async function verifyPesapalPayment(orderTrackingId: string): Promise<PaymentResponse> {
  try {
    const accessToken = await getPesapalAccessToken();
    
    const response = await axios.get(
      `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const status = response.data.payment_status;
    
    return {
      success: status === 'COMPLETED',
      transactionId: orderTrackingId,
    };
  } catch (error) {
    console.error('Error verifying Pesapal payment:', error);
    return {
      success: false,
      error: 'Failed to verify Pesapal payment',
    };
  }
}

// Verify M-Pesa payment status
export async function verifyMpesaPayment(checkoutRequestId: string): Promise<PaymentResponse> {
  try {
    const accessToken = await getMpesaAccessToken();
    
    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: MPESA_CONFIG.shortcode,
        Password: '', // Will be generated
        Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3),
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const resultCode = response.data.ResultCode;
    
    return {
      success: resultCode === 0,
      transactionId: checkoutRequestId,
    };
  } catch (error) {
    console.error('Error verifying M-Pesa payment:', error);
    return {
      success: false,
      error: 'Failed to verify M-Pesa payment',
    };
  }
}
