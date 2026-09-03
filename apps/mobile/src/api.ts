// Central API client — all calls go through here
export const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (__DEV__ ? 'http://localhost:3001' : 'https://api.visaiq.app');

let _token: string | null = null;
export function setToken(t: string | null) { _token = t; }
export function getToken() { return _token; }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let msg = text;
    try { msg = JSON.parse(text)?.error?.message ?? text; } catch { /* raw text */ }
    throw new Error(msg || `${method} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  roles: string[];
}
export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}
export function login(email: string, password: string, remember = false) {
  return request<AuthSession>('POST', '/auth/session', { email, password, remember });
}
export function register(name: string, email: string, password: string) {
  return request<AuthSession>('POST', '/auth/register', { name, email, password });
}
export function googleLogin(idToken: string) {
  return request<AuthSession>('POST', '/auth/google', { idToken });
}
export function demoLogin(persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin') {
  return request<AuthSession>('POST', '/auth/demo', { persona });
}

// ── Applications ──────────────────────────────────────────────────────────────
export interface ApiApplication {
  id: string;
  refCode: string;
  applicantName: string;
  destinationCountry: string;
  destinationFlag: string;
  visaType: string;
  status: 'draft' | 'in_progress' | 'ready' | 'submitted' | 'approved' | 'rejected';
  readinessScore: number;
  documentsUploaded: number;
  documentsRequired: number;
  issuesCount: number;
  intendedFrom: string;
  nationality?: string;
  residenceCountry?: string;
}
export function fetchApplications() {
  return request<{ applications: ApiApplication[] }>('GET', '/applications');
}
export function fetchApplication(id: string) {
  return request<{ application: ApiApplication }>('GET', `/applications/${id}`);
}
export function createApplication(body: {
  destinationCountry: string;
  visaType: string;
  intendedFrom: string;
  intendedTo?: string;
  applicantName?: string;
  purpose?: string;
  nationality?: string;
  residenceCountry?: string;
}) {
  return request<{ application: ApiApplication }>('POST', '/applications', body);
}

// ── Requirements ──────────────────────────────────────────────────────────────
export interface ApiRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  satisfied: boolean;
  sourceIds: string[];
}
export interface ApiRequirementsResponse {
  coverageStatus: string;
  requirements: ApiRequirement[];
  fees: string;
  processingTime: string;
  sourceUrls: { id: string; label: string; url: string }[];
  freshness: { fetchedAt: string; expiresAt: string; ageHours: number };
}
export function fetchRequirements() {
  return request<ApiRequirementsResponse>('GET', '/requirements');
}

// ── Consultants ───────────────────────────────────────────────────────────────
export interface ApiConsultant {
  id: string;
  name: string;
  rating: number;
  specialty: string;
  rate: number;
  languages: string[];
  reviews: number;
  responseTime: string;
  availableToday: boolean;
  bio?: string;
}
export interface ApiSessionOption {
  id: string;
  label: string;
  durationMinutes: number;
  priceUsd: number;
  description: string;
  recommended?: boolean;
}
export interface ApiBooking {
  bookingId: string;
  status: string;
  calendlyUrl: string;
  consultantId: string;
  applicationId: string;
  sessionType: string;
}
export function fetchConsultants(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return request<{ consultants: ApiConsultant[] }>('GET', `/consultants${qs}`);
}
export function fetchConsultant(id: string) {
  return request<{ consultant: ApiConsultant }>('GET', `/consultants/${id}`);
}
export function fetchSessionOptions() {
  return request<{ options: ApiSessionOption[] }>('GET', '/booking/session-options');
}
export function createBooking(body: {
  consultantId: string;
  applicationId: string;
  sessionType: string;
  slotISO?: string;
}) {
  return request<ApiBooking>('POST', '/bookings', body);
}

// ── Access grants ────────────────────────────────────────────────────────────
export function createAccessGrant(body: {
  applicationId: string;
  consultantId: string;
  categories: string[];
  expiresAt: string;
}) {
  return request<{ grantId: string; status: string }>('POST', '/access-grants', body);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatReply {
  reply: string;
  escalate?: boolean;
  suggestedActions?: string[];
}
export function sendChatMessage(message: string, applicationId?: string) {
  return request<ChatReply>('POST', '/chat', { message, applicationId });
}

// ── Document audit ────────────────────────────────────────────────────────────
export interface ApiAuditResult {
  documentId: string;
  documentType: string;
  score: number;
  status: 'excellent' | 'attention_needed' | 'issues_to_fix';
  findings: Array<{ id: string; severity: 'pass' | 'info' | 'warn' | 'red_flag'; title: string; description: string; confidence: number }>;
  generatedAt: string;
}
export function createUploadSlot(body: { applicationId: string; documentId: string }) {
  return request<{ uploadUrl: string; expiresAt: string }>('POST', '/upload-slots', body);
}
export function enqueueAudit(body: { applicationId: string; documentId: string }) {
  return request<{ jobId: string; status: string; result: ApiAuditResult }>('POST', '/audit', body);
}
export function fetchAuditResult(docId: string) {
  return request<ApiAuditResult>('GET', `/audit/${docId}`);
}
export function unlockReport(docId: string, paymentToken?: string) {
  return request<{ unlocked: boolean }>('POST', `/reports/${docId}/unlock`, { paymentToken });
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'audit' | 'warning' | 'booking' | 'requirements' | 'system';
  read: boolean;
}
export function fetchNotifications() {
  return request<{ notifications: ApiNotification[] }>('GET', '/notifications');
}
export function markNotificationRead(id: string) {
  return request<{ ok: boolean }>('POST', `/notifications/${id}/read`);
}

// ── Documents ─────────────────────────────────────────────────────────────────
export interface ApiDocument {
  id: string;
  title: string;
  type: string;
  icon: string;
  status: 'Audited' | 'Queued' | 'Missing' | 'Uploading';
  statusColor: string;
  score: number;
  issue: string;
  retention: string;
  uploadedAt: string | null;
}
export function fetchDocuments(applicationId?: string) {
  const qs = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : '';
  return request<{ documents: ApiDocument[] }>('GET', `/documents${qs}`);
}

// ── Partners / misc ───────────────────────────────────────────────────────────
export function fetchPartners() {
  return request<{ categories: string[]; partners: { id: string; category: string; name: string; discount: string; commissionPct: number }[] }>('GET', '/partners');
}
export function fetchHealth() {
  return request<{ status: string; aiMock: boolean }>('GET', '/health');
}

// ── Exchange rates ─────────────────────────────────────────────────────────────
export function fetchExchangeRates() {
  return request<{ rates: Record<string, number>; base: string; updatedAt: string }>('GET', '/exchange-rates');
}

// ── Profile ───────────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  personal?: { firstName: string; lastName: string; nationality: string; dateOfBirth: string; phone: string; gender: string };
  passport?: { passportNumber: string; issueDate: string; expiryDate: string; issuingCountry: string };
  employment?: { employer: string; jobTitle: string; annualIncomeUsd: string; resumeUploaded?: boolean; resumeFileName?: string };
  financials?: { statements: { label: string; score: number }[] };
  travelHistory?: { trips: { country: string; years: string; status: string }[]; hasRejection: boolean };
  contacts?: { emergencyName: string; emergencyPhone: string; emergencyRelation: string };
  updatedAt: string;
}
export function fetchProfile() {
  return request<{ profile: UserProfile }>('GET', '/profile');
}
export function updateProfile(patch: Partial<Omit<UserProfile, 'uid' | 'updatedAt'>>) {
  return request<{ profile: UserProfile }>('PUT', '/profile', patch);
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
export function forgotPassword(email: string) {
  return request<{ ok: boolean }>('POST', '/auth/forgot-password', { email });
}

export function verifyEmailOtp(email: string, code: string) {
  return request<{ ok: boolean; token?: string }>('POST', '/auth/verify-email', { email, code });
}

export function sendVerificationEmail(email: string) {
  return request<{ ok: boolean; devCode?: string }>('POST', '/auth/send-verification-email', { email });
}

// ── Two-factor authentication ──────────────────────────────────────────────────
export function fetch2faStatus() {
  return request<{ enabled: boolean }>('GET', '/auth/2fa/status');
}
export function send2faCode() {
  return request<{ ok: boolean; devCode?: string }>('POST', '/auth/2fa/send-code');
}
export function verify2faCode(code: string) {
  return request<{ enabled: boolean }>('POST', '/auth/2fa/verify', { code });
}
export function disable2fa() {
  return request<{ enabled: boolean }>('POST', '/auth/2fa/disable');
}
export function deleteAccount() {
  return request<{ ok: boolean; scheduledFor: string; message: string }>('POST', '/auth/delete-account');
}

// ── Booking slots ──────────────────────────────────────────────────────────────
export function fetchBookingSlots(consultantId: string) {
  return request<{ slots: string[]; takenSlots: string[] }>('GET', `/booking/slots/${encodeURIComponent(consultantId)}`);
}

// ── Visa waiver ────────────────────────────────────────────────────────────────
export function fetchVisaWaiver(nationality: string, destination: string) {
  return request<{ type: string; note: string; nationality: string; destination: string }>('GET', `/visa-waiver?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(destination)}`);
}
