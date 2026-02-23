import Link from 'next/link'
import type { Metadata } from 'next'
import { FileWarning, Mail, ExternalLink, Scale, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'Disclaimer for mykunba.org: general information only, not professional advice. Read our terms regarding accuracy, external links, and liability.',
  openGraph: {
    title: 'Disclaimer - My Kunba',
    description:
      'General information only. We make no warranties about completeness or accuracy. Read our full disclaimer.',
    url: '/disclaimer',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Disclaimer - My Kunba',
    description: 'General information only. Not professional advice. Read our full disclaimer.',
  },
  alternates: {
    canonical: '/disclaimer',
  },
}

export default function DisclaimerPage() {
  const contactEmail = 'sanjubhati@mykunba.org'

  return (
    <div className="container mx-auto mt-8 px-3 max-w-4xl">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
            <FileWarning className="size-8 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disclaimer</h1>
            <p className="text-muted-foreground mt-1">
              Important information about the use of our website and content.
            </p>
          </div>
        </div>
      </header>

      <div className="prose dark:prose-invert max-w-none space-y-10">
        <section className="bg-amber-500/5 dark:bg-amber-500/10 rounded-xl p-6 border border-amber-500/20">
          <p className="text-lg leading-relaxed m-0">
            The information provided on <strong>mykunba.org</strong> is for general informational
            purposes only. While we strive to keep our content accurate and up-to-date, we make no
            representations or warranties of any kind, express or implied, about the completeness,
            accuracy, reliability, suitability, or availability of the website or the information,
            products, or services contained on it. Your use of this site is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
            Not Professional Advice
          </h2>
          <p className="text-muted-foreground">
            The content on this website—including articles, guides, and comments—does not
            constitute professional advice (including but not limited to legal, financial, medical,
            or technical advice). Always seek the guidance of a qualified professional before making
            decisions that could affect your health, finances, or legal rights. Reliance on any
            information provided on mykunba.org is solely at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <ExternalLink className="size-6 text-primary" />
            External Links
          </h2>
          <p className="text-muted-foreground">
            Our website may contain links to third-party websites for your convenience. We do not
            control these sites and are not responsible for their content, privacy practices, or
            availability. The inclusion of any link does not imply endorsement. We encourage you to
            read the terms and privacy policies of any third-party site you visit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold flex items-center gap-2 mt-0">
            <Scale className="size-6 text-primary" />
            Limitation of Liability
          </h2>
          <p className="text-muted-foreground">
            To the fullest extent permitted by applicable law, <strong>mykunba.org</strong> and its
            operators, authors, and contributors shall not be held liable for any direct, indirect,
            incidental, consequential, or punitive loss or damage arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Your use of or inability to use our website or services.</li>
            <li>Any errors, inaccuracies, or omissions in our content.</li>
            <li>Unauthorized access to or use of our servers and/or any personal information stored
              therein.</li>
            <li>Any interruption or cessation of transmission to or from our website.</li>
            <li>Any bugs, viruses, or similar that may be transmitted through our site or any third-party
              link.</li>
          </ul>
          <p className="text-muted-foreground">
            This limitation applies whether the alleged liability is based on contract, tort,
            negligence, or any other legal theory.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Accuracy of Information</h2>
          <p className="text-muted-foreground">
            We make reasonable efforts to ensure that information on our site is current and
            accurate. However, technology, laws, and best practices change over time. We do not
            guarantee that all content is error-free or up to date. If you notice an error or
            outdated information, we welcome you to contact us so we can review it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Views of Authors</h2>
          <p className="text-muted-foreground">
            Opinions expressed in articles and comments are those of the respective authors and do
            not necessarily reflect the views of My Kunba or its team. We do not endorse or take
            responsibility for the views of guest authors or commenters.
          </p>
        </section>

        <section className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20">
          <h2 className="text-xl font-bold flex items-center gap-2 mt-0">
            <Mail className="size-5 text-primary" />
            Contact Us
          </h2>
          <p className="text-muted-foreground m-0">
            For any questions or concerns regarding this disclaimer, please contact us at:{' '}
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
