# GitHub Actions Firebase Deployment Setup Guide

This guide will help you set up automatic deployment to Firebase Hosting using GitHub Actions.

## Prerequisites

- GitHub repository for your project
- Firebase project (fxpro-2dc0c)
- Firebase CLI installed locally

## Step 1: Generate Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **fxpro-2dc0c**
3. Click the gear icon ⚙️ next to "Project Overview" and select **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** - this will download a JSON file
7. **Keep this file secure!** It contains sensitive credentials

### Grant Required Permissions

Your service account needs additional permissions for Cloud Functions (required for Next.js with middleware/API routes):

1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. Select your project: **fxpro-2dc0c**
3. Find the service account you just created (should look like `firebase-adminsdk-xxxxx@fxpro-2dc0c.iam.gserviceaccount.com`)
4. Click the pencil icon ✏️ to edit
5. Click **+ ADD ANOTHER ROLE** and add these roles:
   - **Firebase Hosting Admin** (if not already added)
   - **Cloud Functions Developer** or **Cloud Functions Admin**
   - **Service Account User**
6. Click **Save**

## Step 2: Add Firebase Service Account to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_SERVICE_ACCOUNT`
5. Value: Copy and paste the entire contents of the JSON file you downloaded
6. Click **Add secret**

## Step 3: Push Your Code to GitHub

If you haven't already set up your GitHub repository:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit with GitHub Actions workflow"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

If you're using `master` instead of `main`, the workflow is already configured to work with both.

## Step 4: Verify Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see your workflow running
4. Once complete (green checkmark ✓), your site will be deployed to Firebase Hosting

## Workflow Triggers

The workflow will automatically run when:
- You push code to the `main` or `master` branch
- You manually trigger it from the Actions tab (workflow_dispatch)

## Manual Deployment

You can also manually trigger a deployment:

1. Go to the **Actions** tab in your GitHub repository
2. Click **Deploy to Firebase Hosting** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Environment Variables

If your build requires environment variables, add them to the workflow file under the "Build Next.js application" step:

```yaml
- name: Build Next.js application
  run: npm run build
  env:
    NODE_ENV: production
    NEXT_PUBLIC_API_KEY: ${{ secrets.YOUR_API_KEY }}
    # Add other environment variables as needed
```

Then add these secrets in GitHub Settings → Secrets and variables → Actions.

## Troubleshooting

### Build Fails
- Check the Actions logs for specific error messages
- Ensure all environment variables are properly set
- Verify that your build runs successfully locally: `npm run build`

### "Failed to list functions" Error
This happens when your Next.js app has middleware or API routes (which require Cloud Functions) but the service account lacks permissions.

**Solution:**
1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Add these roles:
   - **Cloud Functions Developer** (or Admin)
   - **Service Account User**
   - **Firebase Hosting Admin**

### "webframeworks experiment not enabled" Error
This is already fixed in the workflow file with `FIREBASE_CLI_EXPERIMENTS: webframeworks`

### Deployment Fails
- Verify the Firebase service account JSON is correctly added to GitHub secrets
- Check that the project ID (fxpro-2dc0c) is correct in the workflow file
- Ensure your Firebase project has hosting enabled
- Verify the service account has all required permissions (see above)

### Permission Errors
- Make sure the service account has the necessary permissions in Google Cloud Console
- Required roles for Next.js apps:
  - Firebase Hosting Admin
  - Cloud Functions Developer or Admin
  - Service Account User

## Additional Configuration

### Deploy to Preview Channel

To deploy to a preview channel instead of live, modify the workflow:

```yaml
channelId: preview  # Instead of 'live'
```

### Add Tests Before Deployment

Add a test step before deployment:

```yaml
- name: Run tests
  run: npm test
```

## Support

For more information:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Firebase Documentation](https://firebase.google.com/docs/hosting)

