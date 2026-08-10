FROM node:22-alpine AS base
WORKDIR /app

RUN npm install -g turbo
COPY . .
RUN turbo prune @doorli/auth --docker

FROM base AS installer
WORKDIR /app
COPY --from=base /app/out/json/ .
COPY --from=base /app/out/package-lock.json ./package-lock.json
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY --from=base /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@doorli/auth

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 4001
CMD ["npm", "run", "start", "--workspace=services/auth"]
