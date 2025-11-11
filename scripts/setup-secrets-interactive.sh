#!/bin/bash

# Interactive script to set up Firebase App Hosting secrets using Firebase CLI

set -e

PROJECT_ID="fxpro-2dc0c"

echo "🔐 Firebase App Hosting Secrets Setup"
echo "======================================"
echo ""
echo "Project: $PROJECT_ID"
echo ""
echo "You'll need your Firebase config values (same as GitHub secrets):"
echo "  - NEXT_PUBLIC_FIREBASE_API_KEY"
echo "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (usually: $PROJECT_ID.firebaseapp.com)"
echo "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID ($PROJECT_ID)"
echo ""
echo "Get these from:"
echo "  - GitHub: Settings → Secrets and variables → Actions"
echo "  - Firebase Console: Project Settings → Your apps → Web app"
echo ""

# Ensure we're using the right project
firebase use $PROJECT_ID

echo "Enter your values:"
echo ""

read -p "NEXT_PUBLIC_FIREBASE_API_KEY: " API_KEY
if [ -z "$API_KEY" ]; then
    echo "❌ API Key is required"
    exit 1
fi

read -p "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN [$PROJECT_ID.firebaseapp.com]: " AUTH_DOMAIN
AUTH_DOMAIN=${AUTH_DOMAIN:-$PROJECT_ID.firebaseapp.com}

read -p "NEXT_PUBLIC_FIREBASE_PROJECT_ID [$PROJECT_ID]: " PROJECT_ID_VAL
PROJECT_ID_VAL=${PROJECT_ID_VAL:-$PROJECT_ID}

echo ""
echo "Creating/updating secrets..."

# Create or update secrets
echo -n "$API_KEY" | firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY --project=$PROJECT_ID
echo "✅ NEXT_PUBLIC_FIREBASE_API_KEY set"

echo -n "$AUTH_DOMAIN" | firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --project=$PROJECT_ID
echo "✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN set"

echo -n "$PROJECT_ID_VAL" | firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_PROJECT_ID --project=$PROJECT_ID
echo "✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID set"

echo ""
echo "Granting App Hosting access..."

firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_API_KEY --project=$PROJECT_ID
echo "✅ Access granted for NEXT_PUBLIC_FIREBASE_API_KEY"

firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --project=$PROJECT_ID
echo "✅ Access granted for NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"

firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_PROJECT_ID --project=$PROJECT_ID
echo "✅ Access granted for NEXT_PUBLIC_FIREBASE_PROJECT_ID"

echo ""
echo "🎉 All done! Secrets are configured and accessible."
echo ""
echo "Next steps:"
echo "  1. Verify: firebase apphosting:secrets:describe NEXT_PUBLIC_FIREBASE_API_KEY"
echo "  2. Redeploy your app in Firebase Console"
echo ""

