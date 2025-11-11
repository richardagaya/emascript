# Firebase Deployment Guide from GitHub

This guide will help you deploy your Next.js application to Firebase Hosting with Cloud Run from GitHub.

## Prerequisites

1. **GitHub Repository** - Your code should be in a GitHub repository
2. **Firebase Project** - `fxpro-2dc0c` project should be set up
3. **Google Cloud Project** - Same as Firebase project
4. **Service Account** - For GitHub Actions to deploy

## Step 1: Set Up Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `fxpro-2dc0c`
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Name it: `github-actions-deploy`
6. Grant the following roles:
   - **Cloud Run Admin**
   - **Service Account User**
   - **Storage Admin** (for Container Registry)
   - **Firebase Admin**
7. Create a key (JSON) and download it
8. Save the key content - you'll need it for GitHub Secrets

## Step 2: Set Up Firebase Token

1. Install Firebase CLI locally: `npm install -g firebase-tools`
2. Login: `firebase login:ci`
3. Copy the token - you'll need it for GitHub Secrets

## Step 3: Configure GitHub Secrets

Go to your GitHub repository > **Settings** > **Secrets and variables** > **Actions**

Add the following secrets:

### Firebase Secrets
- `FIREBASE_TOKEN` - Firebase CI token from `firebase login:ci`

### Google Cloud Secrets
- `GCP_SA_KEY` - Content of the service account JSON file (entire JSON)

### Firebase Client Secrets (Public)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API Key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - `fxpro-2dc0c.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - `fxpro-2dc0c`

### Firebase Admin Secrets
- `FIREBASE_ADMIN_PROJECT_ID` - `fxpro-2dc0c`
- `FIREBASE_ADMIN_CLIENT_EMAIL` - Service account email
- `FIREBASE_ADMIN_PRIVATE_KEY` - Service account private key (with \n escaped)
- `FIREBASE_STORAGE_BUCKET` - `fxpro-2dc0c.appspot.com`

### Pesapal Secrets
- `PESAPAL_CONSUMER_KEY` - Your Pesapal consumer key
- `PESAPAL_CONSUMER_SECRET` - Your Pesapal consumer secret
- `PESAPAL_BASE_URL` - `https://api.pesapal.com` (production)
- `PESAPAL_CALLBACK_URL` - Your production callback URL
- `PESAPAL_IPN_URL` - Your production IPN URL

### NextAuth Secrets
- `NEXTAUTH_URL` - Your production URL (e.g., `https://yourdomain.com`)
- `NEXTAUTH_SECRET` - Random secret string
- `FIREBASE_API_KEY` - Firebase API Key
- `FIREBASE_PROJECT_ID` - `fxpro-2dc0c`

## Step 4: Enable Required APIs

Enable the following APIs in Google Cloud Console:

1. **Cloud Run API**
2. **Container Registry API** (or Artifact Registry)
3. **Cloud Build API**

Run these commands or enable via Console:

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 5: Configure Firebase Hosting

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fxpro-2dc0c`
3. Go to **Hosting**
4. Click **Get Started** (if not already set up)
5. The hosting will be configured via `firebase.json`

## Step 6: Deploy

### Automatic Deployment

Push to `main` or `master` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy to Firebase"
git push origin main
```

### Manual Deployment

1. Go to GitHub Actions tab
2. Select **Deploy to Firebase** workflow
3. Click **Run workflow**

## Step 7: Verify Deployment

1. Check GitHub Actions for deployment status
2. Check Cloud Run service: [Cloud Run Console](https://console.cloud.google.com/run)
3. Check Firebase Hosting: [Firebase Console](https://console.firebase.google.com/project/fxpro-2dc0c/hosting)

## Troubleshooting

### Build Fails

- Check Node.js version (should be 20)
- Check environment variables in GitHub Secrets
- Check build logs in GitHub Actions

### Cloud Run Deployment Fails

- Verify service account has correct permissions
- Check GCP_SA_KEY secret is valid JSON
- Verify APIs are enabled

### Firebase Hosting Fails

- Verify FIREBASE_TOKEN is valid
- Check firebase.json configuration
- Verify Cloud Run service is deployed first

### Environment Variables Not Working

- Check environment variables are set in Cloud Run service
- Verify secrets are correctly formatted in GitHub Secrets
- Check Cloud Run service logs

## Environment Variables Reference

### Required for Build
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Required for Runtime
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_BASE_URL`
- `PESAPAL_CALLBACK_URL`
- `PESAPAL_IPN_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `FIREBASE_API_KEY`
- `FIREBASE_PROJECT_ID`

## Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click **Add custom domain**
3. Follow the instructions to verify your domain
4. Update DNS records as instructed

## Monitoring

- **Cloud Run Logs**: [Cloud Run Console](https://console.cloud.google.com/run)
- **Firebase Hosting Analytics**: [Firebase Console](https://console.firebase.google.com/project/fxpro-2dc0c/hosting)
- **GitHub Actions**: Repository > Actions tab

## Rollback

To rollback to a previous deployment:

1. Go to Cloud Run Console
2. Select your service
3. Click **Revisions**
4. Select a previous revision
5. Click **Manage Traffic**
6. Set traffic to 100% for the previous revision

## Cost Optimization

- Cloud Run charges per request and memory usage
- Set appropriate memory limits
- Use minimum instances: 0 (scale to zero)
- Set maximum instances based on traffic

## Support

For issues, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Documentation](https://nextjs.org/docs)

