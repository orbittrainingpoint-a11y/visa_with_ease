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
  createApplication(input: { destinationCountry: string; visaType: string; intendedFrom: string; applicantName: string; purpose?: string }, userId?: string): Promise<VisaApplication>;
}

export interface StorageService {
  createUploadSlot(input: { applicationId: string; documentId: string }): Promise<{ uploadUrl: string; expiresAt: string }>;
  health(): HealthStatus;
}

export interface NotificationService {
  sendUserNotification(input: { userId: string; title: string; body: string; data?: Record<string, string> }): Promise<{ messageId: string; status: 'queued' }>;
  health(): HealthStatus;
}

export interface AuditQueue {
  enqueueAudit(input: AuditRequest): Promise<{ jobId: string; status: 'queued'; result: AuditResult }>;
  getAuditResult(documentId: string): Promise<AuditResult>;
  health(): HealthStatus;
}

export interface RequirementsCache {
  getRequirements(context: VisaContext): Promise<RequirementsResponse>;
  getDefaultRequirements(): Promise<RequirementsResponse>;
  health(): HealthStatus;
}

export interface AiProvider {
  chat(input: ChatRequest): Promise<ChatResponse>;
  health(): HealthStatus;
}

export interface ConsultantService {
  listConsultants(filters?: { query?: string; language?: string; specialty?: string }): Promise<Array<{ id: string; name: string; rating: number; specialty: string; rate: number; languages: string[]; reviews: number; responseTime: string; availableToday: boolean }>>;
  getConsultant(id: string): Promise<{ id: string; name: string; rating: number; specialty: string; rate: number; languages: string[]; reviews: number; responseTime: string; availableToday: boolean; bio: string } | null>;
  listSessionOptions(): Promise<Array<{ id: string; label: string; durationMinutes: number; priceUsd: number; description: string; recommended?: boolean }>>;
  createBooking(input: BookingRequest): Promise<{ bookingId: string; status: 'pending_calendly'; calendlyUrl: string } & BookingRequest>;
  getConsole(): Promise<{ queue: Array<{ id: string; applicant: string; destination: string; urgency: string; sharedCategories: string[] }>; conversations: Array<{ id: string; applicant: string; lastMessage: string; status: string }>; crm: Array<{ label: string; value: string }> }>;
  getHrPortal(): Promise<{ teams: Array<{ id: string; name: string; members: number; openCases: number }>; reports: Array<{ label: string; value: string; trend: string }>; bulkUploads: Array<{ id: string; fileName: string; status: string }> }>;
  getEmployeePortal(user?: { uid: string; email?: string; roles: string[] }): Promise<{ profile: { name: string; company: string; homeCountry: string }; tasks: Array<{ id: string; title: string; due: string; status: string }> }>;
  getAdminOverview(): Promise<{ metrics: Array<{ label: string; value: string; trend: string }>; aiMonitoring: Array<{ provider: string; status: string; latency: string }>; users: Array<{ segment: string; count: number }>; revenue: Array<{ label: string; value: string }>; requirementsDb: Array<{ route: string; freshness: string; coverage: string }> }>;
}

export interface AccessGrantRepository {
  createGrant(input: AccessGrantRequest): Promise<{ grantId: string; status: 'active' } & AccessGrantRequest>;
  revokeGrant(grantId: string): Promise<{ grantId: string; status: 'revoked' }>;
}

export interface UserProfile {
  uid: string;
  personal?: {
    firstName: string; lastName: string; nationality: string;
    dateOfBirth: string; phone: string; gender: string;
  };
  passport?: {
    passportNumber: string; issueDate: string; expiryDate: string;
    issuingCountry: string; mrz: string;
  };
  employment?: {
    employer: string; jobTitle: string; annualIncomeUsd: number;
    contractType: string; employmentLetterUploaded: boolean;
  };
  financials?: {
    monthlyBalance: number; currency: string; statementsUploaded: number;
    bankName: string;
  };
  travelHistory?: Array<{
    country: string; purpose: string; year: number;
    visaGranted: boolean; duration: string;
  }>;
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
}
