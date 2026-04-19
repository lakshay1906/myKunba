# =========================
# Base image
# =========================
FROM node:20-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1

# =========================
# Dependencies
# =========================
FROM base AS deps

RUN apk add --no-cache libc6-compat vips vips-dev

WORKDIR /app

COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./

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

# 🔥 ADD BUILD ARGS HERE
# ARG NEXT_PUBLIC_NEXT_URL
ARG NEXT_PUBLIC_PUBLIC_URL
ARG NEXT_PUBLIC_ADSENSE_ID
ARG NEXT_PUBLIC_ADS_SLOT_1
ARG NEXT_PUBLIC_ADS_SLOT_2
ARG NEXT_PUBLIC_ADS_SLOT_3
ARG NEXT_PUBLIC_ADS_SLOT_4
ARG NEXT_PUBLIC_ADS_SLOT_IN_FEED
ARG NEXT_PUBLIC_ADS_SLOT_BELOW_TITLE
ARG NEXT_PUBLIC_ADS_SLOT_IN_ARTICLE
ARG NEXT_PUBLIC_ADS_SLOT_LEFT_SIDEBAR
ARG NEXT_PUBLIC_ADS_DISPLAY_HORIZONTAL
ARG NEXT_PUBLIC_ADS_MULTIPLEX_SLOT
ARG NEXT_PUBLIC_ADS_MULTIPLEX_SLOT_HORIZONTAL
ARG NEXT_PUBLIC_GA_PROPERTY_ID
ARG CLOUDFLARE_HOSTNAME
ARG CLOUDFLARE_API_TOKEN
ARG CLOUDFLARE_ZONE_ID
# Used when Next/Payload evaluate config during `next build` (avoids empty-secret warnings; not copied to runner)
ARG PAYLOAD_SECRET

# 🔥 EXPOSE TO NEXT BUILD
# ENV NEXT_PUBLIC_NEXT_URL=$NEXT_PUBLIC_NEXT_URL
ENV NEXT_PUBLIC_PUBLIC_URL=$NEXT_PUBLIC_PUBLIC_URL
ENV NEXT_PUBLIC_ADSENSE_ID=$NEXT_PUBLIC_ADSENSE_ID
ENV NEXT_PUBLIC_ADS_SLOT_1=$NEXT_PUBLIC_ADS_SLOT_1
ENV NEXT_PUBLIC_ADS_SLOT_2=$NEXT_PUBLIC_ADS_SLOT_2
ENV NEXT_PUBLIC_ADS_SLOT_3=$NEXT_PUBLIC_ADS_SLOT_3
ENV NEXT_PUBLIC_ADS_SLOT_4=$NEXT_PUBLIC_ADS_SLOT_4
ENV NEXT_PUBLIC_ADS_SLOT_IN_FEED=$NEXT_PUBLIC_ADS_SLOT_IN_FEED
ENV NEXT_PUBLIC_ADS_SLOT_BELOW_TITLE=$NEXT_PUBLIC_ADS_SLOT_BELOW_TITLE
ENV NEXT_PUBLIC_ADS_SLOT_IN_ARTICLE=$NEXT_PUBLIC_ADS_SLOT_IN_ARTICLE
ENV NEXT_PUBLIC_ADS_SLOT_LEFT_SIDEBAR=$NEXT_PUBLIC_ADS_SLOT_LEFT_SIDEBAR
ENV NEXT_PUBLIC_ADS_DISPLAY_HORIZONTAL=$NEXT_PUBLIC_ADS_DISPLAY_HORIZONTAL
ENV NEXT_PUBLIC_ADS_MULTIPLEX_SLOT=$NEXT_PUBLIC_ADS_MULTIPLEX_SLOT
ENV NEXT_PUBLIC_ADS_MULTIPLEX_SLOT_HORIZONTAL=$NEXT_PUBLIC_ADS_MULTIPLEX_SLOT_HORIZONTAL
ENV NEXT_PUBLIC_GA_PROPERTY_ID=$NEXT_PUBLIC_GA_PROPERTY_ID
ENV CLOUDFLARE_HOSTNAME=$CLOUDFLARE_HOSTNAME
ENV CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
ENV CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DOCKER_BUILD=1
RUN npx next build --webpack

# =========================
# Runtime
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache vips

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p /tmp/pg-install && cd /tmp/pg-install && npm init -y && npm install pg@8 && \
  mkdir -p /app/vendor && cp -r /tmp/pg-install/node_modules/* /app/vendor/ && rm -rf /tmp/pg-install

ENV NODE_PATH=/app/vendor

RUN mkdir -p .next && chown -R nextjs:nodejs .next scripts vendor package.json package-lock.json 2>/dev/null || true

USER nextjs

EXPOSE 3000

CMD ["node", "scripts/docker-entrypoint.js"]