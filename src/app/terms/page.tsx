export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-sm text-black/70 dark:text-white/70 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            By accessing and using Akavanta ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Use License</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            Permission is granted to temporarily download one copy of the Expert Advisors (EAs) per license purchased for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-black/70 dark:text-white/70 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Disclaimer</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            The materials on Akavanta are provided on an 'as is' basis. Akavanta makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Limitations</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            In no event shall Akavanta or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Akavanta, even if Akavanta or an authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Trading Risks</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            Trading foreign exchange and other financial instruments carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Contact Information</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p className="text-black/70 dark:text-white/70">
            Email: support@akavanta.com
          </p>
        </section>
      </div>
    </div>
  );
}
