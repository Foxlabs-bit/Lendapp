import Link from 'next/link'
import { Package } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-1.5">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Lend</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 2025</p>

        <h2>1. Who We Are</h2>
        <p>Lend is operated by FoxLabs. This policy explains what data we collect, why, and how we handle it. Contact: <a href="mailto:buisness.foxlabs@outlook.com">buisness.foxlabs@outlook.com</a></p>

        <h2>2. Data We Collect</h2>
        <p>We collect the following when you use Lend:</p>
        <ul>
          <li><strong>Account data:</strong> email address, username, and password (stored securely via Supabase Auth)</li>
          <li><strong>App data:</strong> items, loans, borrowers, and notes you create within the Service</li>
          <li><strong>Payment data:</strong> subscription status processed via Polar — we do not store card details</li>
          <li><strong>Usage data:</strong> basic server logs for security and debugging</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li>To provide and operate the Service</li>
          <li>To send transactional emails (account confirmation, password reset)</li>
          <li>To manage your subscription</li>
          <li>To respond to support requests</li>
        </ul>
        <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

        <h2>4. Data Storage</h2>
        <p>Your data is stored in Supabase (PostgreSQL database hosted on AWS). Data is stored in the EU region. We apply row-level security to ensure users can only access their own data.</p>

        <h2>5. Third-Party Services</h2>
        <ul>
          <li><strong>Supabase</strong> — authentication and database hosting</li>
          <li><strong>Polar</strong> — payment processing for paid subscriptions</li>
          <li><strong>Vercel</strong> — application hosting</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>We retain your data for as long as your account is active. If you delete your account, your personal data is deleted within 30 days, except where retention is required by law.</p>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Export your data (available via the CSV export feature on Pro plans)</li>
        </ul>
        <p>To exercise these rights, contact us at <a href="mailto:buisness.foxlabs@outlook.com">buisness.foxlabs@outlook.com</a>.</p>

        <h2>8. Cookies</h2>
        <p>We use only essential session cookies required for authentication. We do not use tracking or advertising cookies.</p>

        <h2>9. Children</h2>
        <p>The Service is not directed at children under 16. We do not knowingly collect data from children.</p>

        <h2>10. Changes</h2>
        <p>We may update this policy. We will notify users of significant changes via email or an in-app notice.</p>

        <h2>11. Contact</h2>
        <p>For any privacy-related questions: <a href="mailto:buisness.foxlabs@outlook.com">buisness.foxlabs@outlook.com</a></p>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-3xl mx-auto px-6 py-6 flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/" className="hover:text-foreground">Home</Link>
        </div>
      </footer>
    </div>
  )
}
