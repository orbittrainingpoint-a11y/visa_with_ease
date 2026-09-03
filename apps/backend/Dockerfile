# Backend runs on plain Node's built-in TypeScript execution (type-stripping,
# on by default since Node 23.6) — the two workspace packages this service
# imports (@visaiq/contracts, @visaiq/mock-data) point their package.json
# "main" straight at src/*.ts, so this MUST stay on Node 24+. Node 20/22 will
# fail to start with "Unknown file extension .ts".
#
# Build context is the repo root (see docker-compose.yml) and the whole
# monorepo is copied in — pnpm's lockfile is a single file for all workspace
# packages, so installing against only a subset of them risks a
# --frozen-lockfile mismatch. `pnpm deploy` below is what actually trims this
# down to a lean, backend-only output.
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @visaiq/backend build
RUN pnpm --filter @visaiq/backend deploy --prod /out

# ---- Runtime image ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
EXPOSE 3001
CMD ["node", "dist/server.js"]
