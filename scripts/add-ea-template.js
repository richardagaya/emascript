#!/usr/bin/env node

/**
 * EA Data Template Generator
 * 
 * This script helps you create a new EA entry template
 * that you can copy into src/data/eas.ts
 * 
 * Usage:
 *   node scripts/add-ea-template.js <ea-name>
 * 
 * Example:
 *   node scripts/add-ea-template.js "Gold Scalper Pro"
 */

const fs = require('fs');
const path = require('path');

// Get EA name from command line
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('\n❌ Missing EA name\n');
  console.log('Usage: node scripts/add-ea-template.js <ea-name>\n');
  console.log('Example:');
  console.log('  node scripts/add-ea-template.js "Gold Scalper Pro"\n');
  process.exit(1);
}

const eaName = args[0];

// Generate kebab-case ID for folder names
const eaId = eaName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// Generate template
const template = `  "${eaName}": {
    name: "${eaName}",
    desc: "Add description here",
    price: 199,
    category: "Trend Following",
    rating: 4.5,
    reviews: 0,
    image: "/eas/${eaId}.png",
    version: "1.0.0",
    lastUpdated: "${new Date().toISOString().split('T')[0]}",
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
      "Win Rate": "65%",
      "Profit Factor": "2.0",
      "Sharpe Ratio": "1.5",
      "Max Drawdown": "18%"
    },
    requirements: [
      "Minimum account balance: $500",
      "VPS recommended",
      "ECN broker"
    ]
  }`;

console.log('\n📋 EA Template Generated\n');
console.log('Copy this into src/data/eas.ts:\n');
console.log('─'.repeat(60));
console.log(template);
console.log('─'.repeat(60));
console.log('\n📝 Notes:\n');
console.log(`EA ID (for folders): ${eaId}`);
console.log(`Image path: /eas/${eaId}.png`);
console.log(`Firebase Storage path: eas/${eaId}/{version}/`);
console.log('\n✅ Copy the template above and paste it into src/data/eas.ts\n');

