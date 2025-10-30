import AccordionFAQ from "@/components/AccordionFAQ";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Support</h1>
      
      <div className="grid gap-8 lg:grid-cols-2 mb-12">
        <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <div className="space-y-3 text-black/70 dark:text-white/70">
            <p><strong>Email:</strong> support@akavanta.com</p>
            <p><strong>Response Time:</strong> Immediately</p>
            <p><strong>Business Hours:</strong> Monday - Friday, 7 AM - 5 PM</p>
          </div>
        </div>

        <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Help</h2>
          <div className="space-y-3 text-black/70 dark:text-white/70">
            <p><strong>Installation:</strong> Step-by-step setup guides</p>
            <p><strong>Configuration:</strong> Optimal settings for each EA</p>
            <p><strong>Troubleshooting:</strong> Common issues and solutions</p>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <AccordionFAQ
          items={[
            { q: "How do I install an EA?", a: "Download from your dashboard, copy to MT4/MT5 Experts, restart, and attach to chart." },
            { q: "What brokers are supported?", a: "Most standard MT4/MT5 brokers. Prefer low spreads and reliable execution." },
            { q: "Can I use EAs on multiple accounts?", a: "Starter: 1 account, Pro: 3 accounts, Ultimate: unlimited." },
            { q: "Do you provide updates?", a: "Yes, lifetime updates are included for purchases." },
            { q: "Recommended account size?", a: "Depends on risk. Generally $1,000+ conservative, $5,000+ aggressive." },
          ]}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Getting Started</h2>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="text-2xl font-bold text-foreground mb-2">1</div>
            <h3 className="font-semibold mb-2">Choose Your EA</h3>
            <p className="text-sm text-black/70 dark:text-white/70">
              Browse our marketplace and select an EA that matches your trading style and risk tolerance.
            </p>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="text-2xl font-bold text-foreground mb-2">2</div>
            <h3 className="font-semibold mb-2">Download & Install</h3>
            <p className="text-sm text-black/70 dark:text-white/70">
              Download the EA file and follow our step-by-step installation guide for MT4/MT5.
            </p>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="text-2xl font-bold text-foreground mb-2">3</div>
            <h3 className="font-semibold mb-2">Configure & Trade</h3>
            <p className="text-sm text-black/70 dark:text-white/70">
              Set up the recommended parameters and start automated trading with proper risk management.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 bg-black/[.02] dark:bg-white/[.02]">
        <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
        <p className="text-black/70 dark:text-white/70 mb-4">
          Can't find what you're looking for? Our support team is here to help you succeed with your trading automation.
        </p>
        <a 
          href="mailto:support@akavanta.com"
          className="inline-flex items-center rounded-full bg-foreground text-background px-6 py-3 font-medium hover:opacity-90"
        >
          Contact Support
        </a>
      </section>
    </div>
  );
}
