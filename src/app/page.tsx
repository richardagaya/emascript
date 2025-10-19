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
                href="/marketplace"
                className="rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 text-center"
              >
                View marketplace
              </a>
              <a
                href="/marketplace"
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

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">What Our Users Say</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Sarah Chen",
              role: "Forex Trader",
              content: "The TrendRider EA has been a game-changer for my trading. Consistent profits with minimal drawdown.",
              rating: 5
            },
            {
              name: "Michael Rodriguez",
              role: "Day Trader",
              content: "ScalpSwift EA works perfectly during volatile sessions. The spread filter is incredibly effective.",
              rating: 5
            },
            {
              name: "David Kim",
              role: "Swing Trader",
              content: "MeanRevert Pro caught some amazing reversals. The dynamic grid management is brilliant.",
              rating: 5
            }
          ].map((testimonial) => (
            <div key={testimonial.name} className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-4">"{testimonial.content}"</p>
              <div>
                <div className="font-medium text-sm">{testimonial.name}</div>
                <div className="text-xs text-black/60 dark:text-white/60">{testimonial.role}</div>
              </div>
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
