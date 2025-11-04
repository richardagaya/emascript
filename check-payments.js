#!/usr/bin/env node

/**
 * Payment Gateway Configuration Checker
 * Run: node check-payments.js
 * 
 * This script checks if payment gateways (Pesapal, M-Pesa, PayPal) are properly configured.
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n💳 Payment Gateway Configuration Checker\n');
console.log('='.repeat(50));

const paymentGateways = {
  'Pesapal': {
    required: ['PESAPAL_CONSUMER_KEY', 'PESAPAL_CONSUMER_SECRET'],
    optional: ['PESAPAL_BASE_URL', 'PESAPAL_CALLBACK_URL', 'PESAPAL_IPN_URL'],
    baseUrl: process.env.PESAPAL_BASE_URL || 'https://api.pesapal.com',
  },
  'M-Pesa': {
    required: ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY'],
    optional: ['MPESA_BASE_URL', 'MPESA_CALLBACK_URL'],
    baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  },
  'PayPal': {
    required: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
    optional: ['PAYPAL_ENVIRONMENT', 'PAYPAL_BASE_URL', 'PAYPAL_RETURN_URL', 'PAYPAL_CANCEL_URL'],
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
    baseUrl: process.env.PAYPAL_BASE_URL || 'https://api.sandbox.paypal.com',
  },
};

let allConfigured = true;

for (const [gateway, config] of Object.entries(paymentGateways)) {
  console.log(`\n📋 Checking ${gateway} configuration...\n`);
  
  let gatewayConfigured = true;
  
  // Check required variables
  for (const varName of config.required) {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      const displayValue = varName.includes('SECRET') || varName.includes('PASSKEY') || varName.includes('KEY')
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      gatewayConfigured = false;
      allConfigured = false;
    }
  }
  
  // Check optional variables
  for (const varName of config.optional) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`⚠️  ${varName}: Not set (using default)`);
    }
  }
  
  // Show configuration summary
  if (gateway === 'PayPal') {
    console.log(`\n   Environment: ${config.environment}`);
    console.log(`   Base URL: ${config.baseUrl}`);
  } else {
    console.log(`\n   Base URL: ${config.baseUrl}`);
  }
  
  if (gatewayConfigured) {
    console.log(`\n✅ ${gateway} is configured correctly!`);
  } else {
    console.log(`\n❌ ${gateway} is missing required configuration!`);
    console.log(`\n💡 To configure ${gateway}:`);
    
    if (gateway === 'Pesapal') {
      console.log('   1. Go to https://developer.pesapal.com/');
      console.log('   2. Sign up or log in to your Pesapal account');
      console.log('   3. Create an app and get your Consumer Key and Consumer Secret');
      console.log('   4. Add them to your .env.local file');
    } else if (gateway === 'M-Pesa') {
      console.log('   1. Go to https://developer.safaricom.co.ke/');
      console.log('   2. Sign up for Daraja API access');
      console.log('   3. Get your Consumer Key, Consumer Secret, Shortcode, and Passkey');
      console.log('   4. Add them to your .env.local file');
    } else if (gateway === 'PayPal') {
      console.log('   1. Go to https://developer.paypal.com/');
      console.log('   2. Create a new app in the PayPal Developer Dashboard');
      console.log('   3. Get your Client ID and Client Secret');
      console.log('   4. Add them to your .env.local file');
      console.log('   5. Set PAYPAL_ENVIRONMENT to "sandbox" for testing or "live" for production');
    }
  }
}

// Check callback URLs
console.log('\n\n🔗 Checking callback URLs...\n');
const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
if (baseUrl) {
  console.log(`✅ Base URL: ${baseUrl}`);
  console.log(`   Webhook URL: ${baseUrl}/api/payment-webhook`);
} else {
  console.log(`⚠️  NEXTAUTH_URL or NEXT_PUBLIC_APP_URL not set`);
  console.log(`   Callback URLs will use defaults`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allConfigured) {
  console.log('\n✅ All payment gateways are configured!');
  console.log('\n💡 To test payments:');
  console.log('   1. Make sure your app is running');
  console.log('   2. Go to the checkout page');
  console.log('   3. Select a payment method and complete a test transaction');
  console.log('   4. Check the terminal logs for any errors');
} else {
  console.log('\n❌ Some payment gateways are not configured!');
  console.log('\n💡 Add the missing environment variables to your .env.local file');
  console.log('   See the individual gateway sections above for setup instructions.');
}
console.log('\n');

