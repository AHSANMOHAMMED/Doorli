FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/utils/package.json ./packages/utils/
COPY packages/types/package.json ./packages/types/
COPY services/ai/package.json ./services/ai/
RUN npm ci --workspace=services/ai

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=packages/utils
RUN npm run build --workspace=services/ai

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/services/ai/dist ./services/ai/dist
COPY --from=builder /app/services/ai/package.json ./services/ai/
COPY --from=builder /app/node_modules ./node_modules
USER nodejs
EXPOSE 4006
CMD ["node", "services/ai/dist/index.js"]
