# Firebase Admin Secret Fix - Deployment Plan

## Current Status
- Removed Firebase Admin secrets temporarily to break the cache to version 1 (DESTROYED)
- App is deploying without Firebase Admin functionality
- Version 3 of FIREBASE_ADMIN_PRIVATE_KEY is ENABLED and contains correct key

## Next Steps (After Current Deployment Succeeds)

### 1. Add Firebase Admin Secrets Back to apphosting.yaml
```yaml
  # Firebase Admin Configuration (for server-side operations)
  - variable: FIREBASE_ADMIN_PROJECT_ID
    secret: FIREBASE_ADMIN_PROJECT_ID
  - variable: FIREBASE_ADMIN_CLIENT_EMAIL
    secret: FIREBASE_ADMIN_CLIENT_EMAIL
  - variable: FIREBASE_ADMIN_PRIVATE_KEY
    secret: FIREBASE_ADMIN_PRIVATE_KEY
```

### 2. Commit and Deploy
```bash
git add -A
git commit -m "feat: restore Firebase Admin secrets with fresh binding"
git push origin main
```

### 3. Verify Secret Access
All secrets should now bind to latest versions:
- FIREBASE_ADMIN_PRIVATE_KEY → version 3 (ENABLED)
- FIREBASE_ADMIN_CLIENT_EMAIL → latest (ENABLED)
- FIREBASE_ADMIN_PROJECT_ID → latest (ENABLED)

### 4. Test Functionality
Once deployed, test:
- `/api/health` - should return 200 OK
- `/api/test-firestore` - should connect to Firestore
- `/dashboard` - should work with authentication
- Download functionality should work

## What We Fixed
1. ✅ Added missing Firebase Admin secrets to apphosting.yaml
2. ✅ Granted secret access to App Hosting backend
3. ✅ Improved Firebase Admin error handling
4. ✅ Broke cache to destroyed version 1 by temporarily removing secrets
5. ⏳ Will re-add secrets with fresh binding to version 3

