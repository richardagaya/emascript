# 📝 How to Add a New EA to Your Platform

Step-by-step guide to add a new EA with custom name, image, and description.

---

## 🎯 Quick Example

Let's say you want to add an EA called **"Grid Master Pro"**

---

## Step 1: Upload the File to Firebase Storage

### File Structure:
```
Storage/
└── eas/
    └── grid-master-pro/        ← EA folder (use lowercase with hyphens)
        └── 1.0.0/              ← Version folder
            └── grid-master-pro-v1.0.0.ex4  ← Actual file
```

### Upload via Firebase Console:
1. Go to Firebase Console → Storage
2. Create folder: `eas`
3. Inside `eas`, create: `grid-master-pro`
4. Inside that, create: `1.0.0`
5. Upload your file: `grid-master-pro-v1.0.0.ex4`

---

## Step 2: Add EA to Catalog

**Edit file:** `/src/app/api/payment-webhook/route.ts`

Find the `EA_CATALOG` object and add your EA:

```typescript
const EA_CATALOG: Record<string, any> = {
  'TrendRider EA': {
    eaId: 'trendrider-ea',
    version: '2.1.0',
    thumbnail: '📈',
    description: 'Advanced trend-following strategy',
    downloadUrl: 'eas/trendrider-ea/2.1.0/trendrider-ea-v2.1.0.ex4',
  },
  
  // 👇 ADD YOUR NEW EA HERE
  'Grid Master Pro': {                    // ← Display name (shown in UI)
    eaId: 'grid-master-pro',              // ← Unique ID (for internal use)
    version: '1.0.0',                     // ← Version number
    thumbnail: '🎯',                      // ← Emoji/icon (shown in dashboard)
    description: 'Advanced grid trading with martingale',  // ← Description text
    downloadUrl: 'eas/grid-master-pro/1.0.0/grid-master-pro-v1.0.0.ex4',
    //           ↑ Must match your Storage file path exactly!
  },
};
```

---

## Step 3: Add EA to Marketplace

**Edit file:** `/src/app/marketplace/page.tsx`

Add your EA card to the marketplace:

```typescript
// Find the bots array and add:
{
  name: "Grid Master Pro",              // ← Display name
  price: "$149",                        // ← Price
  description: "Advanced grid trading with martingale strategy",
  features: [
    "Dynamic grid sizing",
    "Martingale recovery",
    "Built-in stop loss",
    "Works on all pairs"
  ],
  icon: "🎯"                            // ← Emoji icon
}
```

---

## 📋 Customization Options

### Available Emojis/Icons:
```
📈 - Trend following
⚡ - Scalping
🎯 - Grid/Martingale
📊 - Analytics
💎 - Premium
🚀 - Fast/Aggressive
🛡️ - Safe/Conservative
🎲 - Risk management
⭐ - Best seller
🔥 - Hot/Popular
```

### Description Guidelines:
- Keep it under 100 characters
- Highlight main strategy
- Mention key features
- Be honest about risk level

---

## 🎨 What Shows Where

### In Marketplace (`/marketplace`):
```
┌─────────────────────────┐
│  🎯                     │  ← icon (from marketplace array)
│  Grid Master Pro       │  ← name (from marketplace array)
│  $149                  │  ← price (from marketplace array)
│  Advanced grid trading │  ← description (from marketplace array)
│  • Dynamic grid sizing │  ← features (from marketplace array)
│  • Martingale recovery│
│  [Buy now]            │
└─────────────────────────┘
```

### In Dashboard (`/dashboard`):
```
┌─────────────────────────┐
│  🎯            Standard │  ← thumbnail & license (from EA_CATALOG)
│  Grid Master Pro       │  ← eaName (from EA_CATALOG)
│  Advanced grid trading │  ← description (from EA_CATALOG)
│  v1.0.0 • Purchased... │  ← version (from EA_CATALOG)
│  [Download] [Guide]   │
└─────────────────────────┘
```

### In Emails:
```
Subject: Your Grid Master Pro is Ready! 🎉
        ↑ eaName (from EA_CATALOG)

Body:
"Great news! Your payment has been confirmed 
and Grid Master Pro is now available..."
        ↑ eaName (from EA_CATALOG)
```

---

## 🔗 Complete Example: Adding "Breakout Hunter"

### 1. File Structure in Storage:
```
eas/breakout-hunter/1.5.0/breakout-hunter-v1.5.0.ex4
```

### 2. Add to EA_CATALOG:
```typescript
const EA_CATALOG: Record<string, any> = {
  'Breakout Hunter': {
    eaId: 'breakout-hunter',
    version: '1.5.0',
    thumbnail: '💎',
    description: 'Catches breakouts on support/resistance levels',
    downloadUrl: 'eas/breakout-hunter/1.5.0/breakout-hunter-v1.5.0.ex4',
  },
};
```

### 3. Add to Marketplace:
```typescript
const bots = [
  {
    name: "Breakout Hunter",
    price: "$99",
    description: "Catches breakouts on support/resistance levels",
    features: [
      "S/R level detection",
      "Breakout confirmation",
      "Trailing stop loss",
      "Works 24/7"
    ],
    icon: "💎"
  },
];
```

---

## ✅ Checklist for Adding New EA

- [ ] Upload file to Storage: `eas/{ea-id}/{version}/{filename}.ex4`
- [ ] Add to `EA_CATALOG` in `/src/app/api/payment-webhook/route.ts`
- [ ] Add to marketplace in `/src/app/marketplace/page.tsx`
- [ ] Choose appropriate emoji/icon
- [ ] Write clear description
- [ ] Test purchase flow
- [ ] Test download

---

## 🎯 Key Points to Remember

1. **Display Name** (e.g., "Grid Master Pro")
   - Used in marketplace
   - Used in checkout
   - Must match `EA_CATALOG` key exactly

2. **EA ID** (e.g., "grid-master-pro")
   - Used for file organization
   - Lowercase with hyphens
   - Used in Storage paths

3. **Thumbnail** 
   - Emoji only (for now)
   - Shows in dashboard
   - Choose one that represents the strategy

4. **Description**
   - Brief strategy explanation
   - Shows in dashboard
   - Keep it clear and honest

5. **File Path**
   - Must match Storage exactly
   - Case-sensitive!
   - Include version folder

---

## 🐛 Troubleshooting

### "EA not showing in dashboard"
- Check `EA_CATALOG` key matches `botName` from checkout
- Verify file uploaded to Storage
- Check console for errors

### "Download not working"
- Verify `downloadUrl` path matches Storage
- Check file actually exists
- Look for typos in filename

### "Wrong image showing"
- Update `thumbnail` in `EA_CATALOG`
- Clear browser cache
- Check emoji is displaying correctly

---

## 📱 Need Different Images?

Currently using emojis for simplicity. To use custom images:

1. Upload images to Storage: `eas-images/{ea-id}.png`
2. Update `EA_CATALOG` to use image URLs
3. Update dashboard to use `<img>` tags instead of emoji

Want me to show you how? Just ask! 🎨

---

## 🚀 Quick Reference

```typescript
// File name:        grid-master-pro-v1.0.0.ex4
// Display name:     "Grid Master Pro"
// EA ID:            grid-master-pro
// Thumbnail:        🎯
// Description:      "Advanced grid trading..."
// Storage path:     eas/grid-master-pro/1.0.0/grid-master-pro-v1.0.0.ex4
```

**The file name doesn't affect the UI - everything comes from EA_CATALOG!** ✨

