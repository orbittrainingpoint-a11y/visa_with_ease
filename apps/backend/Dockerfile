# Backend runs on plain Node's built-in TypeScript execution (type-stripping,
# on by default since Node 23.6), which MUST stay on Node 24+ — Node 20/22
# fail immediately with "Unknown file extension .ts". Node also refuses to
# strip types for any .ts file that resolves to a path under node_modules
# (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING) — `pnpm deploy` below copies
# workspace packages into node_modules rather than symlinking to the real
# packages/ directory outside it, which is exactly that case. That's why
# @visaiq/contracts and @visaiq/mock-data are built to real dist/*.js here
# instead of being consumed as raw .ts source — building them is required,
# not optional, for this image to start at all.
#
# Build context is the repo root (see docker-compose.yml) and the whole
# monorepo is copied in — pnpm's lockfile is a single file for all workspace
# packages, so installing against only a subset of them risks a
# --frozen-lockfile mismatch.
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @visaiq/contracts build
RUN pnpm --filter @visaiq/mock-data build
RUN pnpm --filter @visaiq/backend build
RUN pnpm --filter @visaiq/backend deploy --prod /out

# ---- Runtime image ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
EXPOSE 3001
CMD ["node", "dist/server.js"]
