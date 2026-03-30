'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

export function GlobalScripts() {
  const pathname = usePathname()

  // Do not inject third-party scripts on Payload admin or API routes.
  // This prevents AdSense and GTM from breaking React hydration inside the CMS dashboard,
  // which causes Uncaught NotFoundError: Failed to execute 'insertBefore'/'removeChild'.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/api')) {
    return null
  }

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_PROPERTY_ID}`}
        strategy="lazyOnload"
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_PROPERTY_ID}');
          `,
        }}
      />
    </>
  )
}
