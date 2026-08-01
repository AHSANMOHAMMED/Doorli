FROM node:20-alpine AS base
WORKDIR /app

RUN npm install -g turbo
COPY . .
RUN turbo prune @doorli/ai-service --docker

FROM base AS installer
WORKDIR /app
COPY --from=base /app/out/json/ .
COPY --from=base /app/out/package-lock.json ./package-lock.json
RUN npm install

COPY --from=base /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@doorli/ai-service

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 4008
CMD ["npm", "run", "start", "--workspace=services/ai-service"]
