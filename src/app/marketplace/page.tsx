
import Image from "next/image";

export default function Marketplace() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
              EA Trading Bot Marketplace
            </h1>
            <p className="mt-4 text-base sm:text-lg text-black/70 dark:text-white/70 max-w-2xl mx-auto">
              Discover and purchase proven Expert Advisors for automated Forex trading. 
              Each bot comes with detailed backtests, risk controls, and setup guides.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Available Bots</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              All
            </button>
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              Trending
            </button>
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              Scalping
            </button>
            <button className="px-3 py-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
              Swing
            </button>
          </div>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { 
              name: "TrendRider EA", 
              desc: "Follows medium-term trends with ATR-based risk management. Perfect for trending markets.", 
              price: 199,
              category: "Trend Following",
              rating: 4.8,
              reviews: 127,
              image: "/next.svg"
            },
            { 
              name: "ScalpSwift EA", 
              desc: "High-frequency scalper with advanced spread filtering. Designed for volatile market conditions.", 
              price: 149,
              category: "Scalping",
              rating: 4.6,
              reviews: 89,
              image: "/next.svg"
            },
            { 
              name: "MeanRevert Pro", 
              desc: "Mean reversion strategy with dynamic grid management. Ideal for ranging markets.", 
              price: 179,
              category: "Mean Reversion",
              rating: 4.7,
              reviews: 156,
              image: "/next.svg"
            },
            { 
              name: "Breakout Master", 
              desc: "Catches breakouts with momentum confirmation. Includes false breakout protection.", 
              price: 229,
              category: "Breakout",
              rating: 4.9,
              reviews: 203,
              image: "/next.svg"
            },
            { 
              name: "Grid Trader Pro", 
              desc: "Advanced grid trading with adaptive lot sizing. Built for stable market conditions.", 
              price: 189,
              category: "Grid Trading",
              rating: 4.5,
              reviews: 94,
              image: "/next.svg"
            },
            { 
              name: "News Hunter EA", 
              desc: "Trades around high-impact news events with volatility filters and risk controls.", 
              price: 259,
              category: "News Trading",
              rating: 4.8,
              reviews: 167,
              image: "/next.svg"
            },
          ].map((bot) => (
            <div key={bot.name} className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 hover:shadow-lg transition-shadow">
              <div className="h-48 rounded-lg bg-black/[.04] dark:bg-white/[.06] flex items-center justify-center mb-4">
                <div className="text-center">
                  <Image src={bot.image} alt={bot.name} width={80} height={80} className="mx-auto opacity-60 dark:invert" />
                  <p className="mt-2 text-xs text-black/60 dark:text-white/60">Strategy Preview</p>
                </div>
              </div>
              
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{bot.name}</h3>
                <span className="px-2 py-1 text-xs bg-black/[.08] dark:bg-white/[.12] rounded-full">
                  {bot.category}
                </span>
              </div>
              
              <p className="text-sm text-black/70 dark:text-white/70 mb-4 line-clamp-2">
                {bot.desc}
              </p>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(bot.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-black/60 dark:text-white/60">
                  {bot.rating} ({bot.reviews} reviews)
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">${bot.price}</div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm border border-black/[.08] dark:border-white/[.145] rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.06]">
                    Preview
                  </button>
                  <button className="px-4 py-2 text-sm bg-foreground text-background rounded-full hover:opacity-90">
                    Buy now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">Choose Your Plan</h2>
        <div className="mt-8 grid gap-5 sm:gap-6 sm:grid-cols-3">
          {[
            {
              tier: "Starter",
              price: 99,
              features: ["1 EA license", "Email support", "Setup guide", "Basic documentation"],
            },
            {
              tier: "Pro",
              price: 199,
              features: ["3 EA licenses", "Priority support", "Optimization tips", "Advanced settings"],
            },
            {
              tier: "Ultimate",
              price: 299,
              features: ["Unlimited licenses", "1:1 onboarding", "Lifetime updates", "Custom strategies"],
            },
          ].map((plan) => (
            <div key={plan.tier} className={`rounded-xl border p-6 flex flex-col ${plan.tier === 'Pro' ? 'border-foreground ring-1 ring-foreground/20' : 'border-black/[.08] dark:border-white/[.145]'}`}>
              {plan.tier === 'Pro' && (
                <div className="text-xs font-medium text-foreground mb-2">Most Popular</div>
              )}
              <h3 className="font-semibold text-lg">{plan.tier}</h3>
              <div className="mt-2 text-3xl font-semibold">${plan.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-6 rounded-full px-5 py-3 text-sm font-medium text-center ${
                plan.tier === 'Pro' 
                  ? 'bg-foreground text-background hover:opacity-90' 
                  : 'border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06]'
              }`}>
                Choose {plan.tier}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
