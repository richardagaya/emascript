# 🚀 Firebase EA Delivery System - Setup Guide

This guide will help you set up the complete EA delivery system using Firebase.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Environment Variables](#environment-variables)
4. [Database Structure](#database-structure)
5. [File Storage Setup](#file-storage-setup)
6. [Email Configuration](#email-configuration)
7. [Testing the System](#testing-the-system)
8. [Payment Gateway Integration](#payment-gateway-integration)

---

## Prerequisites

- Node.js 18+ installed
- A Firebase project
- Gmail account (or other SMTP provider) for emails
- EA files ready to upload

---

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it (e.g., "akavanta-eas")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode**
4. Select a location (closest to your users)
5. Click "Enable"

### 3. Enable Firebase Storage

1. Go to **Storage** in Firebase Console
2. Click "Get Started"
3. Use default security rules for now
4. Click "Done"

### 4. Get Firebase Admin Credentials

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. **Keep this file secure! Never commit it to Git**

---

## 🔐 Environment Variables

### 1. Create `.env.local` file

```bash
# In your project root
touch .env.local
```

### 2. Add Firebase Admin Credentials

From your downloaded service account JSON file:

```env
# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Email Service (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=noreply@akavanta.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Step Verification
3. Go to **App Passwords**
4. Generate password for "Mail"
5. Copy and paste into `SMTP_PASSWORD`

---

## 🗄️ Database Structure

Your Firestore will have two main collections:

### **`orders` Collection**

```javascript
{
  orderId: "ORD-1234567890-ABC123",
  botName: "TrendRider EA",
  email: "user@example.com",
  phone: "+254712345678",
  paymentMethod: "mpesa",
  status: "completed", // pending, completed, failed
  userId: "user@example.com",
  transactionId: "MPESA123456",
  createdAt: "2024-10-30T10:00:00.000Z",
  paidAt: "2024-10-30T10:05:00.000Z",
  updatedAt: "2024-10-30T10:05:00.000Z"
}
```

### **`users` Collection**

```javascript
{
  email: "user@example.com",
  createdAt: "2024-10-30T10:00:00.000Z",
  updatedAt: "2024-10-30T10:05:00.000Z",
  purchasedEAs: [
    {
      eaId: "trendrider-ea",
      eaName: "TrendRider EA",
      orderId: "ORD-1234567890-ABC123",
      purchaseDate: "2024-10-30T10:05:00.000Z",
      version: "2.1.0",
      license: "Standard",
      thumbnail: "📈",
      description: "Advanced trend-following strategy",
      downloadUrl: "eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4",
      downloadCount: 3,
      lastDownloaded: "2024-10-30T12:00:00.000Z"
    }
  ]
}
```

---

## 📦 File Storage Setup

### 1. Organize Your EA Files

Upload EA files to Firebase Storage with this structure:

```
eas/
├── trendrider-ea/
│   └── 2.1.0/
│       ├── trendrider-ea-v2.1.0.ex4  (for MT4)
│       └── trendrider-ea-v2.1.0.ex5  (for MT5)
├── scalpswift-ea/
│   └── 1.8.3/
│       ├── scalpswift-ea-v1.8.3.ex4
│       └── scalpswift-ea-v1.8.3.ex5
└── meanrevert-pro/
    └── 3.0.1/
        ├── meanrevert-pro-v3.0.1.ex4
        └── meanrevert-pro-v3.0.1.ex5
```

### 2. Upload Files

**Option 1: Firebase Console**
1. Go to Storage in Firebase Console
2. Create folder structure manually
3. Upload files

**Option 2: Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
firebase storage:upload local-file.ex4 eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4
```

### 3. Update EA Catalog

Edit `/src/app/api/payment-webhook/route.ts`:

```typescript
const EA_CATALOG: Record<string, any> = {
  'TrendRider EA': {
    eaId: 'trendrider-ea',
    version: '2.1.0',
    thumbnail: '📈',
    description: 'Advanced trend-following strategy',
    downloadUrl: 'eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4',
  },
  // Add your EAs here
};
```

---

## 📧 Email Configuration

Emails are sent at two stages:

1. **Order Received** - When user places order
2. **Payment Confirmed** - When payment is verified

Test emails:
```bash
npm run dev
# Make a test purchase
# Check your email inbox
```

---

## 🧪 Testing the System

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Checkout Flow

1. Go to `/marketplace`
2. Click "Buy now" on any EA
3. Fill in email and phone
4. Click payment method
5. Check console logs

### 4. Simulate Payment Webhook

Since you don't have payment gateways yet, manually test the webhook:

```bash
curl -X POST http://localhost:3000/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-1234567890-ABC123",
    "status": "success",
    "transactionId": "TEST123",
    "paymentMethod": "mpesa"
  }'
```

### 5. Check Dashboard

1. Log in with the test email
2. Go to `/dashboard`
3. You should see the EA
4. Click "Download" button

---

## 💳 Payment Gateway Integration

### M-PESA Integration

1. Register for [Safaricom Daraja API](https://developer.safaricom.co.ke/)
2. Get Consumer Key and Secret
3. Implement STK Push in `/src/app/api/checkout/route.ts`
4. Set webhook URL: `https://yourdomain.com/api/payment-webhook`

### Pesapal Integration

1. Register at [Pesapal](https://www.pesapal.com/)
2. Get API credentials
3. Implement IPN callback
4. Set callback URL: `https://yourdomain.com/api/payment-webhook`

### PayPal Integration

1. Create [PayPal Developer Account](https://developer.paypal.com/)
2. Get Client ID and Secret
3. Use PayPal SDK
4. Set webhook URL in PayPal dashboard

---

## 🔒 Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders - only server can write
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        resource.data.email == request.auth.token.email;
      allow write: if false; // Only server via Admin SDK
    }
    
    // Users - only server can write
    match /users/{userId} {
      allow read: if request.auth != null && 
        resource.data.email == request.auth.token.email;
      allow write: if false; // Only server via Admin SDK
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /eas/{allPaths=**} {
      // Only authenticated users can download
      // Actual authorization handled by signed URLs from server
      allow read: if request.auth != null;
      allow write: if false; // Only upload via Admin SDK or Console
    }
  }
}
```

---

## 📊 Monitoring & Analytics

### Check Logs

```bash
# In Firebase Console
- Go to Firestore → Data
- Go to Storage → Files
- Go to Functions → Logs (if using Cloud Functions)
```

### Monitor Downloads

User download counts are tracked in Firestore automatically.

---

## 🚨 Troubleshooting

### "Module not found: firebase-admin"
```bash
npm install firebase-admin
```

### "Email not sending"
- Check SMTP credentials
- Verify Gmail App Password
- Check spam folder

### "Download link not working"
- Verify file exists in Storage
- Check file path matches EA_CATALOG
- Ensure Storage Rules allow read

### "User not seeing purchased EA"
- Check Firestore `users` collection
- Verify payment webhook was called
- Check browser console for errors

---

## ✅ Production Checklist

- [ ] Update Firestore security rules
- [ ] Update Storage security rules
- [ ] Set up custom domain
- [ ] Configure email with custom domain
- [ ] Test all payment methods
- [ ] Upload all EA files
- [ ] Test download flow
- [ ] Set up backup strategy
- [ ] Monitor error logs
- [ ] Test email delivery

---

## 📞 Need Help?

Check the code comments in:
- `/src/lib/firebaseAdmin.ts`
- `/src/app/api/checkout/route.ts`
- `/src/app/api/payment-webhook/route.ts`
- `/src/app/api/download/route.ts`

---

## 🎉 You're Done!

Your EA delivery system is now set up! Users can:
1. Purchase EAs
2. Receive confirmation emails
3. Download from dashboard
4. Get updates automatically

Good luck with your EA marketplace! 🚀

