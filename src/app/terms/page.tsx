import Link from 'next/link'
import { Package } from 'lucide-react'

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: May 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Lend (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>Lend is a personal item lending tracker that allows users to record, manage, and monitor items they lend to others. The Service is provided by FoxLabs.</p>

        <h2>3. Account Registration</h2>
        <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable law or regulation</li>
          <li>Upload harmful, offensive, or illegal content</li>
          <li>Attempt to gain unauthorized access to the Service or other users&apos; accounts</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
        </ul>

        <h2>5. Subscription and Payments</h2>
        <p>Paid plans (Pro, Org) are billed monthly via Polar. Subscriptions renew automatically until cancelled. You may cancel at any time from your profile settings. Refunds are not provided for partial billing periods.</p>

        <h2>6. Data and Privacy</h2>
        <p>Your use of the Service is also governed by our <Link href="/privacy">Privacy Policy</Link>. We store the data you provide to deliver the Service and do not sell it to third parties.</p>

        <h2>7. Intellectual Property</h2>
        <p>The Service and its original content, features, and functionality are owned by FoxLabs and are protected by intellectual property laws. You retain ownership of any data you upload.</p>

        <h2>8. Termination</h2>
        <p>We may suspend or terminate your account at our discretion if you violate these Terms. You may delete your account at any time from your profile settings.</p>

        <h2>9. Disclaimer of Warranties</h2>
        <p>The Service is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee uninterrupted or error-free operation.</p>

        <h2>10. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, FoxLabs shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

        <h2>11. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

        <h2>12. Contact</h2>
        <p>Questions about these Terms? Contact us at <a href="mailto:buisness.foxlabs@outlook.com">buisness.foxlabs@outlook.com</a>.</p>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-3xl mx-auto px-6 py-6 flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/" className="hover:text-foreground">Home</Link>
        </div>
      </footer>
    </div>
  )
}
