# Fix Your Failed Order

Your payment **WAS SUCCESSFUL**, but the EA wasn't delivered because Pesapal's production IPN URL is pointing to the wrong server.

## Order Details:
- **Order ID:** `ORD-1763645287572-HGWCK11`
- **Confirmation:** `TKKPGAJG34`
- **Amount:** KES 1.00
- **EA:** Akavanta
- **Status:** Payment successful, EA not delivered

---

## Quick Fix (3 Steps):

### Step 1: Set Admin Secret in Vercel
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add: `ADMIN_SECRET` = `your-strong-random-password`
5. Redeploy

### Step 2: Fix Pesapal Production IPN
1. Log into https://www.pesapal.com/ (Production dashboard)
2. Go to **IPN Settings** or **Webhooks**
3. Set IPN URL to: `https://emascript.vercel.app/api/payment-webhook`
4. Save

### Step 3: Manually Complete Your Order

After redeploying, run these two commands:

**A. Create the missing order:**
```bash
curl -X POST "https://emascript.vercel.app/api/admin/create-order" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-1763645287572-HGWCK11",
    "email": "richardagaya278@gmail.com",
    "botName": "Akavanta",
    "phone": "254115742573",
    "transactionId": "TKKPGAJG34",
    "adminSecret": "YOUR_ADMIN_SECRET_HERE"
  }'
```

**B. Deliver the EA:**
```bash
curl -X POST "https://emascript.vercel.app/api/complete-order-manual" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-1763645287572-HGWCK11"}'
```

---

## Check if it Worked:

1. Log into https://emascript.vercel.app/dashboard
2. You should see **Akavanta** in your purchased EAs
3. Click **Download** to get the .mq5 file

---

## Future Orders Will Work Automatically

Once you fix the Pesapal IPN URL (Step 2), all future payments will automatically:
1. Create order in database ✅
2. Receive payment webhook ✅
3. Deliver EA to user ✅
4. Send confirmation email ✅

---

## Still Not Working?

Check Vercel logs:
1. https://vercel.com/dashboard → Your Project
2. Deployments → Latest → Functions
3. Look for errors when running the commands above

Need help? The logs will show exactly what failed.

