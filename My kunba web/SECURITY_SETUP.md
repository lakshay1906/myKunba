# Quick Security Setup Guide

## Step 1: Configure CORS (Optional)

Edit `middleware.ts` and add your production domain to the `allowedOrigins` array:

```typescript
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://your-production-domain.com', // Add your domain here
]
```

## Step 2: Adjust Rate Limits (Optional)

Edit `src/utils/rate-limit.ts` to customize rate limits:

- **Default**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Image upload**: 20 requests per 15 minutes

## Step 3: Flutter App Configuration

No special configuration needed! Just make requests normally:

```dart
headers: {
  'Authorization': 'Bearer $jwtToken', // For authenticated requests
  'Content-Type': 'application/json',
}
```

## How It Works

- **Web (Next.js)**: Uses CORS + JWT cookies (automatic)
- **Mobile (Flutter)**: Uses JWT in Authorization header
- **Rate Limiting**: Automatically applied to all requests

## Rate Limit Headers

Check these headers in responses:

- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Seconds until reset

## Handling Rate Limits

When you receive `429 Too Many Requests`:

1. Check `Retry-After` header for wait time
2. Implement exponential backoff
3. Show user-friendly message

See `API_SECURITY.md` for detailed documentation.

<!-- Gemini temporary chat suggestions-->

I've reviewed your [slug]/page.tsx. While the code is structurally sound and follows Next.js App Router conventions, the addition of generateStaticParams introduces a major architectural shift that you need to be aware of before deploying.

Here is the breakdown of what is "wrong" or risky in this specific file:

1. The "Static Ghosting" Risk (Crucial)
The IDE added generateStaticParams, which tells Next.js to build these 100 pages as Static HTML at build time.

The Issue: Because this is a CMS, if you edit a post in Payload or publish a new one, the live site will not update because these pages are now static.

The Fix: You must ensure you have a Revalidation strategy. You are missing an export const revalidate = ... statement.

Recommendation: Add export const revalidate = 3600 (1 hour) or export const revalidate = 0 (to always stay dynamic) at the top of the file unless you have configured On-Demand Revalidation via webhooks in your Payload config.

2. Localization vs. Static Params
You have logic inside the component that checks headers() for x-locale.

The Conflict: Static Generation (generateStaticParams) and Dynamic Headers (headers()) are often at odds. When a page is pre-rendered statically, the headers() call will force the page into Dynamic Rendering at request time anyway, which partially defeats the purpose of the IDE's "boost."

The Bug: If Next.js pre-renders these 100 posts during the build, it doesn't have access to the x-locale header. It will default to 'en'. If a user with a different locale visits that exact static path, they might get a cached English version instead of the translated one.

3. Missing dynamicParams Configuration
The IDE set a limit: 100 in generateStaticParams.

The Risk: What happens to your 101st blog post? Or a post published after the build?

The Fix: You should explicitly add export const dynamicParams = true; to ensure that any slug not generated at build time is fetched on-demand rather than showing a 404.

4. Payload Client Import
The code uses import { payload } from '@/payload-client'.

Check: Ensure your payload-client.ts is configured to work correctly in a Server Component environment. Specifically, when self-hosting on EC2, ensure the environment variables for your database are correctly injected into the build process, or generateStaticParams will fail during pnpm build.

Recommended Adjustments
To make this "Production Ready" and safe, I suggest adding these exports to the top of the file:

TypeScript
// Add these to control the static behavior correctly
export const dynamicParams = true; 
export const revalidate = 60; // Recheck for CMS updates every 60 seconds (or set to 0)

export async function generateStaticParams() {
  // ... existing code ...
}
Summary for Production:
If you want speed: Keep generateStaticParams, but you must implement a webhook in Payload to call revalidateTag or revalidatePath whenever a post is saved.

If you want accuracy: If you don't want to deal with cache-clearing logic yet, remove generateStaticParams and stick to dynamic rendering. The current "half-way" setup will result in your site showing outdated content.
