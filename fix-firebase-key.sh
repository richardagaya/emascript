#!/bin/bash

# Script to fix Firebase Admin private key formatting
# This replaces literal \n with actual newlines

PROJECT_ID="fxpro-2dc0c"
SECRET_NAME="FIREBASE_ADMIN_PRIVATE_KEY"

echo "🔧 Fixing Firebase Admin private key formatting..."

# Get the current secret value
echo "📥 Getting current secret value..."
CURRENT_KEY=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID")

if [ $? -ne 0 ]; then
    echo "❌ Failed to get current secret value"
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "📝 Current key length: ${#CURRENT_KEY} characters"

# Replace literal \n with actual newlines
echo "🔄 Converting literal \\n to actual newlines..."
FIXED_KEY=$(echo "$CURRENT_KEY" | sed 's/\\n/\n/g')

echo "📝 Fixed key length: ${#FIXED_KEY} characters"

# Create new secret version with fixed formatting
echo "💾 Creating new secret version with proper formatting..."
echo "$FIXED_KEY" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo "✅ Firebase Admin private key updated successfully!"
    echo "🚀 The key should now work properly with Firebase Admin SDK"
    echo ""
    echo "Next steps:"
    echo "1. Wait a few minutes for the secret to propagate"
    echo "2. Test the connection: https://akavanta.com/api/debug-firebase"
    echo "3. If it works, try the payment webhook again"
else
    echo "❌ Failed to update secret"
    exit 1
fi
