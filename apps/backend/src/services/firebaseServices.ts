import { chatResponseSchema } from '@visaiq/contracts';
import { applications, auditResult, requirements } from '@visaiq/mock-data';
import type { AccessGrantRequest, AuditRequest, BookingRequest, ChatRequest, VisaApplication, VisaContext } from '@visaiq/contracts';
import { FirestoreRestClient } from './firestoreRest.js';
import { createMockServices } from './mockServices.js';
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

const mockServices = createMockServices();

export function createProfileService(): ProfileService {
  const store = new Map<string, UserProfile>();
  return {
    async getProfile(uid) {
      return store.get(uid) ?? { uid, updatedAt: new Date().toISOString() };
    },
    async updateProfile(uid, patch) {
      const current = store.get(uid) ?? { uid, updatedAt: new Date().toISOString() };
      const updated: UserProfile = { ...current, ...patch, uid, updatedAt: new Date().toISOString() };
      store.set(uid, updated);
      return updated;
    }
  };
}

type StoredVisaApplication = VisaApplication & { ownerId?: string };

function cacheKey(context: VisaContext) {
  return Buffer.from(JSON.stringify(context)).toString('base64url');
}

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function currentRequirements() {
  const fetchedAt = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000);
  return {
    ...requirements,
    freshness: {
      fetchedAt: fetchedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ageHours: 6
    }
  };
}

function fallbackOnError<T>(operation: Promise<T>, fallback: () => Promise<T>): Promise<T> {
  return operation.catch(fallback);
}

export function createFirebaseEmulatorServices(db: FirestoreRestClient): Services {
  const auth: AuthService = {
    async verifyIdToken(token) {
      if (!token) return null;
      return { uid: token.replace(/^Bearer\s+/i, '').slice(0, 64) || 'emulator-user', roles: ['consumer'] };
    },
    health: () => 'configured'
  };

  const FIREBASE_COUNTRY_FLAGS: Record<string, string> = {
    France: '🇫🇷', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸',
    Canada: '🇨🇦', Australia: '🇦🇺', Japan: '🇯🇵', Germany: '🇩🇪'
  };

  const applicationRepo: ApplicationRepository = {
    async listApplications(userId) {
      const result = await fallbackOnError(db.list<StoredVisaApplication>('applications'), async () => [] as StoredVisaApplication[]);
      const scoped = userId ? result.filter((item) => !item.ownerId || item.ownerId === userId) : result;
      return scoped;
    },
    async getApplication(id, userId) {
      const result = await fallbackOnError(db.get<VisaApplication & { ownerId?: string }>('applications', id), async () => null);
      if (result && (!userId || !result.ownerId || result.ownerId === userId)) return result;
      return null;
    },
    async createApplication(input, userId) {
      const id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const suffix = id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
      const refCode = `REF-${new Date().getFullYear()}-${suffix}`;
      const baseScore = [input.destinationCountry, input.visaType, input.intendedFrom, input.purpose]
        .filter(Boolean).length * 6;
      const newApp: VisaApplication = {
        id, refCode,
        applicantName: input.applicantName,
        destinationCountry: input.destinationCountry,
        destinationFlag: FIREBASE_COUNTRY_FLAGS[input.destinationCountry] ?? '🌍',
        visaType: input.visaType,
        status: 'draft',
        readinessScore: Math.min(baseScore, 30),
        documentsUploaded: 0,
        documentsRequired: 6,
        issuesCount: 3,
        intendedFrom: input.intendedFrom
      };
      await fallbackOnError(db.set('applications', id, { ...newApp, ownerId: userId ?? 'anonymous' }), async () => ({}));
      return newApp;
    }
  };

  const storage: StorageService = {
    async createUploadSlot(input) {
      const bucket = process.env.FIREBASE_STORAGE_BUCKET ?? 'visaiq-local.appspot.com';
      const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199';
      const objectName = `applications/${input.applicationId}/documents/${input.documentId}/original`;
      await fallbackOnError(
        db.set('uploadSlots', `${input.applicationId}-${input.documentId}`, {
          ...input,
          objectName,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }),
        async () => ({})
      );
      return {
        uploadUrl: `http://${host}/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(objectName)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    },
    health: () => 'configured'
  };

  const notifications: NotificationService = {
    async sendUserNotification(input) {
      const messageId = nowId('emulator-fcm');
      await fallbackOnError(db.set('notifications', messageId, { ...input, messageId, createdAt: new Date().toISOString() }), async () => ({}));
      return { messageId, status: 'queued' };
    },
    health: () => 'configured'
  };

  const auditQueue: AuditQueue = {
    async enqueueAudit(input: AuditRequest) {
      const result = { ...auditResult, documentId: input.documentId, generatedAt: new Date().toISOString() };
      await fallbackOnError(
        db.set('audits', input.documentId, {
          ...input,
          ...result,
          status: result.status,
          queuedAt: new Date().toISOString()
        }),
        async () => result
      );
      return { jobId: `audit-${input.documentId}`, status: 'queued', result };
    },
    async getAuditResult(documentId) {
      return fallbackOnError(db.get<typeof auditResult>('audits', documentId), async () => null).then(
        (result) => result ?? { ...auditResult, documentId, generatedAt: new Date().toISOString() }
      );
    },
    health: () => 'configured'
  };

  const requirementsCache: RequirementsCache = {
    async getRequirements(context) {
      const key = cacheKey(context);
      const cached = await fallbackOnError(db.get<typeof requirements>('requirementsCache', key), async () => null);
      if (cached) return cached;
      const fresh = currentRequirements();
      await fallbackOnError(db.set('requirementsCache', key, { ...fresh, cacheKey: key, expiresAt: fresh.freshness.expiresAt }), async () => ({}));
      return fresh;
    },
    async getDefaultRequirements() {
      return currentRequirements();
    },
    health: () => 'configured'
  };

  const ai: AiProvider = {
    async chat(input: ChatRequest) {
      // AI_MOCK=false → real AI (not yet wired in emulator, falls back to mock)
      // AI_MOCK=true or unset → always use mock
      return chatResponseSchema.parse(await mockServices.ai.chat(input));
    },
    health: () => (process.env.AI_MOCK === 'false' ? 'configured' : 'mock')
  };

  const consultantService: ConsultantService = {
    async listConsultants(filters) {
      return mockServices.consultants.listConsultants(filters);
    },
    async getConsultant(id) {
      return mockServices.consultants.getConsultant(id);
    },
    async listSessionOptions() {
      return mockServices.consultants.listSessionOptions();
    },
    async createBooking(input: BookingRequest) {
      const booking = await mockServices.consultants.createBooking(input);
      await fallbackOnError(db.set('bookings', booking.bookingId, { ...booking, createdAt: new Date().toISOString() }), async () => booking);
      return booking;
    },
    async getConsole() {
      return mockServices.consultants.getConsole();
    },
    async getHrPortal() {
      return mockServices.consultants.getHrPortal();
    },
    async getEmployeePortal(user) {
      return mockServices.consultants.getEmployeePortal(user);
    },
    async getAdminOverview() {
      return mockServices.consultants.getAdminOverview();
    }
  };

  const accessGrants: AccessGrantRepository = {
    async createGrant(input: AccessGrantRequest & { grantedBy: string }) {
      const grant = { grantId: nowId('grant'), status: 'active' as const, ...input };
      await fallbackOnError(db.set('accessGrants', grant.grantId, { ...grant, createdAt: new Date().toISOString() }), async () => grant);
      const { grantedBy: _grantedBy, ...rest } = grant;
      return rest;
    },
    async revokeGrant(grantId, requesterUid) {
      const existing = await fallbackOnError(db.get<Record<string, unknown>>('accessGrants', grantId), async () => null);
      if (!existing || existing.grantedBy !== requesterUid) return null;
      await fallbackOnError(
        db.set('accessGrants', grantId, { ...existing, grantId, status: 'revoked', revokedAt: new Date().toISOString() }),
        async () => ({ grantId, status: 'revoked' })
      );
      return { grantId, status: 'revoked' };
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
    profile: createProfileService()
  };
}
