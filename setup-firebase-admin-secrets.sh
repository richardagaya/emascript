#!/bin/bash
# Script to create and grant access to Firebase Admin secrets in Firebase App Hosting
# Run this script and provide the secret values when prompted

PROJECT_ID="fxpro-2dc0c"
BACKEND="emascript"
LOCATION="us-east4"

echo "Setting up Firebase Admin secrets for Firebase App Hosting..."
echo "You will be prompted to enter each secret value."
echo ""

# Create and grant access to each secret
echo "1. Creating FIREBASE_ADMIN_PROJECT_ID..."
echo "   (This should be your Firebase project ID, e.g., fxpro-2dc0c)"
firebase apphosting:secrets:set FIREBASE_ADMIN_PROJECT_ID \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "2. Creating FIREBASE_ADMIN_CLIENT_EMAIL..."
echo "   (This is the service account email from your Firebase Admin SDK credentials)"
firebase apphosting:secrets:set FIREBASE_ADMIN_CLIENT_EMAIL \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "3. Creating FIREBASE_ADMIN_PRIVATE_KEY..."
echo "   (This is the private key from your Firebase Admin SDK credentials JSON)"
echo "   Note: The entire private key including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----"
firebase apphosting:secrets:set FIREBASE_ADMIN_PRIVATE_KEY \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "Done! All Firebase Admin secrets have been created."
echo ""
echo "Next, grant access to the App Hosting backend by running:"
echo "  ./grant-secrets-access.sh"
echo ""
echo "Or manually grant access using:"
echo "  firebase apphosting:secrets:grantaccess FIREBASE_ADMIN_PROJECT_ID --backend $BACKEND --location $LOCATION --project $PROJECT_ID"
echo "  firebase apphosting:secrets:grantaccess FIREBASE_ADMIN_CLIENT_EMAIL --backend $BACKEND --location $LOCATION --project $PROJECT_ID"
echo "  firebase apphosting:secrets:grantaccess FIREBASE_ADMIN_PRIVATE_KEY --backend $BACKEND --location $LOCATION --project $PROJECT_ID"

