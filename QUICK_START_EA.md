# Quick Start: Adding an EA

## 🚀 Fastest Way to Add an EA

### 1️⃣ Upload EA File
```bash
# Option A: Use script (easiest)
npm run ea:upload gold-scalper-pro 1.0.0 ./gold-scalper-pro.ex4

# Option B: Firebase Console
# Go to: https://console.firebase.google.com/
# Storage → Create: eas/gold-scalper-pro/1.0.0/
# Upload: gold-scalper-pro-v1.0.0.ex4
```

### 2️⃣ Upload Image
```bash
# Copy image to public folder
cp ./gold-scalper-pro.png public/eas/gold-scalper-pro.png
```

### 3️⃣ Generate Template
```bash
npm run ea:template "Gold Scalper Pro"
# Copy the output and paste into src/data/eas.ts
```

### 4️⃣ Edit EA Details
```bash
# Open this file
src/data/eas.ts

# Update:
# - image: "/eas/gold-scalper-pro.png"
# - version: "1.0.0"
# - lastUpdated: "2024-03-01"
# - price, desc, features, etc.
```

### 5️⃣ Verify
Visit: `http://localhost:3000/marketplace`

---

## 📝 Quick Reference

| What | Where | How |
|------|-------|-----|
| **EA File** | Firebase Storage | `eas/{name}/{version}/` |
| **EA Image** | `public/eas/` | `{name}.png` |
| **EA Data** | `src/data/eas.ts` | Edit directly |
| **EA Name** | `src/data/eas.ts` | Must match everywhere |

---

## 🔄 Updating an EA

### Change Name
1. Edit `name` in `src/data/eas.ts`
2. Update image path if needed
3. Update Firebase Storage folder name (if needed)

### Change Image
1. Replace file in `public/eas/{name}.png`
2. Update `image` path in `src/data/eas.ts`

### Change Price/Details
1. Edit `src/data/eas.ts`
2. Update any field you want

### New Version
1. Upload new file: `eas/{name}/{new-version}/`
2. Update `version` in `src/data/eas.ts`
3. Update `lastUpdated` date

---

## 📋 File Locations

```
📁 Project Structure:
├── public/eas/              ← EA images go here
│   └── {name}.png
├── src/data/eas.ts          ← EA data here (EDIT THIS!)
└── scripts/                 ← Helper scripts
    ├── upload-ea.js
    └── add-ea-template.js

🔥 Firebase Storage:
└── eas/{name}/{version}/    ← EA files here
    └── {name}-v{version}.ex4
```

---

## 🎯 Example: Complete Flow

```bash
# 1. Upload EA file
npm run ea:upload gold-scalper-pro 1.0.0 ./gold-scalper-pro.ex4

# 2. Copy image
cp gold-scalper-pro.png public/eas/gold-scalper-pro.png

# 3. Generate template
npm run ea:template "Gold Scalper Pro"

# 4. Copy template output and paste into src/data/eas.ts
# 5. Edit the template with your details
# 6. Save and verify at /marketplace
```

---

## 📚 Full Documentation

- **Complete Guide**: `EA_MANAGEMENT_GUIDE.md`
- **Visual Flow**: `EA_UPLOAD_FLOW.md`
- **Quick Reference**: This file

---

## ⚡ Pro Tips

1. **Use kebab-case for file/folder names**: `gold-scalper-pro`
2. **Use proper case for EA name**: `Gold Scalper Pro`
3. **Always use semantic versioning**: `1.0.0`, `2.1.0`, etc.
4. **Date format**: `YYYY-MM-DD` (e.g., `2024-03-01`)
5. **Image path must start with `/`**: `/eas/image.png`

---

## 🆘 Need Help?

Check the troubleshooting section in `EA_MANAGEMENT_GUIDE.md`

