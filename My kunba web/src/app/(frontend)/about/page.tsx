import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about My Kunba, our mission, values, and team. We are passionate about sharing knowledge and insights on technology, design, and personal development.',
  openGraph: {
    title: 'About Us - My Kunba',
    description: 'Learn about My Kunba, our mission, values, and team. We are passionate about sharing knowledge and insights.',
    url: '/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About Us - My Kunba',
    description: 'Learn about My Kunba, our mission, values, and team.',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function About() {
  const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'https://new.mykunba.org'

  // Enhanced Organization schema for E-E-A-T
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Kunba',
    url: siteUrl,
    logo: `${siteUrl}/full_logo.png`,
    description: 'My Kunba is an open blogging platform where writers share knowledge, insights, and stories on technology, design, and personal development.',
    foundingDate: '2023',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${siteUrl}/contact`,
    },
    sameAs: [
      'https://x.com/mykunba',
    ],
  }

  // AboutPage schema
  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About My Kunba',
    description: 'Learn about My Kunba, our mission, values, and team.',
    url: `${siteUrl}/about`,
    mainEntity: organizationSchema,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <div className="max-w-5xl mx-auto space-y-12 mt-8">
        <section>
          <h1 className="text-3xl font-bold mb-6">About Our Blog</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg">
              Welcome to our blog! We are passionate about sharing knowledge and insights on various
              topics related to technology, design, and personal development.
            </p>

            <div className="my-8 relative h-64 rounded-xl overflow-hidden">
              <Image
                src="https://picsum.photos/seed/about/1200/400"
                alt="Our team working together"
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>

            <p>
              Founded in 2023, our platform has grown from a small personal blog to a community of
              writers and readers who share a common interest in learning and growing together. We
              believe that knowledge should be accessible to everyone, and our mission is to create
              content that is both informative and engaging.
            </p>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300">
            To empower individuals with knowledge and insights that inspire creativity, foster growth,
            and drive innovation in the digital world.
          </p>
        </section>

        <section className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Satpal',
                role: 'Founder & Editor-in-Chief',
                bio: 'Senior writer',
                image: 'https://picsum.photos/seed/alex/200/200',
              },
              {
                name: 'Lakshay',
                role: 'Full Stack Developer',
                bio: 'Tech enthusiast with real world experience in web development.',
                image: 'https://picsum.photos/seed/sarah/200/200',
              },
              // {
              //   name: 'Michael Chen',
              //   role: 'Technical Editor',
              //   bio: 'Full-stack developer specializing in React and Node.js ecosystems.',
              //   image: 'https://picsum.photos/seed/michael/200/200',
              // },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src={member.image || '/placeholder.svg'}
                    alt={`${member.name} - ${member.role}`}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="128px"
                  />
                </div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">{member.role}</p>
                <p className="text-gray-600 dark:text-gray-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Quality Content',
                description: 'We prioritize accuracy, depth, and clarity in all our articles.',
              },
              {
                title: 'Inclusivity',
                description:
                  'We create content that is accessible and valuable to person of all backgrounds.',
              },
              {
                title: 'Continuous Learning',
                description:
                  'We are committed to staying updated with the latest trends and technologies.',
              },
              {
                title: 'Community Engagement',
                description:
                  'We value the feedback and contributions from our readers and community members.',
              },
            ].map((value, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-50 dark:bg-gray-700 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            We're always looking for passionate writers and contributors to join our team.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get in Touch
          </Link>
        </section>
      </div>
    </>
  )
}
