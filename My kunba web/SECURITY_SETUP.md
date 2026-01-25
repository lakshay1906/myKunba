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
