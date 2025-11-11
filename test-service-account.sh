#!/bin/bash

# Test Firebase Service Account Permissions
# This script helps verify your service account has the correct permissions

echo "🔍 Testing Firebase Service Account..."
echo ""

# Check if service account JSON exists
if [ ! -f "fxpro-2dc0c-*.json" ]; then
  echo "❌ No service account JSON file found"
  echo "   Download from Firebase Console → Project Settings → Service Accounts"
  exit 1
fi

# Set the service account
export GOOGLE_APPLICATION_CREDENTIALS=$(ls fxpro-2dc0c-*.json | head -n 1)
echo "✅ Using service account: $GOOGLE_APPLICATION_CREDENTIALS"
echo ""

# Authenticate
echo "🔐 Authenticating..."
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"

# Set project
gcloud config set project fxpro-2dc0c

echo ""
echo "📋 Checking required permissions..."
echo ""

# Test Cloud Functions API
echo "1. Testing Cloud Functions API..."
if gcloud services list --enabled --filter="name:cloudfunctions.googleapis.com" | grep -q "cloudfunctions"; then
  echo "   ✅ Cloud Functions API is enabled"
else
  echo "   ❌ Cloud Functions API is NOT enabled"
  echo "   Run: gcloud services enable cloudfunctions.googleapis.com"
fi

# Test Cloud Build API
echo "2. Testing Cloud Build API..."
if gcloud services list --enabled --filter="name:cloudbuild.googleapis.com" | grep -q "cloudbuild"; then
  echo "   ✅ Cloud Build API is enabled"
else
  echo "   ❌ Cloud Build API is NOT enabled"
  echo "   Run: gcloud services enable cloudbuild.googleapis.com"
fi

# Test Artifact Registry API
echo "3. Testing Artifact Registry API..."
if gcloud services list --enabled --filter="name:artifactregistry.googleapis.com" | grep -q "artifactregistry"; then
  echo "   ✅ Artifact Registry API is enabled"
else
  echo "   ❌ Artifact Registry API is NOT enabled"
  echo "   Run: gcloud services enable artifactregistry.googleapis.com"
fi

# Check IAM permissions
echo ""
echo "4. Checking IAM roles..."
SERVICE_ACCOUNT_EMAIL=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "   Service Account: $SERVICE_ACCOUNT_EMAIL"

# List roles
echo ""
echo "   Current roles:"
gcloud projects get-iam-policy fxpro-2dc0c \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL"

echo ""
echo "✅ Test complete!"
echo ""
echo "Required roles for deployment:"
echo "  - roles/firebasehosting.admin"
echo "  - roles/cloudfunctions.admin (or developer)"
echo "  - roles/iam.serviceAccountUser"
echo ""

