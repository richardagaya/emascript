# Deployment Status & Quick Reference

## ✅ What's Been Fixed

### 1. GitHub Actions Workflow
**File:** `.github/workflows/firebase-deploy.yml`

**Changes:**
- ✅ Added `FIREBASE_CLI_EXPERIMENTS: webframeworks` to enable Next.js support
- ✅ Switched to direct Firebase CLI deployment (more reliable)
- ✅ Added Google Cloud authentication
- ✅ Added automatic API enablement (Cloud Functions, Cloud Build, Artifact Registry)

### 2. Firebase Configuration
**File:** `firebase.json`

**Changes:**
- ✅ Added `frameworksBackend` configuration
- ✅ Added `functions` section for Cloud Functions support
- ✅ Set region to `us-central1`

### 3. Documentation
- ✅ `GITHUB_ACTIONS_SETUP.md` - Complete setup guide
- ✅ `FIREBASE_PERMISSIONS_FIX.md` - Permission troubleshooting
- ✅ `test-service-account.sh` - Script to verify permissions locally

---

## 🚀 Deploy Now

### Commit and Push Changes

```bash
git add .
git commit -m "Fix: Update Firebase deployment workflow with Cloud Functions support"
git push origin main
```

The workflow will automatically run and deploy!

---

## 🔧 If Still Failing: Manual Steps

### Step 1: Enable APIs Manually

Visit Google Cloud Console and enable these APIs:

1. **Cloud Functions API**
   ```
   https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=fxpro-2dc0c
   ```

2. **Cloud Build API**
   ```
   https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=fxpro-2dc0c
   ```

3. **Artifact Registry API**
   ```
   https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=fxpro-2dc0c
   ```

### Step 2: Verify Service Account Permissions

Go to IAM: https://console.cloud.google.com/iam-admin/iam?project=fxpro-2dc0c

Find your service account (firebase-adminsdk-*@fxpro-2dc0c.iam.gserviceaccount.com)

**Required Roles:**
- ✅ Firebase Hosting Admin
- ✅ Cloud Functions Admin
- ✅ Service Account User
- ✅ Cloud Build Service Account (optional but helpful)

### Step 3: Test Locally (Optional)

```bash
# Run the test script
./test-service-account.sh

# Or test deployment locally
export GOOGLE_APPLICATION_CREDENTIALS="path-to-service-account.json"
npm run build
firebase deploy --only hosting --project fxpro-2dc0c
```

---

## 📊 Deployment Architecture

Your Next.js app will deploy as:

```
┌─────────────────────────────────────────┐
│     Firebase Hosting (CDN)              │
│  - Static assets (CSS, JS, images)      │
│  - Pre-rendered pages                   │
└──────────────┬──────────────────────────┘
               │
               │ Routes dynamic requests
               ↓
┌─────────────────────────────────────────┐
│    Cloud Function (ssrfxpro2dc0c)       │
│  - Server-side rendering                │
│  - API routes (/api/*)                  │
│  - Middleware                           │
│  - Dynamic pages                        │
└─────────────────────────────────────────┘
```

**Region:** us-central1  
**Site URL:** https://fxpro-2dc0c.web.app  
**Firestore:** Integrated via Firebase Admin SDK

---

## 🐛 Common Errors & Solutions

### Error: "Failed to list functions"

**Cause:** Service account lacks Cloud Functions permissions  
**Solution:** Add these roles in Google Cloud IAM:
- Cloud Functions Admin
- Service Account User

### Error: "webframeworks experiment not enabled"

**Cause:** Missing environment variable  
**Solution:** Already fixed in workflow (line 53)

### Error: "API not enabled"

**Cause:** Required Google Cloud APIs not activated  
**Solution:** Workflow now auto-enables them (lines 44-48)

### Error: "Permission denied"

**Cause:** Service account key might be wrong or expired  
**Solution:**
1. Download fresh service account key from Firebase Console
2. Update GitHub secret `FIREBASE_SERVICE_ACCOUNT`
3. Re-run workflow

---

## 📝 Environment Variables

If your app needs environment variables during build:

1. Add them in `.github/workflows/firebase-deploy.yml` under "Build Next.js application":

```yaml
- name: Build Next.js application
  run: npm run build
  env:
    NODE_ENV: production
    NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
    # Add more as needed
```

2. Add secrets in GitHub:
   Settings → Secrets and variables → Actions → New repository secret

---

## 🎯 Next Steps After Successful Deployment

1. ✅ Visit your site: https://fxpro-2dc0c.web.app
2. ✅ Test API routes work correctly
3. ✅ Check Firebase Console → Functions to see the deployed Cloud Function
4. ✅ Monitor logs in Cloud Functions section
5. ✅ Set up custom domain (optional):
   Firebase Console → Hosting → Add custom domain

---

## 📞 Support

If deployment still fails after following all steps:

1. Check GitHub Actions logs for specific error
2. Check Firebase Console → Hosting for deployment status
3. Verify all APIs are enabled in Google Cloud Console
4. Ensure service account has all required permissions
5. Try running `./test-service-account.sh` locally

**Logs:**
- GitHub Actions: Your Repo → Actions tab
- Firebase: https://console.firebase.google.com/project/fxpro-2dc0c/overview
- Cloud Functions: https://console.cloud.google.com/functions/list?project=fxpro-2dc0c

