import AccordionFAQ from "@/components/AccordionFAQ";
import Link from "next/link";

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
              <Link
                href="/marketplace"
                className="rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 text-center"
              >
                View marketplace
              </Link>
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
            {
              q: "Can I run the EA on my phone?",
              a: "You can monitor trades with the MT5 mobile app, but the EA must run on a desktop or VPS for 24/7 automation.",
            },
            {
              q: "Do you offer refunds?",
              a: "No refunds after activation, but support will help resolve installation or activation issues.",
            },
            {
              q: "Is the EA guaranteed to make profits?",
              a: "No EA can guarantee profits—forex trading carries risk, so always trade responsibly.",
            },
          ]}
        />
      </section>
    </div>
  );
}
