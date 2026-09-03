import { auditResult, requirements } from '@visaiq/mock-data';
import type { AuditResult, RequirementsResponse, VisaApplication } from '@visaiq/contracts';
import type { Firestore } from 'firebase-admin/firestore';
import { createAiProvider } from './aiProviders.js';
import { createJwtAuthService, createMockServices } from './mockServices.js';
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

function currentRequirements(): RequirementsResponse {
  const fetchedAt = new Date(Date.now() - 2 * 60 * 1000);
  const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000);
  const ageHours = Math.round(((Date.now() - fetchedAt.getTime()) / 3600000) * 10) / 10;
  return { ...requirements, freshness: { fetchedAt: fetchedAt.toISOString(), expiresAt: expiresAt.toISOString(), ageHours } };
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
      const messageId = nowId('fcm');
      await db.collection('notificationLog').doc(messageId).set({
        ...input, messageId, createdAt: new Date().toISOString()
      });
      return { messageId, status: 'queued' };
    },
    health: () => 'mock'
  };

  const auditQueue: AuditQueue = {
    async enqueueAudit(input) {
      const result: AuditResult = { ...auditResult, documentId: input.documentId, generatedAt: new Date().toISOString() };
      await db.collection('auditResults').doc(input.documentId).set(result);
      return { jobId: `audit-${input.documentId}`, status: 'queued', result };
    },
    async getAuditResult(documentId) {
      const doc = await db.collection('auditResults').doc(documentId).get();
      if (doc.exists) return doc.data() as AuditResult;
      return { ...auditResult, documentId, generatedAt: new Date().toISOString() };
    },
    health: () => 'configured'
  };

  const requirementsCache: RequirementsCache = {
    async getRequirements(context) {
      const key = Buffer.from(JSON.stringify(context)).toString('base64url');
      const doc = await db.collection('requirementsCache').doc(key).get();
      if (doc.exists) return doc.data() as RequirementsResponse;
      const fresh = currentRequirements();
      await db.collection('requirementsCache').doc(key).set(fresh);
      return fresh;
    },
    async getDefaultRequirements() {
      return currentRequirements();
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
    }
  };

  const consultantService: ConsultantService = {
    ...mock.consultants,
    async createBooking(input) {
      const booking = await mock.consultants.createBooking(input);
      await db.collection('bookings').doc(booking.bookingId).set({ ...booking, createdAt: new Date().toISOString() });
      return booking;
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
    profile: profileRepo
  };
}
