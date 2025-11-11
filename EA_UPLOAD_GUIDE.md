# EA Upload Guide: Kamikaze & Nitroflow

This guide will help you upload the **Kamikaze** and **Nitroflow** Expert Advisors to Firebase Storage.

## Prerequisites

1. **Firebase CLI** installed and logged in
2. **Firebase project** configured
3. **MetaEditor** (if compiling to .ex5) - Optional, as .mq5 files are also supported

---

## Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

## Step 3: Verify Firebase Connection

```bash
firebase projects:list
```

Make sure your Firebase project is listed.

---

## Option A: Upload .mq5 Source Files (Recommended for Development)

The download API supports both .mq5 and compiled files. You can upload the source files directly.

### Upload Kamikaze

```bash
node scripts/upload-ea.js kamikaze 1.9.3 ./kamikaze.mq5
```

**Note:** The script expects .ex4 or .ex5 files, but we can modify it or use Firebase CLI directly:

```bash
# For Kamikaze
firebase storage:upload "./kamikaze.mq5" "eas/Kamikaze/1.9.3/kamikaze.mq5"

# For Nitroflow
firebase storage:upload "./Nitroflow.mq5" "eas/Nitroflow/2.5.0/Nitroflow.mq5"
```

---

## Option B: Compile and Upload .ex5 Files (Production)

### Step 1: Compile .mq5 Files to .ex5

1. Open **MetaEditor** in MetaTrader 5
2. Open `kamikaze.mq5` file
3. Click **Compile** (F7) or go to Tools → Compile
4. Check for compilation errors
5. The compiled file will be in: `MQL5/Experts/kamikaze.ex5`
6. Repeat for `Nitroflow.mq5`

### Step 2: Upload Compiled Files

```bash
# Upload Kamikaze
node scripts/upload-ea.js kamikaze 1.9.3 ./kamikaze.ex5

# Upload Nitroflow  
node scripts/upload-ea.js nitroflow 2.5.0 ./Nitroflow.ex5
```

**OR** using Firebase CLI directly:

```bash
# For Kamikaze
firebase storage:upload "./kamikaze.ex5" "eas/Kamikaze/1.9.3/kamikaze.ex5"

# For Nitroflow
firebase storage:upload "./Nitroflow.ex5" "eas/Nitroflow/2.5.0/Nitroflow.ex5"
```

---

## Step 4: Verify Files in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Storage** in the sidebar
4. Navigate to `eas/` folder
5. Verify the structure:
   ```
   eas/
   ├── Kamikaze/
   │   └── 1.9.3/
   │       └── kamikaze.ex5 (or .mq5)
   └── Nitroflow/
       └── 2.5.0/
           └── Nitroflow.ex5 (or .mq5)
   ```

---

## Step 5: Update EA Data (if needed)

The EA data is already configured in `src/data/eas.ts`:

- **Kamikaze**: Version 1.9.3 ✅
- **Nitroflow**: Version 2.5.0 ✅

If you need to update the version or metadata, edit `src/data/eas.ts`:

```typescript
"Kamikaze": {
  name: "Kamikaze",
  version: "1.9.3",  // Update if changed
  // ... other fields
},
"Nitroflow": {
  name: "Nitroflow",
  version: "2.5.0",  // Update if changed
  // ... other fields
}
```

---

## Step 6: Verify Download Functionality

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the download endpoint:
   - Login to your application
   - Purchase or add the EA to your account
   - Go to Dashboard
   - Click download for Kamikaze or Nitroflow
   - Verify the file downloads correctly

---

## Troubleshooting

### Error: Firebase CLI not installed
```bash
npm install -g firebase-tools
```

### Error: Not logged in to Firebase
```bash
firebase login
```

### Error: File not found
- Make sure you're in the project root directory
- Check file paths are correct
- Use absolute paths if needed

### Error: Permission denied
- Verify Firebase Storage rules allow uploads
- Check Firebase project permissions
- Ensure you're logged in with the correct account

### Error: File extension not supported
The upload script only accepts .ex4 or .ex5 by default. To upload .mq5 files:
- Use Firebase CLI directly (see Option A above)
- Or modify `scripts/upload-ea.js` to accept .mq5 files

---

## Quick Reference

### Upload Command Format
```bash
firebase storage:upload "<local-file-path>" "eas/<EA-Name>/<version>/<filename>"
```

### File Naming Convention
- EA Name: Capitalized (Kamikaze, Nitroflow)
- Version: Semantic versioning (1.9.3, 2.5.0)
- Filename: lowercase with extension (kamikaze.ex5, Nitroflow.ex5)

### Storage Path Structure
```
eas/
├── <EA-Name>/
│   └── <version>/
│       └── <filename>.<ext>
```

---

## Next Steps

1. ✅ Upload files to Firebase Storage
2. ✅ Verify files in Firebase Console
3. ✅ Test download functionality
4. ✅ Update EA metadata if needed
5. ✅ Deploy to production

---

## Additional Resources

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [MQL5 Compilation Guide](https://www.mql5.com/en/docs/basis/compilation)

---

**Need Help?** Check the troubleshooting section or review the Firebase Console logs.

