# Google OAuth Setup for Production (akavanta.com)

This guide will help you configure Google OAuth to work on your production domain `akavanta.com`.

## Common Issues

If Google sign-in fails on production, it's usually due to missing OAuth configuration in Google Cloud Console, not just Firebase Console.

### Popup Appears and Disappears Immediately

If the Google sign-in popup appears and then immediately disappears, this is almost always caused by:

1. **OAuth Redirect URI Mismatch** (Most Common)
   - The redirect URI in Google Cloud Console doesn't match what Firebase is trying to use
   - Check the browser console for `redirect_uri_mismatch` errors
   - Solution: Add the correct redirect URIs (see Step 2 below)

2. **Unauthorized Domain**
   - Your domain is not authorized in Firebase or Google Cloud Console
   - Check the browser console for `auth/unauthorized-domain` errors
   - Solution: Add your domain to both Firebase Console and Google Cloud Console

3. **Popup Blocked by Browser**
   - Modern browsers may block popups if they're not triggered by direct user interaction
   - The code now automatically falls back to redirect method if popup fails
   - Solution: Allow popups for your domain or use the redirect method

**Quick Fix Steps:**
1. Open browser console (F12) and look for error messages
2. Check if you see `redirect_uri_mismatch` - this means you need to add redirect URIs in Google Cloud Console
3. Check if you see `auth/unauthorized-domain` - this means you need to add your domain
4. The improved code will automatically try redirect method if popup fails

## Required Configuration Steps

### 1. Firebase Console - Authorized Domains ✅ (You've done this)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`fxpro-2dc0c`)
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Ensure these domains are added:
   - `akavanta.com`
   - `www.akavanta.com` (if you use www)
   - `localhost` (for development)

### 2. Google Cloud Console - OAuth 2.0 Client Configuration ⚠️ (CRITICAL)

This is the most common issue! You need to configure the OAuth 2.0 client in Google Cloud Console.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (`fxpro-2dc0c`)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one used by Firebase Auth)
5. Click **Edit** on the OAuth client
6. Under **Authorized JavaScript origins**, add:
   ```
   https://akavanta.com
   https://www.akavanta.com
   ```
7. Under **Authorized redirect URIs**, add:
   ```
   https://akavanta.com/__/auth/handler
   https://www.akavanta.com/__/auth/handler
   ```
   Note: Firebase uses the `__/auth/handler` endpoint for OAuth callbacks.

8. Click **Save**

### 3. OAuth Consent Screen - Authorized Domains

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Scroll down to **Authorized domains**
3. Add:
   - `akavanta.com`
   - `www.akavanta.com` (if applicable)

### 4. Verify Environment Variables

Ensure your production environment has the correct Firebase configuration:

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Should match your Firebase project
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Should be `[your-project-id].firebaseapp.com` or your custom domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Should be `fxpro-2dc0c`

### 5. Check Browser Console

After deploying the improved error handling, check the browser console when Google sign-in fails. You'll see more detailed error messages that can help identify the exact issue.

## Testing

1. Clear your browser cache and cookies for `akavanta.com`
2. Try signing in with Google
3. Check the browser console for any errors
4. The improved error messages will now show specific issues

## Common Error Codes

- `auth/unauthorized-domain` - Domain not in Firebase authorized domains
- `redirect_uri_mismatch` - Redirect URI not in Google Cloud OAuth client
- `auth/operation-not-allowed` - Google sign-in not enabled in Firebase
- `auth/popup-blocked` - Browser blocked the popup

## Important Notes

- Changes in Google Cloud Console can take a few minutes to propagate
- Make sure you're editing the **correct OAuth 2.0 Client ID** (the one Firebase uses)
- If you have multiple OAuth clients, you need to update the one associated with Firebase Authentication
- The redirect URI format is specific: `https://yourdomain.com/__/auth/handler`

## Finding Your Firebase OAuth Client ID

To find which OAuth client Firebase is using:
1. Go to Firebase Console → Authentication → Settings → OAuth providers
2. Click on Google provider
3. Note the Web client ID shown there
4. Use this client ID in Google Cloud Console to find the matching OAuth 2.0 client

