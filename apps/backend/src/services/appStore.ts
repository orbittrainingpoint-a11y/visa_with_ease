import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getDb } from './firestore.js';

/**
 * Persistence for everything app.ts keeps outside the `Services` abstraction:
 * user credentials, email-verification/2FA OTPs, 2FA enrollment, per-user
 * notification read-state, webhooks, and the admin audit log. Each function
 * uses real Firestore when configured, and an in-memory Map/Set otherwise —
 * so local/demo mode behaves exactly as it did before this file existed.
 */

export interface UserRecord {
  uid: string;
  email: string;
  name: string;
  passwordHash: string;
  roles: string[];
  status?: 'active' | 'suspended';
  createdAt?: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const candidateBuf = scryptSync(password, salt, 64);
  if (hashBuf.length !== candidateBuf.length) return false;
  return timingSafeEqual(hashBuf, candidateBuf);
}

const DEMO_EMAIL = 'sarah.mathew@example.com';
function demoUser(): UserRecord {
  return {
    uid: `user-${Buffer.from(DEMO_EMAIL).toString('base64url').slice(0, 12)}`,
    email: DEMO_EMAIL,
    name: 'Sarah Mathew',
    passwordHash: hashPassword('demo1234'),
    roles: ['consumer'],
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  };
}

// ── In-memory fallback (used whenever Firestore isn't configured) ─────────
const memUsers = new Map<string, UserRecord>([[DEMO_EMAIL, demoUser()]]);
const memOtps = new Map<string, { code: string; expiresAt: number }>();
const memTwoFactor = new Set<string>();
const memReadNotifications = new Map<string, Set<string>>();
const memWebhooks = new Map<string, { url: string; events: string[]; createdAt: string }>();
const memAuditLog: Array<{ id: string; actor: string; action: string; resource: string; at: string; ip: string }> = [
  { id: 'al-001', actor: 'admin@demo.visawithease.app', action: 'LOGIN', resource: 'auth', at: new Date(Date.now() - 120000).toISOString(), ip: '127.0.0.1' },
  { id: 'al-002', actor: 'admin@demo.visawithease.app', action: 'VIEW_USERS', resource: '/admin/users', at: new Date(Date.now() - 90000).toISOString(), ip: '127.0.0.1' },
  { id: 'al-003', actor: 'hr@demo.visawithease.app', action: 'VIEW_HR', resource: '/hr', at: new Date(Date.now() - 3600000).toISOString(), ip: '10.0.0.1' }
];

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const key = email.toLowerCase();
  const db = getDb();
  if (!db) return memUsers.get(key) ?? null;
  if (key === DEMO_EMAIL) {
    const doc = await db.collection('users').doc(key).get();
    if (!doc.exists) {
      const seeded = demoUser();
      await db.collection('users').doc(key).set(seeded);
      return seeded;
    }
    return doc.data() as UserRecord;
  }
  const doc = await db.collection('users').doc(key).get();
  return doc.exists ? (doc.data() as UserRecord) : null;
}

export async function createUser(record: UserRecord): Promise<void> {
  const key = record.email.toLowerCase();
  const full: UserRecord = { status: 'active', createdAt: new Date().toISOString(), ...record };
  const db = getDb();
  if (!db) {
    memUsers.set(key, full);
    return;
  }
  await db.collection('users').doc(key).set(full);
}

export async function listUsers(): Promise<UserRecord[]> {
  const db = getDb();
  if (!db) return [...memUsers.values()];
  const snap = await db.collection('users').get();
  return snap.docs.map((doc) => doc.data() as UserRecord);
}

export async function setUserStatus(uid: string, status: 'active' | 'suspended'): Promise<UserRecord | null> {
  const db = getDb();
  if (!db) {
    for (const [key, user] of memUsers) {
      if (user.uid === uid) {
        const updated = { ...user, status };
        memUsers.set(key, updated);
        return updated;
      }
    }
    return null;
  }
  const snap = await db.collection('users').where('uid', '==', uid).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  await doc.ref.set({ status }, { merge: true });
  return { ...(doc.data() as UserRecord), status };
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
  const key = email.toLowerCase();
  const db = getDb();
  if (!db) {
    const existing = memUsers.get(key);
    if (!existing) return false;
    memUsers.set(key, { ...existing, passwordHash });
    return true;
  }
  const doc = await db.collection('users').doc(key).get();
  if (!doc.exists) return false;
  await doc.ref.set({ passwordHash }, { merge: true });
  return true;
}

const memResetTokens = new Map<string, { email: string; expiresAt: number }>();

export async function setResetToken(token: string, entry: { email: string; expiresAt: number }): Promise<void> {
  const db = getDb();
  if (!db) {
    memResetTokens.set(token, entry);
    return;
  }
  await db.collection('resetTokens').doc(token).set(entry);
}

export async function getResetToken(token: string): Promise<{ email: string; expiresAt: number } | null> {
  const db = getDb();
  if (!db) return memResetTokens.get(token) ?? null;
  const doc = await db.collection('resetTokens').doc(token).get();
  return doc.exists ? (doc.data() as { email: string; expiresAt: number }) : null;
}

export async function deleteResetToken(token: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memResetTokens.delete(token);
    return;
  }
  await db.collection('resetTokens').doc(token).delete();
}

export async function getOtp(email: string): Promise<{ code: string; expiresAt: number } | null> {
  const db = getDb();
  if (!db) return memOtps.get(email) ?? null;
  const doc = await db.collection('otps').doc(email).get();
  return doc.exists ? (doc.data() as { code: string; expiresAt: number }) : null;
}

export async function setOtp(email: string, entry: { code: string; expiresAt: number }): Promise<void> {
  const db = getDb();
  if (!db) {
    memOtps.set(email, entry);
    return;
  }
  await db.collection('otps').doc(email).set(entry);
}

export async function deleteOtp(email: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memOtps.delete(email);
    return;
  }
  await db.collection('otps').doc(email).delete();
}

export async function has2FA(uid: string): Promise<boolean> {
  const db = getDb();
  if (!db) return memTwoFactor.has(uid);
  const doc = await db.collection('twoFactor').doc(uid).get();
  return doc.exists;
}

export async function enable2FA(uid: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memTwoFactor.add(uid);
    return;
  }
  await db.collection('twoFactor').doc(uid).set({ enabledAt: new Date().toISOString() });
}

export async function disable2FA(uid: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memTwoFactor.delete(uid);
    return;
  }
  await db.collection('twoFactor').doc(uid).delete();
}

export async function isNotificationRead(uid: string, id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return memReadNotifications.get(uid)?.has(id) ?? false;
  const doc = await db.collection('notificationReads').doc(uid).get();
  const ids = (doc.exists ? (doc.data()?.ids as string[]) : []) ?? [];
  return ids.includes(id);
}

export async function markNotificationRead(uid: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) {
    let set = memReadNotifications.get(uid);
    if (!set) {
      set = new Set();
      memReadNotifications.set(uid, set);
    }
    set.add(id);
    return;
  }
  const ref = db.collection('notificationReads').doc(uid);
  const doc = await ref.get();
  const ids = new Set<string>((doc.exists ? (doc.data()?.ids as string[]) : []) ?? []);
  ids.add(id);
  await ref.set({ ids: [...ids] });
}

export async function listWebhooksForUser(uid: string): Promise<Array<{ id: string; url: string; events: string[]; createdAt: string }>> {
  const db = getDb();
  if (!db) {
    return [...memWebhooks.entries()]
      .filter(([key]) => key.startsWith(`${uid}-wh-`))
      .map(([id, wh]) => ({ id, ...wh }));
  }
  const snap = await db.collection('webhooks').where('uid', '==', uid).get();
  return snap.docs.map((doc) => {
    const { uid: _uid, ...rest } = doc.data() as { uid: string; url: string; events: string[]; createdAt: string };
    return { id: doc.id, ...rest };
  });
}

export async function createWebhook(uid: string, webhook: { url: string; events: string[]; createdAt: string }): Promise<string> {
  const db = getDb();
  const id = `${uid}-wh-${Date.now()}`;
  if (!db) {
    memWebhooks.set(id, webhook);
    return id;
  }
  await db.collection('webhooks').doc(id).set({ ...webhook, uid });
  return id;
}

export async function appendAuditLog(entry: { actor: string; action: string; resource: string; ip: string }): Promise<void> {
  const record = { id: `al-${Date.now()}`, at: new Date().toISOString(), ...entry };
  const db = getDb();
  if (!db) {
    memAuditLog.push(record);
    return;
  }
  await db.collection('auditLog').doc(record.id).set(record);
}

export async function listAuditLog(): Promise<Array<{ id: string; actor: string; action: string; resource: string; at: string; ip: string }>> {
  const db = getDb();
  if (!db) return memAuditLog.slice().reverse();
  const snap = await db.collection('auditLog').orderBy('at', 'desc').limit(200).get();
  return snap.docs.map((doc) => doc.data() as { id: string; actor: string; action: string; resource: string; at: string; ip: string });
}

// Which application a given audit documentId belongs to — recorded when an
// upload slot is created or an audit is enqueued (the points where ownership
// of applicationId is already verified), consulted when reading the audit
// result back so a caller can't read another user's findings by guessing a
// docId. A docId with no recorded owner (e.g. a canned demo id nothing was
// ever enqueued for) is left open, matching today's "hit any docId to see a
// demo result" behavior.
//
// documentId is client-chosen and not guaranteed unique across users/apps
// (mobile's camera-capture path, for example, used to send the same literal
// "doc-passport" for every user). claimAuditOwner is first-claim-wins: once a
// documentId is bound to one application, no *different* application can
// rebind it — without this, a second user could send the same documentId
// under their own application and silently take over (read) the first
// user's audit result, defeating the ownership check entirely.
const memAuditOwners = new Map<string, string>();

export async function claimAuditOwner(documentId: string, applicationId: string): Promise<boolean> {
  const existing = await getAuditOwnerApplication(documentId);
  if (existing && existing !== applicationId) return false;
  const db = getDb();
  if (!db) {
    memAuditOwners.set(documentId, applicationId);
    return true;
  }
  await db.collection('auditOwners').doc(documentId).set({ applicationId });
  return true;
}

export async function getAuditOwnerApplication(documentId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return memAuditOwners.get(documentId) ?? null;
  const doc = await db.collection('auditOwners').doc(documentId).get();
  return doc.exists ? ((doc.data()?.applicationId as string) ?? null) : null;
}
