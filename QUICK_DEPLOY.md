# Quick Deploy Guide - 3 Steps

## ⚡️ Deploy in 3 Minutes

### Step 1: Enable Google Cloud APIs (Do This First!)

Click these links and click "ENABLE" on each:

1. 🔗 [Enable Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=fxpro-2dc0c)
2. 🔗 [Enable Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=fxpro-2dc0c)
3. 🔗 [Enable Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=fxpro-2dc0c)

### Step 2: Add Service Account Permissions

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=fxpro-2dc0c
2. Find service account: `firebase-adminsdk-*****@fxpro-2dc0c.iam.gserviceaccount.com`
3. Click ✏️ Edit
4. Click **+ ADD ANOTHER ROLE** and add:
   - **Cloud Functions Admin**
   - **Service Account User**
5. Click **SAVE**

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Setup Firebase deployment workflow"
git push origin main
```

✅ **Done!** Your site deploys automatically to: https://fxpro-2dc0c.web.app

---

## 🔍 Check Deployment Status

GitHub Actions: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

---

## ❌ Still Failing?

### Quick Fix Commands

Run these in Google Cloud Console Shell:

```bash
gcloud config set project fxpro-2dc0c

gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com  
gcloud services enable artifactregistry.googleapis.com
gcloud services enable run.googleapis.com

# Add all required roles to service account
export SA_EMAIL="YOUR_SERVICE_ACCOUNT@fxpro-2dc0c.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding fxpro-2dc0c \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding fxpro-2dc0c \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding fxpro-2dc0c \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/firebasehosting.admin"
```

Replace `YOUR_SERVICE_ACCOUNT` with your actual service account email.

---

## 📁 Files Changed

✅ `.github/workflows/firebase-deploy.yml` - GitHub Actions workflow  
✅ `firebase.json` - Firebase configuration  
✅ `test-service-account.sh` - Permission testing script

---

## 🎯 What This Does

1. **Builds** your Next.js app
2. **Creates** a Cloud Function for server-side rendering
3. **Deploys** static assets to Firebase Hosting CDN
4. **Routes** API calls and dynamic pages to Cloud Function
5. **Serves** your site at https://fxpro-2dc0c.web.app

---

## 🆘 Emergency Contact

Full documentation: See `DEPLOYMENT_STATUS.md`  
Permission guide: See `FIREBASE_PERMISSIONS_FIX.md`  
Setup guide: See `GITHUB_ACTIONS_SETUP.md`

