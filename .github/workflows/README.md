# GitHub Actions Workflows

This directory contains automated workflows for CI/CD.

## Available Workflows

### `firebase-deploy.yml`
Automatically builds and deploys your Next.js application to Firebase Hosting.

**Triggers:**
- Push to `main` or `master` branch
- Manual trigger via GitHub Actions UI

**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON

**Steps:**
1. Checkout code
2. Setup Node.js 20 with npm caching
3. Install dependencies
4. Build Next.js app
5. Deploy to Firebase Hosting

---

📖 For detailed setup instructions, see [GITHUB_ACTIONS_SETUP.md](../../GITHUB_ACTIONS_SETUP.md) in the root directory.

