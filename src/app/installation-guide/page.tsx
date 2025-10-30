export default function InstallationGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Installation Guide</h1>
      
      <p className="text-black/70 dark:text-white/70 mb-8">
        Follow these step-by-step instructions to install and configure your Expert Advisors on MetaTrader 4 or MetaTrader 5.
      </p>

      {/* MT4 Installation */}
      <section className="mb-12">
        <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 mb-6 bg-blue-50 dark:bg-blue-900/10">
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            MetaTrader 4 (MT4)
          </h2>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Download Your EA</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Log in to your dashboard and download the Expert Advisor file (ends with .ex4 or .mq4).
                </p>
                <div className="rounded-lg bg-black/[.04] dark:bg-white/[.04] p-3 text-sm font-mono">
                  Example: TrendRider_EA.ex4
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Locate MT4 Data Folder</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Open MetaTrader 4, click <strong>File</strong> → <strong>Open Data Folder</strong>
                </p>
                <div className="rounded-lg bg-black/[.04] dark:bg-white/[.04] p-3 text-sm">
                  This will open the MQL4 directory where you need to place your EA files.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Copy EA to Experts Folder</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Navigate to: <strong>MQL4</strong> → <strong>Experts</strong>
                </p>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Copy your downloaded .ex4 or .mq4 file into this folder.
                </p>
                <div className="rounded-lg bg-black/[.04] dark:bg-white/[.04] p-3 text-sm font-mono">
                  Path: /MQL4/Experts/
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Restart MetaTrader 4</h3>
                <p className="text-black/70 dark:text-white/70">
                  Close and reopen MT4 completely for the EA to appear in your Navigator panel.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Enable Algo Trading</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Click the <strong>Algo Trading</strong> button in the toolbar (should turn green).
                </p>
                <p className="text-black/70 dark:text-white/70">
                  Go to <strong>Tools</strong> → <strong>Options</strong> → <strong>Expert Advisors</strong> tab and ensure:
                </p>
                <ul className="list-disc list-inside mt-2 text-black/70 dark:text-white/70 space-y-1">
                  <li>Allow automated trading is checked</li>
                  <li>Allow DLL imports is checked (if required by EA)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                6
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Attach EA to Chart</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  In the Navigator panel, expand <strong>Expert Advisors</strong>, find your EA, and drag it onto the chart.
                </p>
                <p className="text-black/70 dark:text-white/70">
                  A settings window will appear. Configure the parameters as recommended in the EA documentation, then click <strong>OK</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 bg-green-50 dark:bg-green-900/10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-3xl">✅</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Verify Installation</h3>
                <p className="text-black/70 dark:text-white/70">
                  You should see a smiley face emoji (😊) in the top-right corner of the chart. This means the EA is running successfully.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MT5 Installation */}
      <section className="mb-12">
        <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6 mb-6 bg-purple-50 dark:bg-purple-900/10">
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-3xl">📈</span>
            MetaTrader 5 (MT5)
          </h2>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Download Your EA</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Download the MT5 version of your Expert Advisor (ends with .ex5 or .mq5).
                </p>
                <div className="rounded-lg bg-black/[.04] dark:bg-white/[.04] p-3 text-sm font-mono">
                  Example: TrendRider_EA.ex5
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Locate MT5 Data Folder</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Open MetaTrader 5, click <strong>File</strong> → <strong>Open Data Folder</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Copy EA to Experts Folder</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Navigate to: <strong>MQL5</strong> → <strong>Experts</strong>
                </p>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Copy your .ex5 or .mq5 file into this folder.
                </p>
                <div className="rounded-lg bg-black/[.04] dark:bg-white/[.04] p-3 text-sm font-mono">
                  Path: /MQL5/Experts/
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Restart MetaTrader 5</h3>
                <p className="text-black/70 dark:text-white/70">
                  Close and reopen MT5 for the EA to become available.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Enable Algo Trading</h3>
                <p className="text-black/70 dark:text-white/70 mb-3">
                  Click <strong>Algo Trading</strong> in the toolbar (turns green when active).
                </p>
                <p className="text-black/70 dark:text-white/70">
                  Ensure automated trading is enabled in <strong>Tools</strong> → <strong>Options</strong> → <strong>Expert Advisors</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold">
                6
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Attach EA to Chart</h3>
                <p className="text-black/70 dark:text-white/70">
                  Drag your EA from the Navigator onto your desired chart, configure settings, and click <strong>OK</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips & Troubleshooting */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">💡 Tips & Best Practices</h2>
        
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <h3 className="font-semibold mb-2">Start with Demo Account</h3>
            <p className="text-black/70 dark:text-white/70">
              Always test your EA on a demo account first to understand its behavior and optimize settings before going live.
            </p>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <h3 className="font-semibold mb-2">Use Recommended Settings</h3>
            <p className="text-black/70 dark:text-white/70">
              Each EA comes with recommended parameter settings. Start with these and adjust gradually based on your risk tolerance.
            </p>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <h3 className="font-semibold mb-2">Keep Platform Running</h3>
            <p className="text-black/70 dark:text-white/70">
              Your computer and MetaTrader must remain running for the EA to execute trades. Consider using a VPS for 24/7 operation.
            </p>
          </div>

          <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
            <h3 className="font-semibold mb-2">Monitor Performance</h3>
            <p className="text-black/70 dark:text-white/70">
              Regularly check the EA's performance and adjust settings if market conditions change significantly.
            </p>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">🔧 Troubleshooting</h2>
        
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 p-6 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">EA Not Appearing in Navigator</h3>
            <ul className="list-disc list-inside text-black/70 dark:text-white/70 space-y-1">
              <li>Ensure you copied the file to the correct Experts folder</li>
              <li>Restart MetaTrader completely</li>
              <li>Check if the file extension is correct (.ex4 for MT4, .ex5 for MT5)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-red-200 dark:border-red-900/50 p-6 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">Sad Face Emoji on Chart</h3>
            <ul className="list-disc list-inside text-black/70 dark:text-white/70 space-y-1">
              <li>Check if Algo Trading button is enabled (green)</li>
              <li>Verify automated trading is allowed in Options → Expert Advisors</li>
              <li>Ensure your account allows Expert Advisors (some brokers restrict them)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-red-200 dark:border-red-900/50 p-6 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">EA Not Trading</h3>
            <ul className="list-disc list-inside text-black/70 dark:text-white/70 space-y-1">
              <li>Check EA parameters are configured correctly</li>
              <li>Verify you have sufficient margin in your account</li>
              <li>Ensure market is open for the currency pair</li>
              <li>Check the Experts tab in Terminal for error messages</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="mt-12 rounded-xl border border-black/[.08] dark:border-white/[.145] p-8 bg-black/[.02] dark:bg-white/[.02] text-center">
        <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
        <p className="text-black/70 dark:text-white/70 mb-6">
          Our support team is ready to assist you with installation and configuration.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/support"
            className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 py-3 font-medium hover:opacity-90"
          >
            Contact Support
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.145] px-6 py-3 font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            Back to Dashboard
          </a>
        </div>
      </section>
    </div>
  );
}

