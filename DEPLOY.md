# Deploying to your VPS

Two containers: `backend` (Node/Express on port 3001) and `web` (static build served by nginx on port 8080). Neither terminates TLS — put your own reverse proxy (nginx, Caddy, whatever's already on the VPS) in front, pointed at a real domain.

## One-time setup on the VPS

1. Install Docker + Docker Compose plugin if not already there.
2. Clone this repo onto the VPS.
3. Copy env templates and fill in real values:
   ```
   cp apps/backend/.env.production.example apps/backend/.env.production
   cp .env.production.example .env
   ```
   Fill in: `JWT_SECRET` (generate a real one — command's in the file), `CORS_ORIGINS` (your real domain), `GOOGLE_WEB_CLIENT_ID` (already prefilled — confirm your domain is added to that client's Authorized JavaScript origins in Google Cloud Console), and `VITE_API_BASE_URL` (the public URL your reverse proxy will expose the backend at).
4. Drop your real Firebase service-account JSON at `apps/backend/firebase-service-account.json` (gitignored — copy it over separately, never commit it). Without this the backend runs on an in-memory store that resets every restart.

## Build and run

```
docker compose build
docker compose up -d
```

Backend health check: `curl http://localhost:3001/health` should return `{"status":"ok"}`.
Web: `curl -I http://localhost:8080` should return `200`.

## Reverse proxy

Point your existing VPS reverse proxy at:
- `https://api.yourdomain.com` → `http://localhost:3001`
- `https://yourdomain.com` → `http://localhost:8080`

Use Let's Encrypt (certbot, or Caddy's automatic HTTPS) for TLS on both.

## Updating a running deployment

```
git pull
docker compose build
docker compose up -d
```

## Important — Node version

The backend runs on Node's built-in TypeScript execution (no separate transpile step for its workspace dependencies), which needs **Node 24+**. The Dockerfile already pins `node:24-alpine`, so this only matters if you ever run the backend outside Docker directly on the VPS — check `node --version` is 24+ first, or it'll fail immediately with `Unknown file extension ".ts"`.

## What's still a placeholder after this deploys

Everything runs, but these features are honestly labeled "coming soon" in the UI until wired (see project task list): real payment processing (Stripe), real email delivery (OTP/reset codes currently return in the API response instead of being emailed), real push notifications, and real file storage for document uploads (currently a stub URL). None of these block getting the app live — they block specific features working for real.
