import { getRequirementsForCountry } from '@visaiq/mock-data';
import { toClientRequirements, type RequirementsOverrideData } from './verification.js';
import type { AccessGrantRequest, AuditResult, RequirementsResponse, VisaApplication } from '@visaiq/contracts';
import type { Firestore } from 'firebase-admin/firestore';
import { createAiProvider } from './aiProviders.js';
import { analyzeDocument } from './documentAnalysis.js';
import { createJwtAuthService, createMockServices } from './mockServices.js';
import { isPushConfigured, sendPushToUser } from './push.js';
import { messagingService } from './messaging.js';
import { listOverduePendingDeletions } from './appStore.js';
import type {
  AccessGrantRepository,
  ApplicationRepository,
  AuditQueue,
  ConsultantService,
  NotificationService,
  ProfileService,
  RequirementsCache,
  Services,
  StorageService,
  UserProfile
} from './types.js';

type StoredVisaApplication = VisaApplication & { ownerId: string };

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const COUNTRY_FLAGS: Record<string, string> = {
  France: '🇫🇷', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸',
  Canada: '🇨🇦', Australia: '🇦🇺', Japan: '🇯🇵', Germany: '🇩🇪',
  Netherlands: '🇳🇱', Spain: '🇪🇸', Italy: '🇮🇹', UAE: '🇦🇪',
  'United Arab Emirates': '🇦🇪', India: '🇮🇳', Singapore: '🇸🇬',
  'New Zealand': '🇳🇿', Turkey: '🇹🇷', China: '🇨🇳', Thailand: '🇹🇭',
  Malaysia: '🇲🇾', 'Sri Lanka': '🇱🇰', 'South Korea': '🇰🇷',
  'Saudi Arabia': '🇸🇦', Bahrain: '🇧🇭', Oman: '🇴🇲', Kenya: '🇰🇪',
  'South Africa': '🇿🇦', Brazil: '🇧🇷'
};

function currentRequirements(country?: string): RequirementsResponse {
  const fetchedAt = new Date(Date.now() - 2 * 60 * 1000);
  const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000);
  const ageHours = Math.round(((Date.now() - fetchedAt.getTime()) / 3600000) * 10) / 10;
  return { ...getRequirementsForCountry(country), freshness: { fetchedAt: fetchedAt.toISOString(), expiresAt: expiresAt.toISOString(), ageHours } };
}

/**
 * Real, persistent backing for the `Services` contract — everything a user
 * creates survives a server restart. Two pieces are deliberately still stubs
 * because they depend on infrastructure this phase doesn't set up yet:
 *   - `storage.createUploadSlot` records intent to Firestore but doesn't return
 *     a real signed URL (needs a Firebase Storage bucket — separate phase).
 *   - `notifications.sendUserNotification` logs to Firestore but doesn't push
 *     to a device (needs FCM wiring — separate phase).
 * Auth, the AI provider, and the static consultant directory are unaffected
 * by which database backs the app, so they're reused as-is from the mock.
 */
export function createFirestoreServices(db: Firestore): Services {
  const mock = createMockServices();

  const applicationRepo: ApplicationRepository = {
    async listApplications(userId) {
      const uid = userId ?? 'anonymous';
      const snap = await db.collection('applications').where('ownerId', '==', uid).get();
      return snap.docs.map((doc) => {
        const { ownerId: _ownerId, ...rest } = doc.data() as StoredVisaApplication;
        return rest as VisaApplication;
      });
    },
    async getApplication(id, userId) {
      const doc = await db.collection('applications').doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data() as StoredVisaApplication;
      // Fail closed: a document with no ownerId (shouldn't happen via our own
      // write path, but could via a manual edit or future migration) belongs
      // to no one rather than everyone.
      if (userId && data.ownerId !== userId) return null;
      const { ownerId: _ownerId, ...rest } = data;
      return rest as VisaApplication;
    },
    async createApplication(input, userId) {
      const uid = userId ?? 'anonymous';
      const id = nowId('app');
      const suffix = id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
      const refCode = `REF-${new Date().getFullYear()}-${suffix}`;
      const baseScore = [input.destinationCountry, input.visaType, input.intendedFrom, input.purpose]
        .filter(Boolean).length * 6;
      const newApp: VisaApplication = {
        id,
        refCode,
        applicantName: input.applicantName,
        destinationCountry: input.destinationCountry,
        destinationFlag: COUNTRY_FLAGS[input.destinationCountry] ?? '🌍',
        visaType: input.visaType,
        status: 'draft',
        readinessScore: Math.min(baseScore, 30),
        documentsUploaded: 0,
        documentsRequired: 6,
        issuesCount: 0,
        intendedFrom: input.intendedFrom,
        ...(input.nationality ? { nationality: input.nationality } : {}),
        ...(input.residenceCountry ? { residenceCountry: input.residenceCountry } : {})
      };
      await db.collection('applications').doc(id).set({ ...newApp, ownerId: uid });
      return newApp;
    }
  };

  const profileRepo: ProfileService = {
    async getProfile(uid) {
      const doc = await db.collection('profiles').doc(uid).get();
      if (doc.exists) return doc.data() as UserProfile;
      return { uid, updatedAt: new Date().toISOString() };
    },
    async updateProfile(uid, patch) {
      const current = await profileRepo.getProfile(uid);
      const updated: UserProfile = { ...current, ...patch, uid, updatedAt: new Date().toISOString() };
      await db.collection('profiles').doc(uid).set(updated);
      return updated;
    }
  };

  const storage: StorageService = {
    async createUploadSlot(input) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await db.collection('uploadSlots').doc(`${input.applicationId}_${input.documentId}`).set({
        ...input, expiresAt, createdAt: new Date().toISOString()
      });
      return { uploadUrl: `/upload-stub/${input.applicationId}/${input.documentId}`, expiresAt };
    },
    health: () => 'mock'
  };

  const notifications: NotificationService = {
    async sendUserNotification(input) {
      const result = await sendPushToUser(input);
      // Keep a log regardless of whether a device was actually reachable —
      // useful for debugging "why didn't I get a notification" reports.
      await db.collection('notificationLog').doc(nowId('fcm')).set({
        ...input, ...result, createdAt: new Date().toISOString()
      });
      return result;
    },
    health: () => (isPushConfigured() ? 'configured' : 'mock')
  };

  const auditQueue: AuditQueue = {
    async enqueueAudit(input) {
      const result: AuditResult = await analyzeDocument(input);
      await db.collection('auditResults').doc(input.documentId).set(result);
      return { jobId: `audit-${input.documentId}`, status: 'queued', result };
    },
    async getAuditResult(documentId) {
      const doc = await db.collection('auditResults').doc(documentId).get();
      if (doc.exists) return doc.data() as AuditResult;
      return await analyzeDocument({ applicationId: '', documentId });
    },
    async getAuditResultsByIds(documentIds) {
      if (documentIds.length === 0) return [];
      const docs = await Promise.all(documentIds.map(id => db.collection('auditResults').doc(id).get()));
      return docs.filter(d => d.exists).map(d => d.data() as AuditResult);
    },
    health: () => 'configured'
  };

  // Admin-managed knowledge-base overrides live in their own collection,
  // separate from the request-level cache below — an override is always
  // checked first and, when present, wins outright. This is what lets a
  // platform_admin add or correct a country's visa requirements from the
  // web app and have it take effect immediately, with no code deploy.
  function freshen(stored: RequirementsOverrideData): RequirementsResponse {
    const fetchedAt = new Date();
    const data = toClientRequirements(stored);
    return { ...data, freshness: { fetchedAt: fetchedAt.toISOString(), expiresAt: new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000).toISOString(), ageHours: 0 } };
  }

  const requirementsCache: RequirementsCache = {
    async getRequirements(context) {
      if (context?.destinationCountry) {
        const override = await db.collection('visaKnowledgeBaseOverrides').doc(context.destinationCountry).get();
        if (override.exists) return freshen(override.data() as RequirementsOverrideData);
      }
      const key = Buffer.from(JSON.stringify(context)).toString('base64url');
      const doc = await db.collection('requirementsCache').doc(key).get();
      if (doc.exists) return doc.data() as RequirementsResponse;
      const fresh = currentRequirements(context?.destinationCountry);
      await db.collection('requirementsCache').doc(key).set(fresh);
      return fresh;
    },
    async getDefaultRequirements() {
      return currentRequirements();
    },
    async getRequirementsForCountry(country) {
      if (!country) return currentRequirements();
      const override = await db.collection('visaKnowledgeBaseOverrides').doc(country).get();
      if (override.exists) return freshen(override.data() as RequirementsOverrideData);
      const key = `country:${country}`;
      const doc = await db.collection('requirementsCache').doc(key).get();
      if (doc.exists) return doc.data() as RequirementsResponse;
      const fresh = currentRequirements(country);
      await db.collection('requirementsCache').doc(key).set(fresh);
      return fresh;
    },
    async listCountryOverrides() {
      const snap = await db.collection('visaKnowledgeBaseOverrides').get();
      const out: Record<string, RequirementsResponse> = {};
      snap.docs.forEach((d) => { out[d.id] = freshen(d.data() as RequirementsOverrideData); });
      return out;
    },
    async setCountryOverride(country, data) {
      await db.collection('visaKnowledgeBaseOverrides').doc(country).set(data);
      // Drop any stale cached default for this country so a subsequent
      // override delete doesn't briefly serve day-old cached data instead
      // of recomputing the built-in default.
      await db.collection('requirementsCache').doc(`country:${country}`).delete().catch(() => {});
      return freshen(data);
    },
    async deleteCountryOverride(country) {
      await db.collection('visaKnowledgeBaseOverrides').doc(country).delete();
    },
    health: () => 'configured'
  };

  const accessGrants: AccessGrantRepository = {
    async createGrant(input) {
      const grantId = nowId('grant');
      await db.collection('accessGrants').doc(grantId).set({ ...input, grantId, status: 'active', createdAt: new Date().toISOString() });
      const { grantedBy: _grantedBy, ...rest } = input;
      return { grantId, status: 'active', ...rest };
    },
    async revokeGrant(grantId, requesterUid) {
      const doc = await db.collection('accessGrants').doc(grantId).get();
      if (!doc.exists) return null;
      const data = doc.data() as { grantedBy: string };
      if (data.grantedBy !== requesterUid) return null;
      await db.collection('accessGrants').doc(grantId).set({ status: 'revoked', revokedAt: new Date().toISOString() }, { merge: true });
      return { grantId, status: 'revoked' };
    },
    async listActiveGrants() {
      const snap = await db.collection('accessGrants').where('status', '==', 'active').get();
      return snap.docs.map((d) => d.data() as AccessGrantRequest & { grantId: string; status: 'active'; grantedBy: string });
    }
  };

  const consultantService: ConsultantService = {
    ...mock.consultants,
    async createBooking(input) {
      const bookingId = nowId('booking');
      const record = {
        bookingId,
        status: 'pending_calendly' as const,
        consultantId: input.consultantId,
        applicationId: input.applicationId,
        sessionType: input.sessionType,
        userId: input.userId ?? 'anonymous',
        createdAt: new Date().toISOString(),
        ...(input.slotISO ? { slotISO: input.slotISO } : {})
      };
      await db.collection('bookings').doc(bookingId).set(record);
      return { bookingId, status: 'pending_calendly', calendlyUrl: 'https://calendly.com/visawithease', ...input };
    },
    async cancelBooking(bookingId, userId) {
      const ref = db.collection('bookings').doc(bookingId);
      const doc = await ref.get();
      if (!doc.exists || (doc.data() as { userId?: string }).userId !== userId) return 'not_found';
      if ((doc.data() as { status?: string }).status === 'cancelled') return 'already_cancelled';
      await ref.update({ status: 'cancelled' });
      return 'cancelled';
    },
    async listBookings() {
      const snap = await db.collection('bookings').orderBy('createdAt', 'desc').get();
      return snap.docs.map((d) => d.data() as { bookingId: string; status: string; consultantId: string; applicationId: string; sessionType: string; userId: string; createdAt: string; slotISO?: string });
    },
    async getConsole() {
      const grantsSnap = await db.collection('accessGrants').where('status', '==', 'active').get();
      const grants = grantsSnap.docs.map((d) => d.data() as { grantId: string; applicationId: string; consultantId: string; categories: string[] });
      const queue = await Promise.all(grants.map(async (g) => {
        const appDoc = await db.collection('applications').doc(g.applicationId).get();
        const app = appDoc.exists ? (appDoc.data() as StoredVisaApplication) : null;
        const urgency = !app ? 'review' : app.issuesCount > 0 ? 'urgent' : (app.status === 'ready' || app.status === 'submitted') ? 'ready' : 'review';
        return { id: g.grantId, applicant: app?.applicantName ?? 'Unknown applicant', destination: app?.destinationCountry ?? '—', urgency, sharedCategories: g.categories };
      }));
      const conversations = (await messagingService.listThreadsForConsultant()).map((t) => ({ id: t.threadId, applicant: t.applicant, lastMessage: t.lastMessage, status: t.status }));
      const bookingsSnap = await db.collection('bookings').get();
      const bookings = bookingsSnap.docs.map((d) => d.data() as { sessionType: string });
      const sessionOptions = await mock.consultants.listSessionOptions();
      const revenue = bookings.reduce((acc, b) => acc + (sessionOptions.find((s) => s.id === b.sessionType)?.priceUsd ?? 0), 0);
      const activeApplicationIds = new Set(grants.map((g) => g.applicationId));
      return {
        queue,
        conversations,
        crm: [
          { label: 'Total bookings', value: String(bookings.length) },
          { label: 'Active clients', value: String(activeApplicationIds.size) },
          { label: 'Revenue (est.)', value: `$${revenue}` },
          { label: 'Open conversations', value: String(conversations.length) }
        ]
      };
    },
    async getHrPortal(user) {
      // A regular hr_admin only ever sees their own company's teams — the
      // company is derived from their own profile, same field as everyone
      // else's. Without this scoping, every hr_admin saw every other
      // company's headcounts and open cases mixed together — a real
      // cross-tenant leak in a B2B feature. platform_admin (the platform
      // operator, not a tenant) keeps the full cross-company aggregate, via
      // a real query rather than fetching-then-filtering client-side.
      const isPlatformAdmin = user?.roles.includes('platform_admin');
      let profiles: Array<UserProfile & { employment: { employer: string } }>;
      if (isPlatformAdmin) {
        const profilesSnap = await db.collection('profiles').get();
        profiles = profilesSnap.docs.map((d) => d.data() as UserProfile).filter(
          (p): p is UserProfile & { employment: { employer: string } } => typeof p.employment?.employer === 'string' && p.employment.employer.length > 0
        );
      } else {
        const ownProfileDoc = user?.uid ? await db.collection('profiles').doc(user.uid).get() : null;
        const ownEmployer = (ownProfileDoc?.data() as UserProfile | undefined)?.employment?.employer;
        if (!ownEmployer) {
          profiles = [];
        } else {
          const scopedSnap = await db.collection('profiles').where('employment.employer', '==', ownEmployer).get();
          profiles = scopedSnap.docs.map((d) => d.data() as UserProfile & { employment: { employer: string } });
        }
      }
      const byEmployer = new Map<string, UserProfile[]>();
      for (const p of profiles) {
        const key = p.employment!.employer;
        if (!byEmployer.has(key)) byEmployer.set(key, []);
        byEmployer.get(key)!.push(p);
      }
      const teams = await Promise.all([...byEmployer.entries()].map(async ([employer, members], i) => {
        const openFlags = await Promise.all(members.map(async (m) => {
          const appsSnap = await db.collection('applications').where('ownerId', '==', m.uid).get();
          return appsSnap.docs.some((d) => { const a = d.data() as StoredVisaApplication; return a.status !== 'approved' && a.status !== 'rejected'; });
        }));
        return { id: `team-${i}`, name: employer, members: members.length, openCases: openFlags.filter(Boolean).length };
      }));
      const appCounts = await Promise.all(profiles.map(async (p) => (await db.collection('applications').where('ownerId', '==', p.uid).get()).size));
      const totalApps = appCounts.reduce((a, b) => a + b, 0);
      return {
        teams,
        reports: profiles.length
          ? [
              { label: 'Employees with a profile on file', value: String(profiles.length), trend: '' },
              { label: 'Total visa applications',          value: String(totalApps),       trend: '' }
            ]
          : [],
        // Honestly empty — no bulk-upload feature exists yet, so nothing to report.
        bulkUploads: []
      };
    },
    async getEmployeePortal(user) {
      const profile = user?.uid ? await profileRepo.getProfile(user.uid) : undefined;
      const derivedName = profile?.personal
        ? `${profile.personal.firstName} ${profile.personal.lastName}`.trim()
        : user?.email
          ? user.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : 'Employee';
      const apps = user?.uid ? await applicationRepo.listApplications(user.uid) : [];
      const app = apps[0];
      const tasks: Array<{ id: string; title: string; due: string; status: string }> = [];
      if (app) {
        if (app.documentsUploaded < app.documentsRequired) {
          tasks.push({ id: 'emp-docs', title: `Upload remaining documents (${app.documentsUploaded}/${app.documentsRequired})`, due: 'Ongoing', status: 'open' });
        }
        if (app.issuesCount > 0) {
          tasks.push({ id: 'emp-issues', title: `Resolve ${app.issuesCount} flagged issue${app.issuesCount === 1 ? '' : 's'}`, due: 'Ongoing', status: 'blocked' });
        }
        if (app.status === 'ready' || app.status === 'submitted') {
          tasks.push({ id: 'emp-share', title: 'Share readiness with HR', due: 'Ongoing', status: app.status === 'submitted' ? 'complete' : 'ready' });
        }
      }
      return {
        profile: { name: derivedName, company: profile?.employment?.employer ?? '', homeCountry: profile?.personal?.nationality ?? '' },
        tasks
      };
    },
    async getAdminOverview() {
      const appsSnap = await db.collection('applications').get();
      const ownerIds = new Set<string>();
      appsSnap.docs.forEach((d) => ownerIds.add((d.data() as StoredVisaApplication).ownerId));
      const knowledgeBaseSnap = await db.collection('visaKnowledgeBaseOverrides').get();
      const overdueDeletions = await listOverduePendingDeletions();
      return {
        metrics: [
          { label: 'Active users (Firestore)', value: String(ownerIds.size), trend: 'live' },
          { label: 'Total applications',        value: String(appsSnap.size), trend: 'live' },
          { label: 'Server uptime',             value: `${Math.floor(process.uptime() / 60)}m`, trend: 'healthy' },
          { label: 'Deletion SLA queue',        value: `${overdueDeletions.length} overdue`, trend: overdueDeletions.length > 0 ? 'attention' : 'healthy' }
        ],
        aiMonitoring: [
          { provider: 'Claude', status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'mock', latency: '' },
          { provider: 'Gemini', status: process.env.GOOGLE_GEMINI_API_KEY ? 'configured' : 'mock', latency: '' }
        ],
        users: [
          { segment: 'Unique users seen', count: ownerIds.size }
        ],
        revenue: [],
        requirementsDb: [
          { route: '/requirements', freshness: 'live', coverage: `${knowledgeBaseSnap.size} admin overrides on file` }
        ]
      };
    }
  };

  return {
    auth: createJwtAuthService(),
    applications: applicationRepo,
    storage,
    notifications,
    auditQueue,
    requirements: requirementsCache,
    ai: createAiProvider(),
    consultants: consultantService,
    accessGrants,
    profile: profileRepo,
    messaging: messagingService
  };
}
