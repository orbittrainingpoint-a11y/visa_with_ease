import { applications, getRequirementsForCountry } from '@visaiq/mock-data';
import { toClientRequirements, type RequirementsOverrideData } from './verification.js';
import type { AccessGrantRequest, RequirementsResponse } from '@visaiq/contracts';
import jwt from 'jsonwebtoken';
import { createAiProvider } from './aiProviders.js';
import { createRedisAuditQueue } from './redisAuditQueue.js';
import { sendPushToUser } from './push.js';
import { messagingService } from './messaging.js';
import { listOverduePendingDeletions } from './appStore.js';
import type {
  AccessGrantRepository,
  AiProvider,
  ApplicationRepository,
  AuditQueue,
  AuthService,
  BookingRecord,
  ConsultantService,
  NotificationService,
  ProfileService,
  RequirementsCache,
  Services,
  StorageService,
  UserProfile
} from './types.js';

// `verified` is a real field the backend controls, not an assumption the
// client makes — every consultant in this curated list has been vetted, so
// it's honestly true for all of them today. If an unvetted/pending
// consultant is ever added, set it false here and the mobile app's
// "Verified Consultant" badge will correctly stop showing for that one,
// instead of a client-side hardcode claiming it regardless.
const consultants = [
  { id: 'c-priya', name: 'Priya Sharma', rating: 4.9, specialty: 'Schengen documentation', rate: 89, languages: ['English', 'Hindi'], reviews: 284, responseTime: '< 2h', availableToday: true, verified: true, bio: 'Former VFS documentation lead focused on Schengen tourist and family visit applications.' },
  { id: 'c-omar', name: 'Omar Haddad', rating: 4.8, specialty: 'GCC resident applications', rate: 79, languages: ['English', 'Arabic'], reviews: 191, responseTime: '< 4h', availableToday: true, verified: true, bio: 'Dubai-based consultant for GCC residents applying across EU, UK and Canada routes.' },
  { id: 'c-elena', name: 'Elena Rossi', rating: 4.7, specialty: 'European consulate process', rate: 99, languages: ['English', 'Italian'], reviews: 143, responseTime: 'Tomorrow', availableToday: false, verified: true, bio: 'European consulate process specialist for itinerary, accommodation and proof-of-funds evidence.' }
];

const sessionOptions = [
  { id: 'standard', label: 'Standard review', durationMinutes: 30, priceUsd: 49, description: 'Checklist and document gap review.' },
  { id: 'deep-dive', label: 'Deep dive', durationMinutes: 60, priceUsd: 89, description: 'Full readiness review with prioritized fixes.', recommended: true },
  { id: 'emergency', label: 'Emergency review', durationMinutes: 30, priceUsd: 149, description: 'Fast-track consultation for travel within 7 days.' }
];

// Admin-managed knowledge-base overrides, keyed by exact country name (same
// convention as REQUIREMENTS_BY_COUNTRY). An override always wins over the
// built-in default for that country — this is what lets a platform_admin
// add or correct a country's visa requirements from the web app without a
// code deploy.
const countryOverrides = new Map<string, RequirementsOverrideData>();

function currentRequirements(country?: string) {
  const fetchedAt = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago (freshly computed)
  const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000);
  const ageHours = Math.round((Date.now() - fetchedAt.getTime()) / 3600000 * 10) / 10;
  const override = country ? countryOverrides.get(country) : undefined;
  return {
    ...(override ? toClientRequirements(override) : getRequirementsForCountry(country)),
    freshness: {
      fetchedAt: fetchedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ageHours
    }
  };
}

// The real session-token verifier — shared by every backend, mock or Firestore.
// Sessions are always our own signed JWTs (see app.ts's signToken); which
// database backs applications/profile/etc. is a separate concern.
export function createJwtAuthService(): AuthService {
  return {
    async verifyIdToken(token) {
      if (!token) return null;
      const secret = process.env.JWT_SECRET;
      if (!secret) return null;
      try {
        // Pin the algorithm allow-list — never trust `alg` from the token itself.
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { uid: string; email: string; roles: string[] };
        if (payload?.uid && payload?.email && Array.isArray(payload?.roles)) {
          return { uid: payload.uid, email: payload.email, roles: payload.roles };
        }
      } catch { /* invalid or expired JWT */ }
      return null;
    },
    health: () => 'mock'
  };
}

export function createMockServices(): Services {
  const auth: AuthService = createJwtAuthService();

  // Per-user application store: uid -> VisaApplication[]
  const userAppStore = new Map<string, typeof applications>();

  function getAppsForUser(userId?: string): typeof applications {
    const uid = userId ?? 'anonymous';
    if (!userAppStore.has(uid)) {
      // New users start with empty list — no pre-seeded demo apps
      userAppStore.set(uid, []);
    }
    return userAppStore.get(uid)!;
  }

  // Cross-user lookup for staff-facing views (consultant/HR) that need to
  // resolve an applicationId without already knowing which uid owns it —
  // getAppsForUser can't do this since it's keyed by uid.
  function findApplicationById(id: string): (typeof applications)[number] | null {
    for (const apps of userAppStore.values()) {
      const found = apps.find((a) => a.id === id);
      if (found) return found;
    }
    return null;
  }

  const profileStore = new Map<string, UserProfile>();

  function getProfileForUser(uid: string): UserProfile {
    if (!profileStore.has(uid)) {
      profileStore.set(uid, { uid, updatedAt: new Date().toISOString() });
    }
    return profileStore.get(uid)!;
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

  const applicationRepo: ApplicationRepository = {
    async listApplications(userId) {
      return getAppsForUser(userId);
    },
    async getApplication(id, userId) {
      return getAppsForUser(userId).find((item) => item.id === id) ?? null;
    },
    async getApplicationForStaff(id) {
      return findApplicationById(id);
    },
    async deleteApplication(id, userId) {
      const list = getAppsForUser(userId);
      const index = list.findIndex((item) => item.id === id);
      if (index < 0) return false;
      list.splice(index, 1);
      return true;
    },
    async createApplication(input, userId) {
      const uid = userId ?? 'anonymous';
      const list = getAppsForUser(uid);
      const id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const suffix = id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
      const refCode = `REF-${new Date().getFullYear()}-${suffix}`;
      const flag = COUNTRY_FLAGS[input.destinationCountry] ?? '🌍';
      // Seed a non-zero readiness score reflecting that the applicant at least
      // specified destination, visa type, and travel date (profile fields TBD).
      const baseScore = [input.destinationCountry, input.visaType, input.intendedFrom, input.purpose]
        .filter(Boolean).length * 6; // 6 points per filled field, max ~24
      const newApp: (typeof applications)[0] = {
        id,
        refCode,
        applicantName: input.applicantName,
        destinationCountry: input.destinationCountry,
        destinationFlag: flag,
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
      list.push(newApp);
      userAppStore.set(uid, list);
      return newApp;
    }
  };

  const storage: StorageService = {
    async createUploadSlot(input) {
      return {
        uploadUrl: `/upload-stub/${input.applicationId}/${input.documentId}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    },
    health: () => 'mock'
  };

  const notifications: NotificationService = {
    // Same real implementation as the Firestore-backed services — it
    // already degrades to 'skipped' honestly when no Firebase app is
    // configured, which is always true in this no-Firestore mode.
    sendUserNotification: sendPushToUser,
    health: () => 'mock'
  };

  const auditQueue: AuditQueue = createRedisAuditQueue();

  const requirementsCache: RequirementsCache = {
    async getRequirements(context) {
      return currentRequirements(context?.destinationCountry);
    },
    async getDefaultRequirements() {
      return currentRequirements();
    },
    async getRequirementsForCountry(country) {
      return currentRequirements(country);
    },
    async listCountryOverrides() {
      const out: Record<string, RequirementsResponse> = {};
      for (const [country, data] of countryOverrides) out[country] = currentRequirements(country) as RequirementsResponse;
      return out;
    },
    async setCountryOverride(country, data) {
      countryOverrides.set(country, data);
      return currentRequirements(country);
    },
    async deleteCountryOverride(country) {
      countryOverrides.delete(country);
    },
    health: () => 'mock'
  };

  const ai: AiProvider = createAiProvider();

  const consultantService: ConsultantService = {
    async listConsultants(filters) {
      const query = filters?.query?.toLowerCase();
      const language = filters?.language?.toLowerCase();
      const specialty = filters?.specialty?.toLowerCase();
      return consultants.filter((consultant) => {
        const matchesQuery = !query || `${consultant.name} ${consultant.specialty}`.toLowerCase().includes(query);
        const matchesLanguage = !language || consultant.languages.some((item) => item.toLowerCase() === language);
        const matchesSpecialty = !specialty || consultant.specialty.toLowerCase().includes(specialty);
        return matchesQuery && matchesLanguage && matchesSpecialty;
      });
    },
    async getConsultant(id) {
      return consultants.find((consultant) => consultant.id === id) ?? null;
    },
    async listSessionOptions() {
      return sessionOptions;
    },
    async createBooking(input) {
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      bookingStore.set(bookingId, {
        bookingId,
        status: 'pending_calendly',
        consultantId: input.consultantId,
        applicationId: input.applicationId,
        sessionType: input.sessionType,
        userId: input.userId ?? 'anonymous',
        createdAt: new Date().toISOString(),
        ...(input.slotISO ? { slotISO: input.slotISO } : {})
      });
      return {
        bookingId,
        status: 'pending_calendly',
        calendlyUrl: 'https://calendly.com/visawithease',
        ...input
      };
    },
    async listBookings() {
      return [...bookingStore.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getBooking(bookingId) {
      return bookingStore.get(bookingId) ?? null;
    },
    async setBookingMeeting(bookingId, meeting) {
      const b = bookingStore.get(bookingId);
      if (b) bookingStore.set(bookingId, { ...b, meeting });
    },
    async cancelBooking(bookingId, userId) {
      const b = bookingStore.get(bookingId);
      if (!b || b.userId !== userId) return 'not_found';
      if (b.status === 'cancelled') return 'already_cancelled';
      bookingStore.set(bookingId, { ...b, status: 'cancelled' });
      return 'cancelled';
    },
    async getConsole() {
      const activeGrants = [...grantStore.entries()].filter(([, g]) => g.status === 'active');
      const queue = activeGrants.map(([grantId, g]) => {
        const app = findApplicationById(g.applicationId);
        const urgency = !app ? 'review' : app.issuesCount > 0 ? 'urgent' : app.status === 'ready' || app.status === 'submitted' ? 'ready' : 'review';
        return {
          id: grantId,
          applicant: app?.applicantName ?? 'Unknown applicant',
          destination: app?.destinationCountry ?? '—',
          urgency,
          sharedCategories: g.categories
        };
      });
      const conversations = (await messagingService.listThreadsForConsultant()).map((t) => ({ id: t.threadId, applicant: t.applicant, lastMessage: t.lastMessage, status: t.status }));
      const bookings = [...bookingStore.values()];
      const activeApplicationIds = new Set(activeGrants.map(([, g]) => g.applicationId));
      const revenue = bookings.reduce((acc, b) => acc + (sessionOptions.find((s) => s.id === b.sessionType)?.priceUsd ?? 0), 0);
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
      const allProfiles = [...profileStore.values()].filter(
        (p): p is UserProfile & { employment: { employer: string } } => typeof p.employment?.employer === 'string' && p.employment.employer.length > 0
      );
      // A regular hr_admin only ever sees their own company's teams — the
      // company is derived from their own profile, same field as everyone
      // else's. platform_admin (the platform operator, not a tenant) keeps
      // the full cross-company aggregate.
      const isPlatformAdmin = user?.roles.includes('platform_admin');
      const ownEmployer = user?.uid ? profileStore.get(user.uid)?.employment?.employer : undefined;
      const employeeProfiles = isPlatformAdmin
        ? allProfiles
        : ownEmployer
          ? allProfiles.filter((p) => p.employment.employer === ownEmployer)
          : [];
      const byEmployer = new Map<string, UserProfile[]>();
      for (const p of employeeProfiles) {
        const key = p.employment!.employer;
        if (!byEmployer.has(key)) byEmployer.set(key, []);
        byEmployer.get(key)!.push(p);
      }
      const teams = [...byEmployer.entries()].map(([employer, members], i) => ({
        id: `team-${i}`,
        name: employer,
        members: members.length,
        openCases: members.filter((m) => (userAppStore.get(m.uid) ?? []).some((a) => a.status !== 'approved' && a.status !== 'rejected')).length
      }));
      const totalApps = employeeProfiles.reduce((acc, p) => acc + (userAppStore.get(p.uid)?.length ?? 0), 0);
      return {
        teams,
        reports: employeeProfiles.length
          ? [
              { label: 'Employees with a profile on file', value: String(employeeProfiles.length), trend: '' },
              { label: 'Total visa applications',          value: String(totalApps),               trend: '' }
            ]
          : [],
        // Honestly empty — no bulk-upload feature exists yet, so nothing to report.
        bulkUploads: []
      };
    },
    async getEmployeePortal(user?: { uid: string; email?: string; roles: string[] }) {
      const profile = user?.uid ? profileStore.get(user.uid) : undefined;
      const derivedName = profile?.personal
        ? `${profile.personal.firstName} ${profile.personal.lastName}`.trim()
        : user?.email
          ? user.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : 'Employee';
      const apps = user?.uid ? (userAppStore.get(user.uid) ?? []) : [];
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
      const allUids = new Set<string>();
      for (const uid of userAppStore.keys()) allUids.add(uid);
      const totalApps = [...userAppStore.values()].reduce((acc, apps) => acc + apps.length, 0);
      const overdueDeletions = await listOverduePendingDeletions();
      return {
        metrics: [
          { label: 'Active sessions (in-memory)', value: String(allUids.size), trend: 'live' },
          { label: 'Total applications',           value: String(totalApps),   trend: 'live' },
          { label: 'Server uptime',                value: `${Math.floor(process.uptime() / 60)}m`, trend: 'healthy' },
          { label: 'Deletion SLA queue',           value: `${overdueDeletions.length} overdue`, trend: overdueDeletions.length > 0 ? 'attention' : 'healthy' },
        ],
        aiMonitoring: [
          { provider: 'Claude', status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'mock', latency: '' },
          { provider: 'Gemini', status: process.env.GOOGLE_GEMINI_API_KEY ? 'configured' : 'mock', latency: '' }
        ],
        users: [
          { segment: 'Unique UIDs seen', count: allUids.size }
        ],
        revenue: [],
        requirementsDb: []
      };
    }
  };

  // grantId -> record, so revocation can be limited to the user who created the grant
  const grantStore = new Map<string, AccessGrantRequest & { grantedBy: string; status: 'active' | 'revoked' }>();
  // bookingId -> record — real persistence for /bookings (previously fabricated
  // a response with nothing stored, so the console/CRM had nothing real to read).
  const bookingStore = new Map<string, BookingRecord>();

  const accessGrants: AccessGrantRepository = {
    async createGrant(input) {
      const grantId = `grant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      grantStore.set(grantId, { ...input, status: 'active' });
      const { grantedBy: _grantedBy, ...rest } = input;
      return { grantId, status: 'active', ...rest };
    },
    async revokeGrant(grantId, requesterUid) {
      const record = grantStore.get(grantId);
      if (!record || record.grantedBy !== requesterUid) return null;
      record.status = 'revoked';
      return { grantId, status: 'revoked' };
    },
    async listActiveGrants() {
      return [...grantStore.entries()]
        .filter(([, g]) => g.status === 'active')
        .map(([grantId, g]) => ({ ...g, grantId, status: 'active' as const }));
    }
  };

  const profileService: ProfileService = {
    async getProfile(uid) {
      return getProfileForUser(uid);
    },
    async updateProfile(uid, patch) {
      const current = getProfileForUser(uid);
      const updated: UserProfile = { ...current, ...patch, uid, updatedAt: new Date().toISOString() };
      profileStore.set(uid, updated);
      return updated;
    }
  };

  return {
    auth,
    applications: applicationRepo,
    storage,
    notifications,
    auditQueue,
    requirements: requirementsCache,
    ai,
    consultants: consultantService,
    accessGrants,
    profile: profileService,
    messaging: messagingService
  };
}
