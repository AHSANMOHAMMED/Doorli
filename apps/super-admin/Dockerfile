FROM node:20-alpine AS base
WORKDIR /app

# Turbo prune
RUN npm install -g turbo
COPY . .
RUN turbo prune super-admin --docker

FROM base AS installer
WORKDIR /app
# First install dependencies
COPY --from=base /app/out/json/ .
COPY --from=base /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build the project
COPY --from=base /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=super-admin

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/super-admin"]
