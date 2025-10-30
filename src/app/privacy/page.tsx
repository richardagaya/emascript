export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-sm text-black/70 dark:text-white/70 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include:
          </p>
          <ul className="list-disc pl-6 text-black/70 dark:text-white/70 mb-4">
            <li>Name and email address</li>
            <li>Payment information (processed securely through third-party providers)</li>
            <li>Account preferences and settings</li>
            <li>Communications with our support team</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-black/70 dark:text-white/70 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends and usage</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 text-black/70 dark:text-white/70 mb-4">
            <li>With service providers who assist us in operating our website and conducting our business</li>
            <li>When required by law or to protect our rights</li>
            <li>In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Cookies and Tracking</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Third-Party Services</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-black/70 dark:text-white/70 mb-4">
            <li>Access and update your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-black/70 dark:text-white/70">
            Email: privacy@akavanta.com
          </p>
        </section>
      </div>
    </div>
  );
}
