import AsyncStorage from '@react-native-async-storage/async-storage';

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
    throw Object.assign(new Error(msg || `${method} ${path} → ${res.status}`), { status: res.status });
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
// ── Persisted session ─────────────────────────────────────────────────────────
// Stays signed in across app restarts until the user signs out: the session is
// saved on login, and on every launch the stored token is exchanged for a fresh
// 30-day one (/auth/refresh), so regular use never hits an expiry. Only an
// explicit sign-out, a deleted account, or a month without opening the app
// returns to the sign-in screen.
const SESSION_KEY = 'visaiq.session.v1';

export async function startSession(session: AuthSession) {
  setToken(session.token);
  try { await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* storage unavailable — session just won't survive a restart */ }
}

export async function endSession() {
  setToken(null);
  try { await AsyncStorage.removeItem(SESSION_KEY); } catch { /* nothing stored */ }
}

/** Returns the still-valid saved session (refreshed), or null if signed out/expired. */
export async function restoreSession(): Promise<AuthSession | null> {
  let saved: AuthSession | null = null;
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    saved = raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch { saved = null; }
  if (!saved?.token || !saved.user || Date.parse(saved.expiresAt) <= Date.now()) {
    if (saved) await endSession();
    return null;
  }
  setToken(saved.token);
  try {
    const fresh = await request<AuthSession>('POST', '/auth/refresh', {});
    await startSession(fresh);
    return fresh;
  } catch (e: any) {
    if (e?.status === 401) { await endSession(); return null; }
    // Offline / server hiccup: keep the user signed in with what we have.
    return saved;
  }
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
  why?: string;
}
export interface ApiRequirementsVerification {
  status: 'verified' | 'unverified';
  verifiedAt: string | null;
  verifiedBy: string | null;
}
/** Honest provenance line: whether a person at Visa With Ease checked this against the official source, and when. */
export function verificationLabel(v?: ApiRequirementsVerification): { text: string; ok: boolean } {
  if (v?.status === 'verified' && v.verifiedAt) {
    const days = Math.floor((Date.now() - Date.parse(v.verifiedAt)) / 86_400_000);
    const when = new Date(v.verifiedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    return days > 90
      ? { text: `Last verified ${when} — over 3 months ago, confirm on the official site`, ok: false }
      : { text: `Verified by Visa With Ease on ${when}`, ok: true };
  }
  return { text: 'Not yet verified against the official source — guidance only, confirm on the official site', ok: false };
}
export interface ApiRequirementsResponse {
  coverageStatus: string;
  requirements: ApiRequirement[];
  fees: string;
  processingTime: string;
  sourceUrls: { id: string; label: string; url: string }[];
  freshness: { fetchedAt: string; expiresAt: string; ageHours: number };
  verification?: ApiRequirementsVerification;
}
export function fetchRequirements(destinationCountry?: string) {
  const qs = destinationCountry ? `?country=${encodeURIComponent(destinationCountry)}` : '';
  return request<ApiRequirementsResponse>('GET', `/requirements${qs}`);
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
  verified: boolean;
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
export interface ApiAccessGrant {
  grantId: string;
  consultantId: string;
  consultantName: string;
  applicationId: string;
  destinationCountry: string | null;
  categories: string[];
  expiresAt: string;
}
export function fetchMyAccessGrants() {
  return request<{ grants: ApiAccessGrant[] }>('GET', '/access-grants');
}
export function revokeAccessGrant(grantId: string) {
  return request<{ grantId: string; status: string }>('DELETE', `/access-grants/${encodeURIComponent(grantId)}`);
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
export function enqueueAudit(body: { applicationId: string; documentId: string; documentType?: string; extractedText?: string; imageBase64?: string; mimeType?: string }) {
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
  /** Short-lived signed URL to the original file — only present when
   *  Storage is enabled server-side and this specific document's bytes were
   *  actually persisted. Absent otherwise; never a placeholder link. */
  fileUrl?: string;
}
export function fetchDocuments(applicationId?: string) {
  const qs = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : '';
  return request<{ documents: ApiDocument[] }>('GET', `/documents${qs}`);
}

// ── Partners / misc ───────────────────────────────────────────────────────────
export interface ApiPartner {
  id: string;
  category: string;
  name: string;
  tagline?: string;
  discount: string;
  commissionPct: number;
  url?: string;
}
export function fetchPartners() {
  return request<{ categories: string[]; partners: ApiPartner[] }>('GET', '/partners');
}
export function fetchHealth() {
  return request<{ status: string; aiMock: boolean }>('GET', '/health');
}

// ── Exchange rates ─────────────────────────────────────────────────────────────
export function fetchExchangeRates() {
  return request<{ rates: Record<string, number>; base: string; updatedAt: string }>('GET', '/exchange-rates');
}

// ── Push notifications ───────────────────────────────────────────────────────
export function registerDeviceToken(token: string, platform: string) {
  return request<{ ok: boolean }>('POST', '/device-tokens', { token, platform });
}

// ── Consultant messaging ──────────────────────────────────────────────────────
export interface ApiMessage {
  id: string;
  threadId: string;
  consultantId: string;
  clientUid: string;
  clientName: string;
  senderRole: 'client' | 'consultant';
  text: string;
  createdAt: string;
}
/** A client starts/continues a thread by naming consultantId; a consultant
 *  replies into an existing thread by its threadId. Exactly one of the two
 *  must be provided — matches POST /messages' two entry paths. */
export function sendMessage(body: { consultantId?: string; threadId?: string; text: string }) {
  return request<{ message: ApiMessage }>('POST', '/messages', body);
}
export function fetchMessages(threadId: string) {
  return request<{ messages: ApiMessage[] }>('GET', `/messages?threadId=${encodeURIComponent(threadId)}`);
}
export interface ApiConversationThread {
  threadId: string;
  consultantId: string;
  consultantName: string;
  lastMessage: string;
  createdAt: string;
  status: string;
}
/** The signed-in client's own conversations with consultants — without this
 *  there was no way to ever discover a consultant's reply after sending a
 *  message from a consultant's profile screen. */
export function fetchMyConversations() {
  return request<{ threads: ApiConversationThread[] }>('GET', '/my-conversations');
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
export function fetchBookingSlots(consultantId: string, date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return request<{ slots: string[]; takenSlots: string[]; date: string }>('GET', `/booking/slots/${encodeURIComponent(consultantId)}${qs}`);
}

// ── Visa waiver ────────────────────────────────────────────────────────────────
export function fetchVisaWaiver(nationality: string, destination: string) {
  return request<{ type: string; note: string; nationality: string; destination: string }>('GET', `/visa-waiver?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(destination)}`);
}
