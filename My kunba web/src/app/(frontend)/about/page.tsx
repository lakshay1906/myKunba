import Image from 'next/image'
import Link from 'next/link'

export default function About() {
  return (
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
                  alt={member.name}
                  fill
                  className="object-cover"
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
  )
}
