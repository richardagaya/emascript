import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-24 grid gap-8 sm:gap-12 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
              Automated EA Trading Bots
            </h1>
            <p className="mt-4 text-base sm:text-lg text-black/70 dark:text-white/70 max-w-prose">
              Deploy proven Expert Advisors for Forex. Backtested strategies, risk
              controls, and easy onboarding. Start automating your trading today.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <a
                href="#pricing"
                className="rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 text-center"
              >
                View pricing
              </a>
              <a
                href="#products"
                className="rounded-full border border-black/[.08] dark:border-white/[.145] px-5 py-3 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] text-center"
              >
                Explore bots
              </a>
            </div>
            <div className="mt-6 text-xs text-black/60 dark:text-white/60">
              Works with MT4/MT5. No subscription lock-in.
            </div>
          </div>
          <div className="relative aspect-video w-full rounded-xl border border-black/[.08] dark:border-white/[.145] bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.05),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_60%)] flex items-center justify-center">
            <div className="text-center">
              <Image src="/next.svg" alt="Placeholder" width={120} height={26} className="mx-auto opacity-60 dark:invert" />
              <p className="mt-3 text-sm text-black/60 dark:text-white/60">Strategy equity curve preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Popular EAs</h2>
        <div className="mt-8 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "TrendRider EA", desc: "Follows medium-term trends with ATR risk.", price: 199 },
            { name: "ScalpSwift EA", desc: "High-frequency scalper with spread filter.", price: 149 },
            { name: "MeanRevert Pro", desc: "Reversion strategy with dynamic grids.", price: 179 },
          ].map((p) => (
            <div key={p.name} className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5">
              <div className="h-36 rounded-lg bg-black/[.04] dark:bg-white/[.06] flex items-center justify-center text-sm text-black/60 dark:text-white/60">
                Preview image
              </div>
              <h3 className="mt-4 font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">{p.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-medium">${p.price}</span>
                <a
                  href="#buy"
                  className="rounded-full bg-foreground text-background px-4 py-2 text-xs font-medium hover:opacity-90"
                >
                  Buy now
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Simple pricing</h2>
        <div className="mt-8 grid gap-5 sm:gap-6 sm:grid-cols-3">
          {[
            {
              tier: "Starter",
              price: 99,
              features: ["1 EA license", "Email support", "Setup guide"],
            },
            {
              tier: "Pro",
              price: 199,
              features: ["3 EA licenses", "Priority support", "Optimization tips"],
            },
            {
              tier: "Ultimate",
              price: 299,
              features: ["Unlimited licenses", "1:1 onboarding", "Lifetime updates"],
            },
          ].map((plan) => (
            <div key={plan.tier} className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 flex flex-col">
              <h3 className="font-semibold">{plan.tier}</h3>
              <div className="mt-2 text-3xl font-semibold">${plan.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#buy"
                className="mt-6 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 text-center"
              >
                Choose {plan.tier}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            {
              q: "Which platforms are supported?",
              a: "Our bots support MT4 and MT5 with standard brokers.",
            },
            {
              q: "Is there a refund policy?",
              a: "Yes, 14-day refund if not satisfied. Terms apply.",
            },
            {
              q: "Do I get updates?",
              a: "Lifetime updates included for purchased licenses.",
            },
            {
              q: "Can I use on multiple accounts?",
              a: "Depends on license tier; see pricing above.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5">
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
