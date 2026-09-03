# Build context is the repo root (see docker-compose.yml) — the whole
# monorepo is copied in because pnpm's lockfile covers every workspace
# package at once; installing against a partial copy risks a
# --frozen-lockfile mismatch.
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile

# Build-time env (VITE_* vars are baked into the JS bundle, not read at
# runtime) — pass with --build-arg when building the image, e.g.:
#   docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
#                --build-arg VITE_GOOGLE_WEB_CLIENT_ID=... -f apps/web/Dockerfile .
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_WEB_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_WEB_CLIENT_ID=$VITE_GOOGLE_WEB_CLIENT_ID

RUN pnpm --filter @visaiq/web build

# ---- Serve the static build with nginx ----
FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
