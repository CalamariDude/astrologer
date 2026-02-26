import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: February 25, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
            <p>Astrologer ("we", "us") respects your privacy. This policy explains what data we collect, how we use it, and your rights regarding that data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Data We Collect</h2>
            <p><strong>Account data:</strong> If you create an account, we store your email address and authentication credentials (managed by Supabase Auth).</p>
            <p><strong>Birth data:</strong> Date, time, and location of birth that you enter for chart calculations. This is stored locally in your browser (localStorage/sessionStorage) and, if you save a chart, in your account.</p>
            <p><strong>Usage data:</strong> We track AI reading and relocated chart credit usage counts to enforce tier limits. We do not store the content of AI readings on our servers.</p>
            <p><strong>Product analytics:</strong> We collect anonymized product usage data (pages visited, features used, clicks, and session recordings) to understand how people use Astrologer and improve the experience. This data is tied to your account if you are signed in.</p>
            <p><strong>Subscription data:</strong> Payment processing is handled by Stripe. We store your subscription status but do not store credit card numbers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Calculate and display astrological charts</li>
              <li>Generate AI-powered chart interpretations (birth data is sent to our AI provider for the duration of the request only)</li>
              <li>Manage your subscription and enforce usage limits</li>
              <li>Analyze product usage patterns to improve features and user experience</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — Authentication and database hosting</li>
              <li><strong>Stripe</strong> — Payment processing</li>
              <li><strong>xAI (Grok)</strong> — AI chart interpretations (birth data is sent per-request, not stored by the provider)</li>
              <li><strong>Mapbox</strong> — Astrocartography map tiles</li>
              <li><strong>Resend</strong> — Transactional emails (support tickets)</li>
              <li><strong>PostHog</strong> — Product analytics and session replay (for improving the product)</li>
              <li><strong>Fly.io</strong> — Swiss Ephemeris API hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Local Storage</h2>
            <p>We use browser localStorage and sessionStorage to persist chart data, theme preferences, and saved chart defaults between sessions. This data never leaves your device unless you explicitly save a chart to your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
            <p>Account data is retained as long as your account is active. You can delete your account and all associated data by contacting support. Locally stored data can be cleared by clearing your browser data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Data Security</h2>
            <p>We use industry-standard security practices including HTTPS encryption, row-level security policies on our database, and secure authentication via Supabase Auth. Payments are handled entirely by Stripe's PCI-compliant infrastructure.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Your Rights</h2>
            <p>You have the right to: (a) access your personal data; (b) request correction of inaccurate data; (c) request deletion of your data; (d) export your data. Contact us to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Cookies &amp; Analytics</h2>
            <p>We use essential cookies for authentication. We use PostHog for product analytics and session recordings to understand usage patterns and improve Astrologer. We do not use advertising cookies or sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Children's Privacy</h2>
            <p>Astrologer is not intended for users under 13. We do not knowingly collect data from children under 13.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify registered users of significant changes via email.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
            <p>Questions about privacy? Reach us at <a href="mailto:zeineddine.jad@gmail.com" className="text-primary underline">zeineddine.jad@gmail.com</a> or visit our <Link to="/support" className="text-primary underline">Support</Link> page.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
