# Quick Upload Guide: Kamikaze & Nitroflow

## Prerequisites Check

```bash
# 1. Check if Firebase CLI is installed
firebase --version

# 2. If not installed, install it:
npm install -g firebase-tools

# 3. Login to Firebase
firebase login

# 4. Verify you're logged in
firebase projects:list
```

## Upload Commands

### Option 1: Upload .mq5 Source Files (Recommended)

```bash
# Upload Kamikaze
node scripts/upload-ea.js kamikaze 1.9.3 ./kamikaze.mq5

# Upload Nitroflow
node scripts/upload-ea.js nitroflow 2.5.0 ./Nitroflow.mq5
```

**Note:** The script will automatically:
- Capitalize the EA name (kamikaze → Kamikaze)
- Upload to: `eas/Kamikaze/1.9.3/Kamikaze.mq5`
- Upload to: `eas/Nitroflow/2.5.0/Nitroflow.mq5`

### Option 2: Upload Compiled .ex5 Files

First, compile the .mq5 files in MetaEditor, then:

```bash
# Upload Kamikaze (compiled)
node scripts/upload-ea.js kamikaze 1.9.3 ./kamikaze.ex5

# Upload Nitroflow (compiled)
node scripts/upload-ea.js nitroflow 2.5.0 ./Nitroflow.ex5
```

### Option 3: Direct Firebase CLI Upload

If the script doesn't work, use Firebase CLI directly:

```bash
# Upload Kamikaze
firebase storage:upload "./kamikaze.mq5" "eas/Kamikaze/1.9.3/Kamikaze.mq5"

# Upload Nitroflow
firebase storage:upload "./Nitroflow.mq5" "eas/Nitroflow/2.5.0/Nitroflow.mq5"
```

## Verify Upload

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Storage** in the sidebar
4. Navigate to `eas/` folder
5. Verify structure:
   ```
   eas/
   ├── Kamikaze/
   │   └── 1.9.3/
   │       └── Kamikaze.mq5
   └── Nitroflow/
       └── 2.5.0/
           └── Nitroflow.mq5
   ```

## Test Download

1. Start dev server: `npm run dev`
2. Login to your application
3. Purchase/add EA to your account
4. Go to Dashboard
5. Click download for Kamikaze or Nitroflow
6. Verify file downloads correctly

## Troubleshooting

### Error: Firebase CLI not installed
```bash
npm install -g firebase-tools
```

### Error: Not logged in
```bash
firebase login
```

### Error: File not found
- Make sure you're in the project root: `/Users/agaya/Desktop/emascript`
- Check file paths: `./kamikaze.mq5` or `./Nitroflow.mq5`
- Use absolute paths if needed: `/Users/agaya/Desktop/emascript/kamikaze.mq5`

### Error: Permission denied
- Verify Firebase Storage rules allow uploads
- Check you're logged in with correct Firebase account
- Verify project permissions in Firebase Console

---

## Expected File Structure in Firebase Storage

```
eas/
├── Kamikaze/
│   └── 1.9.3/
│       └── Kamikaze.mq5 (or .ex5)
└── Nitroflow/
    └── 2.5.0/
        └── Nitroflow.mq5 (or .ex5)
```

## Current EA Versions (from eas.ts)

- **Kamikaze**: Version 1.9.3
- **Nitroflow**: Version 2.5.0

Make sure the version in the upload command matches the version in `src/data/eas.ts`!

---

**Need more details?** See `EA_UPLOAD_GUIDE.md` for complete documentation.

