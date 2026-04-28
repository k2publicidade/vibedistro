# VibeDistro Web — Production Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
RUN npm ci --ignore-scripts

# ---- Build ----
FROM deps AS builder
COPY tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Build args for Next.js public env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=VibeDistro
ARG NEXT_PUBLIC_REVELATOR_ENVIRONMENT=sandbox
ARG NEXT_PUBLIC_PROVIDER_ENV=sandbox

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_REVELATOR_ENVIRONMENT=$NEXT_PUBLIC_REVELATOR_ENVIRONMENT
ENV NEXT_PUBLIC_PROVIDER_ENV=$NEXT_PUBLIC_PROVIDER_ENV

RUN npx turbo run build --filter=@vibedistro/web

# ---- Production image ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
