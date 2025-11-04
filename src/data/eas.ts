
export interface EA {
  name: string;
  desc: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  version: string;
  lastUpdated: string;
  features: string[];
  specifications: {
    Platform: string;
    Timeframe: string;
    Pairs: string;
    "Risk Level": string;
    "Recommended Balance": string;
    "Max Drawdown": string;
  };
  backtest: {
    Period: string;
    "Win Rate": string;
    "Profit Factor": string;
    "Sharpe Ratio": string;
    "Max Drawdown": string;
  };
  requirements: string[];
}

export const EA_DATA: Record<string, EA> = {
  "TrendRider EA": {
    name: "TrendRider EA",
    desc: "Follows medium-term trends with ATR-based risk management. Perfect for trending markets.",
    price: 199,
    category: "Trend Following",
    rating: 4.8,
    reviews: 127,
    image: "/next.svg",
    version: "2.1.0",
    lastUpdated: "2024-01-15",
    features: [
      "ATR-based dynamic stop loss",
      "Trend confirmation with multiple indicators",
      "Automated position sizing",
      "Risk management per trade",
      "Multi-timeframe analysis",
      "Email notifications"
    ],
    specifications: {
      "Platform": "MT4 / MT5",
      "Timeframe": "M15, M30, H1",
      "Pairs": "Major pairs (EUR/USD, GBP/USD, USD/JPY)",
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
      "VPS recommended for 24/7 operation",
      "Low spread broker (ECN preferred)",
      "MT4/MT5 platform"
    ]
  },
  "ScalpSwift EA": {
    name: "ScalpSwift EA",
    desc: "High-frequency scalper with advanced spread filtering. Designed for volatile market conditions.",
    price: 149,
    category: "Scalping",
    rating: 4.6,
    reviews: 89,
    image: "/next.svg",
    version: "1.8.5",
    lastUpdated: "2024-02-01",
    features: [
      "Ultra-fast execution",
      "Spread filtering system",
      "Volatility-based entries",
      "Quick profit targets",
      "Time-based trading filters",
      "Low latency optimization"
    ],
    specifications: {
      "Platform": "MT4 / MT5",
      "Timeframe": "M1, M5",
      "Pairs": "Major pairs with low spreads",
      "Risk Level": "High",
      "Recommended Balance": "$1000+",
      "Max Drawdown": "10-15%"
    },
    backtest: {
      "Period": "2021-2024",
      "Win Rate": "72%",
      "Profit Factor": "1.9",
      "Sharpe Ratio": "2.1",
      "Max Drawdown": "12.3%"
    },
    requirements: [
      "Minimum account balance: $1000",
      "VPS required for optimal performance",
      "ECN broker with low spreads (< 2 pips)",
      "Low latency connection"
    ]
  },
  "MeanRevert Pro": {
    name: "MeanRevert Pro",
    desc: "Mean reversion strategy with dynamic grid management. Ideal for ranging markets.",
    price: 179,
    category: "Mean Reversion",
    rating: 4.7,
    reviews: 156,
    image: "/next.svg",
    version: "3.0.2",
    lastUpdated: "2024-01-20",
    features: [
      "Dynamic grid management",
      "Mean reversion detection",
      "Support/Resistance levels",
      "Adaptive lot sizing",
      "Range-bound market optimization",
      "Risk protection mechanisms"
    ],
    specifications: {
      "Platform": "MT4 / MT5",
      "Timeframe": "H1, H4, D1",
      "Pairs": "All major and minor pairs",
      "Risk Level": "Medium-High",
      "Recommended Balance": "$2000+",
      "Max Drawdown": "20-25%"
    },
    backtest: {
      "Period": "2019-2024",
      "Win Rate": "65%",
      "Profit Factor": "2.1",
      "Sharpe Ratio": "1.5",
      "Max Drawdown": "22.1%"
    },
    requirements: [
      "Minimum account balance: $2000",
      "VPS recommended",
      "Standard broker account",
      "Sufficient margin for grid positions"
    ]
  },
  "Breakout Master": {
    name: "Breakout Master",
    desc: "Catches breakouts with momentum confirmation. Includes false breakout protection.",
    price: 229,
    category: "Breakout",
    rating: 4.9,
    reviews: 203,
    image: "/next.svg",
    version: "2.5.0",
    lastUpdated: "2024-02-10",
    features: [
      "Breakout detection algorithm",
      "Momentum confirmation",
      "False breakout protection",
      "Volume analysis",
      "Multiple timeframe confirmation",
      "Adaptive entry timing"
    ],
    specifications: {
      "Platform": "MT4 / MT5",
      "Timeframe": "M15, M30, H1, H4",
      "Pairs": "Major pairs",
      "Risk Level": "Medium",
      "Recommended Balance": "$1000+",
      "Max Drawdown": "18%"
    },
    backtest: {
      "Period": "2020-2024",
      "Win Rate": "70%",
      "Profit Factor": "2.5",
      "Sharpe Ratio": "2.0",
      "Max Drawdown": "17.2%"
    },
    requirements: [
      "Minimum account balance: $1000",
      "VPS recommended",
      "Broker with good execution",
      "Access to volume data"
    ]
  },
  "Grid Trader Pro": {
    name: "Grid Trader Pro",
    desc: "Advanced grid trading with adaptive lot sizing. Built for stable market conditions.",
    price: 189,
    category: "Grid Trading",
    rating: 4.5,
    reviews: 94,
    image: "/next.svg",
    version: "1.9.3",
    lastUpdated: "2024-01-25",
    features: [
      "Adaptive grid spacing",
      "Dynamic lot sizing",
      "Martingale protection",
      "Equity-based risk management",
      "Multi-currency support",
      "Grid optimization tools"
    ],
    specifications: {
      "Platform": "MT4 / MT5",
      "Timeframe": "M5, M15, M30",
      "Pairs": "Major pairs",
      "Risk Level": "High",
      "Recommended Balance": "$3000+",
      "Max Drawdown": "25-30%"
    },
    backtest: {
      "Period": "2021-2024",
      "Win Rate": "58%",
      "Profit Factor": "1.8",
      "Sharpe Ratio": "1.2",
      "Max Drawdown": "27.5%"
    },
    requirements: [
      "Minimum account balance: $3000",
      "VPS required",
      "ECN broker account",
      "High margin requirements"
    ]
  },
 
  "Akavanta": {
    name: "Akavanta",
    desc: "Advanced automated trading bot with sophisticated risk management and market analysis.",
    price: 199,
    category: "Trend Following",
    rating: 4.5,
    reviews: 0,
    image: "/akavanta.png",
    version: "1.0.0",
    lastUpdated: "2024-12-19",
    features: [
      "Advanced risk management",
      "Multi-timeframe analysis",
      "Automated position sizing",
      "Market trend detection",
      "Stop loss and take profit automation",
      "Real-time monitoring"
    ],
    specifications: {
      "Platform": "MT4 / MT5",
      "Timeframe": "M15, M30, H1",
      "Pairs": "Major pairs (EUR/USD, GBP/USD, USD/JPY)",
      "Risk Level": "Medium",
      "Recommended Balance": "$500+",
      "Max Drawdown": "15-20%"
    },
    backtest: {
      "Period": "2024",
      "Win Rate": "65%",
      "Profit Factor": "2.0",
      "Sharpe Ratio": "1.5",
      "Max Drawdown": "18%"
    },
    requirements: [
      "Minimum account balance: $500",
      "VPS recommended for 24/7 operation",
      "Low spread broker (ECN preferred)",
      "MT4/MT5 platform"
    ]
  }
};

/**
 * Get all EAs for marketplace listing (with basic info only)
 */
export function getAllEAs() {
  return Object.values(EA_DATA).map(ea => ({
    name: ea.name,
    desc: ea.desc,
    price: ea.price,
    category: ea.category,
    rating: ea.rating,
    reviews: ea.reviews,
    image: ea.image
  }));
}

/**
 * Get EA details by name
 */
export function getEAByName(name: string): EA | undefined {
  return EA_DATA[name];
}

/**
 * Get all EA names
 */
export function getAllEANames(): string[] {
  return Object.keys(EA_DATA);
}

