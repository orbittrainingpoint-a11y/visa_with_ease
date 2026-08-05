import cors from 'cors';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
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
  visaContextSchema
} from '@visaiq/contracts';
import { attachAuth, requireAuth, requireRole } from './auth.js';
import { errorHandler, notFound, traceMiddleware } from './errors.js';
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

// In-memory user credential store (replace with a real user DB in production).
// Keyed by lowercased email. Passwords are salted+hashed with scrypt — never stored
// or logged in plaintext.
interface UserRecord { uid: string; email: string; name: string; passwordHash: string; roles: string[] }
const userStore = new Map<string, UserRecord>();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const candidateBuf = scryptSync(password, salt, 64);
  if (hashBuf.length !== candidateBuf.length) return false;
  return timingSafeEqual(hashBuf, candidateBuf);
}

// Seed the demo account referenced by the web/mobile login screens' pre-filled
// credentials (sarah.mathew@example.com / demo1234) so the documented demo flow
// keeps working now that /auth/session actually checks the password.
userStore.set('sarah.mathew@example.com', {
  uid: `user-${Buffer.from('sarah.mathew@example.com').toString('base64url').slice(0, 12)}`,
  email: 'sarah.mathew@example.com',
  name: 'Sarah Mathew',
  passwordHash: hashPassword('demo1234'),
  roles: ['consumer']
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // RATE_LIMIT_DISABLED=true bypasses the limiter in test environments
  skip: () => process.env.RATE_LIMIT_DISABLED === 'true',
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } }
});

// In-memory audit log — events are appended during the server's lifetime
const auditLog: Array<{ id: string; actor: string; action: string; resource: string; at: string; ip: string }> = [
  { id: 'al-001', actor: 'admin@demo.visaiq.app', action: 'LOGIN',         resource: 'auth',         at: new Date(Date.now() - 120000).toISOString(),    ip: '127.0.0.1' },
  { id: 'al-002', actor: 'admin@demo.visaiq.app', action: 'VIEW_USERS',    resource: '/admin/users', at: new Date(Date.now() - 90000).toISOString(),     ip: '127.0.0.1' },
  { id: 'al-003', actor: 'hr@demo.visaiq.app',    action: 'VIEW_HR',       resource: '/hr',          at: new Date(Date.now() - 3600000).toISOString(),   ip: '10.0.0.1'  },
];

// In-memory OTP store (replace with Redis in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// In-memory two-factor-auth enrollment (replace with DB in production)
const twoFactorEnabledUids = new Set<string>();

// In-memory read-notification state (replace with DB in production)
// Per-user read-notification state: uid -> set of notification ids marked read.
const readNotificationIds = new Map<string, Set<string>>();
function getReadSet(uid: string): Set<string> {
  let set = readNotificationIds.get(uid);
  if (!set) {
    set = new Set();
    readNotificationIds.set(uid, set);
  }
  return set;
}

// Webhook store
const webhookStore = new Map<string, { url: string; events: string[]; createdAt: string }>();

export function createApp(services: Services = createServices()) {
  const app = express();

  app.use(traceMiddleware);
  app.use(helmet());
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
  // Outside production, fall back to allowing any origin so local dev never silently
  // breaks login/API calls just because CORS_ORIGINS isn't set in .env.
  app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : process.env.NODE_ENV !== 'production' }));
  app.use(express.json({ limit: '2mb' }));
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
        redis: services.auditQueue.health(),
        firestore: services.auth.health(),
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
    const record = userStore.get(email.toLowerCase());
    if (!record || !verifyPassword(password, record.passwordHash)) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' } });
    }
    const expiresIn = remember ? '7d' : '1d';
    const expiresAt = new Date(Date.now() + (remember ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString();
    const token = signToken({ uid: record.uid, email: record.email, roles: record.roles }, expiresIn);
    auditLog.push({ id: `al-${Date.now()}`, actor: email, action: 'LOGIN', resource: 'auth', at: new Date().toISOString(), ip: req.ip ?? '?' });
    res.status(201).json({ token, user: { uid: record.uid, email: record.email, name: record.name, roles: record.roles }, expiresAt });
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
    const key = email.toLowerCase();
    if (userStore.has(key)) {
      return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists' } });
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const uid = `user-${Buffer.from(email).toString('base64url').slice(0, 12)}`;
    const roles = ['consumer'];
    userStore.set(key, { uid, email, name, passwordHash: hashPassword(password), roles });
    const token = signToken({ uid, email, roles }, '7d');
    res.status(201).json({ token, user: { uid, email, name, roles }, expiresAt });
  });

  // Google Sign-In — verifies idToken from the mobile app
  app.post('/auth/google', authLimiter, async (req, res) => {
    const { idToken } = req.body ?? {};
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'idToken is required' } });
    }
    const webClientId = process.env.GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) {
      return res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'Google Sign-In is not configured on this server' } });
    }
    try {
      const client = new OAuth2Client(webClientId);
      const ticket = await client.verifyIdToken({ idToken, audience: webClientId });
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
      return res.status(201).json({ token, user: { uid, email, name, roles }, expiresAt });
    } catch {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Google token verification failed' } });
    }
  });

  app.post('/auth/forgot-password', authLimiter, async (req, res) => {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'A valid email address is required' } });
    }
    // In production: send a real password-reset email via SendGrid/SES
    // For now: acknowledge the request without revealing whether the email exists
    res.json({ ok: true, message: 'If an account with that email exists, a reset link has been sent.' });
  });

  app.post('/auth/verify-email', authLimiter, async (req, res) => {
    const { email, code } = req.body ?? {};
    if (!email || !code) {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'email and code are required' } });
    }
    const entry = otpStore.get(email);
    if (!entry || Date.now() > entry.expiresAt) {
      // In dev mode: accept any 6-digit code for demo purposes
      if (process.env.NODE_ENV === 'development' || process.env.AI_MOCK === 'true') {
        return res.json({ ok: true, verified: true });
      }
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code' } });
    }
    if (entry.code !== code) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Incorrect verification code' } });
    }
    otpStore.delete(email);
    res.json({ ok: true, verified: true });
  });

  // Two-factor authentication — enrollment status
  app.get('/auth/2fa/status', requireAuth, (req, res) => {
    res.json({ enabled: twoFactorEnabledUids.has(req.user!.uid) });
  });

  // Two-factor authentication — send a one-time code to the signed-in user's email
  app.post('/auth/2fa/send-code', requireAuth, authLimiter, (req, res) => {
    const email = req.user!.email;
    if (!email) {
      return res.status(400).json({ error: { code: 'NO_EMAIL', message: 'Account has no email on file' } });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    // In production: deliver via SendGrid/SES/SMS. In mock/dev mode, return the
    // code directly so the UI can display it — there is no real mail transport.
    if (process.env.AI_MOCK === 'true' || process.env.NODE_ENV === 'development') {
      return res.json({ ok: true, devCode: code });
    }
    res.json({ ok: true });
  });

  // Two-factor authentication — verify the code and enroll the account
  app.post('/auth/2fa/verify', requireAuth, authLimiter, (req, res) => {
    const { code } = req.body ?? {};
    const email = req.user!.email;
    if (!email) {
      return res.status(400).json({ error: { code: 'NO_EMAIL', message: 'Account has no email on file' } });
    }
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'code is required' } });
    }
    const entry = otpStore.get(email);
    if (!entry || Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code' } });
    }
    if (entry.code !== code) {
      return res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Incorrect verification code' } });
    }
    otpStore.delete(email);
    twoFactorEnabledUids.add(req.user!.uid);
    res.json({ enabled: true });
  });

  // Two-factor authentication — disable
  app.post('/auth/2fa/disable', requireAuth, authLimiter, (req, res) => {
    twoFactorEnabledUids.delete(req.user!.uid);
    res.json({ enabled: false });
  });

  // Demo login — gives pre-configured sessions for different roles (dev/demo only)
  const DEMO_PERSONAS = {
    consumer:        { email: 'consumer@demo.visaiq.app',  name: 'Demo Consumer',       roles: ['consumer'] },
    consultant:      { email: 'consultant@demo.visaiq.app',name: 'Demo Consultant',      roles: ['consumer', 'consultant'] },
    hr_admin:        { email: 'hr@demo.visaiq.app',        name: 'Demo HR Admin',        roles: ['consumer', 'hr_admin'] },
    platform_admin:  { email: 'admin@demo.visaiq.app',     name: 'Demo Platform Admin',  roles: ['consumer', 'consultant', 'hr_admin', 'platform_admin'] },
  } as const;

  app.post('/auth/demo', authLimiter, (req, res) => {
    const persona = (req.body?.persona ?? 'consumer') as keyof typeof DEMO_PERSONAS;
    const p = DEMO_PERSONAS[persona] ?? DEMO_PERSONAS.consumer;
    const uid = `demo-${persona}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = signToken({ uid, email: p.email, roles: [...p.roles] }, '24h');
    auditLog.push({ id: `al-${Date.now()}`, actor: p.email, action: 'LOGIN', resource: 'auth', at: new Date().toISOString(), ip: req.ip ?? '?' });
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
      const { destinationCountry, visaType, intendedFrom, intendedTo, purpose } = req.body ?? {};
      if (!destinationCountry || !visaType || !intendedFrom) {
        return res.status(400).json({ error: { code: 'INVALID_BODY', message: 'destinationCountry, visaType and intendedFrom are required' } });
      }
      const derivedName = req.user?.email
        ? req.user.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Applicant';
      const applicantName = req.body.applicantName ?? derivedName;
      const application = await services.applications.createApplication(
        { destinationCountry, visaType, intendedFrom, applicantName, purpose: purpose ?? visaType },
        req.user?.uid
      );
      res.status(201).json({ application });
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
      // NOTE: this does not verify the caller owns `applicationId` — see
      // CRITICAL_ISSUES_AND_BUGS.md ("upload-slots ownership"). The mock backend
      // has no per-user persistence for the demo application IDs the frontend
      // references (app-fr-2026 etc.), so an ownership check would break the
      // current demo upload flow. Add real ownership enforcement once
      // applications are persisted consistently per user.
      res.status(201).json(await services.storage.createUploadSlot(req.body));
    } catch (err) {
      next(err);
    }
  });

  app.post('/audit', requireAuth, validateBody(auditRequestSchema), async (req, res, next) => {
    try {
      res.status(202).json(await services.auditQueue.enqueueAudit(req.body));
    } catch (err) {
      next(err);
    }
  });

  app.get('/audit/:docId', requireAuth, async (req, res, next) => {
    try {
      const docId = req.params.docId as string;
      if (!docId || docId.length > 256) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid docId' } });
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

  app.get('/requirements', async (_req, res, next) => {
    try {
      res.json(await services.requirements.getDefaultRequirements());
    } catch (err) {
      next(err);
    }
  });

  app.post('/chat', requireAuth, validateBody(chatRequestSchema), async (req, res, next) => {
    try {
      // Ground the assistant's answer in the caller's own application data (the
      // "given service" data source) when applicationId refers to an application
      // they actually own — never another user's data, and never invented state.
      const applicationId = (req.body as { applicationId?: string }).applicationId;
      const application = applicationId
        ? await services.applications.getApplication(applicationId, req.user!.uid)
        : null;
      res.json(await services.ai.chat(req.body, { application }));
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
      const booking = await services.consultants.createBooking({ ...req.body, userId: req.user!.uid });
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  });

  app.get('/booking/slots/:consultantId', async (req, res, next) => {
    try {
      const { consultantId } = req.params;
      // Generate realistic time slots for today and the next 7 days
      const allSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
      // Deterministically mark some as taken based on consultantId hash
      const hash = consultantId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const takenSlots = allSlots.filter((_, i) => (hash + i) % 3 === 0).slice(0, 2);
      res.json({ consultantId, slots: allSlots, takenSlots });
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

  app.get('/hr', requireAuth, requireRole('hr_admin', 'platform_admin'), async (_req, res, next) => {
    try {
      res.json(await services.consultants.getHrPortal());
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

  app.get('/profile', requireAuth, async (req, res, next) => {
    try {
      res.json({ profile: await services.profile.getProfile(req.user!.uid) });
    } catch (err) { next(err); }
  });

  app.put('/profile', requireAuth, async (req, res, next) => {
    try {
      const allowed = ['personal', 'passport', 'employment', 'financials', 'travelHistory', 'contacts'] as const;
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (req.body?.[key] !== undefined) patch[key] = req.body[key];
      }
      res.json({ profile: await services.profile.updateProfile(req.user!.uid, patch) });
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

  app.get('/admin/users', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      // In production this would query the user database
      // For now returns the in-memory sessions as a user list
      res.json({
        users: [
          { uid: 'demo-consumer',       email: 'consumer@demo.visaiq.app',  name: 'Demo Consumer',      roles: ['consumer'],                                              status: 'active',    createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
          { uid: 'demo-consultant',     email: 'consultant@demo.visaiq.app', name: 'Demo Consultant',    roles: ['consumer', 'consultant'],                                status: 'active',    createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
          { uid: 'demo-hr_admin',       email: 'hr@demo.visaiq.app',        name: 'Demo HR Admin',       roles: ['consumer', 'hr_admin'],                                  status: 'active',    createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
          { uid: 'demo-platform_admin', email: 'admin@demo.visaiq.app',     name: 'Demo Platform Admin', roles: ['consumer', 'consultant', 'hr_admin', 'platform_admin'],   status: 'active',    createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
          { uid: 'user-test-1',         email: 'alice@example.com',          name: 'Alice Chen',          roles: ['consumer'],                                              status: 'active',    createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
          { uid: 'user-test-2',         email: 'bob@example.com',            name: 'Bob Tanaka',          roles: ['consumer'],                                              status: 'suspended', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
        ],
        total: 6,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/admin/users/:uid/suspend', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const uid = req.params.uid as string;
      if (!uid || uid.length > 128) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid uid' } });
      // In production: update the user status in the database
      res.json({ uid, status: 'suspended', suspendedAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  });

  app.post('/admin/users/:uid/restore', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
    try {
      const uid = req.params.uid as string;
      if (!uid || uid.length > 128) return res.status(400).json({ error: { code: 'INVALID_PARAM', message: 'Invalid uid' } });
      res.json({ uid, status: 'active', restoredAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  });

  app.get('/admin/audit-log', requireAuth, requireRole('platform_admin'), async (_req, res, next) => {
    try {
      res.json({ entries: auditLog.slice().reverse(), total: auditLog.length });
    } catch (err) {
      next(err);
    }
  });

  app.post('/access-grants', requireAuth, validateBody(accessGrantRequestSchema), async (req, res, next) => {
    try {
      const grant = await services.accessGrants.createGrant({ ...req.body, grantedBy: req.user!.uid });
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
  app.post('/reports/:docId/unlock', requireAuth, async (req, res, next) => {
    try {
      const { paymentToken } = req.body ?? {};
      if (!paymentToken || typeof paymentToken !== 'string') {
        return res.status(402).json({ error: { code: 'PAYMENT_REQUIRED', message: 'A valid payment token is required to unlock this report' } });
      }
      // Stripe validation placeholder — replace with real Stripe charge in production
      // For now accept any non-empty token to unblock dev/demo flows
      if (paymentToken === 'invalid') {
        return res.status(402).json({ error: { code: 'PAYMENT_FAILED', message: 'Payment token rejected' } });
      }
      res.status(200).json({
        docId: req.params.docId,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        message: 'Full report access granted',
      });
    } catch (err) {
      next(err);
    }
  });

  // Usage stats for API portal — current billing period
  app.get('/usage', requireAuth, async (_req, res, next) => {
    try {
      const now = new Date();
      const period = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      res.json({
        period,
        apiCalls: { used: 0, limit: 5000 },
        auditsRun: 0,
        avgLatencyMs: 0,
        errorRate: 0,
        webhookDeliveries: 0,
        updatedAt: now.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  // Compliance database status — reflects actual supported country count
  app.get('/compliance-db', requireAuth, async (_req, res, next) => {
    try {
      const countries = [
        { country: 'France',         status: 'live',    coverage: 98, lastScraped: new Date().toISOString(),                        sources: 12 },
        { country: 'United Kingdom', status: 'live',    coverage: 96, lastScraped: new Date().toISOString(),                        sources: 10 },
        { country: 'United States',  status: 'live',    coverage: 99, lastScraped: new Date().toISOString(),                        sources: 18 },
        { country: 'UAE',            status: 'live',    coverage: 100,lastScraped: new Date().toISOString(),                        sources: 7  },
        { country: 'Canada',         status: 'live',    coverage: 95, lastScraped: new Date().toISOString(),                        sources: 9  },
        { country: 'Australia',      status: 'live',    coverage: 94, lastScraped: new Date().toISOString(),                        sources: 8  },
        { country: 'Japan',          status: 'pending', coverage: 72, lastScraped: new Date(Date.now() - 172800000).toISOString(), sources: 5  },
        { country: 'Germany',        status: 'live',    coverage: 93, lastScraped: new Date().toISOString(),                        sources: 8  },
        { country: 'Singapore',      status: 'live',    coverage: 91, lastScraped: new Date().toISOString(),                        sources: 6  },
        { country: 'India',          status: 'live',    coverage: 88, lastScraped: new Date().toISOString(),                        sources: 7  },
        { country: 'Turkey',         status: 'pending', coverage: 65, lastScraped: new Date(Date.now() - 86400000).toISOString(),  sources: 4  },
        { country: 'Nigeria',        status: 'error',   coverage: 40, lastScraped: new Date(Date.now() - 432000000).toISOString(), sources: 2  },
      ];
      const liveCount = countries.filter(c => c.status === 'live').length;
      res.json({
        countries,
        totalCountries: countries.length,
        liveCount,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/embassies', async (_req, res, next) => {
    try {
      const embassies = [
        { id: 'france',         country: 'France',          city: 'Dubai',       name: 'Consulate General of France',          address: 'Al Bateen Area, W50 St, Abu Dhabi',     phone: '+971 2 613 0000', hours: 'Mon–Fri 08:30–12:30', website: 'ae.ambafrance.org',              appointment: 'https://visas-algerie.gouv.fr' },
        { id: 'uk',             country: 'United Kingdom',  city: 'Dubai',       name: 'British Embassy Dubai',                address: 'Al Seef Rd, Bur Dubai, Dubai',           phone: '+971 4 309 4444', hours: 'Mon–Fri 08:00–16:00', website: 'www.gov.uk/world/uae',           appointment: 'https://www.vfsglobal.co.uk' },
        { id: 'us',             country: 'United States',   city: 'Abu Dhabi',   name: 'U.S. Embassy Abu Dhabi',               address: 'Embassies District, Abu Dhabi',          phone: '+971 2 414 2200', hours: 'Mon–Fri 08:00–16:30', website: 'ae.usembassy.gov',               appointment: 'https://ais.usvisa-info.com' },
        { id: 'canada',         country: 'Canada',          city: 'Dubai',       name: 'Embassy of Canada',                    address: 'Bank St, Abu Dhabi',                     phone: '+971 2 694 0300', hours: 'Mon–Fri 07:30–15:00', website: 'www.canada.ca/en/immigration',    appointment: 'https://ircc.canada.ca' },
        { id: 'germany',        country: 'Germany',         city: 'Abu Dhabi',   name: 'German Embassy Abu Dhabi',             address: 'Sheikh Khalifa St, Abu Dhabi',           phone: '+971 2 644 6693', hours: 'Mon–Fri 09:00–12:00', website: 'abu-dhabi.diplo.de',             appointment: 'https://videx.diplo.de' },
        { id: 'france_dubai',   country: 'France',          city: 'Dubai',       name: 'Consulate General of France in Dubai', address: 'Al Habtoor City, Sheikh Zayed Rd',       phone: '+971 4 408 4900', hours: 'Mon–Fri 08:30–12:30', website: 'ae.ambafrance.org',              appointment: 'https://visas-algerie.gouv.fr' },
        { id: 'italy',          country: 'Italy',           city: 'Abu Dhabi',   name: 'Embassy of Italy',                     address: 'Khalid Bin Al Waleed, Abu Dhabi',        phone: '+971 2 443 5622', hours: 'Mon–Fri 09:00–12:30', website: 'ambAbuDhabi.esteri.it',          appointment: 'https://prenotami.esteri.it' },
        { id: 'netherlands',    country: 'Netherlands',     city: 'Abu Dhabi',   name: 'Embassy of the Netherlands',           address: 'Diplomatic Area, Abu Dhabi',             phone: '+971 2 632 1920', hours: 'Mon–Fri 09:00–12:00', website: 'www.dutchembassy.ae',            appointment: 'https://www.vfsglobal.com' },
        { id: 'australia',      country: 'Australia',       city: 'Abu Dhabi',   name: 'Australian Embassy',                   address: 'Al Muhairy Centre, Abu Dhabi',           phone: '+971 2 401 7500', hours: 'Mon–Fri 08:30–12:30', website: 'uae.embassy.gov.au',             appointment: 'https://online.vfsglobal.com' },
        { id: 'india',          country: 'India',           city: 'Dubai',       name: 'Consulate General of India',           address: 'Oud Metha Rd, Bur Dubai',                phone: '+971 4 397 1333', hours: 'Mon–Fri 09:00–12:00', website: 'cgidubai.gov.in',                appointment: 'https://indiavisa.com' },
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
          { id: 'p-emirates', category: 'flights',   name: 'Emirates',    discount: '8% off bookings',        commissionPct: 4 },
          { id: 'p-airbnb',   category: 'housing',   name: 'Airbnb',      discount: '10% off first stay',     commissionPct: 6 },
          { id: 'p-deel',     category: 'corporate', name: 'Deel',        discount: '1 month free on annual', commissionPct: 8 },
          { id: 'p-axa',      category: 'insurance', name: 'AXA Travel',  discount: 'AED 80 single-trip',     commissionPct: 5 },
          { id: 'p-flydubai', category: 'flights',   name: 'flydubai',    discount: 'AED 50 off first booking',commissionPct: 3 },
          { id: 'p-remote',   category: 'corporate', name: 'Remote.com',  discount: 'Waived onboarding fee',  commissionPct: 7 },
          { id: 'p-rsa',      category: 'insurance', name: 'RSA Insurance',discount: '12% off annual plan',   commissionPct: 5 },
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

      apps.forEach((app, i) => {
        if (app.issuesCount > 0) {
          notifications.push({
            id: `warn-${app.id}`,
            title: `${app.issuesCount} issue${app.issuesCount !== 1 ? 's' : ''} on ${app.destinationCountry} application`,
            body: `Resolve issues to improve your readiness score (currently ${app.readinessScore}/100).`,
            time: 'Just now',
            type: 'warning',
            read: i > 0,
          });
        }
        if (app.documentsUploaded > 0 && app.documentsUploaded < app.documentsRequired) {
          notifications.push({
            id: `docs-${app.id}`,
            title: `${app.documentsRequired - app.documentsUploaded} document${app.documentsRequired - app.documentsUploaded !== 1 ? 's' : ''} still needed`,
            body: `${app.destinationCountry} ${app.visaType} — upload remaining documents to continue.`,
            time: '1h ago',
            type: 'audit',
            read: true,
          });
        }
      });

      if (notifications.length === 0) {
        notifications.push({
          id: 'welcome',
          title: 'Welcome to VisaIQ',
          body: 'Start by creating your first visa application.',
          time: 'Just now',
          type: 'system',
          read: false,
        });
      }

      // Apply persisted read state from mark-read calls (scoped to this user)
      const readSet = getReadSet(uid);
      const enriched = notifications.map(n => ({ ...n, read: n.read || readSet.has(n.id) }));
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
      getReadSet(req.user!.uid).add(id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Documents — per-user document list (seeded from application state)
  app.get('/documents', requireAuth, async (req, res, next) => {
    try {
      const uid = req.user!.uid;
      const applicationId = typeof req.query.applicationId === 'string' ? req.query.applicationId : undefined;
      const apps = await services.applications.listApplications(uid);
      const relevantApp = applicationId ? apps.find(a => a.id === applicationId) : apps[0];

      const DOCUMENT_TEMPLATES = [
        { id: 'passport',   title: 'Passport bio page',           type: 'Passport',   icon: 'id-card-outline',          required: true  },
        { id: 'bank',       title: 'Bank statement (3 months)',   type: 'Finance',    icon: 'cash-outline',             required: true  },
        { id: 'employment', title: 'Employment letter',           type: 'Employment', icon: 'briefcase-outline',        required: true  },
        { id: 'insurance',  title: 'Travel medical insurance',    type: 'Insurance',  icon: 'shield-checkmark-outline', required: true  },
        { id: 'itinerary',  title: 'Flight & hotel reservation',  type: 'Itinerary',  icon: 'airplane-outline',         required: true  },
        { id: 'photo',      title: 'Biometric photo',             type: 'Photo',      icon: 'camera-outline',           required: true  },
      ];

      // Deterministic scores per document type — no Math.random()
      const AUDIT_SCORES: Record<string, number> = {
        passport: 96, bank: 88, employment: 91, insurance: 85, itinerary: 93, photo: 90
      };

      const uploaded = relevantApp?.documentsUploaded ?? 0;
      const documents = DOCUMENT_TEMPLATES.map((tmpl, i) => {
        const isUploaded = i < uploaded;
        const isAudited = i < Math.max(0, uploaded - 1);
        const appId = relevantApp?.id ?? 'doc';
        return {
          id: `${appId}-${tmpl.id}`,
          title: tmpl.title,
          type: tmpl.type,
          icon: tmpl.icon,
          status: isAudited ? 'Audited' : isUploaded ? 'Queued' : 'Missing',
          statusColor: isAudited ? '#10B981' : isUploaded ? '#F59E0B' : '#DC2626',
          score: isAudited ? (AUDIT_SCORES[tmpl.id] ?? 90) : 0,
          issue: isAudited ? 'Passed all checks' : isUploaded ? 'Waiting for AI audit' : (tmpl.required ? 'Required — not yet uploaded' : 'Optional'),
          retention: isUploaded ? `Deletes in ${68 + i}h` : 'Not uploaded',
          uploadedAt: isUploaded ? new Date(Date.now() - i * 3600000).toISOString().split('T')[0] : null,
        };
      });

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
  };
  let rateCache: { rates: Record<string, number>; updatedAt: string } | null = null;
  let rateCacheExpiry = 0;

  app.get('/exchange-rates', async (_req, res, next) => {
    try {
      const now = Date.now();
      if (rateCache && now < rateCacheExpiry) {
        return res.json({ ...rateCache, base: 'USD' });
      }
      const fxRes = await fetch('https://api.frankfurter.app/latest?base=USD');
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
      const referralCode = `REF-${uid.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
      res.json({
        referralCode,
        referralLink: `https://visaiq.app/r/${referralCode}`,
        stats: { pending: 0, converted: 0, totalEarned: 0 },
        history: [],
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
      res.json({ ok: true, message: 'Referral code applied. Reward will be credited on your first paid subscription.' });
    } catch (err) {
      next(err);
    }
  });

  app.get('/webhooks', requireAuth, async (req, res, next) => {
    try {
      const userWebhooks = [...webhookStore.entries()]
        .filter(([key]) => key.startsWith(`${req.user!.uid}-wh-`))
        .map(([id, wh]) => ({ id, ...wh }));
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
      const id = `${req.user!.uid}-wh-${Date.now()}`;
      const webhook = { url, events: Array.isArray(events) ? events : ['audit.complete'], createdAt: new Date().toISOString() };
      webhookStore.set(id, webhook);
      res.status(201).json({ id, ...webhook });
    } catch (err) {
      next(err);
    }
  });

  app.post('/auth/delete-account', requireAuth, async (req, res, next) => {
    try {
      // In production: queue account deletion (GDPR 30-day window)
      // For now: acknowledge and return success
      res.json({ ok: true, scheduledFor: new Date(Date.now() + 30 * 86400000).toISOString(), message: 'Account deletion scheduled. You have 30 days to cancel by logging in.' });
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
