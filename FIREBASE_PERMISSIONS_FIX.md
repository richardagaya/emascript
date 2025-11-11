# Quick Fix: "Failed to list functions" Error

## The Problem

Your deployment is failing with: `"Failed to list functions for fxpro-2dc0c"`

This happens because your Next.js app uses:
- Middleware
- API routes (like `/api/checkout`, `/api/payment-webhook`, etc.)

These require **Cloud Functions**, but your Firebase service account only has Hosting permissions.

## The Solution (5 minutes)

### Step 1: Go to Google Cloud Console IAM

🔗 **Direct Link:** https://console.cloud.google.com/iam-admin/iam?project=fxpro-2dc0c

### Step 2: Find Your Service Account

Look for an account that looks like:
```
firebase-adminsdk-xxxxx@fxpro-2dc0c.iam.gserviceaccount.com
```

### Step 3: Add Required Roles

1. Click the **pencil icon ✏️** next to the service account
2. Click **+ ADD ANOTHER ROLE**
3. Add these three roles:

   - **Cloud Functions Admin**
     - Search: "Cloud Functions Admin"
     - Full name: `roles/cloudfunctions.admin`
   
   - **Service Account User**
     - Search: "Service Account User"
     - Full name: `roles/iam.serviceAccountUser`
   
   - **Firebase Hosting Admin** (if not already added)
     - Search: "Firebase Hosting Admin"
     - Full name: `roles/firebasehosting.admin`

4. Click **SAVE**

### Step 4: Re-run GitHub Action

Go to your GitHub repository → Actions tab → Click "Re-run jobs"

## Alternative: Use Cloud Functions Developer Role

If you don't want to grant full admin access, use:
- **Cloud Functions Developer** instead of Cloud Functions Admin
- Plus **Service Account User**
- Plus **Firebase Hosting Admin**

## Verify Permissions

After adding roles, verify the service account has these permissions:
- `firebase.projects.get`
- `firebasehosting.sites.update`
- `cloudfunctions.functions.create`
- `cloudfunctions.functions.update`
- `cloudfunctions.functions.delete`
- `cloudfunctions.functions.get`
- `cloudfunctions.functions.list`
- `iam.serviceAccounts.actAs`

## Still Having Issues?

### Check Service Account Key

Make sure the service account JSON in GitHub Secrets matches the account you just updated:

1. Download the service account key again from Firebase Console
2. Update the `FIREBASE_SERVICE_ACCOUNT` secret in GitHub
3. Re-run the workflow

### Enable Required APIs

Make sure these APIs are enabled in Google Cloud Console:
- Cloud Functions API
- Cloud Build API
- Artifact Registry API

🔗 **Enable APIs:** https://console.cloud.google.com/apis/dashboard?project=fxpro-2dc0c

---

## Why This Happens

Firebase's web framework support for Next.js automatically:
1. Detects your middleware and API routes
2. Creates a Cloud Function to handle server-side rendering
3. Deploys static assets to Cloud Storage
4. Configures Hosting to route requests appropriately

Without Cloud Functions permissions, step 2 fails.

## Expected Behavior After Fix

Your deployment will:
1. ✅ Build Next.js application
2. ✅ Create Cloud Function `ssrfxpro2dc0c`
3. ✅ Upload static assets
4. ✅ Deploy to Firebase Hosting
5. ✅ Your site will be live at: https://fxpro-2dc0c.web.app

