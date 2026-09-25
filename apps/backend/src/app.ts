import { faqCatalog, getFaq, faqReply, answerFromKnowledge, needsApplications } from './services/chatKnowledge.js';
import { createHash, randomBytes } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import {
  accessGrantRequestSchema,
  authSessionRequestSchema,
  auditRequestSchema,
  bookingRequestSchema,
  chatRequestSchema,
  requirementsOverrideSchema,
  userProfilePatchSchema,
  visaContextSchema
} from '@visaiq/contracts';
import { attachAuth, requireAuth, requireRole } from './auth.js';
import { errorHandler, notFound, traceMiddleware } from './errors.js';
import {
  appendAuditLog,
  claimAuditOwner,
  createUser,
  createWebhook,
  deleteOtp,
  deleteResetToken,
  disable2FA,
  enable2FA,
  getAuditOwnerApplication,
  getOrCreateReferralCode,
  getOtp,
  getReferralClaimForUser,
  getReferralCodeOwner,
  getResetToken,
  getUserByEmail,
  has2FA,
  hashPassword,
  getDocumentFilePath,
  isNotificationRead,
  listAuditLog,
  listAuditOwnerDocumentIds,
  listReferralClaimsForReferrer,
  listUsers,
  recordReferralClaim,
  saveDeviceToken,
  saveDocumentFilePath,
  listWebhooksForUser,
  markNotificationRead,
  setOtp,
  setResetToken,
  setUserStatus,
  updateUserPassword,
  verifyPassword,
  scheduleAccountDeletion,
  getAccountDeletionStatus,
  cancelAccountDeletion,
  listOverduePendingDeletions,
  getFaceProfile,
  saveFaceProfile,
  deleteFaceProfile,
  deletePassportDataForApplication,
  deleteUserByUid,
  completeAccountDeletion,
  savePassportData,
  getPassportDataForApplication,
  resolveConsultantId,
  setUserConsultantId
} from './services/appStore.js';
import { createMeetEvent, isMeetConfigured, joinWindow } from './services/meetings.js';
import { parsePassportData } from './services/passportMrz.js';
import { isEmailConfigured, send2faCodeEmail, sendPasswordResetEmail, sendVerificationEmail } from './services/email.js';
import { isFirestoreConfigured } from './services/firestore.js';
import { getSignedReadUrl, saveDocumentImage } from './services/storage.js';
import { createServices, providerHealth } from './services/index.js';
import type { Services } from './services/types.js';
import { validateBody, validateVisaContextBody } from './validation.js';

function signToken(payload: { uid: string; email: string; roles: string[] }, expiresIn: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // No fallback: an unsigned/opaque token would be trivially forgeable by anyone
    // who knows a victim's email. JWT_SECRET must be configured in every environment.
    throw new Error('JWT_SECRET is not configured — refusing to issue an unsigned token');
  }
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn } as jwt.SignOptions);
}

// User credentials, OTPs, 2FA enrollment, notification read-state, webhooks,
// and the audit log all live in ./services/appStore.js now — real Firestore
// when configured, the same in-memory behavior as before otherwise.

// RATE_LIMIT_DISABLED=true bypasses rate limiting for test environments —
// fail-closed like ENABLE_DEMO_LOGIN/ENABLE_DEV_AUTH_BYPASS: NODE_ENV
// === 'production' always wins regardless of the flag, so a leftover test
// env var can't silently strip brute-force protection off a live deployment.
// Warn loudly at startup too, since this stays silent otherwise.
function isRateLimitDisabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.RATE_LIMIT_DISABLED === 'true';
}
if (process.env.RATE_LIMIT_DISABLED === 'true' && process.env.NODE_ENV !== 'production') {
  console.warn('[security] RATE_LIMIT_DISABLED=true — auth/audit rate limiting is OFF. This must never be set on a real deployment.');
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled(),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } }
});

// Each /audit call can trigger a real, billed Gemini vision request — a
// higher ceiling than auth (people legitimately upload several documents
// per application) but still bounded so a runaway client can't rack up
// unbounded AI spend.
const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled(),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many document scans, please try again later' } }
});

// /chat had NO rate limit at all until this was added — every message
// triggers a real, billed Claude/Gemini call once AI_MOCK=false, so an
// authenticated user (or a leaked/scripted token) could otherwise hammer it
// as fast as the network allows with no cap on the resulting AI spend. 60
// per 15 minutes covers a genuinely active back-and-forth conversation
// (~4/min sustained) while bounding a scripted flood.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled(),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many messages, please slow down and try again shortly' } }
});

// Face and call-link routes: cheap, but they touch biometric data and (once configured) create Google Meet rooms.
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitDisabled(),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } }
});

export function createApp(services: Services = createServices()) {
  const app = express();

  // Deployed behind exactly one reverse proxy hop (the VPS's own nginx/Caddy
  // terminating TLS — see DEPLOY.md), so trust exactly one hop of
  // X-Forwarded-For. Without this, req.ip resolves to the proxy's own address
  // for every request: authLimiter/auditLimiter's per-IP caps become
  // effectively shared across all users (one bad actor can rate-limit
  // everyone else out of login), and every audit-log IP column is useless for
  // investigating abuse. `true` (trust every hop) would be worse — it'd let a
  // client spoof its own X-Forwarded-For and bypass rate limiting entirely.
  app.set('trust proxy', 1);

  app.use(traceMiddleware);
  app.use(helmet());
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
  // Outside production, fall back to allowing any origin so local dev never silently
  // breaks login/API calls just because CORS_ORIGINS isn't set in .env.
  app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : process.env.NODE_ENV !== 'production' }));
  // 15mb accommodates a base64-encoded phone photo or PDF page sent to
  // /audit for real Gemini vision analysis (base64 inflates size ~33%).
  app.use(express.json({ limit: '15mb' }));
  app.use((req, _res, next) => {
    console.info(`${req.method} ${req.path}`);
    next();
  });
  app.use(attachAuth(services.auth));

  // Public health — minimal info. Detailed info requires auth.
  app.get('/health', (req, res) => {
    if (req.user) {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        // Named for what it actually is — there is no Redis/BullMQ anywhere
        // in this project; the audit queue is Firestore-backed (or in-memory
        // in mock mode). The old "redis" key name was a leftover from an
        // earlier design and never matched reality.
        auditQueue: services.auditQueue.health(),
        firestore: isFirestoreConfigured() ? 'configured' : 'mock',
        storage: services.storage.health(),
        fcm: services.notifications.health(),
        claude: providerHealth('ANTHROPIC_API_KEY'),
        gemini: providerHealth('GOOGLE_GEMINI_API_KEY'),
        aiMock: process.env.AI_MOCK !== 'false'
      });
    } else {
      res.json({ status: 'ok' });
    }
  });

  app.post('/auth/session', authLimiter, validateBody(authSessionRequestSchema), async (req, res) => {
    const { email, password, remember } = req.body;
    const record = await getUserByEmail(email);
    if (!record || !verifyPassword(password, record.passwordHash)) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' } });
    }
    const expiresIn = remember ? '7d' : '1d';
    const expiresAt = new Date(Date.now() + (remember ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString();
    const token = signToken({ uid: record.uid, email: record.email, roles: record.roles }, expiresIn);
    await appendAuditLog({ actor: email, action: 'LOGIN', resource: 'auth', ip: req.ip ?? '?' });
    // Makes /auth/delete-account's "you have 30 days to cancel by logging in"
    // literally true instead of just a string with nothing behind it.
    await cancelAccountDeletion(record.uid);
    res.status(201).json({ token, user: { uid: record.uid, email: record.email, name: record.name, roles: record.roles }, expiresAt });
  });

  // Sliding session for the mobile app: called on every app launch with the
  // stored token, returns a fresh 30-day one. As long as the app is opened at
  // least once a month the user stays signed in until they sign out; a deleted
  // account or an expired/forged token gets 401 and the app falls back to the
  // sign-in screen.
  app.post('/auth/refresh', requireAuth, async (req, res) => {
    const email = req.user!.email;
    const record = email ? await getUserByEmail(email) : null;
    if (!record || record.uid !== req.user!.uid) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Session no longer valid' } });
    }
    const days = 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const token = signToken({ uid: record.uid, email: record.email, roles: record.roles }, `${days}d`);
    res.json({ token, user: { uid: record.uid, email: record.email, name: record.name, roles: record.roles }, expiresAt });
  });

  // Registration — creates account, returns session token immediately
  app.post('/auth/register', authLimiter, async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (!email || !password || !name || typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'name, email and password are required' } });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'Invalid email address' } });
    }
    if (await getUserByEmail(email)) {
      return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists' } });
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    // A hash, not a truncated base64 encoding: base64url(email).slice(0,12)
    // only covers the email's first ~9 bytes, so two different emails
    // sharing a 9+ character prefix (e.g. "alice.k@x.com" / "alice.m@x.com")
    // would silently collide onto the same uid and merge those accounts'
    // data. SHA-256 output is uniform regardless of input similarity.
    const uid = `user-${createHash('sha256').update(email.toLowerCase()).digest('base64url').slice(0, 16)}`;
    const roles = ['consumer'];
    await createUser({ uid, email, name, passwordHash: hashPassword(password), roles });
    const token = signToken({ uid, email, roles }, '7d');
    res.status(201).json({ token, user: { uid, email, name, roles }, expiresAt });
  });

  // Google Sign-In — verifies idToken from the web app and/or the mobile app.
  // These can be two different OAuth web clients (e.g. the mobile app's
  // native Google Sign-In must use a Web client from the SAME Firebase
  // project its Android app is registered under, which may not be the
  // project apps/web's browser flow was originally set up against) — accept
  // either as a valid audience rather than forcing both platforms onto one.
  app.post('/auth/google', authLimiter, async (req, res) => {
    const { idToken } = req.body ?? {};
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'idToken is required' } });
    }
    const webClientIds = [process.env.GOOGLE_WEB_CLIENT_ID, process.env.GOOGLE_WEB_CLIENT_ID_MOBILE].filter((id): id is string => !!id);
    if (webClientIds.length === 0) {
      return res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'Google Sign-In is not configured on this server' } });
    }
    try {
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({ idToken, audience: webClientIds });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Could not verify Google token' } });
      }
      const { email, name: googleName, sub: googleSub } = payload;
      const uid = `google-${googleSub}`;
      const name = googleName ?? email.split('@')[0];
      const roles = ['consumer'];
      const token = signToken({ uid, email, roles }, '7d');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await cancelAccountDeletion(uid);
      return res.status(201).json({ token, user: { uid, email, name, roles }, expiresAt });
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Google token verification failed' } });
    }
  });

  // Dev-only auth conveniences (returning a live OTP/reset-token/verification
  // code directly in the response instead of actually emailing it) must never
  // key off AI_MOCK — AI_MOCK only controls which AI provider answers
  // chat/audit calls, and `.env.production.example` documents leaving it
  // `true` until a real AI key is added, which would otherwise leak a real
  // password-reset URL (full account takeover) or 2FA/verification code to
  // anyone who asks. This needs its own explicit, fail-closed opt-in, same
  // pattern as isDemoLoginEnabled below.
  function isDevAuthBypassEnabled(): boolean {
    return process.env.ENABLE_DEV_AUTH_BYPASS === 'true';
  }

  app.post('/auth/forgot-password', authLimiter, async (req, res, next) => {
    try {
      const { email } = req.body ?? {};
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'A valid email address is required' } });
      }
      // Always respond the same way regardless of whether the account exists,
      // so this endpoint can't be used to enumerate registered emails.
      const user = await getUserByEmail(email);
      if (user) {
        const token = randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 30 * 60 * 1000;
        await setResetToken(token, { email: email.toLowerCase(), expiresAt });
        const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5174'}/reset-password?token=${token}`;
        if (isEmailConfigured()) {
          await sendPasswordResetEmail(email, resetUrl);
        } else if (isDevAuthBypassEnabled()) {
          return res.json({ ok: true, message: 'If an account with that email exists, a reset link has been sent.', devResetUrl: resetUrl });
        }
      }
      res.json({ ok: true, message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (err) { next(err); }
  });

  app.post('/auth/reset-password', authLimiter, async (req, res, next) => {
    try {
      const { token, newPassword } = req.body ?? {};
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'token is required' } });
      }
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } });
      }
      const entry = await getResetToken(token);
      if (!entry || Date.now() > entry.expiresAt) {
        return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or has expired' } });
      }
      await updateUserPassword(entry.email, hashPassword(newPassword));
      await deleteResetToken(token);
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.post('/auth/send-verification-email', authLimiter, async (req, res, next) => {
    try {
      const { email } = req.body ?? {};
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'email is required' } });
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await setOtp(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
      if (isEmailConfigured()) {
        await sendVerificationEmail(email, code);
        return res.json({ ok: true });
      }
      // No SMTP configured — fall back to returning the code directly so the
      // UI can still display it in dev/mock mode. There is no real mail
      // transport in this branch.
      if (isDevAuthBypassEnabled()) {
        return res.json({ ok: true, devCode: code });
      }
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  app.post('/auth/verify-email', authLimiter, async (req, res) => {
    const { email, code } = req.body ?? {};
    if (!email || !code) {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'email and code are required' } });
    }
    const entry = await getOtp(email);
    if (!entry || Date.now() > entry.expiresAt) {
      // In dev mode: accept any 6-digit code for demo purposes
      if (isDevAuthBypassEnabled()) {
        return res.json({ ok: true, verified: true });
      }
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code' } });
    }
    if (entry.code !== code) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Incorrect verification code' } });
    }
    await deleteOtp(email);
    res.json({ ok: true, verified: true });
  });

  // Two-factor authentication — enrollment status
  app.get('/auth/2fa/status', requireAuth, async (req, res) => {
    res.json({ enabled: await has2FA(req.user!.uid) });
  });

  // Two-factor authentication — send a one-time code to the signed-in user's email
  app.post('/auth/2fa/send-code', requireAuth, authLimiter, async (req, res, next) => {
    try {
      const email = req.user!.email;
      if (!email) {
        return res.status(400).json({ error: { code: 'NO_EMAIL', message: 'Account has no email on file' } });
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await setOtp(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
      if (isEmailConfigured()) {
        await send2faCodeEmail(email, code);
        return res.json({ ok: true });
      }
      // No SMTP configured — fall back to returning the code directly so the
      // UI can still display it in dev/mock mode. There is no real mail
      // transport in this branch.
      if (isDevAuthBypassEnabled()) {
        return res.json({ ok: true, devCode: code });
      }
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  // Two-factor authentication — verify the code and enroll the account
  app.post('/auth/2fa/verify', requireAuth, authLimiter, async (req, res) => {
    const { code } = req.body ?? {};
    const email = req.user!.email;
    if (!email) {
      return res.status(400).json({ error: { code: 'NO_EMAIL', message: 'Account has no email on file' } });
    }
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'code is required' } });
    }
    const entry = await getOtp(email);
    if (!entry || Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code' } });
    }
    if (entry.code !== code) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Incorrect verification code' } });
    }
    await deleteOtp(email);
    await enable2FA(req.user!.uid);
    res.json({ enabled: true });
  });

  // Two-factor authentication — disable
  app.post('/auth/2fa/disable', requireAuth, authLimiter, async (req, res) => {
    await disable2FA(req.user!.uid);
    res.json({ enabled: false });
  });

  // Demo login — gives pre-configured sessions for different roles (dev/demo only)
  const DEMO_PERSONAS = {
    consumer:        { email: 'consumer@demo.visawithease.app',  name: 'Demo Consumer',       roles: ['consumer'] },
    consultant:      { email: 'consultant@demo.visawithease.app',name: 'Demo Consultant',      roles: ['consumer', 'consultant'] },
    hr_admin:        { email: 'hr@demo.visawithease.app',        name: 'Demo HR Admin',        roles: ['consumer', 'hr_admin'] },
    platform_admin:  { email: 'admin@demo.visawithease.app',     name: 'Demo Platform Admin',  roles: ['consumer', 'consultant', 'hr_admin', 'platform_admin'] },
  } as const;

  // Fail-closed always — an unauthenticated endpoint that hands out real
  // (including platform_admin) tokens must be an explicit opt-in everywhere,
  // not inferred from NODE_ENV. A deployment that simply forgets to set
  // NODE_ENV=production would otherwise leave this open by accident. Local
  // dev, CI, and Playwright each set ENABLE_DEMO_LOGIN=true explicitly
  // (see .env / playwright.config.ts / the contract test files).
  function isDemoLoginEnabled(): boolean {
    return process.env.ENABLE_DEMO_LOGIN === 'true';
  }

  app.post('/auth/demo', authLimiter, async (req, res) => {
    if (!isDemoLoginEnabled()) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    }
    const persona = (req.body?.persona ?? 'consumer') as keyof typeof DEMO_PERSONAS;
    const p = DEMO_PERSONAS[persona] ?? DEMO_PERSONAS.consumer;
    const uid = `demo-${persona}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = signToken({ uid, email: p.email, roles: [...p.roles] }, '24h');
    await appendAuditLog({ actor: p.email, action: 'LOGIN', resource: 'auth', ip: req.ip ?? '?' });
    res.status(201).json({ token, user: { uid, email: p.email, name: p.name, roles: p.roles }, expiresAt });
  });

  app.get('/applications', requireAuth, async (req, res, next) => {
    try {
      res.json({ applications: await services.applications.listApplications(req.user!.uid) });
    } catch (err) {
      next(err);
    }
  });

  app.get('/applications/:id', requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id as string;
      if (!id || id.length > 128) throw notFound('Application not found');
      const application = await services.applications.getApplication(id, req.user!.uid);
      if (!application) throw notFound('Application not found');
      res.json({ application });
    } catch (err) {
      next(err);
    }
  });

  app.post('/applications', requireAuth, async (req, res, next) => {
    try {
      const { destinationCountry, visaType, intendedFrom, intendedTo, purpose, nationality, residenceCountry } = req.body ?? {};
      if (!destinationCountry || !visaType || !intendedFrom) {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'destinationCountry, visaType and intendedFrom are required' } });
      }
      const derivedName = req.user?.email
        ? req.user.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Applicant';
      const applicantName = req.body.applicantName ?? derivedName;
      const application = await services.applications.createApplication(
        { destinationCountry, visaType, intendedFrom, applicantName, purpose: purpose ?? visaType, nationality, residenceCountry },
        req.user?.uid
      );
      res.status(201).json({ application });
    } catch (err) {
      next(err);
    }
  });

  // Deleting an application also ends everything that hangs off it: the caller's
  // upcoming appointments for it are cancelled and any consultant access they granted
  // for it is revoked — otherwise a deleted application could still be visible to an expert.
  // Everything that hangs off an application goes with it: upcoming appointments are cancelled, consultant
  // access is revoked and the passport details read from it are erased.
  async function eraseApplication(uid: string, id: string) {
    const bookings = (await services.consultants.listBookings()).filter((b) => b.userId === uid && b.applicationId === id && b.status !== 'cancelled');
    await Promise.all(bookings.map((b) => services.consultants.cancelBooking(b.bookingId, uid)));
    const grants = (await services.accessGrants.listActiveGrants()).filter((g) => g.applicationId === id && g.grantedBy === uid);
    await Promise.all(grants.map((g) => services.accessGrants.revokeGrant(g.grantId, uid)));
    const deleted = await services.applications.deleteApplication(id, uid);
    if (deleted) await deletePassportDataForApplication(id);
    return { deleted, cancelledBookings: bookings.length, revokedGrants: grants.length };
  }

  app.delete('/applications/:id', requireAuth, async (req, res, next) => {
    try {
      const uid = req.user!.uid;
      const id = req.params.id as string;
      const owned = await services.applications.getApplication(id, uid);
      if (!owned) throw notFound('Application not found');
      const { deleted, cancelledBookings, revokedGrants } = await eraseApplication(uid, id);
      if (!deleted) throw notFound('Application not found');
      await appendAuditLog({ actor: req.user!.email ?? uid, action: 'DELETE_APPLICATION', resource: id, ip: req.ip ?? '?' });
      res.json({ id, deleted: true, cancelledBookings, revokedGrants });
    } catch (err) {
      next(err);
    }
  });

  // Erases an account for good: its applications (with their bookings, grants and passport details), the
  // face template and the login itself. Runs for accounts whose 30-day deletion window has passed, and on
  // demand for a platform admin handling an erasure request.
  async function purgeAccount(uid: string, actor: string) {
    // Copy: deleting while iterating the store's own list would skip entries.
    const apps = [...(await services.applications.listApplications(uid))];
    for (const a of apps) await eraseApplication(uid, a.id);
    await deleteFaceProfile(uid);
    await deleteUserByUid(uid);
    await completeAccountDeletion(uid);
    await appendAuditLog({ actor, action: 'ACCOUNT_PURGED', resource: uid, ip: 'system' });
    return { uid, applicationsErased: apps.length };
  }
  app.locals.purgeOverdueAccounts = async () => {
    const due = await listOverduePendingDeletions();
    const done: string[] = [];
    for (const r of due) {
      try { await purgeAccount(r.uid, 'system:deletion-job'); done.push(r.uid); } catch (err) { console.warn('account purge failed', r.uid, err); }
    }
    return done;
  };
  app.post('/admin/accounts/:uid/purge', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      res.json(await purgeAccount(String(req.params.uid), req.user!.email ?? req.user!.uid));
    } catch (err) {
      next(err);
    }
  });

  const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;

  app.post('/upload-slots', requireAuth, validateBody(auditRequestSchema), async (req, res, next) => {
    try {
      const { applicationId, documentId } = req.body as { applicationId: string; documentId: string };
      if (!SAFE_ID_RE.test(applicationId) || !SAFE_ID_RE.test(documentId)) {
        return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'applicationId and documentId may only contain letters, numbers, - and _' } });
      }
      // Real ownership check — applications now persist consistently per user
      // (Firestore, see services/firestoreServices.ts), so this can finally be
      // enforced instead of deferred.
      const owned = await services.applications.getApplication(applicationId, req.user!.uid);
      if (!owned) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } });
      }
      // Claim which application this document belongs to, so GET /audit/:docId
      // can check the same ownership when the result is read back later.
      // First-claim-wins — refuses to let a different application take over a
      // documentId another application already claimed (documentId is
      // client-chosen and not guaranteed unique across users).
      if (!(await claimAuditOwner(documentId, applicationId))) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: 'This document ID is already associated with a different application' } });
      }
      res.status(201).json(await services.storage.createUploadSlot(req.body));
    } catch (err) {
      next(err);
    }
  });

  app.post('/audit', requireAuth, auditLimiter, validateBody(auditRequestSchema), async (req, res, next) => {
    try {
      const { applicationId, documentId } = req.body as { applicationId: string; documentId: string };
      if (!SAFE_ID_RE.test(applicationId) || !SAFE_ID_RE.test(documentId)) {
        return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'applicationId and documentId may only contain letters, numbers, - and _' } });
      }
      const owned = await services.applications.getApplication(applicationId, req.user!.uid);
      if (!owned) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } });
      }
      // Only the verified person may analyse: when enabled, the account's face must have been verified
      // recently (liveness + passport match at enrolment, and a fresh check each session window).
      if (faceRequiredForAudit()) {
        const face = await getFaceProfile(req.user!.uid);
        if (!face) return res.status(403).json({ error: { code: 'FACE_VERIFICATION_REQUIRED', message: 'Verify your face first — analysis is limited to the verified applicant.' } });
        if (Date.now() - Date.parse(face.lastVerifiedAt) >= faceSessionMs()) {
          return res.status(403).json({ error: { code: 'FACE_REVERIFICATION_REQUIRED', message: 'Confirm it is still you — do a quick face check to continue.' } });
        }
      }
      if (!(await claimAuditOwner(documentId, applicationId))) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: 'This document ID is already associated with a different application' } });
      }
      // Best-effort — persists the original file so it can be viewed again
      // later (see GET /documents), separate from the AI's computed result.
      // Never blocks or fails the audit itself: Storage may not be enabled
      // on this project yet, and that must not break scanning.
      const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };
      if (imageBase64 && mimeType) {
        const storagePath = await saveDocumentImage(applicationId, documentId, imageBase64, mimeType);
        if (storagePath) await saveDocumentFilePath(documentId, storagePath);
      }
      const auditResponse = await services.auditQueue.enqueueAudit(req.body);
      // Keep what was read from a passport as structured data (name, number, dates) so it can be shown
      // back to the client and — only with their grant — to a consultant.
      const { extractedText: passportText, documentType: passportDocType } = req.body as { extractedText?: string; documentType?: string };
      if ((passportDocType ?? '').toLowerCase() === 'passport' && passportText) {
        const parsed = parsePassportData(passportText);
        if (parsed) void savePassportData(documentId, applicationId, parsed).catch(() => {});
      }
      res.status(202).json(auditResponse);
      // Real trigger for a real push — fires after the response is already
      // sent so a slow/unreachable device doesn't add latency to the audit
      // itself. Best-effort: a failure here must never surface as an audit
      // failure to the user, since the scan itself already succeeded.
      const { score, status, documentType } = auditResponse.result;
      void services.notifications.sendUserNotification({
        userId: req.user!.uid,
        title: `${documentType} audit complete`,
        body: status === 'excellent' ? `Score ${score}/100 — looks good.` : `Score ${score}/100 — needs a look before you submit.`,
        data: { documentId, applicationId, type: 'audit' }
      }).catch((err) => console.warn('[push] audit-complete notification failed:', (err as Error).message));
    } catch (err) {
      next(err);
    }
  });

  app.post('/device-tokens', requireAuth, async (req, res, next) => {
    try {
      const { token, platform } = req.body as { token?: string; platform?: string };
      if (!token || typeof token !== 'string' || token.length > 4096) {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'A valid token is required' } });
      }
      await saveDeviceToken(req.user!.uid, token, typeof platform === 'string' ? platform : 'unknown');
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  app.get('/audit/:docId', requireAuth, async (req, res, next) => {
    try {
      const docId = req.params.docId as string;
      if (!docId || docId.length > 256) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid docId' } });
      // If we know which application this document belongs to (recorded at
      // upload-slot time), only that application's owner may read the result.
      // A docId nothing was ever uploaded for (e.g. a canned demo id) has no
      // recorded owner and stays open, matching existing demo behavior.
      const ownerAppId = await getAuditOwnerApplication(docId);
      if (ownerAppId && !(await services.applications.getApplication(ownerAppId, req.user!.uid))) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Audit result not found' } });
      }
      res.json(await services.auditQueue.getAuditResult(docId));
    } catch (err) {
      next(err);
    }
  });

  app.post('/requirements', validateVisaContextBody(visaContextSchema), async (req, res, next) => {
    try {
      res.json(await services.requirements.getRequirements(req.body.visaContext));
    } catch (err) {
      next(err);
    }
  });

  app.get('/requirements', async (req, res, next) => {
    try {
      const country = typeof req.query.country === 'string' ? req.query.country : undefined;
      res.json(country
        ? await services.requirements.getRequirementsForCountry(country)
        : await services.requirements.getDefaultRequirements());
    } catch (err) {
      next(err);
    }
  });

  // ── Knowledge base (admin-managed visa requirements) ──────────────────────
  // Lets a platform_admin add or correct a country's visa requirements from
  // the web app's dashboard — takes effect immediately for both the mobile
  // and web apps (GET /requirements above already checks these overrides
  // first), with no code deploy needed.
  const COUNTRY_NAME_RE = /^[A-Za-z][A-Za-z '.\-]{0,79}$/;

  app.get('/admin/knowledge-base', requireAuth, requireRole('platform_admin'), async (_req, res, next) => {
    try {
      res.json({ overrides: await services.requirements.listCountryOverrides() });
    } catch (err) {
      next(err);
    }
  });

  app.put('/admin/knowledge-base/:country', requireAuth, requireRole('platform_admin'), validateBody(requirementsOverrideSchema), async (req, res, next) => {
    try {
      const country = decodeURIComponent(req.params.country as string);
      if (!COUNTRY_NAME_RE.test(country)) {
        return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid country name' } });
      }
      // The server, not the client, stamps verification: only an explicit
      // markVerified from a platform_admin records "checked against the official
      // sources by <admin> on <now>"; otherwise the previous stamp (if any) is
      // kept, so editing a typo doesn't silently re-verify or un-verify a country.
      const { markVerified, ...body } = req.body as typeof req.body & { markVerified?: boolean };
      const previous = (await services.requirements.listCountryOverrides())[country]?.verification;
      const verifiedAt = markVerified ? new Date().toISOString() : previous?.verifiedAt ?? null;
      const verifiedBy = markVerified ? (req.user!.email ?? req.user!.uid) : previous?.verifiedBy ?? null;
      const result = await services.requirements.setCountryOverride(country, { ...body, verifiedAt, verifiedBy });
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'UPDATE_KNOWLEDGE_BASE', resource: country, ip: req.ip ?? '?' });
      res.json({ country, requirements: result });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/admin/knowledge-base/:country', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const country = decodeURIComponent(req.params.country as string);
      if (!COUNTRY_NAME_RE.test(country)) {
        return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid country name' } });
      }
      await services.requirements.deleteCountryOverride(country);
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'DELETE_KNOWLEDGE_BASE_OVERRIDE', resource: country, ip: req.ip ?? '?' });
      res.json({ country, deleted: true });
    } catch (err) {
      next(err);
    }
  });

  // The FAQ knowledge base behind the chat's quick-tap questions. Static, reviewed content — no auth needed.
  app.get('/chat/faq', (_req, res) => { res.json(faqCatalog()); });
  // A tapped question is answered straight from the knowledge base (no AI call, no rate-limit cost).
  app.get('/chat/faq/:id', (req, res) => {
    const entry = getFaq(String(req.params.id));
    if (!entry) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown question' } });
    res.json(faqReply(entry));
  });

  app.post('/chat', requireAuth, chatLimiter, validateBody(chatRequestSchema), async (req, res, next) => {
    try {
      // Status / upload / FAQ questions are answered from the knowledge base and the user's own applications
      // first — instant, free and always consistent. Only what they cannot answer goes to the AI model.
      const chatMessage = (req.body as { message: string }).message;
      const known = answerFromKnowledge(chatMessage, needsApplications(chatMessage) ? await services.applications.listApplications(req.user!.uid) : []);
      if (known) return res.json(known);
      // Ground the assistant's answer in the caller's own application data (the
      // "given service" data source) when applicationId refers to an application
      // they actually own — never another user's data, and never invented state.
      const applicationId = (req.body as { applicationId?: string }).applicationId;
      // No id supplied (older clients): fall back to the caller's own most recent
      // application, so "my score" / "what's missing" still mean their real data.
      const application = applicationId
        ? await services.applications.getApplication(applicationId, req.user!.uid)
        : (await services.applications.listApplications(req.user!.uid))[0] ?? null;
      // Real admin-managed (or built-in default) requirements data for the
      // applicant's own destination — the same knowledge base /requirements
      // itself reads from, so guidance is grounded in actual embassy rules
      // instead of the model's general training knowledge.
      const requirements = await services.requirements.getRequirementsForCountry(application?.destinationCountry);
      res.json(await services.ai.chat(req.body, { application, requirements }));
    } catch (err) {
      next(err);
    }
  });

  app.get('/consultants', async (_req, res, next) => {
    try {
      res.json({
        consultants: await services.consultants.listConsultants({
          query: typeof _req.query.q === 'string' ? _req.query.q : undefined,
          language: typeof _req.query.language === 'string' ? _req.query.language : undefined,
          specialty: typeof _req.query.specialty === 'string' ? _req.query.specialty : undefined
        })
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/consultants/:id', async (req, res, next) => {
    try {
      const consultant = await services.consultants.getConsultant(req.params.id);
      if (!consultant) throw notFound('Consultant not found');
      res.json({ consultant });
    } catch (err) {
      next(err);
    }
  });

  app.get('/booking/session-options', async (_req, res, next) => {
    try {
      res.json({ options: await services.consultants.listSessionOptions() });
    } catch (err) {
      next(err);
    }
  });

  app.post('/bookings', requireAuth, validateBody(bookingRequestSchema), async (req, res, next) => {
    try {
      // Ownership check: getApplication(id, userId) returns null for an id
      // that exists but belongs to someone else, same as a genuinely unknown
      // id — without this, any signed-in user could create a booking (and
      // pollute the real CRM revenue figures) against an application they
      // don't own, just by guessing/enumerating its id.
      const owned = await services.applications.getApplication(req.body.applicationId, req.user!.uid);
      if (!owned) throw notFound('Application not found');
      const booking = await services.consultants.createBooking({ ...req.body, userId: req.user!.uid });
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  });

  // ── Calls (Google Meet) ───────────────────────────────────────────────────
  // What a client/consultant may know about an appointment's call. The link itself is only released by
  // GET /bookings/:id/join, inside the join window — never in a list.
  function callInfo(b: { slotISO?: string; status: string; sessionType: string; meeting?: unknown }, sessionOptions: Array<{ id: string; durationMinutes: number }>) {
    if (b.status === 'cancelled' || !b.slotISO) return { available: false as const, reason: b.status === 'cancelled' ? 'cancelled' : 'no_time' };
    const minutes = sessionOptions.find((o) => o.id === b.sessionType)?.durationMinutes ?? 30;
    const w = joinWindow(b.slotISO, minutes);
    return {
      available: true as const,
      provider: 'google_meet' as const,
      connected: isMeetConfigured() || !!b.meeting,
      opensAt: w.opensAt,
      closesAt: w.closesAt,
      open: Date.now() >= Date.parse(w.opensAt) && Date.now() <= Date.parse(w.closesAt)
    };
  }

  // The call link: released to the client who booked it or the consultant it is booked with, only inside
  // the join window. Creates the Meet room on first use if it wasn't created at booking time.
  app.get('/bookings/:bookingId/join', requireAuth, sensitiveLimiter, async (req, res, next) => {
    try {
      const b = await services.consultants.getBooking(req.params.bookingId as string);
      const myConsultantId = await resolveConsultantId(req.user!);
      const allowed = !!b && (b.userId === req.user!.uid || (!!myConsultantId && b.consultantId === myConsultantId));
      if (!b || !allowed) throw notFound('Booking not found');
      const sessionOptions = await services.consultants.listSessionOptions();
      const info = callInfo(b, sessionOptions);
      if (!info.available) return res.status(409).json({ error: { code: 'NO_CALL', message: info.reason === 'cancelled' ? 'This appointment was cancelled.' : 'This appointment has no time yet.' } });
      if (!info.open) {
        return res.status(409).json({ error: { code: 'JOIN_NOT_OPEN', message: Date.now() < Date.parse(info.opensAt) ? 'The call opens 10 minutes before the appointment.' : 'This appointment has ended.', opensAt: info.opensAt, closesAt: info.closesAt } });
      }
      let meeting = b.meeting;
      if (!meeting) {
        if (!isMeetConfigured()) {
          return res.status(503).json({ error: { code: 'MEETING_PROVIDER_NOT_CONFIGURED', message: 'Video calls are not connected yet. Your consultant will contact you another way.' } });
        }
        const consultant = await services.consultants.getConsultant(b.consultantId);
        meeting = await createMeetEvent({
          summary: `Visa With Ease — ${consultant?.name ?? 'consultant'} session`,
          description: 'Visa consultation booked through Visa With Ease.',
          startISO: b.slotISO!,
          durationMinutes: sessionOptions.find((o) => o.id === b.sessionType)?.durationMinutes ?? 30,
          attendeeEmails: [req.user!.email ?? '']
        });
        await services.consultants.setBookingMeeting(b.bookingId, meeting);
      }
      res.json({ provider: meeting.provider, url: meeting.url, opensAt: info.opensAt, closesAt: info.closesAt });
    } catch (err) {
      next(err);
    }
  });

  // ── Consultant workspace ─────────────────────────────────────────────────
  // A consultant sees only appointments booked with THEM, and a client's data only through an active,
  // terms-accepted grant from that client. requireRole alone is not enough: a consultant login must also
  // be linked to a marketplace consultant identity.
  async function consultantIdFor(req: express.Request): Promise<string | null> {
    const linked = await resolveConsultantId(req.user!);
    if (linked) return linked;
    // platform_admin may act as any consultant for support, by naming it explicitly
    if (req.user!.roles.includes('platform_admin') && typeof req.query.consultantId === 'string') return req.query.consultantId;
    return null;
  }

  app.get('/consultant/me', requireAuth, requireRole('consultant', 'platform_admin'), async (req, res, next) => {
    try {
      const id = await consultantIdFor(req);
      const profile = id ? await services.consultants.getConsultant(id) : null;
      res.json({ linked: !!id, consultantId: id, name: profile?.name ?? null, specialty: profile?.specialty ?? null });
    } catch (err) {
      next(err);
    }
  });

  type ActiveGrant = Awaited<ReturnType<typeof services.accessGrants.listActiveGrants>>[number];
  function pickGrant(grants: ActiveGrant[], consultantId: string, applicationId: string) {
    return grants.find((g) => g.consultantId === consultantId && g.applicationId === applicationId && Date.parse(g.expiresAt) > Date.now()) ?? null;
  }
  async function activeGrantFor(consultantId: string, applicationId: string) {
    const grants = await services.accessGrants.listActiveGrants();
    return grants.find((g) => g.consultantId === consultantId && g.applicationId === applicationId && Date.parse(g.expiresAt) > Date.now()) ?? null;
  }

  app.get('/consultant/appointments', requireAuth, requireRole('consultant', 'platform_admin'), async (req, res, next) => {
    try {
      const consultantId = await consultantIdFor(req);
      if (!consultantId) return res.status(403).json({ error: { code: 'NOT_LINKED', message: 'This login is not linked to a consultant profile yet. Ask a platform admin to link it.' } });
      // One read of the grants and one lookup per distinct application — not one of each per appointment.
      const [all, sessionOptions, grants] = await Promise.all([services.consultants.listBookings(), services.consultants.listSessionOptions(), services.accessGrants.listActiveGrants()]);
      const mine = all.filter((b) => b.consultantId === consultantId);
      const appIds = [...new Set(mine.map((b) => b.applicationId))];
      const apps = new Map(await Promise.all(appIds.map(async (id) => [id, await services.applications.getApplicationForStaff(id)] as const)));
      const rows = await Promise.all(mine.map(async (b) => {
        const application = apps.get(b.applicationId) ?? null;
        const grant = pickGrant(grants, consultantId, b.applicationId);
        return {
          bookingId: b.bookingId,
          status: b.status,
          sessionType: b.sessionType,
          sessionLabel: sessionOptions.find((o) => o.id === b.sessionType)?.label ?? b.sessionType,
          slotISO: b.slotISO ?? null,
          createdAt: b.createdAt,
          applicationId: b.applicationId,
          // Name and destination are what a consultant needs to recognise the booking; nothing else about
          // the client is exposed until they grant access.
          clientName: application?.applicantName ?? 'Client',
          destinationCountry: application?.destinationCountry ?? null,
          visaType: application?.visaType ?? null,
          access: grant ? { granted: true as const, categories: grant.categories, expiresAt: grant.expiresAt, termsAcceptedAt: grant.termsAcceptedAt ?? null } : { granted: false as const },
          call: callInfo(b, sessionOptions)
        };
      }));
      rows.sort((a, b) => (a.slotISO ?? '9').localeCompare(b.slotISO ?? '9'));
      res.json({ consultantId, appointments: rows });
    } catch (err) {
      next(err);
    }
  });

  app.get('/consultant/appointments/:bookingId/case', requireAuth, requireRole('consultant', 'platform_admin'), async (req, res, next) => {
    try {
      const consultantId = await consultantIdFor(req);
      if (!consultantId) return res.status(403).json({ error: { code: 'NOT_LINKED', message: 'This login is not linked to a consultant profile yet.' } });
      const booking = await services.consultants.getBooking(req.params.bookingId as string);
      if (!booking || booking.consultantId !== consultantId) throw notFound('Appointment not found');
      const grant = await activeGrantFor(consultantId, booking.applicationId);
      if (!grant) {
        return res.status(403).json({ error: { code: 'ACCESS_NOT_GRANTED', message: 'The client has not granted you access to their case. Ask them to share it from their Bookings screen.' } });
      }
      const application = await services.applications.getApplicationForStaff(booking.applicationId);
      if (!application) throw notFound('Application not found');
      const has = (c: string) => (grant.categories as string[]).includes(c);
      const out: Record<string, unknown> = {
        bookingId: booking.bookingId,
        applicationId: booking.applicationId,
        shared: grant.categories,
        access: { expiresAt: grant.expiresAt, termsAcceptedAt: grant.termsAcceptedAt ?? null, termsVersion: grant.termsVersion ?? null }
      };
      // Independent reads run together rather than one after another.
      const facePromise = has('profile') ? getFaceProfile(booking.userId) : Promise.resolve(null);
      const passportPromise = has('documents') ? getPassportDataForApplication(booking.applicationId) : Promise.resolve(null);
      const reqsPromise = has('requirements') ? services.requirements.getRequirementsForCountry(application.destinationCountry) : Promise.resolve(null);
      const documentIds = has('documents') || has('audit_findings') || has('requirements') ? await listAuditOwnerDocumentIds(booking.applicationId) : [];
      const results = documentIds.length ? await services.auditQueue.getAuditResultsByIds(documentIds) : [];
      const latestByType = new Map<string, (typeof results)[number]>();
      for (const r of results) {
        const key = (r.documentType || 'other').toLowerCase();
        const existing = latestByType.get(key);
        if (!existing || r.generatedAt > existing.generatedAt) latestByType.set(key, r);
      }

      if (has('profile')) {
        const face = await facePromise;
        out.profile = {
          applicantName: application.applicantName,
          destinationCountry: application.destinationCountry,
          visaType: application.visaType,
          nationality: application.nationality ?? null,
          residenceCountry: application.residenceCountry ?? null,
          intendedFrom: application.intendedFrom,
          readinessScore: application.readinessScore,
          status: application.status,
          // The badge a consultant can rely on: the client passed liveness and matched their own passport photo.
          faceVerified: face ? { verified: true, passportSimilarity: face.passportSimilarity, verifiedAt: face.enrolledAt, steps: face.steps } : { verified: false }
        };
      }
      if (has('documents')) {
        out.documents = [...latestByType.values()].map((r) => ({ type: r.documentType, score: r.score, status: r.status, checkedAt: r.generatedAt }));
        out.passportData = await passportPromise;
      }
      if (has('audit_findings')) {
        out.auditFindings = [...latestByType.values()].map((r) => ({ type: r.documentType, score: r.score, status: r.status, findings: r.findings }));
      }
      if (has('requirements')) {
        const reqs = (await reqsPromise)!;
        const uploaded = (...types: string[]) => types.some((t) => (latestByType.get(t)?.score ?? 0) >= 50);
        out.requirements = reqs.requirements.map((r) => {
          const text = `${r.id} ${r.title}`.toLowerCase();
          const met = text.includes('passport') ? uploaded('passport')
            : (text.includes('bank') || text.includes('financ') || text.includes('fund')) ? uploaded('bank', 'finance')
              : text.includes('insur') ? uploaded('insurance')
                : (text.includes('itinerary') || text.includes('flight') || text.includes('hotel') || text.includes('reserv')) ? uploaded('itinerary')
                  : text.includes('photo') ? uploaded('photo')
                    : (text.includes('employ') || text.includes('student') || text.includes('enroll')) ? uploaded('employment') : false;
          return { id: r.id, title: r.title, required: r.required, met };
        });
      }
      if (has('contact')) {
        // Contact goes through the platform's messaging; no personal identifiers are handed over.
        out.contact = { note: 'The client agreed to be contacted through the platform. Reach them from the appointment.' };
      }
      if (has('ai_messages')) out.aiMessages = [];
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'CONSULTANT_VIEW_CASE', resource: booking.applicationId, ip: req.ip ?? '?' });
      res.json(out);
    } catch (err) {
      next(err);
    }
  });

  // Platform admin links a consultant login to a marketplace consultant profile.
  app.put('/admin/consultant-link', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const { email, consultantId } = (req.body ?? {}) as { email?: string; consultantId?: string | null };
      if (!email) return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'email is required' } });
      if (consultantId && !(await services.consultants.getConsultant(consultantId))) throw notFound('Consultant profile not found');
      const ok = await setUserConsultantId(email, consultantId ?? null);
      if (!ok) throw notFound('User not found');
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'LINK_CONSULTANT', resource: `${email}:${consultantId ?? 'none'}`, ip: req.ip ?? '?' });
      res.json({ email, consultantId: consultantId ?? null });
    } catch (err) {
      next(err);
    }
  });

  // ── Face verification ────────────────────────────────────────────────────
  // The face SDK runs on the phone (liveness, face match). The server keeps the one enrolled template per
  // account so a different face can never replace it, and records the outcome. Scores may arrive as 0-1 or
  // 0-100 depending on the SDK build, so they are normalised; thresholds are env-tunable and need calibrating
  // against real devices and passports.
  const norm = (n: number) => (n > 1 ? n / 100 : n);
  const faceMinSimilarity = () => Number(process.env.FACE_MIN_SIMILARITY ?? 0.7);
  const faceMinLiveness = () => Number(process.env.FACE_MIN_LIVENESS ?? 0.6);
  const faceSessionMs = () => Number(process.env.FACE_SESSION_HOURS ?? 24) * 3600_000;
  const faceRequiredForAudit = () => process.env.FACE_REQUIRED_FOR_AUDIT === 'true';

  app.get('/face/status', requireAuth, sensitiveLimiter, async (req, res, next) => {
    try {
      const f = await getFaceProfile(req.user!.uid);
      res.json({
        enrolled: !!f,
        verifiedBadge: !!f,
        passportSimilarity: f?.passportSimilarity ?? null,
        enrolledAt: f?.enrolledAt ?? null,
        lastVerifiedAt: f?.lastVerifiedAt ?? null,
        // Fresh = verified again within the session window (bank-app style re-check).
        sessionFresh: !!f && Date.now() - Date.parse(f.lastVerifiedAt) < faceSessionMs(),
        requiredForAnalysis: faceRequiredForAudit(),
        thresholds: { similarity: faceMinSimilarity(), liveness: faceMinLiveness() }
      });
    } catch (err) {
      next(err);
    }
  });

  // The owner's own template, so a new phone can verify against it. Never returned to anyone else.
  app.get('/face/template', requireAuth, sensitiveLimiter, async (req, res, next) => {
    try {
      const f = await getFaceProfile(req.user!.uid);
      if (!f) throw notFound('No face enrolled');
      res.json({ faceFeature: f.faceFeature });
    } catch (err) {
      next(err);
    }
  });

  app.post('/face/enroll', requireAuth, sensitiveLimiter, async (req, res, next) => {
    try {
      const b = (req.body ?? {}) as { faceFeature?: unknown; passportSimilarity?: unknown; liveness?: unknown; steps?: unknown };
      if (typeof b.faceFeature !== 'string' || b.faceFeature.length < 16 || b.faceFeature.length > 20000) return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'faceFeature is required' } });
      if (typeof b.passportSimilarity !== 'number' || typeof b.liveness !== 'number') return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'passportSimilarity and liveness are required numbers' } });
      const steps = Array.isArray(b.steps) ? b.steps.filter((x): x is string => typeof x === 'string').slice(0, 10) : [];
      if (steps.length < 2) return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'At least two liveness steps must be completed' } });
      const existing = await getFaceProfile(req.user!.uid);
      if (existing) return res.status(409).json({ error: { code: 'FACE_ALREADY_ENROLLED', message: 'A face is already verified for this account and cannot be replaced. Contact support to reset it.' } });
      if (![b.passportSimilarity, b.liveness].every((n) => Number.isFinite(n) && (n as number) >= 0 && (n as number) <= 100)) return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Scores must be between 0 and 100' } });
      const similarity = norm(b.passportSimilarity);
      const liveness = norm(b.liveness);
      if (liveness < faceMinLiveness()) return res.status(422).json({ error: { code: 'LIVENESS_FAILED', message: 'The liveness check did not pass. Try again in good light, following each instruction.' } });
      if (similarity < faceMinSimilarity()) return res.status(422).json({ error: { code: 'FACE_MISMATCH', message: 'Your face does not match the photo in your passport closely enough.', similarity } });
      const now = new Date().toISOString();
      await saveFaceProfile({ uid: req.user!.uid, faceFeature: b.faceFeature, passportSimilarity: similarity, liveness, steps, enrolledAt: now, lastVerifiedAt: now, verifiedCount: 1 });
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'FACE_ENROLLED', resource: req.user!.uid, ip: req.ip ?? '?' });
      res.status(201).json({ enrolled: true, verifiedBadge: true, passportSimilarity: similarity, enrolledAt: now });
    } catch (err) {
      next(err);
    }
  });

  // A returning check (new session or device) against the already-enrolled face.
  app.post('/face/verified', requireAuth, sensitiveLimiter, async (req, res, next) => {
    try {
      const f = await getFaceProfile(req.user!.uid);
      if (!f) throw notFound('No face enrolled');
      const b = (req.body ?? {}) as { similarity?: unknown; liveness?: unknown };
      if (typeof b.similarity !== 'number' || typeof b.liveness !== 'number') return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'similarity and liveness are required numbers' } });
      if (![b.similarity, b.liveness].every((n) => Number.isFinite(n) && (n as number) >= 0 && (n as number) <= 100)) return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Scores must be between 0 and 100' } });
      if (norm(b.liveness) < faceMinLiveness()) return res.status(422).json({ error: { code: 'LIVENESS_FAILED', message: 'The liveness check did not pass.' } });
      if (norm(b.similarity) < faceMinSimilarity()) return res.status(422).json({ error: { code: 'FACE_MISMATCH', message: 'This face does not match the verified face on this account.' } });
      const now = new Date().toISOString();
      await saveFaceProfile({ ...f, lastVerifiedAt: now, verifiedCount: f.verifiedCount + 1 });
      res.json({ verified: true, lastVerifiedAt: now });
    } catch (err) {
      next(err);
    }
  });

  app.delete('/admin/face/:uid', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const removed = await deleteFaceProfile(req.params.uid as string);
      if (!removed) throw notFound('No face enrolled for that account');
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'FACE_RESET', resource: req.params.uid as string, ip: req.ip ?? '?' });
      res.json({ uid: req.params.uid, reset: true });
    } catch (err) {
      next(err);
    }
  });

  // The caller's own appointments, newest first, with the consultant's name and the
  // application's destination joined in so a client can render a card without extra calls.
  app.get('/bookings', requireAuth, async (req, res, next) => {
    try {
      const uid = req.user!.uid;
      const [all, apps] = await Promise.all([services.consultants.listBookings(), services.applications.listApplications(uid)]);
      const mine = all.filter((b) => b.userId === uid);
      const appById = new Map(apps.map((a) => [a.id, a]));
      const sessionOptions = await services.consultants.listSessionOptions();
      const consultantIds = [...new Set(mine.map((b) => b.consultantId))];
      const consultants = new Map<string, { name: string; specialty: string } | null>();
      await Promise.all(consultantIds.map(async (id) => {
        const c = await services.consultants.getConsultant(id);
        consultants.set(id, c ? { name: c.name, specialty: c.specialty } : null);
      }));
      res.json({
        bookings: mine.map((b) => ({
          bookingId: b.bookingId,
          status: b.status,
          consultantId: b.consultantId,
          consultantName: consultants.get(b.consultantId)?.name ?? 'Consultant',
          consultantSpecialty: consultants.get(b.consultantId)?.specialty ?? '',
          applicationId: b.applicationId,
          destinationCountry: appById.get(b.applicationId)?.destinationCountry ?? null,
          sessionType: b.sessionType,
          slotISO: b.slotISO ?? null,
          createdAt: b.createdAt,
          call: callInfo(b, sessionOptions)
        }))
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/bookings/:bookingId/cancel', requireAuth, async (req, res, next) => {
    try {
      const result = await services.consultants.cancelBooking(req.params.bookingId as string, req.user!.uid);
      if (result === 'not_found') throw notFound('Booking not found');
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'CANCEL_BOOKING', resource: req.params.bookingId as string, ip: req.ip ?? '?' });
      res.json({ bookingId: req.params.bookingId, status: 'cancelled' });
    } catch (err) {
      next(err);
    }
  });

  // Real, fixed slot menu — matches apps/mobile/App.tsx's SLOTS_AM/SLOTS_PM
  // exactly (label format included: "9:00 AM", no leading zero). There's no
  // real per-consultant calendar system (Calendly is only referenced as a
  // placeholder URL), so the available TIMES are still a fixed list — what's
  // now real is which of those times are already booked.
  const ALL_BOOKING_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];
  // All booking slot times are quoted in GST (UTC+4, no DST) — matching the
  // "All times in GST" label already shown in the mobile booking screen.
  const GST_OFFSET_MS = 4 * 60 * 60 * 1000;
  function gstDateKeyAndLabel(slotISO: string): { dateKey: string; label: string } | null {
    const shifted = new Date(new Date(slotISO).getTime() + GST_OFFSET_MS);
    const dateKey = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
    const hour24 = shifted.getUTCHours();
    const minute = shifted.getUTCMinutes();
    const h12 = ((hour24 + 11) % 12) + 1;
    const label = `${h12}:${String(minute).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
    return ALL_BOOKING_SLOTS.includes(label) ? { dateKey, label } : null;
  }

  app.get('/booking/slots/:consultantId', async (req, res, next) => {
    try {
      const { consultantId } = req.params;
      // date is a GST-local YYYY-MM-DD string for the day being browsed;
      // defaults to "today" (GST) when the caller doesn't pass one.
      const requestedDate = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : gstDateKeyAndLabel(new Date().toISOString())?.dateKey ?? new Date().toISOString().slice(0, 10);
      const bookings = await services.consultants.listBookings();
      const takenSlots = bookings
        .filter((b) => b.consultantId === consultantId && b.slotISO && b.status !== 'cancelled')
        .map((b) => gstDateKeyAndLabel(b.slotISO!))
        .filter((parsed): parsed is { dateKey: string; label: string } => !!parsed && parsed.dateKey === requestedDate)
        .map((parsed) => parsed.label);
      res.json({ consultantId, date: requestedDate, slots: ALL_BOOKING_SLOTS, takenSlots });
    } catch (err) {
      next(err);
    }
  });

  app.get('/consultant-console', requireAuth, requireRole('consultant', 'platform_admin'), async (_req, res, next) => {
    try {
      res.json(await services.consultants.getConsole());
    } catch (err) {
      next(err);
    }
  });

  app.get('/hr', requireAuth, requireRole('hr_admin', 'platform_admin'), async (req, res, next) => {
    try {
      res.json(await services.consultants.getHrPortal(req.user!));
    } catch (err) {
      next(err);
    }
  });

  app.get('/employee', requireAuth, async (req, res, next) => {
    try {
      res.json(await services.consultants.getEmployeePortal(req.user!));
    } catch (err) {
      next(err);
    }
  });

  // Real consultant<->client messaging. A client starts a thread by naming a
  // consultantId; a consultant/platform_admin replies into an existing
  // thread by its threadId (`${consultantId}__${clientUid}`) — there's no
  // per-consultant login identity yet (see getConsole), so any staff role
  // can reply into any thread, same scope as the console itself.
  app.post('/messages', requireAuth, async (req, res, next) => {
    try {
      const { text } = req.body ?? {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'text is required' } });
      }
      const isStaff = req.user!.roles.includes('consultant') || req.user!.roles.includes('platform_admin');
      let consultantId: string;
      let clientUid: string;
      let clientName: string;
      let senderRole: 'client' | 'consultant';
      if (isStaff && typeof req.body?.threadId === 'string') {
        // Match against the known consultant-id whitelist rather than
        // splitting on "__" — a clientUid can itself legitimately contain an
        // underscore (uids are derived from base64url-encoded emails), so a
        // naive split could misparse the boundary.
        const threadId: string = req.body.threadId;
        const consultantsList = await services.consultants.listConsultants();
        const matched = consultantsList.find((c) => threadId.startsWith(`${c.id}__`));
        if (!matched) {
          return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Invalid threadId' } });
        }
        consultantId = matched.id;
        clientUid = threadId.slice(matched.id.length + 2);
        if (!clientUid) {
          return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Invalid threadId' } });
        }
        senderRole = 'consultant';
        const clientProfile = await services.profile.getProfile(clientUid);
        clientName = clientProfile.personal ? `${clientProfile.personal.firstName} ${clientProfile.personal.lastName}`.trim() : clientUid;
      } else {
        const { consultantId: bodyConsultantId } = req.body ?? {};
        if (!bodyConsultantId || typeof bodyConsultantId !== 'string') {
          return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'consultantId is required' } });
        }
        const consultant = await services.consultants.getConsultant(bodyConsultantId);
        if (!consultant) throw notFound('Consultant not found');
        consultantId = bodyConsultantId;
        clientUid = req.user!.uid;
        senderRole = 'client';
        const profile = await services.profile.getProfile(clientUid);
        clientName = profile.personal ? `${profile.personal.firstName} ${profile.personal.lastName}`.trim() : (req.user!.email ?? clientUid);
      }
      const message = await services.messaging.sendMessage({
        consultantId,
        clientUid,
        clientName: clientName || (req.user!.email ?? clientUid),
        senderRole,
        text: text.trim()
      });
      res.status(201).json({ message });
    } catch (err) {
      next(err);
    }
  });

  // A client's own conversations with consultants — without this, a client
  // could send a message (POST /messages) but had no way to ever discover it
  // got a reply, since listThreadsForConsultant only serves the staff side.
  app.get('/my-conversations', requireAuth, async (req, res, next) => {
    try {
      const threads = await services.messaging.listThreadsForUser(req.user!.uid);
      const enriched = await Promise.all(threads.map(async (t) => {
        const consultant = await services.consultants.getConsultant(t.consultantId);
        return { ...t, consultantName: consultant?.name ?? t.consultantId };
      }));
      res.json({ threads: enriched });
    } catch (err) {
      next(err);
    }
  });

  app.get('/messages', requireAuth, async (req, res, next) => {
    try {
      const threadId = typeof req.query.threadId === 'string' ? req.query.threadId : null;
      if (!threadId) {
        return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'threadId query param is required' } });
      }
      const isStaff = req.user!.roles.includes('consultant') || req.user!.roles.includes('platform_admin');
      // Exact-suffix check, not a "__" split — see the POST /messages comment
      // for why splitting on the delimiter is unsafe here.
      if (!isStaff && !threadId.endsWith(`__${req.user!.uid}`)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your conversation' } });
      }
      const messages = await services.messaging.listMessages(threadId);
      res.json({ messages });
    } catch (err) {
      next(err);
    }
  });

  app.get('/profile', requireAuth, async (req, res, next) => {
    try {
      res.json({ profile: await services.profile.getProfile(req.user!.uid) });
    } catch (err) { next(err); }
  });

  app.put('/profile', requireAuth, validateBody(userProfilePatchSchema), async (req, res, next) => {
    try {
      res.json({ profile: await services.profile.updateProfile(req.user!.uid, req.body) });
    } catch (err) { next(err); }
  });

  app.get('/admin/overview', requireAuth, requireRole('platform_admin'), async (_req, res, next) => {
    try {
      res.json(await services.consultants.getAdminOverview());
    } catch (err) {
      next(err);
    }
  });

  app.get('/admin/embassy-updates', requireAuth, requireRole('platform_admin'), async (_req, res, next) => {
    try {
      const { getUpdateLog } = await import('./services/embassyUpdater.js');
      res.json({ updates: getUpdateLog() });
    } catch (err) {
      next(err);
    }
  });

  app.get('/admin/users', requireAuth, requireRole('platform_admin'), async (_req, res, next) => {
    try {
      const users = await listUsers();
      res.json({
        users: users.map((u) => ({
          uid: u.uid, email: u.email, name: u.name, roles: u.roles,
          status: u.status ?? 'active', createdAt: u.createdAt ?? new Date().toISOString(),
          // 'seed' marks the built-in demo login account, not a real signup —
          // absent entirely for every real user, so existing callers that
          // ignore this field see no change.
          ...(u.source === 'seed' ? { source: 'seed' as const } : {})
        })),
        total: users.length,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/admin/users/:uid/suspend', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const uid = req.params.uid as string;
      if (!uid || uid.length > 128) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid uid' } });
      const updated = await setUserStatus(uid, 'suspended');
      if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      await appendAuditLog({ actor: req.user!.email ?? uid, action: 'SUSPEND_USER', resource: uid, ip: req.ip ?? '?' });
      res.json({ uid, status: 'suspended', suspendedAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  });

  app.post('/admin/users/:uid/restore', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const uid = req.params.uid as string;
      if (!uid || uid.length > 128) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid uid' } });
      const updated = await setUserStatus(uid, 'active');
      if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      await appendAuditLog({ actor: req.user!.email ?? uid, action: 'RESTORE_USER', resource: uid, ip: req.ip ?? '?' });
      res.json({ uid, status: 'active', restoredAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  });

  app.get('/admin/audit-log', requireAuth, requireRole('platform_admin'), async (_req, res, next) => {
    try {
      const entries = await listAuditLog();
      res.json({ entries, total: entries.length });
    } catch (err) {
      next(err);
    }
  });

  // The consumer-facing counterpart to POST/DELETE below — without this, a
  // user had no way to see or manage what they'd shared: the mobile app's
  // profile screen claimed "View and revoke consultant access from your
  // profile" next to a plain, unclickable info row with no screen behind it
  // at all. Scoped to grants THIS user created (listActiveGrants() itself is
  // platform-wide, for the staff-facing console — filtering by grantedBy
  // here is what keeps this endpoint from leaking every user's grants).
  app.get('/access-grants', requireAuth, async (req, res, next) => {
    try {
      const all = await services.accessGrants.listActiveGrants();
      const mine = all.filter((g) => g.grantedBy === req.user!.uid);
      const enriched = await Promise.all(mine.map(async (g) => {
        const consultant = await services.consultants.getConsultant(g.consultantId);
        const application = await services.applications.getApplication(g.applicationId, req.user!.uid);
        return {
          grantId: g.grantId,
          consultantId: g.consultantId,
          consultantName: consultant?.name ?? g.consultantId,
          applicationId: g.applicationId,
          destinationCountry: application?.destinationCountry ?? null,
          categories: g.categories,
          expiresAt: g.expiresAt
        };
      }));
      res.json({ grants: enriched });
    } catch (err) {
      next(err);
    }
  });

  app.post('/access-grants', requireAuth, validateBody(accessGrantRequestSchema), async (req, res, next) => {
    try {
      // Same ownership check as /bookings above — without it, any signed-in
      // user could grant a consultant access (including documents,
      // audit_findings, ai_messages, contact) to an application they don't
      // own, just by guessing/enumerating its id, and that grant would
      // surface the real owner's data in the consultant console.
      const owned = await services.applications.getApplication(req.body.applicationId, req.user!.uid);
      if (!owned) throw notFound('Application not found');
      // acceptedTerms is validated (must be literally true) by the request schema; the server stamps
      // when it was accepted so the consent is a real record, not a client-supplied claim.
      const grant = await services.accessGrants.createGrant({ ...req.body, grantedBy: req.user!.uid, termsAcceptedAt: new Date().toISOString(), termsVersion: '2026-09' });
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'GRANT_CONSULTANT_ACCESS', resource: `${req.body.applicationId}:${req.body.consultantId}`, ip: req.ip ?? '?' });
      res.status(201).json(grant);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/access-grants/:grantId', requireAuth, async (req, res, next) => {
    try {
      const grantId = req.params.grantId as string;
      if (!grantId || grantId.length > 128) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid grantId' } });
      const result = await services.accessGrants.revokeGrant(grantId, req.user!.uid);
      if (!result) throw notFound('Access grant not found');
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Unlock report — requires payment validation (Stripe integration pending)
  // No payment processor is wired up yet (no Stripe key anywhere in this
  // codebase) — this used to accept any non-"invalid" string as a valid
  // payment and unlock the report for free, which is a real free-unlock bug,
  // not a dev convenience (nothing gated it to non-production). Fails closed
  // until a real STRIPE_SECRET_KEY is configured, matching the "coming soon"
  // messaging already shown in both mobile and web (neither currently calls
  // this endpoint at all — the mobile paywall UI was removed, web shows a
  // "coming soon" toast instead of calling it).
  app.post('/reports/:docId/unlock', requireAuth, async (req, res, next) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Payment processing is not yet configured on this server.' } });
      }
      const { paymentToken } = req.body ?? {};
      if (!paymentToken || typeof paymentToken !== 'string') {
        return res.status(402).json({ error: { code: 'PAYMENT_REQUIRED', message: 'A valid payment token is required to unlock this report' } });
      }
      // TODO: verify paymentToken as a real Stripe PaymentIntent/charge here
      // once STRIPE_SECRET_KEY is set — no client can reach this branch yet.
      return res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Payment processing is not yet configured on this server.' } });
    } catch (err) {
      next(err);
    }
  });

  // Usage stats for API portal — current billing period. auditsRun is real
  // (derived from the same owner-verified audit trail /documents uses);
  // apiCalls/avgLatencyMs/errorRate/webhookDeliveries stay honestly at 0 —
  // there's no request-metering or webhook-delivery-tracking system yet, so
  // reporting anything else would be fabricated.
  app.get('/usage', requireAuth, async (req, res, next) => {
    try {
      const now = new Date();
      const period = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const apps = await services.applications.listApplications(req.user!.uid);
      const documentIds = (await Promise.all(apps.map((a) => listAuditOwnerDocumentIds(a.id)))).flat();
      const auditResults = await services.auditQueue.getAuditResultsByIds(documentIds);
      res.json({
        period,
        apiCalls: { used: 0, limit: 5000 },
        auditsRun: auditResults.length,
        avgLatencyMs: 0,
        errorRate: 0,
        webhookDeliveries: 0,
        updatedAt: now.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  // Requirements knowledge-base status — real coverage, not a fabricated
  // "scraper" fiction. 'admin-managed' = a platform_admin has reviewed and
  // set this country's data via /admin/knowledge-base; 'built-in' = still on
  // the shipped default dataset. requirementCount/sourceCount are real counts
  // of the actual requirement/source-URL entries on file for that country.
  app.get('/compliance-db', requireAuth, async (_req, res, next) => {
    try {
      const { REQUIREMENTS_BY_COUNTRY } = await import('@visaiq/mock-data');
      const overrides = await services.requirements.listCountryOverrides();
      const countryNames = new Set([...Object.keys(REQUIREMENTS_BY_COUNTRY), ...Object.keys(overrides)]);
      const countries = [...countryNames].sort().map((country) => {
        const isOverride = country in overrides;
        const data = isOverride ? overrides[country] : REQUIREMENTS_BY_COUNTRY[country];
        return {
          country,
          status: isOverride ? 'admin-managed' as const : 'built-in' as const,
          requirementCount: data.requirements.length,
          sourceCount: data.sourceUrls.length,
          lastUpdated: isOverride ? data.freshness.fetchedAt : null,
        };
      });
      res.json({
        countries,
        totalCountries: countries.length,
        overrideCount: Object.keys(overrides).length,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/embassies', async (_req, res, next) => {
    try {
      const embassies = [
        { id: 'france',         country: 'France',          city: 'Dubai',       name: 'Consulate General of France',          address: 'Al Bateen Area, W50 St, Abu Dhabi',     phone: '+971 2 613 0000', hours: 'Mon–Fri 08:30–12:30', website: 'ae.ambafrance.org',              appointment: 'https://ae.ambafrance.org' },
        { id: 'uk',             country: 'United Kingdom',  city: 'Dubai',       name: 'British Embassy Dubai',                address: 'Al Seef Rd, Bur Dubai, Dubai',           phone: '+971 4 309 4444', hours: 'Mon–Fri 08:00–16:00', website: 'www.gov.uk/world/uae',           appointment: 'https://www.vfsglobal.co.uk' },
        { id: 'us',             country: 'United States',   city: 'Abu Dhabi',   name: 'U.S. Embassy Abu Dhabi',               address: 'Embassies District, Abu Dhabi',          phone: '+971 2 414 2200', hours: 'Mon–Fri 08:00–16:30', website: 'ae.usembassy.gov',               appointment: 'https://ais.usvisa-info.com' },
        { id: 'canada',         country: 'Canada',          city: 'Dubai',       name: 'Embassy of Canada',                    address: 'Bank St, Abu Dhabi',                     phone: '+971 2 694 0300', hours: 'Mon–Fri 07:30–15:00', website: 'www.canada.ca/en/immigration',    appointment: 'https://ircc.canada.ca' },
        { id: 'germany',        country: 'Germany',         city: 'Abu Dhabi',   name: 'German Embassy Abu Dhabi',             address: 'Sheikh Khalifa St, Abu Dhabi',           phone: '+971 2 644 6693', hours: 'Mon–Fri 09:00–12:00', website: 'abu-dhabi.diplo.de',             appointment: 'https://videx.diplo.de' },
        { id: 'france_dubai',   country: 'France',          city: 'Dubai',       name: 'Consulate General of France in Dubai', address: 'Al Habtoor City, Sheikh Zayed Rd',       phone: '+971 4 408 4900', hours: 'Mon–Fri 08:30–12:30', website: 'ae.ambafrance.org',              appointment: 'https://ae.ambafrance.org' },
        { id: 'italy',          country: 'Italy',           city: 'Abu Dhabi',   name: 'Embassy of Italy',                     address: 'Khalid Bin Al Waleed, Abu Dhabi',        phone: '+971 2 443 5622', hours: 'Mon–Fri 09:00–12:30', website: 'ambAbuDhabi.esteri.it',          appointment: 'https://prenotami.esteri.it' },
        { id: 'netherlands',    country: 'Netherlands',     city: 'Abu Dhabi',   name: 'Embassy of the Netherlands',           address: 'Diplomatic Area, Abu Dhabi',             phone: '+971 2 632 1920', hours: 'Mon–Fri 09:00–12:00', website: 'www.dutchembassy.ae',            appointment: 'https://www.vfsglobal.com' },
        { id: 'australia',      country: 'Australia',       city: 'Abu Dhabi',   name: 'Australian Embassy',                   address: 'Al Muhairy Centre, Abu Dhabi',           phone: '+971 2 401 7500', hours: 'Mon–Fri 08:30–12:30', website: 'uae.embassy.gov.au',             appointment: 'https://online.vfsglobal.com' },
        { id: 'india',          country: 'India',           city: 'Dubai',       name: 'Consulate General of India',           address: 'Oud Metha Rd, Bur Dubai',                phone: '+971 4 397 1333', hours: 'Mon–Fri 09:00–12:00', website: 'cgidubai.gov.in',                appointment: 'https://cgidubai.gov.in' },
        { id: 'japan',          country: 'Japan',           city: 'Abu Dhabi',   name: 'Embassy of Japan',                     address: 'Bainunah St, Abu Dhabi',                 phone: '+971 2 443 5696', hours: 'Mon–Fri 09:00–12:00', website: 'www.ae.emb-japan.go.jp',         appointment: 'https://www.vfsglobal.com' },
        { id: 'singapore',      country: 'Singapore',       city: 'Abu Dhabi',   name: 'Embassy of Singapore',                 address: 'Abu Dhabi Mall Tower A',                 phone: '+971 2 657 0444', hours: 'Mon–Fri 09:00–13:00', website: 'www.mfa.gov.sg/abudhabi',         appointment: 'https://www.vfsglobal.com' },
      ];
      const country = typeof _req.query.country === 'string' ? _req.query.country.toLowerCase() : null;
      const result = country ? embassies.filter(e => e.country.toLowerCase().includes(country) || e.id.includes(country)) : embassies;
      res.json({ embassies: result, total: result.length });
    } catch (err) { next(err); }
  });

  const WAIVER_DB: Record<string, Record<string, { type: 'waiver' | 'visa' | 'eta'; note: string }>> = {
    'UAE Resident': {
      'France': { type: 'visa', note: 'Schengen visa required. UAE resident permit may fast-track VFS appointment.' },
      'United Kingdom': { type: 'visa', note: 'UK Standard Visitor visa required.' },
      'Turkey': { type: 'waiver', note: '90-day visa-free entry for UAE residents (UAE residence permit required).' },
      'Georgia': { type: 'waiver', note: '365-day visa-free entry for UAE residents.' },
      'Serbia': { type: 'waiver', note: '30-day visa-free for UAE residents.' },
      'Azerbaijan': { type: 'waiver', note: '30-day visa-free for UAE residents.' },
      'Thailand': { type: 'eta', note: 'Thailand e-Visa available online. 30-day tourist.' },
      'Malaysia': { type: 'waiver', note: '30-day visa-free entry.' },
      'Maldives': { type: 'waiver', note: '30-day visa-free on arrival.' },
    },
    'Indian': {
      'UAE': { type: 'visa', note: 'UAE tourist visa required. Available online via ICA or airlines.' },
      'Thailand': { type: 'visa', note: 'Thailand e-Visa or VOA available. 15–30 days.' },
      'Malaysia': { type: 'eta', note: 'eNTRI or e-Visa available online. 15-day free for Indian passport holders.' },
      'Maldives': { type: 'waiver', note: '30-day visa-free on arrival.' },
      'Nepal': { type: 'waiver', note: 'Visa-free for Indian passport holders.' },
      'Bhutan': { type: 'visa', note: 'Bhutan Development Fund fee (USD 100/day) + permit required.' },
      'Indonesia': { type: 'waiver', note: '30-day free visa on arrival at major ports.' },
      'Mauritius': { type: 'waiver', note: '60-day visa-free entry.' },
      'Seychelles': { type: 'waiver', note: '3-month visa-free.' },
      'Sri Lanka': { type: 'eta', note: 'ETA required online. 30 days.' },
    },
    'Pakistani': {
      'UAE': { type: 'visa', note: 'UAE visa required. Tourist/visit visa available via sponsor or online.' },
      'Turkey': { type: 'visa', note: 'e-Visa available online. 30 days.' },
      'Azerbaijan': { type: 'visa', note: 'e-Visa available online.' },
      'Malaysia': { type: 'eta', note: 'eNTRI available for social/tourism visits.' },
      'Thailand': { type: 'visa', note: 'e-Visa or visa on arrival available.' },
      'Maldives': { type: 'waiver', note: '30-day visa-free on arrival.' },
    },
    'British': {
      'UAE': { type: 'waiver', note: '30-day visa on arrival (extendable). British passport holders get entry stamp at port.' },
      'France': { type: 'visa', note: 'Post-Brexit: short-stay Schengen visa required for stays over 90 days in 180.' },
      'United States': { type: 'eta', note: 'ESTA required online. 90 days visa-free under VWP.' },
      'Canada': { type: 'eta', note: 'eTA required for air travel. 6-month visa-free.' },
      'Australia': { type: 'eta', note: 'ETA (subclass 601) required. 12-month multiple entry.' },
      'Japan': { type: 'waiver', note: '90-day visa-free.' },
      'Singapore': { type: 'waiver', note: '30-day visa-free.' },
    },
    'American': {
      'UAE': { type: 'waiver', note: '30-day visa on arrival at all ports. Extendable.' },
      'France': { type: 'waiver', note: '90 days in 180-day period visa-free in Schengen zone.' },
      'United Kingdom': { type: 'waiver', note: '6 months visa-free as visitor.' },
      'Australia': { type: 'eta', note: 'ETA required (subclass 601). 12-month multiple entry.' },
      'Japan': { type: 'waiver', note: '90-day visa-free.' },
      'Canada': { type: 'waiver', note: '6-month visa-free entry.' },
    },
    'Filipino': {
      'UAE': { type: 'visa', note: 'UAE visa required. Tourist or visit visa via sponsor.' },
      'Malaysia': { type: 'waiver', note: '30-day visa-free.' },
      'Thailand': { type: 'waiver', note: '30-day visa-free.' },
      'Indonesia': { type: 'waiver', note: '30-day visa-free.' },
      'Vietnam': { type: 'waiver', note: '30-day visa-free.' },
      'Singapore': { type: 'waiver', note: '30-day visa-free.' },
      'South Korea': { type: 'waiver', note: '30-day visa-free for UAE residents with valid UAE residence.' },
      'Japan': { type: 'visa', note: 'Japan visa required from embassy.' },
    },
    'Egyptian': {
      'UAE': { type: 'visa', note: 'UAE visa required. e-Visa available for some categories.' },
      'Turkey': { type: 'eta', note: 'Turkey e-Visa available online. 30 days.' },
      'Georgia': { type: 'waiver', note: '360-day visa-free.' },
      'Malaysia': { type: 'waiver', note: '30-day visa-free.' },
      'Maldives': { type: 'waiver', note: '30-day visa-free on arrival.' },
    },
  };

  app.get('/visa-waiver', async (req, res, next) => {
    try {
      const nationality = typeof req.query.nationality === 'string' ? req.query.nationality : null;
      const destination = typeof req.query.destination === 'string' ? req.query.destination : null;
      if (!nationality) {
        return res.json({ nationalities: Object.keys(WAIVER_DB) });
      }
      const rules = WAIVER_DB[nationality];
      if (!rules) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: `No waiver data for nationality: ${nationality}` } });
      }
      if (!destination) {
        return res.json({ nationality, destinations: Object.entries(rules).map(([dest, rule]) => ({ destination: dest, ...rule })) });
      }
      const rule = rules[destination];
      if (!rule) {
        return res.json({ nationality, destination, type: 'unknown', note: 'No specific waiver rule found. Check with the destination embassy.' });
      }
      return res.json({ nationality, destination, ...rule });
    } catch (err) { next(err); }
  });

  // Ecosystem partners
  app.get('/partners', async (_req, res, next) => {
    try {
      res.json({
        categories: ['flights', 'housing', 'corporate', 'insurance'],
        partners: [
          { id: 'p-emirates', category: 'flights',   name: 'Emirates',     tagline: 'World-class connectivity from Dubai',        discount: '8% off bookings',         commissionPct: 4, url: 'https://www.emirates.com' },
          { id: 'p-airindia', category: 'flights',   name: 'Air India',    tagline: 'Direct routes India ↔ Schengen',             discount: '5% off + priority check-in', commissionPct: 4, url: 'https://www.airindia.com' },
          { id: 'p-flydubai', category: 'flights',   name: 'flydubai',     tagline: 'Budget-friendly regional routes',            discount: 'AED 50 off first booking', commissionPct: 3, url: 'https://www.flydubai.com' },
          { id: 'p-airbnb',   category: 'housing',   name: 'Airbnb',       tagline: 'Verified stays with host ratings',           discount: '10% off first stay',      commissionPct: 6, url: 'https://www.airbnb.com' },
          { id: 'p-booking',  category: 'housing',   name: 'Booking.com',  tagline: 'Cancellation-friendly hotel bookings',       discount: 'Genius Level 2 unlocked', commissionPct: 6, url: 'https://www.booking.com' },
          { id: 'p-deel',     category: 'corporate', name: 'Deel',         tagline: 'International payroll and HR',               discount: '1 month free on annual plan', commissionPct: 8, url: 'https://www.deel.com' },
          { id: 'p-remote',   category: 'corporate', name: 'Remote.com',   tagline: 'Employer of record worldwide',               discount: 'Waived onboarding fee',   commissionPct: 7, url: 'https://remote.com' },
          { id: 'p-axa',      category: 'insurance', name: 'AXA Travel',   tagline: 'Schengen-compliant medical coverage',        discount: 'AED 80 single-trip policy', commissionPct: 5, url: 'https://www.axa-travel-insurance.com' },
          { id: 'p-rsa',      category: 'insurance', name: 'RSA Insurance',tagline: 'UAE-issued travel insurance certificates',   discount: '12% off annual plan',     commissionPct: 5, url: 'https://www.rsauae.com' },
          { id: 'p-oman',     category: 'insurance', name: 'Oman Insurance',tagline: 'Instant certificate for embassy submission', discount: 'Same-day issuance',      commissionPct: 5, url: 'https://www.omaninsurance.ae' },
        ],
      });
    } catch (err) {
      next(err);
    }
  });

  // Notifications — per-user, derived from application events
  app.get('/notifications', requireAuth, async (req, res, next) => {
    try {
      const uid = req.user!.uid;
      const apps = await services.applications.listApplications(uid);
      const notifications: Array<{ id: string; title: string; body: string; time: string; type: string; read: boolean }> = [];

      // VisaApplication carries no timestamp field at all (not createdAt, not
      // an "issues last found at" marker) — these two notifications reflect a
      // persistent CURRENT condition recomputed fresh on every request, not a
      // one-time event with a real moment to measure elapsed time from. This
      // used to show a fixed "Just now"/"1h ago" regardless of how long the
      // condition had actually existed (could be weeks) — 'Ongoing' is
      // honest about that instead of implying a precision that isn't there.
      apps.forEach((app, i) => {
        if (app.issuesCount > 0) {
          notifications.push({
            id: `warn-${app.id}`,
            title: `${app.issuesCount} issue${app.issuesCount !== 1 ? 's' : ''} on ${app.destinationCountry} application`,
            body: `Resolve issues to improve your readiness score (currently ${app.readinessScore}/100).`,
            time: 'Ongoing',
            type: 'warning',
            read: i > 0,
          });
        }
        if (app.documentsUploaded > 0 && app.documentsUploaded < app.documentsRequired) {
          notifications.push({
            id: `docs-${app.id}`,
            title: `${app.documentsRequired - app.documentsUploaded} document${app.documentsRequired - app.documentsUploaded !== 1 ? 's' : ''} still needed`,
            body: `${app.destinationCountry} ${app.visaType} — upload remaining documents to continue.`,
            time: 'Ongoing',
            type: 'audit',
            read: true,
          });
        }
      });

      if (notifications.length === 0) {
        notifications.push({
          id: 'welcome',
          title: 'Welcome to Visa With Ease',
          body: 'Start by creating your first visa application.',
          time: 'Just now',
          type: 'system',
          read: false,
        });
      }

      // Apply persisted read state from mark-read calls (scoped to this user)
      const enriched = await Promise.all(
        notifications.map(async (n) => ({ ...n, read: n.read || (await isNotificationRead(uid, n.id)) }))
      );
      res.json({ notifications: enriched });
    } catch (err) {
      next(err);
    }
  });

  app.post('/notifications/:id/read', requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id as string;
      if (!id || id.length > 128) {
        return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid notification id' } });
      }
      await markNotificationRead(req.user!.uid, id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Documents — the real per-application checklist, cross-referenced against
  // actually-claimed documentIds and their actually-stored audit results.
  // Nothing here is derived from a count or a random/deterministic filler —
  // a template only shows as done when a real AuditResult exists for it.
  app.get('/documents', requireAuth, async (req, res, next) => {
    try {
      const uid = req.user!.uid;
      const applicationId = typeof req.query.applicationId === 'string' ? req.query.applicationId : undefined;
      const apps = await services.applications.listApplications(uid);
      const relevantApp = applicationId ? apps.find(a => a.id === applicationId) : apps[0];

      const DOCUMENT_TEMPLATES = [
        { id: 'passport',   title: 'Passport bio page',           type: 'passport',   icon: 'id-card-outline',          required: true  },
        { id: 'bank',       title: 'Bank statement (3 months)',   type: 'bank',       icon: 'cash-outline',             required: true  },
        { id: 'employment', title: 'Employment letter',           type: 'employment', icon: 'briefcase-outline',        required: true  },
        { id: 'insurance',  title: 'Travel medical insurance',    type: 'insurance',  icon: 'shield-checkmark-outline', required: true  },
        { id: 'itinerary',  title: 'Flight & hotel reservation',  type: 'itinerary',  icon: 'airplane-outline',         required: true  },
        { id: 'photo',      title: 'Biometric photo',             type: 'photo',      icon: 'camera-outline',           required: true  },
      ];
      const STATUS_LABEL: Record<string, string> = { excellent: 'Passed all checks', attention_needed: 'Needs attention', issues_to_fix: 'Issues found' };
      const STATUS_COLOR: Record<string, string> = { excellent: '#10B981', attention_needed: '#F59E0B', issues_to_fix: '#DC2626' };

      let documents: any[] = DOCUMENT_TEMPLATES.map(tmpl => ({
        id: `${relevantApp?.id ?? 'doc'}-${tmpl.id}`,
        title: tmpl.title,
        type: tmpl.type,
        icon: tmpl.icon,
        status: 'Missing',
        statusColor: '#DC2626',
        score: 0,
        issue: tmpl.required ? 'Required — not yet uploaded' : 'Optional',
        retention: 'Not uploaded',
        uploadedAt: null as string | null,
      }));

      if (relevantApp) {
        const documentIds = await listAuditOwnerDocumentIds(relevantApp.id);
        const results = await services.auditQueue.getAuditResultsByIds(documentIds);
        // Most recent result wins if the same type was uploaded more than once.
        const byType = new Map<string, typeof results[number]>();
        for (const r of results) {
          const key = (r.documentType || 'other').toLowerCase();
          const existing = byType.get(key);
          if (!existing || r.generatedAt > existing.generatedAt) byType.set(key, r);
        }
        // A real signed URL to the original file — only present when Storage
        // is actually enabled on this project AND that specific document's
        // bytes were successfully persisted at audit time. Absent otherwise,
        // never a placeholder link.
        async function withFileUrl(real: typeof results[number]) {
          const storagePath = await getDocumentFilePath(real.documentId);
          const fileUrl = storagePath ? await getSignedReadUrl(storagePath) : null;
          return {
            status: 'Audited',
            statusColor: STATUS_COLOR[real.status] ?? '#10B981',
            score: real.score,
            issue: STATUS_LABEL[real.status] ?? 'Audited',
            retention: fileUrl ? 'Original file stored with your account' : 'Result stored with your account — original file is not retained',
            uploadedAt: real.generatedAt,
            fileUrl: fileUrl ?? undefined,
          };
        }
        documents = await Promise.all(documents.map(async doc => {
          const real = byType.get(doc.type);
          if (!real) return doc;
          byType.delete(doc.type);
          return { ...doc, id: real.documentId, ...(await withFileUrl(real)) };
        }));
        // Any real audit whose type didn't match one of the 6 known templates
        // (e.g. 'other') still gets shown — a real upload is never dropped.
        for (const [, real] of byType) {
          documents.push({
            id: real.documentId,
            title: real.documentType || 'Document',
            type: real.documentType || 'other',
            icon: 'document-outline',
            ...(await withFileUrl(real)),
          });
        }
      }

      res.json({ documents });
    } catch (err) {
      next(err);
    }
  });

  // Currencies Frankfurter doesn't cover — fixed pegs or exotic currencies
  const STATIC_RATES: Record<string, number> = {
    USD: 1.000, AED: 3.6725, SAR: 3.7500, QAR: 3.6400, BHD: 0.3760,
    KWD: 0.3080, OMR: 0.3845, JOD: 0.7090, PKR: 278.5, BDT: 109.8,
    LKR: 299.2, NPR: 133.4, IDR: 15840, VND: 25135, EGP: 30.90,
    NGN: 1608, GHS: 15.25, ETB: 56.90, MAD: 9.980, KES: 128.7,
    // Approximate majors — only shown when the live rate service is unreachable.
    EUR: 0.92, GBP: 0.79, AUD: 1.52, CAD: 1.37, CHF: 0.88, JPY: 150, CNY: 7.2, INR: 83, SGD: 1.34, NZD: 1.65, TRY: 32, ZAR: 18.5,
  };
  let rateCache: { rates: Record<string, number>; updatedAt: string } | null = null;
  let rateCacheExpiry = 0;

  app.get('/exchange-rates', async (_req, res, next) => {
    try {
      const now = Date.now();
      if (rateCache && now < rateCacheExpiry) {
        return res.json({ ...rateCache, base: 'USD' });
      }
      // Frankfurter has no SLA and this route has no other guard against a
      // slow/unreachable upstream — without a timeout, one stuck outbound
      // call here hangs the whole request (and ties up the connection)
      // instead of falling back to the cache/static rates below.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      let fxRes: Response;
      try {
        fxRes = await fetch('https://api.frankfurter.app/latest?base=USD', { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!fxRes.ok) throw new Error(`Frankfurter returned ${fxRes.status}`);
      const fxData = await fxRes.json() as { rates: Record<string, number>; date: string };
      const rates: Record<string, number> = { ...STATIC_RATES, ...fxData.rates, USD: 1.000 };
      const updatedAt = new Date().toISOString();
      rateCache = { rates, updatedAt };
      rateCacheExpiry = now + 5 * 60 * 1000;
      return res.json({ rates, base: 'USD', updatedAt });
    } catch (_err) {
      if (rateCache) return res.json({ ...rateCache, base: 'USD' });
      const rates = { ...STATIC_RATES };
      return res.json({ rates, base: 'USD', updatedAt: new Date().toISOString() });
    }
  });

  app.get('/referrals', requireAuth, async (req, res, next) => {
    try {
      const uid = req.user!.uid;
      const referralCode = await getOrCreateReferralCode(uid);
      const claims = await listReferralClaimsForReferrer(uid);
      const REWARD_USD = 10;
      res.json({
        referralCode,
        referralLink: `${process.env.FRONTEND_URL ?? 'http://localhost:5174'}/join?ref=${referralCode}`,
        stats: { pending: 0, converted: claims.length, totalEarned: claims.length * REWARD_USD },
        history: claims
          .slice()
          .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt))
          .map((c) => ({ name: c.claimedByEmail, status: 'Signed up', date: c.claimedAt, credit: `+$${REWARD_USD}` })),
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/referrals/claim', requireAuth, async (req, res, next) => {
    try {
      const { code } = req.body ?? {};
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'Referral code is required' } });
      }
      const uid = req.user!.uid;
      const normalized = code.trim().toUpperCase();
      const referrerUid = await getReferralCodeOwner(normalized);
      if (!referrerUid) {
        return res.status(404).json({ error: { code: 'INVALID_CODE', message: 'That referral code was not found' } });
      }
      if (referrerUid === uid) {
        return res.status(400).json({ error: { code: 'SELF_REFERRAL', message: "You can't claim your own referral code" } });
      }
      const existingClaim = await getReferralClaimForUser(uid);
      if (existingClaim) {
        return res.status(409).json({ error: { code: 'ALREADY_CLAIMED', message: 'You have already claimed a referral code' } });
      }
      await recordReferralClaim({
        code: normalized,
        referrerUid,
        claimedByUid: uid,
        claimedByEmail: req.user!.email ?? uid,
        claimedAt: new Date().toISOString()
      });
      res.json({ ok: true, message: 'Referral code applied. Reward will be credited on your first paid subscription.' });
    } catch (err) {
      next(err);
    }
  });

  app.get('/webhooks', requireAuth, async (req, res, next) => {
    try {
      const userWebhooks = await listWebhooksForUser(req.user!.uid);
      res.json({ webhooks: userWebhooks });
    } catch (err) {
      next(err);
    }
  });

  app.post('/webhooks', requireAuth, async (req, res, next) => {
    try {
      const { url, events } = req.body ?? {};
      if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
        return res.status(400).json({ error: { code: 'INVALID_URL', message: 'A valid HTTPS URL is required' } });
      }
      const webhook = { url, events: Array.isArray(events) ? events : ['audit.complete'], createdAt: new Date().toISOString() };
      const id = await createWebhook(req.user!.uid, webhook);
      res.status(201).json({ id, ...webhook });
    } catch (err) {
      next(err);
    }
  });

  // Real persistence — this used to reply with a "scheduled" message and
  // write nothing anywhere, so nothing was ever actually scheduled or
  // cancellable. A record now genuinely exists and genuinely un-schedules
  // itself if the user logs back in (see cancelAccountDeletion calls in
  // /auth/session and /auth/google below). There is still no scheduled job
  // that purges data once scheduledFor passes — that needs real
  // infrastructure on the server this app deploys to, not just an API route.
  app.post('/auth/delete-account', requireAuth, async (req, res, next) => {
    try {
      const scheduledFor = new Date(Date.now() + 30 * 86400000).toISOString();
      const record = await scheduleAccountDeletion(req.user!.uid, scheduledFor);
      await appendAuditLog({ actor: req.user!.email ?? req.user!.uid, action: 'REQUEST_ACCOUNT_DELETION', resource: req.user!.uid, ip: req.ip ?? '?' });
      res.json({ ok: true, scheduledFor: record.scheduledFor, message: 'Account deletion scheduled. You have 30 days to cancel by logging in.' });
    } catch (err) {
      next(err);
    }
  });

  app.get('/auth/delete-account/status', requireAuth, async (req, res, next) => {
    try {
      const record = await getAccountDeletionStatus(req.user!.uid);
      res.json({ pending: record?.status === 'pending', record: record ?? null });
    } catch (err) {
      next(err);
    }
  });

  app.use((_req, _res, next) => {
    next(notFound('Not found'));
  });
  app.use(errorHandler);

  return app;
}
