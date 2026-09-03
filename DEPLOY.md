# Deploying to your VPS

Two containers: `backend` (Node/Express, published on host port **3011** → container port 3001) and `web` (static build served by nginx, published on host port **8081** → container port 80). Neither terminates TLS — put your own reverse proxy (nginx, Caddy, whatever's already on the VPS) in front, pointed at a real domain.

Host ports 3011/8081 aren't the app's real ports — they're just what's free on this particular VPS after checking `docker ps` / `ss -tlnp`. If you deploy to a different machine, check for conflicts first and adjust the `ports:` lines in `docker-compose.yml`.

## One-time setup on the VPS

1. Install Docker + Docker Compose plugin if not already there.
2. Clone this repo onto the VPS.
3. Copy env templates and fill in real values:
   ```
   cp apps/backend/.env.production.example apps/backend/.env.production
   cp .env.production.example .env
   ```
   Fill in: `JWT_SECRET` (generate a real one — command's in the file), `CORS_ORIGINS` (your real domain), `GOOGLE_WEB_CLIENT_ID` (already prefilled — confirm your domain is added to that client's Authorized JavaScript origins in Google Cloud Console), `SMTP_USER`/`SMTP_PASS` (Gmail App Password, for real verification/2FA/reset emails), `FRONTEND_URL` (your domain — used to build the password-reset link), and `VITE_API_BASE_URL` (the public URL your reverse proxy will expose the backend at).
4. Drop your real Firebase service-account JSON at `apps/backend/firebase-service-account.json` (gitignored — copy it over separately, never commit it). Without this the backend runs on an in-memory store that resets every restart.

## Build and run

```
docker compose build
docker compose up -d
```

Backend health check: `curl http://127.0.0.1:3011/health` should return `{"status":"ok"}`.
Web: `curl -I http://127.0.0.1:8081` should return `200` with real app HTML (not some other site's).

## Reverse proxy (path-based — one domain, no extra DNS record needed)

- `https://yourdomain.com/api/` → `http://127.0.0.1:3011/` (strip the `/api` prefix — backend routes don't have it)
- `https://yourdomain.com/` → `http://127.0.0.1:8081`

Set `VITE_API_BASE_URL=https://yourdomain.com/api` accordingly. Use Let's Encrypt (certbot, or Caddy's automatic HTTPS) for TLS.

## Updating a running deployment

```
git pull
docker compose build
docker compose up -d
```

## Important — Node version

The backend runs on Node's built-in TypeScript execution (no separate transpile step for its workspace dependencies), which needs **Node 24+**. The Dockerfile already pins `node:24-alpine`, so this only matters if you ever run the backend outside Docker directly on the VPS — check `node --version` is 24+ first, or it'll fail immediately with `Unknown file extension ".ts"`.

## What's real vs. still a placeholder

Real: email delivery (verification, 2FA, password reset) via Gmail SMTP, Google Sign-In (mobile + web), Firestore data, admin user management.

Still "coming soon" in the UI: real payment processing (Stripe unlock/Pro tier), real push notifications, and real file storage for document uploads (currently a stub URL). None of these block getting the app live — they block those specific features working for real.
