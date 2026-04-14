# VibeDistro API — Production Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/types/package.json ./packages/types/
RUN npm ci --ignore-scripts

# ---- Generate Prisma client ----
FROM deps AS prisma
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/tsconfig.json ./packages/database/
COPY packages/database/src ./packages/database/src
RUN npx -w packages/database prisma generate

# ---- Build ----
FROM prisma AS builder
COPY tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npx turbo run build --filter=@vibedistro/api

# ---- Production image ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./

# Prisma migrations
COPY --from=prisma /app/packages/database/prisma ./packages/database/prisma
COPY --from=prisma /app/packages/database/src/generated ./packages/database/src/generated

WORKDIR /app/apps/api
USER nestjs
EXPOSE 3001

CMD ["node", "dist/apps/api/src/main.js"]
