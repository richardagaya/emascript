#!/bin/bash
# Script to update the NEXT_PUBLIC_FIREBASE_API_KEY secret in Firebase App Hosting
# This will create a new version of the secret with the updated value

PROJECT_ID="fxpro-2dc0c"
BACKEND="emascript"
LOCATION="us-east4"

echo "Updating NEXT_PUBLIC_FIREBASE_API_KEY secret..."
echo "Backend: $BACKEND"
echo "Location: $LOCATION"
echo "Project: $PROJECT_ID"
echo ""
echo "This will create a new version of the secret with your updated API key."
echo ""

# Update the secret - this will create a new version automatically
firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY \
  --project "$PROJECT_ID" \
  --location "$LOCATION" \
  --force

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Successfully updated NEXT_PUBLIC_FIREBASE_API_KEY"
  echo ""
  echo "The secret has been updated with a new version."
  echo "Your next deployment should use the latest version automatically."
  echo ""
  echo "You can now retry your deployment."
else
  echo ""
  echo "✗ Failed to update the secret"
  echo "Make sure you're authenticated with Firebase CLI:"
  echo "  firebase login"
  echo ""
  echo "And that you have the necessary permissions."
fi

