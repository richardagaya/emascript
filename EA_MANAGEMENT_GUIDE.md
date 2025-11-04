# EA Management Guide

Complete guide for uploading EAs, images, and updating EA details in the marketplace.

---

## 📋 Table of Contents

1. [Upload EA File to Firebase Storage](#1-upload-ea-file-to-firebase-storage)
2. [Upload EA Image](#2-upload-ea-image)
3. [Update EA Data in Code](#3-update-ea-data-in-code)
4. [Quick Reference](#quick-reference)

---

## 1. Upload EA File to Firebase Storage

EA files (.ex4 or .ex5) are stored in Firebase Storage for secure delivery to customers.

### Step-by-Step:

#### Option A: Using Firebase Console (Web UI)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "Get Started" if this is your first time

3. **Create Folder Structure**
   - Create folder: `eas/`
   - Inside `eas/`, create folder: `{ea-name}/` (e.g., `trendrider-ea/`)
   - Inside `{ea-name}/`, create folder: `{version}/` (e.g., `2.1.0/`)

4. **Upload EA File**
   - Navigate to: `eas/{ea-name}/{version}/`
   - Click "Upload file"
   - Select your `.ex4` or `.ex5` file
   - Rename file to: `{ea-name}-v{version}.ex4` (e.g., `trendrider-ea-v2.1.0.ex4`)

**Example Structure:**
```
eas/
  └── trendrider-ea/
      └── 2.1.0/
          └── trendrider-ea-v2.1.0.ex4
```

#### Option B: Using Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Upload EA file
firebase storage:upload ./path/to/your-ea.ex4 \
  eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4
```

#### Option C: Using the Upload Script (Recommended)

We'll create a script for this - see below.

---

## 2. Upload EA Image

EA images are stored in the `public/` folder for fast loading.

### Step-by-Step:

1. **Prepare Your Image**
   - Format: PNG, JPG, or SVG (recommended: PNG or SVG)
   - Size: 400x400px or larger (will be resized automatically)
   - Name: Use kebab-case (e.g., `trendrider-ea.png`)

2. **Place Image in Public Folder**
   - Copy your image to: `public/eas/trendrider-ea.png`
   - Recommended structure:
     ```
     public/
       └── eas/
           ├── trendrider-ea.png
           ├── scalpswift-ea.png
           └── ...
     ```

3. **Update Image Path in Code**
   - Open `src/data/eas.ts`
   - Find your EA entry
   - Update the `image` field:
     ```typescript
     image: "/eas/trendrider-ea.png"
     ```

---

## 3. Update EA Data in Code

All EA information is stored in `src/data/eas.ts`.

### Step-by-Step:

1. **Open the Data File**
   ```bash
   # File location
   src/data/eas.ts
   ```

2. **Find Your EA Entry**
   - Search for the EA name in the `EA_DATA` object
   - Or add a new entry if it's a new EA

3. **Update EA Information**

   **Example: Adding a New EA**
   ```typescript
   export const EA_DATA: Record<string, EA> = {
     // ... existing EAs ...
     
     "Your New EA Name": {
       name: "Your New EA Name",
       desc: "Description of your EA",
       price: 199,
       category: "Trend Following",
       rating: 4.8,
       reviews: 0,  // Start with 0, will update as reviews come in
       image: "/eas/your-new-ea.png",
       version: "1.0.0",
       lastUpdated: "2024-03-01",  // Use format: YYYY-MM-DD
       features: [
         "Feature 1",
         "Feature 2",
         "Feature 3"
       ],
       specifications: {
         "Platform": "MT4 / MT5",
         "Timeframe": "M15, M30, H1",
         "Pairs": "Major pairs",
         "Risk Level": "Medium",
         "Recommended Balance": "$500+",
         "Max Drawdown": "15-20%"
       },
       backtest: {
         "Period": "2020-2024",
         "Win Rate": "68%",
         "Profit Factor": "2.3",
         "Sharpe Ratio": "1.8",
         "Max Drawdown": "18.5%"
       },
       requirements: [
         "Minimum account balance: $500",
         "VPS recommended",
         "ECN broker"
       ]
     }
   };
   ```

   **Example: Updating Existing EA**
   ```typescript
   "TrendRider EA": {
     name: "TrendRider EA",
     desc: "Updated description here",
     price: 249,  // Updated price
     // ... other fields ...
     version: "2.2.0",  // New version
     lastUpdated: "2024-03-01",  // Update date
     image: "/eas/trendrider-ea.png",  // Updated image path
   }
   ```

4. **Save and Test**
   - Save the file
   - The changes will appear automatically in:
     - Marketplace page: `/marketplace`
     - EA details page: `/marketplace/{ea-name}`

---

## Quick Reference

### File Locations

| Item | Location |
|------|----------|
| EA Data | `src/data/eas.ts` |
| EA Images | `public/eas/` |
| EA Files | Firebase Storage: `eas/{ea-name}/{version}/` |

### EA Data Fields

| Field | Type | Example |
|-------|------|---------|
| `name` | string | `"TrendRider EA"` |
| `desc` | string | `"Description here"` |
| `price` | number | `199` |
| `category` | string | `"Trend Following"` |
| `rating` | number | `4.8` |
| `reviews` | number | `127` |
| `image` | string | `"/eas/trendrider-ea.png"` |
| `version` | string | `"2.1.0"` |
| `lastUpdated` | string | `"2024-03-01"` |
| `features` | string[] | `["Feature 1", "Feature 2"]` |
| `specifications` | object | See structure above |
| `backtest` | object | See structure above |
| `requirements` | string[] | `["Requirement 1"]` |

### Firebase Storage Path Format

```
eas/{ea-name}/{version}/{ea-name}-v{version}.ex4
```

Example:
```
eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4
```

### Image Path Format

```
/eas/{ea-name}.png
```

Example:
```
/eas/trendrider-ea.png
```

---

## 🔄 Complete Workflow Example

### Adding a New EA: "Gold Scalper Pro"

1. **Upload EA File**
   - Firebase Console → Storage
   - Create: `eas/gold-scalper-pro/1.0.0/`
   - Upload: `gold-scalper-pro-v1.0.0.ex4`

2. **Upload Image**
   - Save image as: `public/eas/gold-scalper-pro.png`
   - Image path will be: `/eas/gold-scalper-pro.png`

3. **Add to Data File**
   - Open: `src/data/eas.ts`
   - Add entry with all details
   - Set `image: "/eas/gold-scalper-pro.png"`

4. **Verify**
   - Visit: `http://localhost:3000/marketplace`
   - Click on your EA to see details page

---

## 📝 Notes

- **EA Names**: Must match exactly between:
  - Firebase Storage folder name
  - EA data `name` field
  - URL parameter (will be URL-encoded automatically)

- **Version Updates**: When updating an EA version:
  1. Upload new file to: `eas/{ea-name}/{new-version}/`
  2. Update `version` in `eas.ts`
  3. Update `lastUpdated` date

- **Image Best Practices**:
  - Use PNG for complex images
  - Use SVG for simple logos/icons
  - Keep file size under 200KB for fast loading
  - Recommended dimensions: 400x400px or larger

---

## 🆘 Troubleshooting

**EA not showing in marketplace?**
- Check that the EA name in `eas.ts` matches exactly
- Verify the file is saved correctly

**Image not loading?**
- Check that image path starts with `/` (e.g., `/eas/image.png`)
- Verify image exists in `public/eas/` folder
- Check browser console for 404 errors

**EA file not downloading?**
- Verify Firebase Storage path matches: `eas/{ea-name}/{version}/`
- Check file name matches: `{ea-name}-v{version}.ex4`
- Ensure user has purchased the EA (check Firestore)

---

## Next Steps

After setting up your EAs, you may want to:
- Create an admin panel for easier management
- Set up automated version updates
- Add image upload functionality
- Integrate with a database for dynamic EA management

