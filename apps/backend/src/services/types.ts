import type {
  AccessGrantRequest,
  AuditRequest,
  AuditResult,
  BookingRequest,
  ChatRequest,
  ChatResponse,
  RequirementsResponse,
  VisaApplication,
  VisaContext
} from '@visaiq/contracts';
import type { RequirementsOverrideData } from './verification.js';

export type HealthStatus = 'configured' | 'mock';

export interface AuthUser {
  uid: string;
  email?: string;
  roles: string[];
}

export interface AuthService {
  verifyIdToken(token?: string): Promise<AuthUser | null>;
  health(): HealthStatus;
}

export interface ApplicationRepository {
  listApplications(userId?: string): Promise<VisaApplication[]>;
  getApplication(id: string, userId?: string): Promise<VisaApplication | null>;
  createApplication(input: { destinationCountry: string; visaType: string; intendedFrom: string; applicantName: string; purpose?: string; nationality?: string; residenceCountry?: string }, userId?: string): Promise<VisaApplication>;
}

export interface StorageService {
  createUploadSlot(input: { applicationId: string; documentId: string }): Promise<{ uploadUrl: string; expiresAt: string }>;
  health(): HealthStatus;
}

export interface NotificationService {
  /** 'sent' means a real FCM push actually went out to at least one of the
   *  user's registered devices. 'skipped' is the honest outcome when Firebase
   *  isn't configured or the user has no registered device — never fake
   *  'queued' for something nothing is actually processing. */
  sendUserNotification(input: { userId: string; title: string; body: string; data?: Record<string, string> }): Promise<{ messageId: string; status: 'sent' | 'skipped' }>;
  health(): HealthStatus;
}

export interface AuditQueue {
  enqueueAudit(input: AuditRequest): Promise<{ jobId: string; status: 'queued'; result: AuditResult }>;
  getAuditResult(documentId: string): Promise<AuditResult>;
  /** Only documentIds that actually have a stored result — unlike
   *  getAuditResult, never synthesizes a fresh one for a documentId nothing
   *  was ever enqueued for. Used to build a real (not fabricated) document list. */
  getAuditResultsByIds(documentIds: string[]): Promise<AuditResult[]>;
  health(): HealthStatus;
}

export interface RequirementsCache {
  getRequirements(context: VisaContext): Promise<RequirementsResponse>;
  getDefaultRequirements(): Promise<RequirementsResponse>;
  /** Country-wise lookup independent of the full VisaContext — used when only
   *  a destination is known (e.g. the mobile requirements screen before the
   *  rest of the visa context has been collected). Prefers an admin-managed
   *  override for that country when one exists, falling back to the built-in
   *  dataset otherwise. */
  getRequirementsForCountry(country?: string): Promise<RequirementsResponse>;
  /** Every country with an admin-managed override on file, keyed by country
   *  name — for the admin knowledge-base page to list and edit. Does not
   *  include countries that only have the built-in default data. */
  listCountryOverrides(): Promise<Record<string, RequirementsResponse>>;
  /** Create or replace the admin-managed data for one country. Takes effect
   *  immediately for both the mobile app and web app — no deploy needed. */
  setCountryOverride(country: string, data: RequirementsOverrideData): Promise<RequirementsResponse>;
  /** Remove a country's override, reverting it to the built-in default. */
  deleteCountryOverride(country: string): Promise<void>;
  health(): HealthStatus;
}

export interface AiProvider {
  chat(input: ChatRequest, grounding?: { application?: VisaApplication | null; requirements?: RequirementsResponse | null }): Promise<ChatResponse>;
  health(): HealthStatus;
}

export interface ConsultantService {
  listConsultants(filters?: { query?: string; language?: string; specialty?: string }): Promise<Array<{ id: string; name: string; rating: number; specialty: string; rate: number; languages: string[]; reviews: number; responseTime: string; availableToday: boolean; verified: boolean }>>;
  getConsultant(id: string): Promise<{ id: string; name: string; rating: number; specialty: string; rate: number; languages: string[]; reviews: number; responseTime: string; availableToday: boolean; verified: boolean; bio: string } | null>;
  listSessionOptions(): Promise<Array<{ id: string; label: string; durationMinutes: number; priceUsd: number; description: string; recommended?: boolean }>>;
  createBooking(input: BookingRequest & { userId?: string }): Promise<{ bookingId: string; status: 'pending_calendly'; calendlyUrl: string } & BookingRequest>;
  /** Every real booking on file, newest first — used to build the consultant
   *  CRM view. Not scoped to one consultant: the product has no per-consultant
   *  login identity yet, so the console shows the platform-wide real queue. */
  listBookings(): Promise<Array<{ bookingId: string; status: string; consultantId: string; applicationId: string; sessionType: string; userId: string; createdAt: string; slotISO?: string }>>;
  getConsole(): Promise<{ queue: Array<{ id: string; applicant: string; destination: string; urgency: string; sharedCategories: string[] }>; conversations: Array<{ id: string; applicant: string; lastMessage: string; status: string }>; crm: Array<{ label: string; value: string }> }>;
  /** `user` scopes the view to the calling HR admin's own company (their own
   *  profile.employment.employer) — without it, every hr_admin saw every
   *  other company's teams and headcounts mixed together, a real cross-tenant
   *  data leak in a B2B feature. platform_admin (the platform operator, not
   *  a tenant) still sees the aggregate across all companies. */
  getHrPortal(user?: { uid: string; roles: string[] }): Promise<{ teams: Array<{ id: string; name: string; members: number; openCases: number }>; reports: Array<{ label: string; value: string; trend: string }>; bulkUploads: Array<{ id: string; fileName: string; status: string }> }>;
  getEmployeePortal(user?: { uid: string; email?: string; roles: string[] }): Promise<{ profile: { name: string; company: string; homeCountry: string }; tasks: Array<{ id: string; title: string; due: string; status: string }> }>;
  getAdminOverview(): Promise<{ metrics: Array<{ label: string; value: string; trend: string }>; aiMonitoring: Array<{ provider: string; status: string; latency: string }>; users: Array<{ segment: string; count: number }>; revenue: Array<{ label: string; value: string }>; requirementsDb: Array<{ route: string; freshness: string; coverage: string }> }>;
}

export interface AccessGrantRepository {
  createGrant(input: AccessGrantRequest & { grantedBy: string }): Promise<{ grantId: string; status: 'active' } & AccessGrantRequest>;
  revokeGrant(grantId: string, requesterUid: string): Promise<{ grantId: string; status: 'revoked' } | null>;
  /** All grants currently active — used to build the real consultant queue
   *  (no per-consultant login identity exists yet, so this is platform-wide). */
  listActiveGrants(): Promise<Array<AccessGrantRequest & { grantId: string; status: 'active'; grantedBy: string }>>;
}

export interface ConsultantMessage {
  id: string;
  threadId: string;
  consultantId: string;
  clientUid: string;
  clientName: string;
  senderRole: 'client' | 'consultant';
  text: string;
  createdAt: string;
}

export interface MessagingService {
  sendMessage(input: { consultantId: string; clientUid: string; clientName: string; senderRole: 'client' | 'consultant'; text: string }): Promise<ConsultantMessage>;
  listMessages(threadId: string): Promise<ConsultantMessage[]>;
  /** One row per thread (client↔consultant pair) showing the latest message —
   *  platform-wide, for the same reason listActiveGrants is platform-wide. */
  listThreadsForConsultant(): Promise<Array<{ threadId: string; applicant: string; lastMessage: string; status: string }>>;
  listThreadsForUser(uid: string): Promise<Array<{ threadId: string; consultantId: string; lastMessage: string; createdAt: string; status: string }>>;
  health(): HealthStatus;
}

// Matches @visaiq/contracts' userProfilePatchSchema — the shape real clients
// (mobile's src/api.ts, web) actually send. This used to declare a different,
// unvalidated shape (travelHistory as a bare array, no `contacts`,
// `annualIncomeUsd` typed as number though clients send a string) that had
// drifted from reality since PUT /profile had no schema validation to force
// the two to stay in sync.
export interface UserProfile {
  uid: string;
  personal?: {
    firstName?: string; lastName?: string; nationality?: string;
    dateOfBirth?: string; phone?: string; gender?: string;
  };
  passport?: {
    passportNumber?: string; issueDate?: string; expiryDate?: string;
    issuingCountry?: string;
  };
  employment?: {
    employer?: string; jobTitle?: string; annualIncomeUsd?: string | number;
    resumeUploaded?: boolean; resumeFileName?: string;
  };
  financials?: {
    statements?: Array<{ label: string; score: number }>;
  };
  travelHistory?: {
    trips?: Array<{ country: string; years: string; status: string }>;
    hasRejection?: boolean;
  };
  contacts?: {
    emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string;
  };
  notificationPrefs?: {
    audit?: boolean; requirements?: boolean; booking?: boolean; message?: boolean;
  };
  updatedAt: string;
}

export interface ProfileService {
  getProfile(uid: string): Promise<UserProfile>;
  updateProfile(uid: string, patch: Partial<Omit<UserProfile, 'uid' | 'updatedAt'>>): Promise<UserProfile>;
}

export interface Services {
  auth: AuthService;
  applications: ApplicationRepository;
  storage: StorageService;
  notifications: NotificationService;
  auditQueue: AuditQueue;
  requirements: RequirementsCache;
  ai: AiProvider;
  consultants: ConsultantService;
  accessGrants: AccessGrantRepository;
  profile: ProfileService;
  messaging: MessagingService;
}
