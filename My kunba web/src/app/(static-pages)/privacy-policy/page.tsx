import type { Metadata } from 'next'
import { Shield, Mail, Lock, Eye, Share2, Cookie } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how My Kunba collects, uses, and protects your personal information. We are committed to transparency and your privacy.',
  openGraph: {
    title: 'Privacy Policy - My Kunba',
    description:
      'How we collect, use, and safeguard your information. Your privacy matters to us.',
    url: '/privacy-policy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - My Kunba',
    description: 'How we collect, use, and safeguard your information.',
  },
  alternates: {
    canonical: '/privacy-policy',
  },
}

/** Static page: no dynamic APIs; layout (static-pages) does not use headers(). */
export const dynamic = 'force-static'

export default function PrivacyPolicyPage() {
  const contactEmail = 'sanjubhati@mykunba.org'

  return (
    <div className="container mx-auto mt-8 px-3 max-w-4xl">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="size-8 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground mt-1">
              Your privacy is important to us. We are committed to transparency and protecting your
              data.
            </p>
          </div>
        </div>
      </header>

      <div className="prose dark:prose-invert max-w-none space-y-10">
        <section className="bg-muted/50 dark:bg-muted/20 rounded-xl p-6 border">
          <p className="text-lg leading-relaxed m-0">
            At <strong>My Kunba</strong> (mykunba.org), we take your privacy seriously. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our website. By using our site, you agree to the practices described
            here. We encourage you to read this policy in full.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <Eye className="size-6 text-primary" />
            Information We Collect
          </h2>
          <p className="text-muted-foreground">
            We may collect personal and non-personal information to provide and improve our
            services:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Account & profile:</strong> Name, email address, username, and profile
              details when you register or update your account.
            </li>
            <li>
              <strong>Newsletter & subscriptions:</strong> Email address when you subscribe to our
              newsletter or updates.
            </li>
            <li>
              <strong>Comments & engagement:</strong> Name, email, and comment content when you
              comment on posts.
            </li>
            <li>
              <strong>Contact & support:</strong> Name, email, and message content when you contact
              us or use our contact form.
            </li>
            <li>
              <strong>Usage data:</strong> IP address, browser type, device information, pages
              visited, and referring URLs to understand how our site is used and to improve
              performance.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <Share2 className="size-6 text-primary" />
            How We Use Your Information
          </h2>
          <p className="text-muted-foreground">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Deliver and personalize your experience on our website.</li>
            <li>Send newsletters, updates, and respond to your inquiries.</li>
            <li>Moderate comments and prevent abuse.</li>
            <li>Analyze site usage to improve content, design, and performance.</li>
            <li>Comply with legal obligations and protect our rights and the rights of our users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <Lock className="size-6 text-primary" />
            Data Security
          </h2>
          <p className="text-muted-foreground">
            We employ industry-standard security measures to protect your data from unauthorized
            access, alteration, disclosure, or destruction. This includes encryption (e.g., HTTPS),
            secure storage practices, and access controls. While we strive to protect your
            information, no method of transmission over the internet or electronic storage is 100%
            secure; we encourage you to use strong passwords and keep your account details
            confidential.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <Share2 className="size-6 text-primary" />
            Third-Party Sharing
          </h2>
          <p className="text-muted-foreground">
            We do <strong>not</strong> sell, trade, or rent your personal information to third
            parties for marketing purposes. We may share information only in the following
            circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>With service providers who assist us in operating our site (e.g., hosting, email)
              under strict confidentiality agreements.</li>
            <li>When required by law, court order, or to protect our rights, safety, or property.</li>
            <li>With your explicit consent for a specific purpose.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <Cookie className="size-6 text-primary" />
            Cookies & Similar Technologies
          </h2>
          <p className="text-muted-foreground">
            We may use cookies and similar technologies to remember your preferences, analyze
            traffic, and improve your experience. You can control cookie settings through your
            browser. Disabling certain cookies may affect some features of the site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Your Rights</h2>
          <p className="text-muted-foreground">
            Depending on your location, you may have the right to access, correct, or delete your
            personal data, object to or restrict certain processing, and data portability. To
            exercise these rights or for any privacy-related questions, please contact us using the
            details below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will post the revised policy on
            this page and update the &quot;Last updated&quot; date. Continued use of our website
            after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20">
          <h2 className="text-xl font-bold flex items-center gap-2 mt-0">
            <Mail className="size-5 text-primary" />
            Contact Us
          </h2>
          <p className="text-muted-foreground m-0">
            If you have any questions, concerns, or requests regarding this Privacy Policy or your
            personal data, please contact us at:{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="text-primary font-medium underline underline-offset-4 hover:no-underline"
            >
              {contactEmail}
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
