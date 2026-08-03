// Load apps/backend/.env into process.env before any other module reads
// process.env at import time (several files read config, API keys, ports,
// etc. as top-level constants). Must stay the first import in server.ts —
// ESM executes import statements in source order, so this runs to
// completion before ./app.js or ./services/* are evaluated.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — fine when real env vars are already set
  // (e.g. production, CI, or containers that inject env directly).
}
