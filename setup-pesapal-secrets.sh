#!/bin/bash
# Script to create and grant access to Pesapal secrets in Firebase App Hosting
# Run this script and provide the secret values when prompted

PROJECT_ID="fxpro-2dc0c"
BACKEND="emascript"
LOCATION="us-east4"

echo "Setting up Pesapal secrets for Firebase App Hosting..."
echo "You will be prompted to enter each secret value."
echo ""

# Create and grant access to each secret
echo "1. Creating PESAPAL_CONSUMER_KEY..."
firebase apphosting:secrets:set PESAPAL_CONSUMER_KEY \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "2. Creating PESAPAL_CONSUMER_SECRET..."
firebase apphosting:secrets:set PESAPAL_CONSUMER_SECRET \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "3. Creating PESAPAL_BASE_URL (optional - press Enter to skip or provide value)..."
firebase apphosting:secrets:set PESAPAL_BASE_URL \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "4. Creating PESAPAL_CALLBACK_URL (optional - press Enter to skip or provide value)..."
firebase apphosting:secrets:set PESAPAL_CALLBACK_URL \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "5. Creating PESAPAL_IPN_URL (optional - press Enter to skip or provide value)..."
firebase apphosting:secrets:set PESAPAL_IPN_URL \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "6. Creating PESAPAL_IPN_ID (optional - press Enter to skip or provide value)..."
firebase apphosting:secrets:set PESAPAL_IPN_ID \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "7. Creating NEXT_PUBLIC_APP_URL (optional - press Enter to skip or provide value)..."
firebase apphosting:secrets:set NEXT_PUBLIC_APP_URL \
  --project $PROJECT_ID \
  --location $LOCATION \
  --force

echo ""
echo "Done! All secrets have been created and granted access to the App Hosting backend."
echo "Note: The --force flag should have automatically granted access, but if you still get errors,"
echo "you can manually grant access using:"
echo "  firebase apphosting:secrets:grantaccess <SECRET_NAME> --backend $BACKEND --location $LOCATION --project $PROJECT_ID"

