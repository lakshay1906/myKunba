import { MetadataRoute } from 'next'
import { getPublicUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/', '/unauthorised/', '/profile/', '/upload/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/', '/unauthorised/', '/profile/', '/upload/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
