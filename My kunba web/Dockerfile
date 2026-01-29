# =========================
# Base image
# =========================
FROM node:20-alpine AS base

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# =========================
# Dependencies stage
# =========================
FROM base AS deps

# Native deps required by sharp (Payload CMS)
RUN apk add --no-cache \
  libc6-compat \
  vips \
  vips-dev

WORKDIR /app

# Copy lock files only (better cache)
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./

# Install dependencies (use npm to install pnpm to avoid Corepack fetching registry on 503)
RUN \
  if [ -f pnpm-lock.yaml ]; then \
  npm install -g pnpm@9 && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
  yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
  npm ci; \
  else \
  echo "❌ No lockfile found" && exit 1; \
  fi

# =========================
# Build stage
# =========================
FROM base AS builder

WORKDIR /app

# Reuse dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js (standalone output)
# Use --webpack so standalone file tracing generates middleware.js.nft.json (Turbopack can omit it)
# npx uses node_modules from deps (no pnpm/yarn needed in builder)
RUN npx next build --webpack

# =========================
# Runtime stage (minimal & secure)
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Runtime dependency for sharp
RUN apk add --no-cache vips

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone server & static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure permissions
RUN mkdir -p .next && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

# Run standalone Next.js server
CMD ["node", "server.js"]
