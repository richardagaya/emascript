# Firebase App Hosting Support Ticket

## Issue Summary
All deployments to Firebase App Hosting fail with "Resource readiness deadline exceeded" error, even with the most minimal Next.js application.

## Project Details
- Project ID: `fxpro-2dc0c`
- Backend Name: `emascript`
- Region: `us-east4`
- Domain: `akavanta.com`

## Symptoms
1. **Builds succeed** - Cloud Build completes successfully, creates Docker image
2. **Container never becomes ready** - Cloud Run revision fails health checks
3. **Error Message**: `generic::failed_precondition: Deploying Revision. Waiting on revision emascript-build-2025-11-12-029. Resource readiness deadline exceeded.`

## What We've Tried
1. ✅ Removed Dockerfile - using native Next.js support
2. ✅ Simplified to minimal Next.js app (single HTML page)
3. ✅ Removed all Firebase Admin dependencies
4. ✅ Disabled middleware
5. ✅ Set `minInstances: 0`
6. ✅ Removed conflicting GitHub Actions workflows
7. ✅ Simplified firebase.json configuration
8. ✅ Verified secrets have proper access grants

## Build Logs Show Success
```
DONE
build-2025-11-12-029: digest: sha256:a444471ab8d24d7685b3ecb69fe18c43a8110a249d16a8003642866e232bf039
frameworkVersion: 15.5.4
framework: nextjs
```

## Current Configuration

### apphosting.yaml
```yaml
runConfig:
  concurrency: 100
  cpu: 1
  maxInstances: 20
  minInstances: 0
  memory: 512Mi

env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: NEXT_PUBLIC_FIREBASE_API_KEY
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    secret: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    secret: NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - variable: PESAPAL_CONSUMER_KEY
    secret: PESAPAL_CONSUMER_KEY
  - variable: PESAPAL_CONSUMER_SECRET
    secret: PESAPAL_CONSUMER_SECRET
  - variable: PESAPAL_BASE_URL
    secret: PESAPAL_BASE_URL
  - variable: PESAPAL_CALLBACK_URL
    secret: PESAPAL_CALLBACK_URL
  - variable: PESAPAL_IPN_URL
    secret: PESAPAL_IPN_URL
  - variable: PESAPAL_IPN_ID
    secret: PESAPAL_IPN_ID
  - variable: NEXT_PUBLIC_APP_URL
    secret: NEXT_PUBLIC_APP_URL
```

### Minimal Application
Current deployment is the most basic Next.js app:
- Single route `/` with plain HTML
- No external dependencies
- No Firebase client initialization
- No middleware
- No custom server logic

## Request
Please investigate why Cloud Run revisions are not passing health checks despite successful builds. Need access to container startup logs or guidance on what might be preventing the service from becoming ready.

## Timeline
Issue started: November 12, 2025
Multiple deployment attempts: 50+ versions, all failing with same error
Last known working version: Unknown (need to check older deployments)

