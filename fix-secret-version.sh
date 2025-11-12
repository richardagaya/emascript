#!/bin/bash
# Script to fix the FIREBASE_ADMIN_PRIVATE_KEY secret version issue

PROJECT_ID="fxpro-2dc0c"
BACKEND="emascript"
LOCATION="us-east4"
SECRET_NAME="FIREBASE_ADMIN_PRIVATE_KEY"

echo "Fixing FIREBASE_ADMIN_PRIVATE_KEY secret version..."
echo ""

# Step 1: List all versions to see what we have
echo "Step 1: Checking secret versions..."
firebase apphosting:secrets:describe $SECRET_NAME \
  --project $PROJECT_ID \
  2>&1 || echo "Could not describe secret"

echo ""
echo "Step 2: Removing the secret binding from the backend..."
# This will remove the reference so we can re-add it fresh
firebase apphosting:secrets:access revoke $SECRET_NAME \
  --backend $BACKEND \
  --location $LOCATION \
  --project $PROJECT_ID \
  2>&1 || echo "Secret binding may not exist or already removed"

echo ""
echo "Step 3: Re-granting access to the secret (will use latest version)..."
# This should bind to the latest enabled version
firebase apphosting:secrets:grantaccess $SECRET_NAME \
  --backend $BACKEND \
  --location $LOCATION \
  --project $PROJECT_ID

echo ""
echo "Done!"
echo ""
echo "Now trigger a new deployment by pushing to GitHub."

