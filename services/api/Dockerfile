FROM node:22-alpine AS base
WORKDIR /app

# Turbo prune
RUN npm install -g turbo
COPY . .
RUN turbo prune @doorli/api --docker

FROM base AS installer
WORKDIR /app
# First install dependencies
COPY --from=base /app/out/json/ .
COPY --from=base /app/out/package-lock.json ./package-lock.json
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Build the project
COPY --from=base /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@doorli/api

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace=services/api"]
