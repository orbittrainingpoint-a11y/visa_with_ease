import { getStorage } from 'firebase-admin/storage';
import { getDb } from './firestore.js';

/**
 * Real Firebase Storage for the original uploaded document bytes — separate
 * from Firestore (which only ever held the AI's computed findings). Requires
 * the same service account as Firestore, PLUS the project must be on the
 * Blaze plan with Storage enabled — Storage is not available on Spark.
 * Every function here degrades to null/no-op when unavailable, matching the
 * rest of this codebase's "real when configured, honest no-op otherwise"
 * pattern — never throws for the caller to handle.
 */

function getBucket() {
  // getDb() also verifies the Firebase app itself is initialized (real
  // service account present) — Storage piggybacks on that same app.
  if (!getDb()) return null;
  try {
    return getStorage().bucket();
  } catch (err) {
    console.warn('[storage] getStorage() failed — Storage may not be enabled for this project:', (err as Error).message);
    return null;
  }
}

export function isStorageConfigured(): boolean {
  return getBucket() !== null;
}

/** Persists the original document bytes. Returns the storage path on
 *  success, or null if Storage isn't configured/enabled or the write failed
 *  — callers must treat null as "not stored", not as an error to surface. */
export async function saveDocumentImage(applicationId: string, documentId: string, base64: string, mimeType: string): Promise<string | null> {
  const bucket = getBucket();
  if (!bucket) return null;
  const ext = (mimeType.split('/')[1] ?? 'bin').split(';')[0].replace(/[^a-z0-9]/gi, '') || 'bin';
  const path = `documents/${applicationId}/${documentId}.${ext}`;
  try {
    const buffer = Buffer.from(base64, 'base64');
    await bucket.file(path).save(buffer, { metadata: { contentType: mimeType } });
    return path;
  } catch (err) {
    console.warn('[storage] failed to save document image:', (err as Error).message);
    return null;
  }
}

/** A short-lived signed URL for viewing the original file — generated fresh
 *  per request rather than stored, since signed URLs expire. */
export async function getSignedReadUrl(storagePath: string): Promise<string | null> {
  const bucket = getBucket();
  if (!bucket) return null;
  try {
    const [url] = await bucket.file(storagePath).getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 });
    return url;
  } catch (err) {
    console.warn('[storage] failed to sign read URL:', (err as Error).message);
    return null;
  }
}
