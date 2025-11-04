#!/usr/bin/env node

/**
 * Register Pesapal IPN URL
 * Run: node register-pesapal-ipn.js
 * 
 * This script registers your IPN URL with Pesapal for receiving payment notifications.
 * You only need to run this once, or when you change your IPN URL.
 */

require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

const PESAPAL_CONFIG = {
  baseUrl: process.env.PESAPAL_BASE_URL || 'https://api.pesapal.com',
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  ipnUrl: process.env.PESAPAL_IPN_URL || `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/payment-webhook`,
};

console.log('\n📝 Pesapal IPN Registration\n');
console.log('='.repeat(50));

// Check if credentials are configured
if (!PESAPAL_CONFIG.consumerKey || !PESAPAL_CONFIG.consumerSecret) {
  console.error('\n❌ Pesapal credentials not configured!');
  console.error('💡 Add these to your .env.local:');
  console.error('   PESAPAL_CONSUMER_KEY=your_consumer_key');
  console.error('   PESAPAL_CONSUMER_SECRET=your_consumer_secret');
  console.error('   PESAPAL_IPN_URL=https://yourdomain.com/api/payment-webhook\n');
  process.exit(1);
}

console.log(`\n📋 Configuration:`);
console.log(`   Base URL: ${PESAPAL_CONFIG.baseUrl}`);
console.log(`   IPN URL: ${PESAPAL_CONFIG.ipnUrl}`);
console.log(`   Consumer Key: ${PESAPAL_CONFIG.consumerKey.substring(0, 20)}...`);

async function registerIPN() {
  try {
    console.log('\n🔧 Step 1: Getting Pesapal access token...');
    
    // Get access token
    const tokenResponse = await axios.post(
      `${PESAPAL_CONFIG.baseUrl}/api/Auth/RequestToken`,
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

    if (!tokenResponse.data.token) {
      throw new Error('Failed to get access token');
    }

    const accessToken = tokenResponse.data.token;
    console.log('✅ Access token obtained');

    console.log('\n🔧 Step 2: Registering IPN URL...');
    
    // Register IPN URL
    const ipnResponse = await axios.post(
      `${PESAPAL_CONFIG.baseUrl}/api/URLSetup/RegisterIPN`,
      {
        url: PESAPAL_CONFIG.ipnUrl,
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

    if (ipnResponse.data && ipnResponse.data.ipn_id) {
      console.log('\n✅ IPN URL registered successfully!');
      console.log(`   IPN ID: ${ipnResponse.data.ipn_id}`);
      console.log(`   IPN URL: ${PESAPAL_CONFIG.ipnUrl}`);
      console.log('\n💡 You can now use this IPN ID in your payment requests.');
      console.log('   However, Pesapal v3 also supports passing the IPN URL directly.');
      console.log('\n📝 Save this IPN ID for reference:');
      console.log(`   PESAPAL_IPN_ID=${ipnResponse.data.ipn_id}\n`);
    } else {
      console.log('\n⚠️  IPN registration response:', ipnResponse.data);
      console.log('💡 IPN might already be registered, or you can use the URL directly in payment requests.\n');
    }

  } catch (error) {
    if (error.response) {
      console.error('\n❌ Error registering IPN:', error.response.data || error.response.statusText);
      console.error('   Status:', error.response.status);
      
      if (error.response.status === 401) {
        console.error('\n💡 Check your Pesapal credentials (Consumer Key and Consumer Secret)');
      } else if (error.response.status === 400) {
        console.error('\n💡 IPN URL might be invalid or already registered');
        console.error('   Make sure your IPN URL is publicly accessible');
      }
    } else {
      console.error('\n❌ Error:', error.message);
    }
    console.error('\n💡 Note: Pesapal v3 also supports passing the IPN URL directly in payment requests.');
    console.error('   You can skip IPN registration and use the notification_id field with the URL.\n');
    process.exit(1);
  }
}

registerIPN();

