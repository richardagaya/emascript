#!/bin/bash

# Super simple one-command setup for Firebase App Hosting secrets
# Just run: ./scripts/setup-secrets-simple.sh

set -e

PROJECT_ID="fxpro-2dc0c"

echo "🚀 Quick Firebase Secrets Setup"
echo "================================"
echo ""
echo "This will create 3 secrets in Firebase Secret Manager."
echo "You'll need your Firebase config values (same ones from GitHub secrets)."
echo ""

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Please install Firebase CLI first: npm install -g firebase-tools"
    exit 1
fi

# Login check
firebase login --no-localhost 2>/dev/null || {
    echo "🔑 Please login to Firebase:"
    firebase login
}

firebase use $PROJECT_ID

echo ""
echo "Enter your Firebase config values (same as GitHub secrets):"
echo ""

read -p "NEXT_PUBLIC_FIREBASE_API_KEY: " API_KEY
read -p "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (e.g., fxpro-2dc0c.firebaseapp.com): " AUTH_DOMAIN
read -p "NEXT_PUBLIC_FIREBASE_PROJECT_ID (fxpro-2dc0c): " PROJECT_ID_VAL

PROJECT_ID_VAL=${PROJECT_ID_VAL:-fxpro-2dc0c}

echo ""
echo "Creating secrets..."

# Create secrets using Firebase CLI (simpler than gcloud)
echo -n "$API_KEY" | firebase apphosting:secrets:create NEXT_PUBLIC_FIREBASE_API_KEY --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$API_KEY" | firebase apphosting:secrets:update NEXT_PUBLIC_FIREBASE_API_KEY --project=$PROJECT_ID

echo -n "$AUTH_DOMAIN" | firebase apphosting:secrets:create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$AUTH_DOMAIN" | firebase apphosting:secrets:update NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --project=$PROJECT_ID

echo -n "$PROJECT_ID_VAL" | firebase apphosting:secrets:create NEXT_PUBLIC_FIREBASE_PROJECT_ID --project=$PROJECT_ID 2>/dev/null || \
    echo -n "$PROJECT_ID_VAL" | firebase apphosting:secrets:update NEXT_PUBLIC_FIREBASE_PROJECT_ID --project=$PROJECT_ID

echo ""
echo "Granting App Hosting access..."

firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_API_KEY --project=$PROJECT_ID
firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --project=$PROJECT_ID
firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_PROJECT_ID --project=$PROJECT_ID

echo ""
echo "✅ Done! Secrets are configured."
echo ""
echo "Verify with: firebase apphosting:secrets:list"
echo "Then redeploy your app in Firebase Console."

