# EA Upload & Management Flow

## 📊 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    START: Adding New EA                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Prepare EA File                                     │
│  • Ensure .ex4 or .ex5 file is ready                         │
│  • Choose version number (e.g., 1.0.0)                       │
│  • Prepare EA name (e.g., "Gold Scalper Pro")                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Upload EA File to Firebase Storage                 │
│                                                              │
│  Option A: Firebase Console (Web UI)                        │
│  • Go to: https://console.firebase.google.com/               │
│  • Navigate: Storage → Create folder: eas/                  │
│  • Create: eas/{ea-name}/{version}/                         │
│  • Upload: {ea-name}-v{version}.ex4                         │
│                                                              │
│  Option B: Firebase CLI                                     │
│  $ firebase storage:upload ./file.ex4 \                     │
│      eas/{ea-name}/{version}/{ea-name}-v{version}.ex4       │
│                                                              │
│  Option C: Upload Script                                    │
│  $ node scripts/upload-ea.js {ea-name} {version} ./file.ex4 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Prepare EA Image                                   │
│  • Create or prepare image (PNG/SVG recommended)            │
│  • Recommended size: 400x400px or larger                    │
│  • Name: {ea-name}.png (e.g., gold-scalper-pro.png)         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Upload EA Image                                    │
│  • Copy image to: public/eas/{ea-name}.png                  │
│  • Example: public/eas/gold-scalper-pro.png                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Generate EA Data Template                          │
│                                                              │
│  Option A: Use Script                                       │
│  $ node scripts/add-ea-template.js "Gold Scalper Pro"      │
│                                                              │
│  Option B: Manual Entry                                     │
│  • Open: src/data/eas.ts                                    │
│  • Copy template from EA_MANAGEMENT_GUIDE.md                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Update EA Data File                                │
│                                                              │
│  • Open: src/data/eas.ts                                    │
│  • Add new entry or update existing entry                    │
│  • Set image path: "/eas/{ea-name}.png"                     │
│  • Set version: "{version}"                                 │
│  • Set lastUpdated: "{YYYY-MM-DD}"                         │
│  • Fill in all details (price, features, etc.)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Verify                                             │
│  • Visit: http://localhost:3000/marketplace                  │
│  • Check EA appears in listing                               │
│  • Click EA to view details page                             │
│  • Verify image displays correctly                           │
│  • Test purchase flow (if applicable)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ✅ DONE!                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Updating Existing EA

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Update EA File (if new version)                   │
│  • Upload new .ex4/.ex5 to Firebase Storage                  │
│  • Path: eas/{ea-name}/{new-version}/                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Update Image (if needed)                           │
│  • Replace image in: public/eas/{ea-name}.png              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Update EA Data                                     │
│  • Open: src/data/eas.ts                                    │
│  • Find EA entry                                            │
│  • Update version, lastUpdated, price, etc.                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Quick Commands Reference

### Upload EA File
```bash
# Using Firebase CLI
firebase storage:upload ./gold-scalper-pro.ex4 \
  eas/gold-scalper-pro/1.0.0/gold-scalper-pro-v1.0.0.ex4

# Using script
node scripts/upload-ea.js gold-scalper-pro 1.0.0 ./gold-scalper-pro.ex4
```

### Generate EA Template
```bash
node scripts/add-ea-template.js "Gold Scalper Pro"
```

### Update EA Data
```bash
# Edit this file
src/data/eas.ts
```

---

## 🎯 Example: Adding "Gold Scalper Pro"

### 1. Upload EA File
```bash
# Firebase Console OR
firebase storage:upload ./gold-scalper-pro.ex4 \
  eas/gold-scalper-pro/1.0.0/gold-scalper-pro-v1.0.0.ex4
```

### 2. Upload Image
```bash
# Copy image to public folder
cp ./gold-scalper-pro.png public/eas/gold-scalper-pro.png
```

### 3. Generate Template
```bash
node scripts/add-ea-template.js "Gold Scalper Pro"
```

### 4. Update Data File
```typescript
// In src/data/eas.ts
"Gold Scalper Pro": {
  name: "Gold Scalper Pro",
  desc: "Advanced gold scalping EA with ICT strategies",
  price: 299,
  category: "Scalping",
  rating: 4.9,
  reviews: 0,
  image: "/eas/gold-scalper-pro.png",  // ← Image path
  version: "1.0.0",                    // ← Version
  lastUpdated: "2024-03-01",          // ← Date
  // ... rest of details
}
```

### 5. Verify
- Visit: `http://localhost:3000/marketplace`
- Find "Gold Scalper Pro" in the list
- Click to see details page

---

## 🔍 File Structure Reference

```
project/
├── public/
│   └── eas/                          ← EA images here
│       ├── gold-scalper-pro.png
│       ├── trendrider-ea.png
│       └── ...
├── src/
│   └── data/
│       └── eas.ts                    ← EA data here
└── scripts/
    ├── upload-ea.js                  ← Upload helper
    └── add-ea-template.js            ← Template generator

Firebase Storage:
└── eas/                              ← EA files here
    ├── gold-scalper-pro/
    │   └── 1.0.0/
    │       └── gold-scalper-pro-v1.0.0.ex4
    └── ...
```

---

## ⚠️ Important Notes

1. **EA Names Must Match**
   - Data file: `"Gold Scalper Pro"`
   - Image path: `/eas/gold-scalper-pro.png`
   - Firebase folder: `eas/gold-scalper-pro/`
   - URL: `/marketplace/Gold%20Scalper%20Pro`

2. **Version Format**
   - Use semantic versioning: `X.Y.Z`
   - Example: `1.0.0`, `2.1.0`, `3.0.5`

3. **Date Format**
   - Use: `YYYY-MM-DD`
   - Example: `2024-03-01`

4. **Image Paths**
   - Always start with `/`
   - Example: `/eas/gold-scalper-pro.png`
   - Not: `eas/gold-scalper-pro.png`

---

## 🆘 Troubleshooting

**EA not showing?**
- Check EA name matches exactly in `eas.ts`
- Verify file is saved correctly
- Clear browser cache

**Image not loading?**
- Check path starts with `/`
- Verify image exists in `public/eas/`
- Check file name matches (case-sensitive)

**File not uploading?**
- Verify Firebase login: `firebase login`
- Check Firebase project is selected
- Verify storage rules allow uploads

