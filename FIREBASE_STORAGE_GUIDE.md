# 📦 Firebase Storage Setup Guide

Complete guide to get your Storage Bucket ID and upload EA files.

---

## 🔍 Part 1: Get Your Storage Bucket ID

### Method 1: From Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click on your project (e.g., "akavanta-eas")

2. **Navigate to Storage**
   - In the left sidebar, click **"Storage"**
   - If you haven't enabled it yet, click **"Get Started"**

3. **Find Your Bucket Name**
   - Look at the top of the Storage page
   - You'll see something like: `gs://your-project-id.appspot.com`
   - Your bucket ID is: `your-project-id.appspot.com`
   
   **Example:**
   ```
   If you see: gs://akavanta-eas.appspot.com
   Your bucket ID is: akavanta-eas.appspot.com
   ```

### Method 2: From Project Settings

1. Click the **⚙️ gear icon** (Project Settings)
2. Go to the **"General"** tab
3. Scroll down to **"Your apps"** section
4. Look for **"Storage bucket"**
5. Copy the value (e.g., `your-project-id.appspot.com`)

### Method 3: From Service Account JSON

1. Open your downloaded service account JSON file
2. Look for the `"storage_bucket"` field
3. Copy the value

**Example JSON:**
```json
{
  "project_id": "akavanta-eas",
  "storage_bucket": "akavanta-eas.appspot.com",  ← THIS IS IT!
  ...
}
```

---

## 📤 Part 2: Upload EA Files to Firebase Storage

You have **3 options** to upload files. Choose the one you prefer:

---

### ✅ Option 1: Firebase Console (Easiest - Recommended)

**Step-by-Step:**

1. **Go to Storage in Firebase Console**
   - https://console.firebase.google.com/
   - Click your project → **Storage**

2. **Create Folder Structure**
   - Click **"Create folder"** button
   - Name it: `eas`
   - Click inside the `eas` folder

3. **Create EA-specific folders**
   - Click **"Create folder"** again
   - Name it after your EA (e.g., `trendrider-ea`)
   - Click inside `trendrider-ea`
   - Create version folder (e.g., `2.1.0`)

4. **Upload Files**
   - Click inside the version folder
   - Click **"Upload file"** button
   - Select your EA file (e.g., `trendrider-ea-v2.1.0.ex4`)
   - Click **"Upload"**

**Final Structure:**
```
Storage
└── eas/
    ├── trendrider-ea/
    │   └── 2.1.0/
    │       ├── trendrider-ea-v2.1.0.ex4  ✓
    │       └── trendrider-ea-v2.1.0.ex5  ✓
    ├── scalpswift-ea/
    │   └── 1.8.3/
    │       └── scalpswift-ea-v1.8.3.ex4  ✓
    └── meanrevert-pro/
        └── 3.0.1/
            └── meanrevert-pro-v3.0.1.ex4  ✓
```

---

### Option 2: Firebase CLI (For Multiple Files)

**Setup:**

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in Your Project**
   ```bash
   cd /Users/agaya/Desktop/emascript
   firebase init storage
   ```
   - Select your project
   - Accept default storage.rules

**Upload Files:**

```bash
# Create local folder structure first
mkdir -p eas-files/trendrider-ea/2.1.0
mkdir -p eas-files/scalpswift-ea/1.8.3
mkdir -p eas-files/meanrevert-pro/3.0.1

# Copy your EA files there
cp ~/Downloads/trendrider-ea-v2.1.0.ex4 eas-files/trendrider-ea/2.1.0/

# Upload to Firebase Storage
firebase storage:upload eas-files/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4 \
  eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4

# Or upload entire folder
firebase deploy --only storage
```

---

### Option 3: Upload Script (Automated)

Create a Node.js script to upload all files at once:

**Create `upload-eas.js` in your project root:**

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project-id.appspot.com'
});

const bucket = admin.storage().bucket();

// List of EA files to upload
const files = [
  {
    local: './local-eas/trendrider-ea-v2.1.0.ex4',
    remote: 'eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4'
  },
  {
    local: './local-eas/scalpswift-ea-v1.8.3.ex4',
    remote: 'eas/scalpswift-ea/1.8.3/scalpswift-ea-v1.8.3.ex4'
  },
  // Add more files here
];

async function uploadFiles() {
  console.log('Starting upload...\n');
  
  for (const file of files) {
    try {
      console.log(`Uploading: ${file.local} → ${file.remote}`);
      
      await bucket.upload(file.local, {
        destination: file.remote,
        metadata: {
          contentType: 'application/octet-stream',
        },
      });
      
      console.log(`✅ Uploaded: ${file.remote}\n`);
    } catch (error) {
      console.error(`❌ Error uploading ${file.local}:`, error.message, '\n');
    }
  }
  
  console.log('Upload complete!');
  process.exit(0);
}

uploadFiles();
```

**Run the script:**

```bash
node upload-eas.js
```

---

## 📝 Update Your .env.local

After getting your bucket ID, add it to `.env.local`:

```env
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Example:**
```env
FIREBASE_STORAGE_BUCKET=akavanta-eas.appspot.com
```

---

## 🔧 Update EA Catalog

After uploading files, update the EA catalog in your code:

**Edit:** `/src/app/api/payment-webhook/route.ts`

Find the `EA_CATALOG` object and update it:

```typescript
const EA_CATALOG: Record<string, any> = {
  'TrendRider EA': {
    eaId: 'trendrider-ea',
    version: '2.1.0',
    thumbnail: '📈',
    description: 'Advanced trend-following strategy',
    downloadUrl: 'eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4',
    // ↑ This path must match your Storage structure
  },
  'ScalpSwift EA': {
    eaId: 'scalpswift-ea',
    version: '1.8.3',
    thumbnail: '⚡',
    description: 'High-frequency scalping bot',
    downloadUrl: 'eas/scalpswift-ea/1.8.3/scalpswift-ea-v1.8.3.ex4',
  },
  'MeanRevert Pro': {
    eaId: 'meanrevert-pro',
    version: '3.0.1',
    thumbnail: '🎯',
    description: 'Mean reversion with grid management',
    downloadUrl: 'eas/meanrevert-pro/3.0.1/meanrevert-pro-v3.0.1.ex4',
  },
};
```

---

## ✅ Verify Upload

### Method 1: Firebase Console
1. Go to Storage in Firebase Console
2. Navigate through folders
3. You should see your files

### Method 2: Test Download
1. Run your app: `npm run dev`
2. Complete a test purchase (or simulate webhook)
3. Go to dashboard
4. Click download button
5. File should download successfully

---

## 🔒 Storage Security Rules

Update your Firebase Storage rules:

1. Go to **Storage** → **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // EA files - only authenticated users
    match /eas/{eaId}/{version}/{fileName} {
      // Read through signed URLs only (handled by server)
      allow read: if request.auth != null;
      // Only admins can write (via Console or Admin SDK)
      allow write: if false;
    }
  }
}
```

3. Click **"Publish"**

---

## 🎯 Quick Checklist

- [ ] Got Storage Bucket ID from Firebase Console
- [ ] Added bucket ID to `.env.local`
- [ ] Created folder structure: `eas/{ea-name}/{version}/`
- [ ] Uploaded EA files (.ex4 or .ex5)
- [ ] Updated `EA_CATALOG` in webhook code
- [ ] Updated Storage security rules
- [ ] Tested download functionality

---

## 🐛 Troubleshooting

### "File not found in storage"
**Solution:**
- Check file path matches `EA_CATALOG` exactly
- Verify file exists in Firebase Console
- Check file name spelling (case-sensitive!)

### "Permission denied"
**Solution:**
- Update Storage security rules
- Ensure user is authenticated
- Check `.env.local` has correct bucket ID

### "Invalid bucket name"
**Solution:**
- Bucket ID should end with `.appspot.com`
- No `gs://` prefix in `.env.local`
- Example: `akavanta-eas.appspot.com` ✅
- NOT: `gs://akavanta-eas.appspot.com` ❌

---

## 📹 Visual Guide

### Finding Storage Bucket:

```
Firebase Console
├── Click your project name
├── Click "Storage" in sidebar
└── Look at top: "gs://YOUR-BUCKET-ID.appspot.com"
                         ↑
                  This is your bucket ID!
```

### Folder Structure:

```
🗂️ Storage Root
  └── 📁 eas/
      ├── 📁 trendrider-ea/
      │   └── 📁 2.1.0/
      │       └── 📄 trendrider-ea-v2.1.0.ex4
      ├── 📁 scalpswift-ea/
      │   └── 📁 1.8.3/
      │       └── 📄 scalpswift-ea-v1.8.3.ex4
      └── 📁 meanrevert-pro/
          └── 📁 3.0.1/
              └── 📄 meanrevert-pro-v3.0.1.ex4
```

---

## 🚀 You're Done!

Now your EA files are stored securely in Firebase Storage and ready for download!

**Next Steps:**
1. Test the complete flow (checkout → payment → download)
2. Monitor download counts in Firestore
3. Add more EAs as needed

Need help? Check the main `SETUP_GUIDE.md` or ask! 🎉

