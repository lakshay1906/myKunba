import { MetadataRoute } from 'next'
import { getPublicUrl } from '@/lib/env'

/**
 * Robots.txt: Allow indexing of all public content (blogs, categories, tags, authors, FAQs).
 * Disallow: dashboard, admin, api, unauthorised, upload.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/unauthorised/', '/upload/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/unauthorised/', '/upload/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/unauthorised/', '/upload/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
