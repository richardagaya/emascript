#!/bin/bash

# Script to set up Firebase App Hosting secrets
# This script creates secrets in Firebase Secret Manager and grants access to App Hosting

set -e

PROJECT_ID="fxpro-2dc0c"
SECRETS=(
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
)

echo "🔐 Setting up Firebase App Hosting secrets for project: $PROJECT_ID"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if gcloud CLI is installed (needed for secret creation)
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first:"
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate if needed
echo "🔑 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Set the project
gcloud config set project $PROJECT_ID

echo ""
echo "📝 You'll need to provide the following values:"
echo "   - NEXT_PUBLIC_FIREBASE_API_KEY: Your Firebase Web API Key"
echo "   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Your Firebase Auth Domain (usually PROJECT_ID.firebaseapp.com)"
echo "   - NEXT_PUBLIC_FIREBASE_PROJECT_ID: Your Firebase Project ID ($PROJECT_ID)"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Create or update secrets
for SECRET_NAME in "${SECRETS[@]}"; do
    echo ""
    echo "🔧 Processing secret: $SECRET_NAME"
    
    # Check if secret already exists
    if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &> /dev/null; then
        echo "   ✓ Secret already exists. Updating..."
        read -sp "   Enter value for $SECRET_NAME: " SECRET_VALUE
        echo ""
        echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
    else
        echo "   Creating new secret..."
        read -sp "   Enter value for $SECRET_NAME: " SECRET_VALUE
        echo ""
        echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
    fi
    
    echo "   ✓ Secret $SECRET_NAME configured"
done

echo ""
echo "🔓 Granting App Hosting access to secrets..."

# Grant access to App Hosting service account
for SECRET_NAME in "${SECRETS[@]}"; do
    echo "   Granting access to $SECRET_NAME..."
    firebase apphosting:secrets:grantaccess "$SECRET_NAME" --project="$PROJECT_ID" || {
        echo "   ⚠️  Warning: Could not grant access via Firebase CLI. Trying gcloud..."
        # Get the App Hosting service account
        SERVICE_ACCOUNT="service-$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@gcp-sa-firebaseapphosting.iam.gserviceaccount.com"
        gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
            --member="serviceAccount:$SERVICE_ACCOUNT" \
            --role="roles/secretmanager.secretAccessor" \
            --project="$PROJECT_ID"
    }
    echo "   ✓ Access granted for $SECRET_NAME"
done

echo ""
echo "✅ All secrets have been configured and access has been granted!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify your secrets are accessible:"
echo "      firebase apphosting:secrets:list --project=$PROJECT_ID"
echo "   2. Redeploy your app to Firebase App Hosting"
echo "   3. Check the App Hosting logs if issues persist"
echo ""

