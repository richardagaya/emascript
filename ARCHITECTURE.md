# 🏗️ EA Delivery System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER JOURNEY                            │
└─────────────────────────────────────────────────────────────┘

1. BROWSE & SELECT
   User visits /marketplace → Clicks "Buy now" on EA
   ↓
   
2. CHECKOUT
   /marketplace/checkout?bot=TrendRider%20EA
   - User enters email & phone
   - Selects payment method (M-PESA/Pesapal/PayPal)
   ↓
   
3. ORDER CREATION
   POST /api/checkout
   - Validates email & phone
   - Creates order in Firestore (status: "pending")
   - Sends "Order Received" email
   - Returns orderId
   ↓
   
4. PAYMENT (TODO - integrate payment gateway)
   - User completes payment on gateway
   - Gateway sends webhook to /api/payment-webhook
   ↓
   
5. PAYMENT CONFIRMATION
   POST /api/payment-webhook
   - Verifies payment
   - Updates order status to "completed"
   - Adds EA to user's account in Firestore
   - Sends "Payment Confirmed" email with dashboard link
   ↓
   
6. DASHBOARD ACCESS
   User logs in → /dashboard
   GET /api/user/purchased-eas
   - Fetches user's EAs from Firestore
   - Displays EA cards with download buttons
   ↓
   
7. DOWNLOAD
   User clicks "Download" button
   GET /api/download?eaId=trendrider-ea
   - Verifies user owns the EA
   - Generates signed URL from Firebase Storage
   - Increments download count
   - Triggers browser download
   ✓ User receives EA file
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts          # Creates orders
│   │   ├── payment-webhook/
│   │   │   └── route.ts          # Processes payments
│   │   ├── user/
│   │   │   └── purchased-eas/
│   │   │       └── route.ts      # Fetches user's EAs
│   │   └── download/
│   │       └── route.ts          # Handles secure downloads
│   ├── dashboard/
│   │   └── page.tsx              # User's EA library
│   ├── marketplace/
│   │   ├── page.tsx              # EA listings
│   │   └── checkout/
│   │       ├── page.tsx          # Checkout form
│   │       └── checkout.css      # Premium phone input styles
│   └── installation-guide/
│       └── page.tsx              # Setup instructions
├── lib/
│   ├── firebaseAdmin.ts          # Firebase Admin SDK setup
│   └── email.ts                  # Email notifications
└── components/
    └── Navbar.tsx                # Navigation with auth

```

## Data Flow

### Firestore Collections

```
firestore/
├── orders/                       # All purchase orders
│   └── {orderId}
│       ├── orderId: "ORD-123..."
│       ├── botName: "TrendRider EA"
│       ├── email: "user@example.com"
│       ├── phone: "+254712345678"
│       ├── paymentMethod: "mpesa"
│       ├── status: "completed"
│       ├── transactionId: "MPESA123"
│       └── timestamps...
│
└── users/                        # User profiles & purchases
    └── {autoId}
        ├── email: "user@example.com"
        └── purchasedEAs: [
              {
                eaId: "trendrider-ea",
                eaName: "TrendRider EA",
                orderId: "ORD-123...",
                version: "2.1.0",
                downloadCount: 3,
                lastDownloaded: "2024-10-30...",
                ...
              }
            ]
```

### Firebase Storage Structure

```
storage/
└── eas/
    ├── trendrider-ea/
    │   └── 2.1.0/
    │       ├── trendrider-ea-v2.1.0.ex4
    │       └── trendrider-ea-v2.1.0.ex5
    ├── scalpswift-ea/
    │   └── 1.8.3/
    │       └── ...
    └── meanrevert-pro/
        └── 3.0.1/
            └── ...
```

## API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/checkout` | POST | Create order | No |
| `/api/payment-webhook` | POST | Process payment | No (verified by signature) |
| `/api/user/purchased-eas` | GET | Get user's EAs | Yes |
| `/api/download` | GET | Download EA file | Yes |

## Security Features

✅ **Authentication**
- Firebase Auth tokens verified on server
- Session cookies for persistent auth

✅ **Authorization**
- Users can only access their own EAs
- Download endpoint verifies ownership

✅ **Secure Downloads**
- Signed URLs (1-hour expiry)
- Download count tracking
- Files stored in private Firebase Storage

✅ **Payment Verification**
- Webhook signature verification (TODO)
- Order status tracking
- Transaction ID logging

## Email Notifications

### 1. Order Pending Email
**Trigger:** User submits checkout form  
**Content:** Order confirmation, awaiting payment  
**Action:** None required

### 2. Payment Confirmed Email  
**Trigger:** Payment webhook received  
**Content:** Payment confirmed, link to dashboard  
**Action:** User downloads EA from dashboard

## Environment Variables Required

```env
# Firebase Admin (from service account JSON)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=

# App URL
NEXT_PUBLIC_APP_URL=
```

## Next Steps (TODOs)

### Payment Integration
1. Choose payment gateway (M-PESA, Pesapal, PayPal)
2. Get API credentials
3. Implement payment initialization
4. Set up webhook URL
5. Test payment flow

### Production Deployment
1. Deploy to Vercel/Netlify
2. Set environment variables
3. Configure custom domain
4. Update Firebase security rules
5. Set up monitoring

## Key Features

✨ **For Users:**
- Secure payment processing
- Instant email confirmation
- Easy dashboard access
- One-click downloads
- Download history tracking

✨ **For You:**
- Automated delivery
- No manual EA sending
- Download analytics
- Order tracking
- Scalable architecture

---

**Status:** ✅ Backend Complete | ⏳ Payment Integration Pending

See `SETUP_GUIDE.md` for detailed setup instructions.

