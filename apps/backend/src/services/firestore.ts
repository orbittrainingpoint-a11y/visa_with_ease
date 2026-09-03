import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Looked up once per process. `null` means "no real Firestore available —
// callers should fall back to the in-memory mock" rather than throwing, so a
// machine with no credentials configured still runs the app in demo mode.
let db: Firestore | null | undefined;

function resolveServiceAccountPath(): string | null {
  const explicit = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (explicit) return existsSync(explicit) ? explicit : null;
  // Default location documented in the setup guide: apps/backend/firebase-service-account.json
  const defaultPath = path.resolve(__dirname, '../../firebase-service-account.json');
  return existsSync(defaultPath) ? defaultPath : null;
}

function initialize(): Firestore | null {
  // Contract tests set this so they run against the deterministic in-memory
  // mock instead of real, shared, cross-run Firestore data.
  if (process.env.FIRESTORE_DISABLED === 'true') return null;
  try {
    if (getApps().length === 0) {
      const keyPath = resolveServiceAccountPath();
      if (keyPath) {
        initializeApp({ credential: cert(keyPath) });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Set by `gcloud auth application-default login` (or a GCP-hosted runtime's
        // attached service account) — no key file needed on disk.
        initializeApp({
          credential: applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        return null;
      }
    }
    return getFirestore();
  } catch (err) {
    console.warn('[firestore] failed to initialize — falling back to in-memory store:', (err as Error).message);
    return null;
  }
}

/** Returns the real Firestore client, or `null` if no credentials are configured. */
export function getDb(): Firestore | null {
  if (db === undefined) {
    db = initialize();
    if (db) {
      // initializeApp()/getFirestore() succeed synchronously even with bad
      // credentials — the actual auth failure only surfaces on the first real
      // call. Ping once at startup so a misconfigured deployment gets a loud,
      // immediate warning instead of silent 500s on every request with no
      // clue why.
      // A real collection name — Firestore rejects "__reserved__"-style ids
      // as invalid, so this can't just be a made-up sentinel name.
      db.collection('applications').limit(1).get().catch((err) => {
        console.error(
          '[firestore] connected but a test query failed — check your credentials are valid and not expired:',
          (err as Error).message
        );
      });
    }
  }
  return db;
}

export function isFirestoreConfigured(): boolean {
  return getDb() !== null;
}
