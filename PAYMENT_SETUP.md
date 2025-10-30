# Payment Gateway Setup Guide

This document outlines the setup requirements for Pesapal (M-Pesa) and PayPal payment integrations.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Pesapal Configuration
```env
PESAPAL_BASE_URL=https://api.pesapal.com
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/payment-webhook
PESAPAL_IPN_URL=https://yourdomain.com/api/payment-webhook
```

### M-Pesa Daraja Configuration
```env
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_CALLBACK_URL=https://yourdomain.com/api/payment-webhook
```

### PayPal Configuration
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_BASE_URL=https://api.sandbox.paypal.com
PAYPAL_RETURN_URL=https://yourdomain.com/api/payment-webhook
PAYPAL_CANCEL_URL=https://yourdomain.com/marketplace/checkout
```

## Setup Instructions

### 1. Pesapal Setup
1. Register at [Pesapal Developer Portal](https://developer.pesapal.com/)
2. Create a new application
3. Get your Consumer Key and Consumer Secret
4. Set up your callback URLs in the Pesapal dashboard

### 2. M-Pesa Daraja Setup
1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create a new app and get your Consumer Key and Consumer Secret
3. Generate a Passkey for your shortcode
4. Configure your callback URL in the Daraja dashboard

### 3. PayPal Setup
1. Create a PayPal Developer account at [PayPal Developer](https://developer.paypal.com/)
2. Create a new application
3. Get your Client ID and Client Secret
4. Configure your webhook endpoints in the PayPal dashboard

## API Endpoints

### Checkout Endpoint
- **URL**: `/api/checkout`
- **Method**: POST
- **Body**:
  ```json
  {
    "botName": "TrendRider EA",
    "email": "user@example.com",
    "phone": "+254712345678",
    "paymentMethod": "mpesa|pesapal|paypal",
    "userId": "optional_user_id"
  }
  ```

### Payment Webhook
- **URL**: `/api/payment-webhook`
- **Method**: POST
- **Description**: Handles payment confirmations from all payment gateways

## Payment Flow

1. User selects payment method and submits checkout form
2. System creates order in Firestore
3. Payment gateway is initialized based on selected method:
   - **M-Pesa**: STK Push is sent to user's phone
   - **Pesapal**: User is redirected to Pesapal payment page
   - **PayPal**: User is redirected to PayPal payment page
4. User completes payment
5. Payment gateway sends webhook to `/api/payment-webhook`
6. System verifies payment and updates order status
7. User receives confirmation email with EA download link

## Testing

### Sandbox Testing
- All payment gateways support sandbox mode for testing
- Use test credentials provided by each gateway
- Test webhook endpoints using tools like ngrok for local development

### Webhook Testing
- Use ngrok to expose your local server: `ngrok http 3000`
- Update webhook URLs in payment gateway dashboards
- Test with sample webhook payloads provided by each gateway

## Security Notes

- Always verify webhook signatures in production
- Use HTTPS for all webhook URLs
- Store sensitive credentials securely
- Implement proper error handling and logging
- Validate all incoming webhook data

## Troubleshooting

### Common Issues
1. **Webhook not receiving**: Check URL accessibility and SSL certificate
2. **Payment verification failing**: Verify API credentials and endpoint URLs
3. **Order not updating**: Check Firestore permissions and webhook processing

### Logs
- Check server logs for payment initialization errors
- Monitor webhook endpoint for incoming requests
- Verify Firestore order updates
