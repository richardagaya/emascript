import AccordionFAQ from "@/components/AccordionFAQ";

export default function Home() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-16 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
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
            </div>
            <div className="mt-6 text-xs text-black/60 dark:text-white/60">
              Works with MT4/MT5.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">FAQ</h2>
        <AccordionFAQ
          items={[
            { q: "Which platforms are supported?", a: "Our bots support MT4 and MT5 with standard brokers." },
            { q: "Do I get updates?", a: "Lifetime updates included for purchased licenses." },
            { q: "Can I use on multiple accounts?", a: "Depends on license tier; see pricing above." },
          ]}
        />
      </section>
    </div>
  );
}
