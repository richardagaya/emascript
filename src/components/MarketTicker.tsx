"use client";

import { useEffect, useRef, useState } from "react";

type Ticker = {
  symbol: string;
  price: number | null;
  change24hPct: number | null;
};

const symbols = [
  { stream: "btcusdt@miniTicker", label: "BTC/USDT" },
  { stream: "ethusdt@miniTicker", label: "ETH/USDT" },
];

export default function MarketTicker() {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({
    BTCUSDT: { symbol: "BTC/USDT", price: null, change24hPct: null },
    ETHUSDT: { symbol: "ETH/USDT", price: null, change24hPct: null },
  });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const streams = symbols.map((s) => s.stream).join("/");
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const p = data?.data; // miniTicker payload
        if (!p?.s) return;
        // p.s = symbol like BTCUSDT, p.c = last price, p.P = 24h change percent
        setTickers((prev) => {
          const next = { ...prev };
          const key = p.s as keyof typeof prev;
          const current = next[key] ?? { symbol: p.s, price: null, change24hPct: null };
          next[key] = {
            symbol: current.symbol,
            price: Number(p.c),
            change24hPct: Number(p.P),
          };
          return next;
        });
      } catch {}
    };

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) return;
      try { ws.send("ping"); } catch {}
    }, 30000);

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };

    return () => {
      clearInterval(heartbeat);
      try { ws.close(); } catch {}
    };
  }, []);

  function Pill({ label, price, change }: { label: string; price: number | null; change: number | null }) {
    const isUp = (change ?? 0) >= 0;
    const changeStr = change === null ? "--" : `${change.toFixed(2)}%`;
    const priceStr = price === null ? "--" : Number(price).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return (
      <div className="flex items-center gap-2 rounded-full border border-black/[.08] dark:border-white/[.145] px-3 py-1 text-xs">
        <span className="font-medium">{label}</span>
        <span className="opacity-80">${priceStr}</span>
        <span className={isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{changeStr}</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        <Pill label="BTC/USDT" price={tickers.BTCUSDT.price} change={tickers.BTCUSDT.change24hPct} />
        <Pill label="ETH/USDT" price={tickers.ETHUSDT.price} change={tickers.ETHUSDT.change24hPct} />
      </div>
    </div>
  );
}


