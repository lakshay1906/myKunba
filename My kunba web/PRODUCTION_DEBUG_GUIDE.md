# Production Debug Guide - AWS EC2 Authentication Issues

This guide helps you debug authentication issues when the app is deployed to AWS EC2 Linux.

## 🔍 **Key Log Messages to Look For**

### **1. Proxy Middleware Logs** (`src/proxy.ts`)

Look for these log prefixes: `[PROXY]`

**✅ Normal Flow:**

```
🔄 [PROXY] Request intercepted for path: /dashboard
📊 [PROXY] Dashboard route detected, checking authentication...
🍪 [PROXY] Cookie token exists: true
✅ [PROXY] Token found, proceeding with verification...
🔍 [PROXY] Verifying JWT directly (no external fetch)
🔐 [PROXY] ACCESS_SECRET exists: true
✅ [PROXY] JWT verified successfully
🗄️ [PROXY] Querying database for user...
👤 [PROXY] User found: { id: "...", email: "...", role: "user" }
✅ [PROXY] Authentication successful, allowing access
```

**❌ Common Issues:**

```
❌ [PROXY] Dashboard access denied: No token found
❌ [PROXY] ACCESS_SECRET not configured
❌ [PROXY] User not found in database
❌ [PROXY] Dashboard access denied: Insufficient role
💥 [PROXY] Auth error occurred: { error: 'fetch failed' } - FIXED: JWT now verified directly
```

### **2. Dashboard Layout Logs** (`src/app/(frontend)/dashboard/layout.tsx`)

Look for these log prefixes: `[DASHBOARD LAYOUT]`

**✅ Normal Flow:**

```
🏗️ [DASHBOARD LAYOUT] Starting server-side authorization check
🍪 [DASHBOARD LAYOUT] Token exists: true
🔍 [DASHBOARD LAYOUT] Verifying JWT token...
✅ [DASHBOARD LAYOUT] JWT verified successfully
🗄️ [DASHBOARD LAYOUT] Querying database for user...
📋 [DASHBOARD LAYOUT] Database query result: { totalDocs: 1, docsLength: 1 }
👤 [DASHBOARD LAYOUT] User found: { role: "user" }
✅ [DASHBOARD LAYOUT] Authorization successful, rendering dashboard
```

**❌ Common Issues:**

```
❌ [DASHBOARD LAYOUT] No token found, redirecting to unauthorized
❌ [DASHBOARD LAYOUT] ACCESS_SECRET not configured
❌ [DASHBOARD LAYOUT] User not found in database
❌ [DASHBOARD LAYOUT] Insufficient role permissions
```

### **3. JWT Verify API Logs** (`src/app/api/user/auth/jwt/verify/route.ts`)

Look for these log prefixes: `[JWT VERIFY API]`

**✅ Normal Flow:**

```
🔍 [JWT VERIFY API] JWT verification request received
🔑 [JWT VERIFY API] Token exists: true
✅ [JWT VERIFY API] JWT verified successfully
🗄️ [JWT VERIFY API] Querying database for user...
👤 [JWT VERIFY API] User found: { role: "user" }
✅ [JWT VERIFY API] Returning user data
```

### **4. Login API Logs** (`src/app/api/user/auth/login/route.ts`)

Look for these log prefixes: `[LOGIN API]`

**✅ Normal Flow:**

```
🔐 [LOGIN API] Login request received
✅ [LOGIN API] JWT verified successfully
🗄️ [LOGIN API] Querying database for user...
🍪 [LOGIN API] Setting cookie...
✅ [LOGIN API] Login successful, returning user data
```

## 🐛 **Common Production Issues & Solutions**

### **Issue 1: Cookie Not Set Properly**

**Symptoms:** `❌ [PROXY] Dashboard access denied: No token found`
**Check:**

- Environment variables: `NODE_ENV`, `ACCESS_SECRET`
- Cookie settings: `secure`, `sameSite`, `domain`
- HTTPS configuration

### **Issue 2: JWT Verification Fails**

**Symptoms:** `❌ [PROXY] Dashboard access denied: Token verification failed`
**Check:**

- `ACCESS_SECRET` environment variable
- Token expiration
- JWT signature

### **Issue 3: User Not Found in Database**

**Symptoms:** `❌ [DASHBOARD LAYOUT] User not found in database`
**Check:**

- Database connection
- User migration between environments
- Email/UID mismatch

### **Issue 4: Insufficient Role Permissions**

**Symptoms:** `❌ [DASHBOARD LAYOUT] Insufficient role permissions`
**Check:**

- User role in database
- Role validation logic
- Default role assignment

## 📋 **Debugging Steps**

1. **Check AWS CloudWatch Logs** for the log messages above
2. **Verify Environment Variables:**
   ```bash
   echo $NODE_ENV
   echo $ACCESS_SECRET  # Don't log this in production!
   ```
3. **Test Cookie Settings:**
   - Check if cookies are being set with correct domain
   - Verify HTTPS is enabled in production
4. **Test Database Connection:**
   - Verify MongoDB/PostgreSQL connection
   - Check user data exists and is correct
5. **Test JWT Token:**
   - Manually decode JWT to verify payload
   - Check token expiration

## 🎯 **Quick Diagnostic Commands**

```bash
# Check environment
echo "NODE_ENV: $NODE_ENV"
echo "ACCESS_SECRET length: ${#ACCESS_SECRET}"

# Check application logs
tail -f /var/log/application.log

# Test database connection
# (depends on your database setup)

# Test JWT manually (replace TOKEN with actual token)
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.decode('TOKEN'));"
```

## 🚨 **Emergency Fixes**

If you need to bypass authentication temporarily for debugging:

1. **Temporarily allow all users:**

   ```typescript
   // In proxy.ts and dashboard/layout.tsx
   return NextResponse.next({ request: { headers: requestHeaders } })
   // Skip authentication checks
   ```

2. **Add test user:**
   ```bash
   # Create a test user directly in database
   ```

Remember to remove these temporary fixes after debugging!
