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
  /** For role 'consultant': which marketplace consultant this login is (set by a platform admin). */
  consultantId?: string;
  createdAt?: string;
  /** Marks a record that was never a real signup (the built-in demo login
   *  account, canned audit-log entries below) so admin views can show it's
   *  not real user activity instead of it being indistinguishable. */
  source?: 'seed';
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
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    source: 'seed'
  };
}

// ── In-memory fallback (used whenever Firestore isn't configured) ─────────
const memUsers = new Map<string, UserRecord>([[DEMO_EMAIL, demoUser()]]);
const memOtps = new Map<string, { code: string; expiresAt: number }>();
const memTwoFactor = new Set<string>();
const memReadNotifications = new Map<string, Set<string>>();
const memWebhooks = new Map<string, { url: string; events: string[]; createdAt: string }>();
// These 3 rows exist purely to demo the audit-log UI in a fresh in-memory
// environment with no real activity yet — `source: 'seed'` marks them so
// GET /admin/audit-log doesn't present them as real activity that occurred.
const memAuditLog: Array<{ id: string; actor: string; action: string; resource: string; at: string; ip: string; source?: 'seed' }> = [
  { id: 'al-001', actor: 'admin@demo.visawithease.app', action: 'LOGIN', resource: 'auth', at: new Date(Date.now() - 120000).toISOString(), ip: '127.0.0.1', source: 'seed' },
  { id: 'al-002', actor: 'admin@demo.visawithease.app', action: 'VIEW_USERS', resource: '/admin/users', at: new Date(Date.now() - 90000).toISOString(), ip: '127.0.0.1', source: 'seed' },
  { id: 'al-003', actor: 'hr@demo.visawithease.app', action: 'VIEW_HR', resource: '/hr', at: new Date(Date.now() - 3600000).toISOString(), ip: '10.0.0.1', source: 'seed' }
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

export async function listAuditLog(): Promise<Array<{ id: string; actor: string; action: string; resource: string; at: string; ip: string; source?: 'seed' }>> {
  const db = getDb();
  if (!db) return memAuditLog.slice().reverse();
  const snap = await db.collection('auditLog').orderBy('at', 'desc').limit(200).get();
  return snap.docs.map((doc) => doc.data() as { id: string; actor: string; action: string; resource: string; at: string; ip: string; source?: 'seed' });
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

/** Every documentId ever claimed for this application — lets /documents show
 *  the real set of uploads instead of a fabricated count-based list. */
export async function listAuditOwnerDocumentIds(applicationId: string): Promise<string[]> {
  const db = getDb();
  if (!db) {
    return [...memAuditOwners.entries()].filter(([, appId]) => appId === applicationId).map(([docId]) => docId);
  }
  const snap = await db.collection('auditOwners').where('applicationId', '==', applicationId).get();
  return snap.docs.map(d => d.id);
}

// Which documentIds actually have their original file persisted in Storage
// (as opposed to just an AI-computed result) — separate from auditOwners
// since a document can be audited (via imageBase64 in the request) without
// Storage being configured/enabled on this project at all.
const memDocumentFiles = new Map<string, string>();

export async function saveDocumentFilePath(documentId: string, storagePath: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memDocumentFiles.set(documentId, storagePath);
    return;
  }
  await db.collection('documentFiles').doc(documentId).set({ storagePath });
}

export async function getDocumentFilePath(documentId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return memDocumentFiles.get(documentId) ?? null;
  const doc = await db.collection('documentFiles').doc(documentId).get();
  return doc.exists ? ((doc.data()?.storagePath as string) ?? null) : null;
}

// Real push notifications need a real device token to send to — this is
// where the mobile app's token (registered after the user grants
// notification permission) lives. Keyed by the token itself (not uid) so a
// user with multiple devices gets a push on all of them, and so the same
// physical device re-registering just overwrites its own prior entry.
const memDeviceTokens = new Map<string, { uid: string; platform: string }>();

export async function saveDeviceToken(uid: string, token: string, platform: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memDeviceTokens.set(token, { uid, platform });
    return;
  }
  await db.collection('deviceTokens').doc(token).set({ uid, platform, updatedAt: new Date().toISOString() });
}

export async function getDeviceTokensForUser(uid: string): Promise<string[]> {
  const db = getDb();
  if (!db) {
    return [...memDeviceTokens.entries()].filter(([, v]) => v.uid === uid).map(([token]) => token);
  }
  const snap = await db.collection('deviceTokens').where('uid', '==', uid).get();
  return snap.docs.map(d => d.id);
}

/** Called when FCM reports a token as invalid/unregistered — stale tokens
 *  (app uninstalled, permission revoked) must not accumulate forever. */
export async function removeDeviceToken(token: string): Promise<void> {
  const db = getDb();
  if (!db) {
    memDeviceTokens.delete(token);
    return;
  }
  await db.collection('deviceTokens').doc(token).delete();
}

// Real consultant↔client messages. threadId = `${consultantId}__${clientUid}`
// so a thread's identity is derivable without a separate "create thread"
// step. Flat storage (no separate threads collection) — thread summaries are
// computed by grouping messages, same tradeoff as auditOwners above.
export interface StoredMessage {
  id: string;
  threadId: string;
  consultantId: string;
  clientUid: string;
  clientName: string;
  senderRole: 'client' | 'consultant';
  text: string;
  createdAt: string;
}

const memMessages: StoredMessage[] = [];

export async function saveMessage(message: StoredMessage): Promise<void> {
  const db = getDb();
  if (!db) {
    memMessages.push(message);
    return;
  }
  await db.collection('messages').doc(message.id).set(message);
}

export async function listMessagesForThread(threadId: string): Promise<StoredMessage[]> {
  const db = getDb();
  if (!db) {
    return memMessages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  // Sorted here: filtering on threadId AND ordering by createdAt would need a composite Firestore index.
  const snap = await db.collection('messages').where('threadId', '==', threadId).get();
  return snap.docs.map((d) => d.data() as StoredMessage).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every message on file, oldest first — callers group by threadId
 *  themselves to build per-thread summaries (platform-wide; see
 *  listActiveGrants for why there's no per-consultant scoping yet). */
export async function listAllMessages(): Promise<StoredMessage[]> {
  const db = getDb();
  if (!db) {
    return memMessages.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const snap = await db.collection('messages').orderBy('createdAt', 'asc').get();
  return snap.docs.map((d) => d.data() as StoredMessage);
}

// Real persistence for account-deletion requests. This does NOT purge any
// data by itself — there is no scheduled job in this codebase to actually
// erase records once scheduledFor passes, that's a separate infra piece
// (a real cron/scheduled task on the server). What this DOES make real: the
// record actually exists (unlike before, when "scheduled" meant nothing was
// written anywhere), it can be checked, and it's genuinely cancelled if the
// user logs back in before scheduledFor — matching what /auth/delete-account
// tells the user.
export interface AccountDeletionRecord {
  uid: string;
  requestedAt: string;
  scheduledFor: string;
  status: 'pending' | 'cancelled' | 'completed';
}

const memDeletionRequests = new Map<string, AccountDeletionRecord>();

export async function scheduleAccountDeletion(uid: string, scheduledFor: string): Promise<AccountDeletionRecord> {
  const record: AccountDeletionRecord = { uid, requestedAt: new Date().toISOString(), scheduledFor, status: 'pending' };
  const db = getDb();
  if (!db) {
    memDeletionRequests.set(uid, record);
    return record;
  }
  await db.collection('accountDeletions').doc(uid).set(record);
  return record;
}

export async function getAccountDeletionStatus(uid: string): Promise<AccountDeletionRecord | null> {
  const db = getDb();
  if (!db) return memDeletionRequests.get(uid) ?? null;
  const doc = await db.collection('accountDeletions').doc(uid).get();
  return doc.exists ? (doc.data() as AccountDeletionRecord) : null;
}

/** Marks a request as carried out once the account's data has actually been erased. */
export async function completeAccountDeletion(uid: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const existing = memDeletionRequests.get(uid);
    if (existing) memDeletionRequests.set(uid, { ...existing, status: 'completed' });
    return;
  }
  await db.collection('accountDeletions').doc(uid).set({ status: 'completed' }, { merge: true });
}

/** Removes the login record itself. */
export async function deleteUserByUid(uid: string): Promise<boolean> {
  const db = getDb();
  if (!db) {
    for (const [key, user] of memUsers) {
      if (user.uid === uid) { memUsers.delete(key); return true; }
    }
    return false;
  }
  const snap = await db.collection('users').where('uid', '==', uid).limit(1).get();
  if (snap.empty) return false;
  await snap.docs[0].ref.delete();
  return true;
}

/** Called on successful login — makes "cancel by logging in" literally true. */
export async function cancelAccountDeletion(uid: string): Promise<void> {
  const db = getDb();
  if (!db) {
    const existing = memDeletionRequests.get(uid);
    if (existing && existing.status === 'pending') memDeletionRequests.set(uid, { ...existing, status: 'cancelled' });
    return;
  }
  const doc = await db.collection('accountDeletions').doc(uid).get();
  if (doc.exists && (doc.data() as AccountDeletionRecord).status === 'pending') {
    await doc.ref.set({ status: 'cancelled' }, { merge: true });
  }
}

/** Real count for the admin "Deletion SLA queue" metric — pending requests
 *  whose scheduledFor date has already passed with nothing having purged
 *  them (there's no purge job yet, so this number can only ever grow until
 *  one exists — that's an honest reflection of the current gap, not a bug). */
export async function listOverduePendingDeletions(): Promise<AccountDeletionRecord[]> {
  const db = getDb();
  const nowIso = new Date().toISOString();
  if (!db) {
    return [...memDeletionRequests.values()].filter((r) => r.status === 'pending' && r.scheduledFor < nowIso);
  }
  // One equality filter only: combining it with a range on scheduledFor needs a composite Firestore index that
  // was never created, which made this (and the hourly purge job) fail. The date check is done here instead.
  const snap = await db.collection('accountDeletions').where('status', '==', 'pending').get();
  return snap.docs.map((d) => d.data() as AccountDeletionRecord).filter((r) => r.scheduledFor < nowIso);
}

// Real referral codes and claims. A code is deterministic per uid (so it
// never changes across requests) but the code -> owner mapping is persisted
// the first time it's generated, since the encoding (uppercased, truncated
// to 8 chars) is lossy and can't be reversed back to the original uid.
const memReferralCodeByUid = new Map<string, string>();
const memReferralCodeOwner = new Map<string, string>();
export interface ReferralClaim {
  code: string;
  referrerUid: string;
  claimedByUid: string;
  claimedByEmail: string;
  claimedAt: string;
}
const memReferralClaims = new Map<string, ReferralClaim>(); // keyed by claimedByUid — one claim per user, ever

function computeReferralCode(uid: string): string {
  return `REF-${uid.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
}

export async function getOrCreateReferralCode(uid: string): Promise<string> {
  const db = getDb();
  if (!db) {
    let code = memReferralCodeByUid.get(uid);
    if (!code) {
      code = computeReferralCode(uid);
      memReferralCodeByUid.set(uid, code);
      memReferralCodeOwner.set(code, uid);
    }
    return code;
  }
  const doc = await db.collection('referralCodesByUid').doc(uid).get();
  if (doc.exists) return doc.data()?.code as string;
  const code = computeReferralCode(uid);
  await db.collection('referralCodesByUid').doc(uid).set({ code });
  await db.collection('referralCodes').doc(code).set({ ownerUid: uid });
  return code;
}

export async function getReferralCodeOwner(code: string): Promise<string | null> {
  const db = getDb();
  if (!db) return memReferralCodeOwner.get(code) ?? null;
  const doc = await db.collection('referralCodes').doc(code).get();
  return doc.exists ? ((doc.data()?.ownerUid as string) ?? null) : null;
}

/** null when this user has never claimed a code — one claim per user, ever. */
export async function getReferralClaimForUser(uid: string): Promise<ReferralClaim | null> {
  const db = getDb();
  if (!db) return memReferralClaims.get(uid) ?? null;
  const doc = await db.collection('referralClaims').doc(uid).get();
  return doc.exists ? (doc.data() as ReferralClaim) : null;
}

export async function recordReferralClaim(claim: ReferralClaim): Promise<void> {
  const db = getDb();
  if (!db) {
    memReferralClaims.set(claim.claimedByUid, claim);
    return;
  }
  await db.collection('referralClaims').doc(claim.claimedByUid).set(claim);
}

export async function listReferralClaimsForReferrer(referrerUid: string): Promise<ReferralClaim[]> {
  const db = getDb();
  if (!db) return [...memReferralClaims.values()].filter((c) => c.referrerUid === referrerUid);
  const snap = await db.collection('referralClaims').where('referrerUid', '==', referrerUid).get();
  return snap.docs.map((d) => d.data() as ReferralClaim);
}

// ── Face verification ─────────────────────────────────────────────────────
// One face per account. The template (the SDK's face-feature string) is what makes the lock real: a
// second, different face can never replace it from the app; only a platform admin can reset it.
export interface FaceProfile {
  uid: string;
  /** SDK face-feature string of the enrolled live face. Only ever returned to its owner. */
  faceFeature: string;
  /** Live selfie vs the passport photo, 0-1. */
  passportSimilarity: number;
  liveness: number;
  /** Liveness steps completed during enrolment, e.g. ['blink', 'turn_left', 'turn_right']. */
  steps: string[];
  enrolledAt: string;
  lastVerifiedAt: string;
  verifiedCount: number;
}
const memFaceProfiles = new Map<string, FaceProfile>();

export async function getFaceProfile(uid: string): Promise<FaceProfile | null> {
  const db = getDb();
  if (!db) return memFaceProfiles.get(uid) ?? null;
  const doc = await db.collection('faceProfiles').doc(uid).get();
  return doc.exists ? (doc.data() as FaceProfile) : null;
}

export async function saveFaceProfile(profile: FaceProfile): Promise<void> {
  const db = getDb();
  if (!db) { memFaceProfiles.set(profile.uid, profile); return; }
  await db.collection('faceProfiles').doc(profile.uid).set(profile);
}

export async function deleteFaceProfile(uid: string): Promise<boolean> {
  const db = getDb();
  if (!db) return memFaceProfiles.delete(uid);
  const ref = db.collection('faceProfiles').doc(uid);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}

// ── Passport data read from a scanned passport (the client's own view and, with consent, a consultant's) ──
const memPassportData = new Map<string, { applicationId: string; data: unknown }>();

export async function savePassportData(documentId: string, applicationId: string, data: unknown): Promise<void> {
  const db = getDb();
  if (!db) { memPassportData.set(documentId, { applicationId, data }); return; }
  await db.collection('passportData').doc(documentId).set({ applicationId, data });
}

/** Passport details are personal data: they go when the application does. */
export async function deletePassportDataForApplication(applicationId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    for (const [id, v] of memPassportData) if (v.applicationId === applicationId) memPassportData.delete(id);
    return;
  }
  const snap = await db.collection('passportData').where('applicationId', '==', applicationId).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

export async function getPassportDataForApplication(applicationId: string): Promise<unknown | null> {
  const db = getDb();
  if (!db) {
    const found = [...memPassportData.values()].find((v) => v.applicationId === applicationId);
    return found?.data ?? null;
  }
  const snap = await db.collection('passportData').where('applicationId', '==', applicationId).limit(1).get();
  return snap.empty ? null : ((snap.docs[0].data() as { data: unknown }).data ?? null);
}

// ── Consultant identity ────────────────────────────────────────────────────
// The built-in demo consultant login maps to a real marketplace consultant so the consultant
// workspace can be exercised; real consultant accounts are linked by a platform admin.
const DEMO_CONSULTANTS: Record<string, string> = { 'consultant@demo.visawithease.app': 'c-priya' };

export async function resolveConsultantId(user: { email?: string; uid: string }): Promise<string | null> {
  if (!user.email) return null;
  const demo = DEMO_CONSULTANTS[user.email.toLowerCase()];
  if (demo) return demo;
  const record = await getUserByEmail(user.email);
  return record?.consultantId ?? null;
}

export async function setUserConsultantId(email: string, consultantId: string | null): Promise<boolean> {
  const key = email.toLowerCase();
  // Linking a login to a consultant profile is what makes it a consultant: it gains the 'consultant' role
  // (kept alongside 'consumer', so the same person can also use the app as a client); unlinking removes it.
  const withRole = (roles: string[]) => {
    const rest = roles.filter((r) => r !== 'consultant');
    return consultantId ? [...rest, 'consultant'] : rest;
  };
  const db = getDb();
  if (!db) {
    const u = memUsers.get(key);
    if (!u) return false;
    const next = { ...u, roles: withRole(u.roles) };
    if (consultantId) next.consultantId = consultantId; else delete next.consultantId;
    memUsers.set(key, next);
    return true;
  }
  const ref = db.collection('users').doc(key);
  const doc = await ref.get();
  if (!doc.exists) return false;
  const current = (doc.data() as UserRecord).roles ?? ['consumer'];
  await ref.set({ consultantId: consultantId ?? null, roles: withRole(current) }, { merge: true });
  return true;
}
