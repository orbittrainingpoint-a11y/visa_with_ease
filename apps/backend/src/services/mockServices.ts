import { applications, auditResult, requirements } from '@visaiq/mock-data';
import jwt from 'jsonwebtoken';
import { createAiProvider } from './aiProviders.js';
import { createRedisAuditQueue } from './redisAuditQueue.js';
import type {
  AccessGrantRepository,
  AiProvider,
  ApplicationRepository,
  AuditQueue,
  AuthService,
  ConsultantService,
  NotificationService,
  ProfileService,
  RequirementsCache,
  Services,
  StorageService,
  UserProfile
} from './types.js';

const consultants = [
  { id: 'c-priya', name: 'Priya Sharma', rating: 4.9, specialty: 'Schengen documentation', rate: 89, languages: ['English', 'Hindi'], reviews: 284, responseTime: '< 2h', availableToday: true, bio: 'Former VFS documentation lead focused on Schengen tourist and family visit applications.' },
  { id: 'c-omar', name: 'Omar Haddad', rating: 4.8, specialty: 'GCC resident applications', rate: 79, languages: ['English', 'Arabic'], reviews: 191, responseTime: '< 4h', availableToday: true, bio: 'Dubai-based consultant for GCC residents applying across EU, UK and Canada routes.' },
  { id: 'c-elena', name: 'Elena Rossi', rating: 4.7, specialty: 'European consulate process', rate: 99, languages: ['English', 'Italian'], reviews: 143, responseTime: 'Tomorrow', availableToday: false, bio: 'European consulate process specialist for itinerary, accommodation and proof-of-funds evidence.' }
];

const sessionOptions = [
  { id: 'standard', label: 'Standard review', durationMinutes: 30, priceUsd: 49, description: 'Checklist and document gap review.' },
  { id: 'deep-dive', label: 'Deep dive', durationMinutes: 60, priceUsd: 89, description: 'Full readiness review with prioritized fixes.', recommended: true },
  { id: 'emergency', label: 'Emergency review', durationMinutes: 30, priceUsd: 149, description: 'Fast-track consultation for travel within 7 days.' }
];

function currentRequirements() {
  const fetchedAt = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago (freshly computed)
  const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000);
  const ageHours = Math.round((Date.now() - fetchedAt.getTime()) / 3600000 * 10) / 10;
  return {
    ...requirements,
    freshness: {
      fetchedAt: fetchedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ageHours
    }
  };
}

export function createMockServices(): Services {
  const auth: AuthService = {
    async verifyIdToken(token) {
      if (!token) return null;
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const payload = jwt.verify(token, secret) as { uid: string; email: string; roles: string[] };
          if (payload?.uid && payload?.email && Array.isArray(payload?.roles)) {
            return { uid: payload.uid, email: payload.email, roles: payload.roles };
          }
        } catch { /* invalid JWT — fall through to legacy check */ }
      }
      // Legacy opaque token support for dev mode without JWT_SECRET
      if (token.startsWith('demo-token-')) {
        const b64 = token.slice('demo-token-'.length);
        try {
          const email = Buffer.from(b64, 'base64url').toString('utf8');
          const uid = `user-${Buffer.from(email).toString('base64url').slice(0, 12)}`;
          return { uid, email, roles: ['consumer'] };
        } catch { /* fall through */ }
      }
      if (token.startsWith('google-token-')) {
        const b64 = token.slice('google-token-'.length);
        try {
          const [uid, email] = Buffer.from(b64, 'base64url').toString('utf8').split(':');
          return { uid, email, roles: ['consumer'] };
        } catch { /* fall through */ }
      }
      return null;
    },
    health: () => 'mock'
  };

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
    India: '🇮🇳', Singapore: '🇸🇬', 'New Zealand': '🇳🇿'
  };

  const applicationRepo: ApplicationRepository = {
    async listApplications(userId) {
      return getAppsForUser(userId);
    },
    async getApplication(id, userId) {
      return getAppsForUser(userId).find((item) => item.id === id) ?? null;
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
        intendedFrom: input.intendedFrom
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
    async sendUserNotification(input) {
      return { messageId: `mock-fcm-${input.userId}-${Date.now()}`, status: 'queued' };
    },
    health: () => 'mock'
  };

  const auditQueue: AuditQueue = createRedisAuditQueue();

  const requirementsCache: RequirementsCache = {
    async getRequirements() {
      return currentRequirements();
    },
    async getDefaultRequirements() {
      return currentRequirements();
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
      return {
        bookingId: `booking-${Date.now()}`,
        status: 'pending_calendly',
        calendlyUrl: 'https://calendly.com/visaiq',
        ...input
      };
    },
    async getConsole() {
      return {
        queue: [
          { id: 'q-001', applicant: 'Nadia Rahman',  destination: 'France',         urgency: 'review', sharedCategories: ['Bank statements', 'Travel history'] },
          { id: 'q-002', applicant: 'Farhan Sheikh', destination: 'United Kingdom', urgency: 'urgent', sharedCategories: ['Prior refusal letter', 'Employment proof'] },
          { id: 'q-003', applicant: 'Lina Kowalski', destination: 'Germany',        urgency: 'ready',  sharedCategories: ['All documents submitted'] },
        ],
        conversations: [
          { id: 'conv-001', applicant: 'Nadia Rahman',  lastMessage: 'My bank statement is from 4 months ago — is that too old?', status: 'unread' },
          { id: 'conv-002', applicant: 'Farhan Sheikh', lastMessage: 'I have a prior UK refusal in 2022. Should I disclose it?',  status: 'read'  },
        ],
        crm: [
          { label: 'Nadia Rahman — Schengen Tourist',    value: '£89 paid · 1 session'   },
          { label: 'Farhan Sheikh — UK Standard Visitor', value: '£149 paid · 2 sessions' },
          { label: 'Yuki Tanaka — Closed Won',            value: '£49 paid · 1 session'   },
        ],
      };
    },
    async getHrPortal() {
      return {
        teams: [
          { id: 'team-eng',   name: 'Engineering', members: 12, openCases: 3 },
          { id: 'team-ops',   name: 'Operations',  members: 8,  openCases: 1 },
          { id: 'team-sales', name: 'Sales',        members: 15, openCases: 5 },
        ],
        reports: [
          { label: 'Q2 2026 Visa Applications', value: '35 rows',       trend: '+12% vs Q1' },
          { label: 'Pending Reviews — July',    value: '9 rows',        trend: 'Due: today'  },
          { label: 'Monthly Compliance Report', value: 'Generating…',   trend: ''            },
        ],
        bulkUploads: [
          { id: 'bu-001', fileName: 'hr-employees-july.csv', status: 'complete' },
        ],
      };
    },
    async getEmployeePortal(user?: { uid: string; email?: string; roles: string[] }) {
      const derivedName = user?.email
        ? user.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Employee';
      return {
        profile: { name: derivedName, company: 'Your Company', homeCountry: '' },
        tasks: [
          { id: 'emp-passport', title: 'Confirm passport scan quality', due: 'Today', status: 'open' },
          { id: 'emp-insurance', title: 'Upload Schengen insurance', due: 'Tomorrow', status: 'blocked' },
          { id: 'emp-hr', title: 'Share readiness with HR', due: 'Jun 8', status: 'ready' }
        ]
      };
    },
    async getAdminOverview() {
      const allUids = new Set<string>();
      for (const uid of userAppStore.keys()) allUids.add(uid);
      const totalApps = [...userAppStore.values()].reduce((acc, apps) => acc + apps.length, 0);
      return {
        metrics: [
          { label: 'Active sessions (in-memory)', value: String(allUids.size), trend: 'live' },
          { label: 'Total applications',           value: String(totalApps),   trend: 'live' },
          { label: 'Server uptime',                value: `${Math.floor(process.uptime() / 60)}m`, trend: 'healthy' },
          { label: 'Deletion SLA queue',           value: '0 overdue',         trend: 'healthy' },
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

  const accessGrants: AccessGrantRepository = {
    async createGrant(input) {
      return { grantId: `grant-${Date.now()}`, status: 'active', ...input };
    },
    async revokeGrant(grantId) {
      return { grantId, status: 'revoked' };
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
    profile: profileService
  };
}
