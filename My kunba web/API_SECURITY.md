# API Security Documentation

This document describes the security implementation for the Next.js API routes, ensuring they are protected from unauthorized access, abuse, and data scraping.

## Overview

The API security uses a two-layered approach:

1. **CORS Protection (Web)**: Restricts browser-based requests to only allowed origins
2. **Rate Limiting**: Protects against abuse, DDoS attacks, and data scraping by limiting requests per IP address

## Environment Variables

Add the following environment variable to your `.env` file:

```env
# Your Next.js app URL (for CORS)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# In production, set this to your actual domain:
# NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## How It Works

### Web Requests (Next.js Frontend)

- **Origin Header**: Browser requests include an `Origin` header
- **CORS Check**: Middleware validates the origin against the allowed list
- **Rate Limiting**: Tracks requests per IP address to prevent abuse
- **Authentication**: Uses JWT tokens stored in httpOnly cookies
- **Headers**: Automatically includes CORS headers for allowed origins

### Mobile/Server Requests

- **No Origin Header**: Mobile apps and server-to-server requests don't send Origin headers
- **Rate Limiting**: Still applies to prevent abuse
- **Authentication**: Uses JWT tokens in `Authorization: Bearer <token>` header
- **No CORS**: CORS doesn't apply to mobile apps

## Rate Limiting

Rate limiting protects your API from:
- **DDoS Attacks**: Prevents overwhelming your server
- **Data Scraping**: Limits how much data can be extracted
- **Brute Force**: Protects authentication endpoints
- **Resource Abuse**: Prevents excessive API usage

### Rate Limit Configuration

Different endpoints have different rate limits:

- **Default**: 100 requests per 15 minutes per IP
- **Authentication Endpoints** (`/auth/*`): 5 requests per 15 minutes per IP
- **Image Upload Endpoints** (`/image/upload`): 20 requests per 15 minutes per IP

### Rate Limit Headers

Responses include rate limit information:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Seconds until the limit resets
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

### Rate Limit Response

When rate limit is exceeded, the API returns:

```json
{
  "message": "Too many requests. Please try again later.",
  "error": "Rate limit exceeded"
}
```

Status code: `429 Too Many Requests`

## Implementation Details

### Middleware (`middleware.ts`)

The middleware runs before all API routes and:

1. Checks if the request is to an API route (`/api/*`)
2. Applies rate limiting based on IP address
3. For browser requests (has `Origin` header):
   - Validates origin against allowed list
   - Adds CORS headers if valid
   - Rejects if origin not allowed
4. For mobile/server requests (no `Origin` header):
   - Allows the request (no CORS check)
   - Still applies rate limiting
5. Handles OPTIONS preflight requests for CORS

### Authentication Utility (`src/utils/auth.ts`)

Provides helper functions for API routes:

- `getTokenFromRequest()`: Extracts JWT from cookies (web) or Authorization header (mobile)
- `authenticateUser()`: Verifies JWT and optionally fetches user from database
- `verifyToken()`: Validates JWT token

### Protected API Routes

All protected API routes use `authenticateUser()` which supports both:
- **Web**: JWT from httpOnly cookies
- **Mobile**: JWT from `Authorization: Bearer <token>` header

## Flutter Implementation

In your Flutter app, make requests normally. No API key is required:

```dart
import 'package:http/http.dart' as http;

// Standard API request
final response = await http.get(
  Uri.parse('https://your-api.com/api/endpoint'),
  headers: {
    'Authorization': 'Bearer $jwtToken', // If authenticated
    'Content-Type': 'application/json',
  },
);
```

### Example: Authenticated Request

```dart
// After user logs in and receives JWT token
final response = await http.post(
  Uri.parse('https://your-api.com/api/dashboard/blog'),
  headers: {
    'Authorization': 'Bearer $jwtToken',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'title': 'My Blog Post',
    'slug': 'my-blog-post',
    // ... other fields
  }),
);
```

### Handling Rate Limits

Check rate limit headers and handle 429 responses:

```dart
if (response.statusCode == 429) {
  final retryAfter = response.headers['retry-after'];
  print('Rate limit exceeded. Retry after: $retryAfter seconds');
  // Implement exponential backoff or show user-friendly message
} else {
  // Check remaining requests
  final remaining = response.headers['x-ratelimit-remaining'];
  print('Remaining requests: $remaining');
}
```

## Public Endpoints

The following endpoints are public and don't require authentication (but still require CORS/API key):

- `/api/user/auth/sign-in`
- `/api/user/auth/login`
- `/api/user/auth/jwt/verify`
- `/api/user/auth/jwt/new`

## Security Best Practices

1. **Never commit secrets to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Monitor rate limits**
   - Check rate limit headers in responses
   - Implement exponential backoff when rate limited
   - Alert on unusual traffic patterns

3. **HTTPS in production**
   - Always use HTTPS for API requests
   - Prevents token interception

4. **Adjust rate limits as needed**
   - Modify limits in `src/utils/rate-limit.ts`
   - Consider different limits for different user tiers
   - Use Redis for distributed rate limiting in production

5. **IP-based blocking** (future enhancement)
   - Consider blocking known malicious IPs
   - Use services like Cloudflare for additional protection

## Testing

### Test Web Request (Browser)

```bash
# Should work (from allowed origin)
curl -H "Origin: http://localhost:3000" \
     -H "Cookie: access_token=your-jwt-token" \
     http://localhost:3000/api/dashboard/blog

# Should fail (from disallowed origin)
curl -H "Origin: https://evil.com" \
     http://localhost:3000/api/dashboard/blog
```

### Test Mobile Request

```bash
# Should work (no API key needed)
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:3000/api/dashboard/blog
```

### Test Rate Limiting

```bash
# Make multiple rapid requests to test rate limiting
for i in {1..110}; do
  curl -H "Authorization: Bearer your-jwt-token" \
       http://localhost:3000/api/dashboard/blog
  echo "Request $i"
done

# After 100 requests, you should receive 429 Too Many Requests
```

## Troubleshooting

### "CORS Not Allowed" Error

- Check that your origin is in the `allowedOrigins` array in `middleware.ts`
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Ensure you're making the request from the correct domain

### "429 Too Many Requests" Error

- You've exceeded the rate limit for your IP address
- Wait for the rate limit window to reset (check `X-RateLimit-Reset` header)
- Implement exponential backoff in your client
- Consider using a different IP address if legitimate high-volume access is needed

### "Unauthorized" Error (Authentication)

- Verify JWT token is valid and not expired
- Check that token is in cookies (web) or Authorization header (mobile)
- Ensure user exists and has proper permissions

## Customizing Rate Limits

To adjust rate limits, edit `src/utils/rate-limit.ts`:

```typescript
// Increase default limit
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // Increased from 100
}

// Stricter limit for specific endpoint
const CUSTOM_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
}
```

## Production Considerations

For production deployments with multiple servers:

1. **Use Redis for distributed rate limiting**
   - Current implementation uses in-memory storage
   - For multiple server instances, use Redis
   - Consider using libraries like `ioredis` or `@upstash/ratelimit`

2. **Monitor rate limit violations**
   - Log rate limit hits for analysis
   - Set up alerts for unusual patterns
   - Track which IPs are hitting limits

3. **Consider user-based rate limiting**
   - Current implementation is IP-based
   - For authenticated users, consider per-user limits
   - Can be more fair than IP-based limits
