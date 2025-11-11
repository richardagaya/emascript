#!/bin/bash
# Script to grant App Hosting backend access to all secrets
# This script grants access to secrets that already exist in Google Secrets Manager

PROJECT_ID="fxpro-2dc0c"
BACKEND="emascript"
LOCATION="us-east4"

echo "Granting App Hosting backend access to secrets..."
echo "Backend: $BACKEND"
echo "Location: $LOCATION"
echo "Project: $PROJECT_ID"
echo ""

# List of all secrets that need access
SECRETS=(
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "PESAPAL_CONSUMER_KEY"
  "PESAPAL_CONSUMER_SECRET"
  "PESAPAL_BASE_URL"
  "PESAPAL_CALLBACK_URL"
  "PESAPAL_IPN_URL"
  "PESAPAL_IPN_ID"
  "NEXT_PUBLIC_APP_URL"
)

# Grant access to each secret
for SECRET in "${SECRETS[@]}"; do
  echo "Granting access to $SECRET..."
  firebase apphosting:secrets:grantaccess "$SECRET" \
    --backend "$BACKEND" \
    --location "$LOCATION" \
    --project "$PROJECT_ID"
  
  if [ $? -eq 0 ]; then
    echo "✓ Successfully granted access to $SECRET"
  else
    echo "✗ Failed to grant access to $SECRET (secret may not exist or already has access)"
  fi
  echo ""
done

echo "Done! All secrets have been processed."
echo ""
echo "If you see any errors, make sure:"
echo "1. The secrets exist in Google Secrets Manager"
echo "2. The backend name '$BACKEND' is correct"
echo "3. The location '$LOCATION' is correct"
echo "4. You have the necessary permissions"

