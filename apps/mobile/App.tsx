import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin,
  sendChatMessage, setUnauthorizedHandler, setToken, startSession, endSession, restoreSession,
  fetchApplications, createApplication as apiCreateApplication,
  fetchConsultants as apiFetchConsultants,
  fetchSessionOptions as apiFetchSessionOptions,
  createBooking as apiCreateBooking,
  createAccessGrant as apiCreateAccessGrant, fetchMyAccessGrants, revokeAccessGrant,
  fetchNotifications, markNotificationRead, fetchDocuments, fetchAuditResult, fetchExchangeRates,
  fetchMyBookings, cancelMyBooking, deleteApplication as apiDeleteApplication, type ApiMyBooking,
  fetchConsultantMe, fetchConsultantAppointments, fetchConsultantCase, joinBookingCall,
  fetchFaqCatalog, fetchFaqAnswer, type ApiFaqCatalog, type ChatRelated, type ApiAuditResult,
  fetchFaceStatus, fetchFaceTemplate, enrollFace, confirmFaceCheck, type ApiFaceStatus,
  type ApiCallInfo, type ApiConsultantMe, type ApiConsultantAppointment, type ApiConsultantCase, type ApiPassportData, type ApiAccessGrant,
  createUploadSlot, enqueueAudit, fetchRequirements, verificationLabel, fetchPartners,
  fetchProfile, updateProfile,
  forgotPassword, verifyEmailOtp, sendVerificationEmail, fetchBookingSlots, fetchVisaWaiver,
  fetch2faStatus, send2faCode, verify2faCode, disable2fa, deleteAccount,
  registerDeviceToken,
  sendMessage as apiSendMessage, fetchMessages, fetchMyConversations,
  type AuthUser, type AuthSession, type UserProfile,
  type ApiApplication, type ApiConsultant, type ApiSessionOption, type ApiBooking,
  type ApiNotification, type ApiDocument, type ApiRequirement, type ApiMessage, type ApiConversationThread,
} from './src/api';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { ActivityIndicator, Alert, Animated, AppState, BackHandler, Dimensions, Image, Keyboard, Linking, Platform, Pressable, ScrollView, StatusBar, Modal, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';

// Controls how a push is presented while the app is in the foreground — set
// once at module load, not per-screen. Without this, Android shows nothing
// for a foreground push at all (the OS assumes the app will handle it itself).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Phones from different makers ship very different "large text" settings (some
// go to 200%). Uncapped, that pushes buttons and labels off narrow screens, so
// system font scaling is honoured up to 1.25x — still larger for readability,
// without breaking layouts. Patches Text/TextInput render once at load.
for (const Comp of [Text, TextInput] as any[]) {
  const originalRender = Comp?.render;
  if (typeof originalRender === 'function') {
    Comp.render = function patchedRender(...args: any[]) {
      const element = originalRender.apply(this, args);
      return React.cloneElement(element, { maxFontSizeMultiplier: element.props.maxFontSizeMultiplier ?? 1.25 });
    };
  }
}
import { getCacheSnapshot, clearCache } from './src/offlineCache';
import { loadPreferences, savePreferences, DEFAULT_PREFERENCES, type SettingsPreferences } from './src/preferences';
import { colors, scoreColor } from './src/theme';
import { PLAN_ENFORCED, canUse, tierOf, type FeatureId } from './src/plan';
import { getBiometricSupport, authenticateBiometric, isLockEnabled, setLockEnabled, wasAsked, markAsked, faceGateSkipped, markFaceGateSkipped, type BiometricSupport } from './src/biometricLock';
import { faceSdkAvailable, passportFaceId, accountFaceId, enrolPassportFace, liveVerify, captureAccountFace, loadAccountTemplate, forgetPassportFace } from './src/faceSdk';
import { HOW_TO_SECTIONS, TOUR_STEPS, hasSeenTour, markTourSeen, type TourTarget } from './src/tour';
import { DOC_GUIDES, DOC_KIND_LABEL, judge, liveChecks, monthsUntil, parsePassportMrz, recognise, similarity, tokensOf, type DocKind, type FaceLike, type LiveCheck, type MrzResult, type OcrLike, type Verdict } from './src/documentRecognition';

// ─── Device metrics — dynamic safe area support ───────────────────────────────
// Status-bar / cutout / gesture-bar space always comes from safe-area insets (real
// per-device values on every Android maker's skin), never StatusBar.currentHeight guesses.
const { width: SCREEN_W } = Dimensions.get('screen');
// Height of the pinned-action bar a screen can request via setStickyFooter —
// BottomNav renders position:absolute (floats above document flow), so the
// footer must too, and scrollable content needs this much extra bottom
// padding to avoid the last row ending up hidden underneath it.
const STICKY_FOOTER_H = 84;

// ─── Safe external-link opener ────────────────────────────────────────────────
// Linking.openURL rejects if no app can handle the URL (no dialer, no email
// client, etc.) — always handle that instead of leaving an unhandled rejection.
function openUrlSafely(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', "No app is available to handle this on your device.");
  });
}

// ─── Visa topic guard — prevents off-topic AI calls ──────────────────────────
const VISA_RE = /visa|passport|embassy|consulate|schengen|immigrat|travel doc|residency|permit|arrival card|departure|customs|biometric|interview|overstay|appeal|rejection|refusal|bank statement|financial proof|insurance|invitation letter|sponsor|flight reserv|hotel reserv|itinerary|notarize|apostille|noc |no objection|salary certif|employment letter|work permit|study permit|student visa|tourist visa|business visa|transit visa|family visit|entry ban|blacklist|vfs|ika|appointment/i;
const OFF_TOPIC_RE = /recipe|cook|music|song|movie|film|weather|sports|cricket|football|game|programming|code|math|physics|history|politics|religion|relationship|joke|poem|story|novel|stock|invest|crypto|bitcoin|diet|workout|fitness/i;

function isOffTopicMessage(msg: string): boolean {
  if (VISA_RE.test(msg)) return false;
  if (msg.trim().split(/\s+/).length <= 5) return false; // short questions get through
  return OFF_TOPIC_RE.test(msg);
}

/** One bubble in the assistant chat. Besides plain text it can carry tap-to-ask questions, quick actions,
 *  a "please upload this document" card, or a live progress/result card for a document being checked. */
interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  note?: string;
  related?: ChatRelated[];
  actions?: string[];
  docCard?: { type: string; title: string; icon: IoniconName; tip: string; state: 'open' | 'sent' | 'skipped' };
  progress?: { title: string; type: string; state: 'running' | 'done' | 'error'; documentId: string; result?: ApiAuditResult; error?: string };
}

const CHAT_DOC_TIPS: Record<string, string> = {
  passport: 'Photo page flat on a dark surface, all four corners and the two lines at the bottom visible.',
  bank: 'Last 3 months, with your name, account number and the bank stamp. PDF works best.',
  employment: 'On company letterhead, signed and dated within the last month.',
  insurance: 'The policy certificate showing cover amount and travel dates.',
  itinerary: 'Flight and hotel reservations with dates matching your application.',
  photo: 'Plain light background, neutral face, no glasses, taken in the last 6 months.',
};

const OFF_TOPIC_REPLY = "I can only help with visa and immigration questions — things like document requirements, embassy rules, application timelines, and travel eligibility. What visa question can I help you with?";

const tabs = [
  { id: 'home',    label: 'Home',    icon: 'home'                as IoniconName, iconOff: 'home-outline'                as IoniconName },
  { id: 'apps',    label: 'Apps',    icon: 'document-text'       as IoniconName, iconOff: 'document-text-outline'       as IoniconName },
  { id: 'docs',    label: 'Docs',    icon: 'folder'              as IoniconName, iconOff: 'folder-outline'              as IoniconName },
  { id: 'bookings', label: 'Bookings', icon: 'calendar'           as IoniconName, iconOff: 'calendar-outline'           as IoniconName },
  { id: 'chat',    label: 'Chat',    icon: 'chatbubble-ellipses' as IoniconName, iconOff: 'chatbubble-ellipses-outline' as IoniconName },
  { id: 'profile', label: 'Profile', icon: 'person'              as IoniconName, iconOff: 'person-outline'              as IoniconName },
] as const;

type TabId = (typeof tabs)[number]['id'];
type DetailTab = 'overview' | 'documents' | 'requirements' | 'chat';
type Route =
  | { name: 'splash' }
  | { name: 'welcome' }
  | { name: 'register' }
  | { name: 'verify'; email: string }
  | { name: 'forgotPassword' }
  | { name: 'camera'; docType: string; uri?: string; mime?: string }
  | { name: 'liveAnalysis'; docTitle: string }
  | { name: 'profileHub' }
  | { name: 'visaWaiver' }
  | { name: 'rejectionAnalyzer' }
  | { name: 'proTier' }
  | { name: 'ecosystemPartners'; score: number }
  | { name: 'visaCalculator' }
  | { name: 'bankBalance' }
  | { name: 'embassyFinder' }
  | { name: 'faceVerification'; firstRun?: boolean }
  | { name: 'timelineTracker' }
  | { name: 'countryComparison' }
  | { name: 'onboarding'; step: number }
  | { name: 'tabs'; tab: TabId }
  | { name: 'application'; id: string; tab: DetailTab }
  | { name: 'newApp'; step: number }
  | { name: 'upload'; state: 'select' | 'uploading' | 'auditing' | 'done' }
  | { name: 'auditReport'; docId: string }
  | { name: 'analysis' }
  | { name: 'requirements' }
  | { name: 'consultants' }
  | { name: 'consultant'; id: string }
  | { name: 'booking'; consultantId: string; optionId?: string }
  | { name: 'calendarPicker'; consultantId: string; optionId: string }
  | { name: 'consent'; consultantId: string; optionId: string; slotISO?: string; shareFor?: { applicationId: string } }
  | { name: 'ctabs'; tab: ConsultantTabId }
  | { name: 'ccase'; bookingId: string }
  | { name: 'confirmation'; consultantId: string }
  | { name: 'notifications' }
  | { name: 'search' }
  | { name: 'settings' }
  | { name: 'consultantConsole' }
  | { name: 'hrPortal' }
  | { name: 'employeePortal' }
  | { name: 'adminOverview' }
  | { name: 'myMessages' }
  | { name: 'accessGrants' }
  | { name: 'howTo' };

// ── Data normalizers (API → mobile display format) ────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', in_progress: 'In Progress', ready: 'Ready',
  submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected'
};
const STATUS_COLOR: Record<string, string> = {
  draft: '#64748B', in_progress: '#1A56DB', ready: '#0D9488',
  submitted: '#7C3AED', approved: '#10B981', rejected: '#DC2626'
};
function normalizeApp(a: ApiApplication) {
  return {
    ...a,
    statusRaw: a.status,
    status: STATUS_LABEL[a.status] ?? a.status,
    statusColor: STATUS_COLOR[a.status] ?? '#64748B',
    intendedTo: a.intendedFrom,
    jurisdiction: a.residenceCountry ?? 'Not specified',
    fee: '—',
    processingDays: '—',
    purpose: a.visaType,
  };
}

const AVATAR_COLORS = ['#6D28D9','#0D9488','#1A56DB','#DC2626','#D97706','#059669'];
function normalizeConsultant(c: ApiConsultant, idx = 0) {
  const parts = c.name.split(' ');
  const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return {
    ...c,
    initials,
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    price: `$${c.rate}`,
    nextSlot: c.availableToday ? 'Available today' : c.responseTime,
    jurisdictions: c.specialty,
    languages: Array.isArray(c.languages) ? c.languages.join(', ') : c.languages,
    bio: c.bio ?? `${c.specialty} specialist with ${c.reviews} reviews.`,
  };
}
function normalizeSessionOption(o: ApiSessionOption) {
  return {
    id: o.id,
    title: o.label,
    price: `$${o.priceUsd}`,
    duration: `${o.durationMinutes} min`,
    detail: o.description,
    recommended: o.recommended ?? false,
  };
}

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  offlineAccess: true,
});

function AppInner() {
  const insets = useSafeAreaInsets();
  // Real device-reported inset for the OS nav bar/gesture pill — replaces the
  // old Dimensions(screen)-Dimensions(window) heuristic, which read as ~0 on
  // some real devices (Samsung edge-to-edge/gesture nav) even though the OS
  // bar was still there, causing the sticky footer and BottomNav to render
  // underneath it instead of above it.
  const bottomNavH = 64 + insets.bottom;
  const [route, setRoute] = useState<Route>({ name: 'splash' });
  // App lock: set when a signed-in session is waiting behind the device fingerprint / face check.
  const [locked, setLocked] = useState(false);
  const pendingSession = useRef<AuthSession | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  // Where to go once the first-time face check is finished or postponed.
  const postAuthRoute = useRef<Route | null>(null);
  const authUserRef = useRef<AuthUser | null>(null);
  const [bioLabel, setBioLabel] = useState('Fingerprint or face');
  useEffect(() => { getBiometricSupport().then((sup) => { if (sup.available) setBioLabel(sup.label); }).catch(() => {}); }, []);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  authUserRef.current = authUser;
  // Route-level guard matching the backend's own requireRole gates exactly
  // (app.ts: /consultant-console, /hr, /admin/overview) — the web app
  // already redirects at the route level as defense-in-depth on top of the
  // real backend 403; mobile only hid the button that navigates here, with
  // nothing stopping the screen itself from rendering (and failing to load
  // its data) if `route` were ever set some other way. Not currently
  // reachable any other way in this app (no deep-link route for these
  // screens), but this closes the gap properly rather than relying on a
  // single point of failure.
  useEffect(() => {
    const roles = authUser?.roles ?? [];
    const requiresOneOf: Partial<Record<Route['name'], string[]>> = {
      consultantConsole: ['consultant', 'platform_admin'],
      hrPortal: ['hr_admin', 'platform_admin'],
      adminOverview: ['platform_admin'],
      ctabs: ['consultant', 'platform_admin'],
      ccase: ['consultant', 'platform_admin'],
    };
    const required = requiresOneOf[route.name];
    if (required && !required.some((r) => roles.includes(r))) {
      setRoute({ name: 'tabs', tab: 'profile' });
    }
  }, [route.name, authUser]);
  // Real keyboard height, tracked ourselves: on edge-to-edge Android the window
  // isn't resized for the keyboard, and KeyboardAvoidingView didn't lift the
  // pinned footer/composer in testing, so the whole shell is padded by exactly
  // this much instead.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = keyboardHeight > 0;
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height + (Platform.OS === 'android' ? insets.bottom : 0)));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, [insets.bottom]);
  // Android back button / back gesture: walk back through the screens the user
  // actually visited instead of closing the app from anywhere. Exits only from
  // Home (or the start screen), like a normal app.
  const routeHistory = useRef<Route[]>([]);
  const previousRoute = useRef<Route>(route);
  const navigatingBack = useRef(false);
  useEffect(() => {
    if (navigatingBack.current) { navigatingBack.current = false; previousRoute.current = route; return; }
    const prev = previousRoute.current;
    // Auth/transient screens never go on the stack: back from Home must not return to sign-in or a finished analysis.
    const transient = ['splash', 'welcome', 'register', 'verify', 'forgotPassword', 'liveAnalysis', 'onboarding', 'camera', 'upload'];
    if (prev !== route && !transient.includes(prev.name)) routeHistory.current = [...routeHistory.current.slice(-29), prev];
    if (route.name === 'welcome') routeHistory.current = [];
    previousRoute.current = route;
  }, [route]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Keyboard open: back only closes it (Android can deliver the key to the app first).
      if (Keyboard.isVisible()) { Keyboard.dismiss(); return true; }
      if (route.name === 'liveAnalysis') return true; // mid-upload: don't abandon it with a stray swipe
      if (route.name === 'register' || route.name === 'forgotPassword') { setRoute({ name: 'welcome' }); return true; }
      if (route.name === 'camera') { if (chatPending.current) { chatPending.current = null; setRoute({ name: 'tabs', tab: 'chat' }); } else setRoute({ name: 'upload', state: 'select' }); return true; }
      const prev = routeHistory.current[routeHistory.current.length - 1];
      if (prev) {
        routeHistory.current = routeHistory.current.slice(0, -1);
        navigatingBack.current = true;
        setRoute(prev);
        return true;
      }
      if (route.name === 'tabs' && route.tab !== 'home') { setRoute({ name: 'tabs', tab: 'home' }); return true; }
      return false; // Home / start screen: let Android close the app
    });
    return () => sub.remove();
  }, [route]);
  // First-run tour: once per install, the first time the signed-in user lands on Home.
  const [tourVisible, setTourVisible] = useState(false);
  const tourChecked = useRef(false);
  useEffect(() => {
    if (!authUser || tourChecked.current || route.name !== 'tabs' || route.tab !== 'home') return;
    tourChecked.current = true;
    hasSeenTour().then((seen) => { if (!seen) setTourVisible(true); });
  }, [authUser, route]);
  const closeTour = useCallback(() => { setTourVisible(false); void markTourSeen(); }, []);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<ChatMsg[]>([]);
  const [faqCatalog, setFaqCatalog] = useState<ApiFaqCatalog | null>(null);
  // Documents the assistant has already asked for in this chat session, so "next document" never repeats one.
  const docFlow = useRef<{ handled: Set<string> }>({ handled: new Set() });
  const documentsRef = useRef<ApiDocument[]>([]);
  // Set while the guided scanner is open on behalf of the chat: its capture goes back to the chat, not the full-screen analysis.
  const chatPending = useRef<{ msgId: string; card: NonNullable<ChatMsg['docCard']> } | null>(null);

  // Real data state
  const [appList, setAppList] = useState<ReturnType<typeof normalizeApp>[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadAppsError, setLoadAppsError] = useState('');
  const [consultantList, setConsultantList] = useState<ReturnType<typeof normalizeConsultant>[]>([]);
  const [loadConsultantsError, setLoadConsultantsError] = useState('');
  const [sessionOpts, setSessionOpts] = useState<ReturnType<typeof normalizeSessionOption>[]>([]);
  const [loadSessionOptsError, setLoadSessionOptsError] = useState('');
  const [lastBooking, setLastBooking] = useState<ApiBooking | null>(null);
  const [createAppError, setCreateAppError] = useState('');
  // Lets a long scrollable screen (e.g. a step wizard with a tall list above
  // its primary action) pin that action to the bottom of the viewport
  // instead of it scrolling away with the content — set by the active
  // screen via a useEffect, cleared automatically on unmount/navigation.
  const [stickyFooter, setStickyFooter] = useState<React.ReactNode>(null);
  const [notificationList, setNotificationList] = useState<ApiNotification[]>([]);
  const [loadNotificationsError, setLoadNotificationsError] = useState('');
  const [documentList, setDocumentList] = useState<ApiDocument[]>([]);
  const [loadDocumentsError, setLoadDocumentsError] = useState('');
  const [auditData, setAuditData] = useState<Record<string, any>>({});
  const [auditErrors, setAuditErrors] = useState<Record<string, string>>({});
  // Carries which document is being uploaded from the picker step through to
  // the final API call — set when the user picks a file, read when the audit
  // actually gets enqueued a couple of screens later.
  const [pendingDocumentId, setPendingDocumentId] = useState('doc-passport');
  // Real on-device OCR text (Google ML Kit) for whatever was just captured
  // or picked, carried the same way through to the audit call — undefined
  // when the source has no OCR available (e.g. a picked PDF).
  const [pendingDocType, setPendingDocType] = useState('Document');
  const [pendingExtractedText, setPendingExtractedText] = useState<string | undefined>(undefined);
  // The actual file bytes, so the backend can run real Gemini vision
  // analysis instead of only the on-device OCR text above.
  const [pendingImageBase64, setPendingImageBase64] = useState<string | undefined>(undefined);
  const [pendingMimeType, setPendingMimeType] = useState<string | undefined>(undefined);

  // New application form
  const [newAppVisaType, setNewAppVisaType] = useState('schengen-tourist');
  const [newAppNationality, setNewAppNationality] = useState('');
  const [newAppResidence, setNewAppResidence] = useState('');
  const [newAppDestination, setNewAppDestination] = useState('');
  const [newAppTravelFrom, setNewAppTravelFrom] = useState('');
  const [newAppCreating, setNewAppCreating] = useState(false);

  // Nationality and residence rarely change between applications — carry
  // forward whatever was entered last time instead of asking again.
  useEffect(() => {
    loadPreferences().then(p => {
      if (p.nationality) setNewAppNationality(prev => prev || p.nationality);
      if (p.residenceCountry) setNewAppResidence(prev => prev || p.residenceCountry);
    });
  }, []);

  const inConsultantWorkspace = route.name === 'ctabs' || route.name === 'ccase';
  const activeTab: string = route.name === 'ctabs' ? route.tab : route.name === 'ccase' ? 'schedule' : route.name === 'tabs' ? route.tab : route.name === 'howTo' ? 'profile' : ['consultants', 'consultant', 'booking', 'calendarPicker', 'consent', 'confirmation'].includes(route.name) ? 'bookings' : route.name === 'application' ? 'apps' : route.name === 'newApp' ? 'apps' : route.name === 'upload' ? 'docs' : 'home';
  const isChatRoute = route.name === 'tabs' && route.tab === 'chat';
  // Tab bar hides while the keyboard is up: it would otherwise sit between the
  // keyboard and the field/button being typed into, eating a fifth of the
  // usable screen. It comes straight back when the keyboard closes.
  const bottomNavVisible = !keyboardVisible && !['camera','liveAnalysis','welcome','splash','register','verify','forgotPassword'].includes(route.name) && route.name !== 'onboarding';

  // "More below" affordance for the main scrolling screen: a chevron button
  // that appears whenever content continues below the fold and jumps down a
  // page when tapped, instead of relying on people guessing a screen scrolls.
  const mainScrollRef = useRef<ScrollView>(null);
  const mainScroll = useRef({ y: 0, viewH: 0, contentH: 0 });
  const [canScrollDown, setCanScrollDown] = useState(false);
  const updateCanScroll = useCallback(() => {
    const { y, viewH, contentH } = mainScroll.current;
    setCanScrollDown(contentH > viewH + 24 && y + viewH < contentH - 24);
  }, []);

  useEffect(() => {
    if (authUser && route.name === 'tabs' && route.tab === 'bookings') { void loadBookings(); void loadGrants(); }
  }, [route.name === 'tabs' && route.tab === 'bookings', authUser?.uid]);
  useEffect(() => {
    if (authUser && (route.name === 'ctabs' || route.name === 'ccase')) void loadConsultantData();
  }, [route.name === 'ctabs' || route.name === 'ccase', authUser?.uid, route.name === 'ctabs' ? route.tab : '']);

  const goHome = () => setRoute({ name: 'tabs', tab: 'home' });
  const goChat = () => setRoute({ name: 'tabs', tab: 'chat' });
  const openApplication = (id: string, tab: DetailTab = 'overview') => setRoute({ name: 'application', id, tab });
  const openBooking = (consultantId = (consultantList[0]?.id ?? 'c-priya'), optionId?: string) =>
    setRoute({ name: 'booking', consultantId, optionId });

  const loadApplications = async () => {
    setLoadingApps(true);
    setLoadAppsError('');
    try {
      const { applications } = await fetchApplications();
      setAppList(applications.map(normalizeApp));
    } catch (e: any) {
      setLoadAppsError(e?.message ?? 'Failed to load applications. Please try again.');
    }
    finally { setLoadingApps(false); }
  };

  // Sends a freshly authenticated user to the real "create your first
  // application" flow only if they don't have one yet — returning users with
  // existing applications land straight on the dashboard instead of being
  // routed through onboarding on every login.
  // useCallback with an empty dep array: every setter called here is a
  // stable useState setter, and fetchApplications/normalizeApp are
  // module-level — the load*() calls below are intentionally left out of
  // the array (fire-and-forget background refreshes, not read for their
  // return value here) rather than chased into their own useCallbacks,
  // which would expand this fix well beyond the bug it's for. What matters
  // for that bug is that THIS function stays referentially stable, since
  // handleLogin depends on it and WelcomeScreen's sticky-footer effect
  // depends on handleLogin in turn — see the comment on handleLogin.
  const routeAfterAuth = useCallback(async (resumed = false, roles: string[] = [], uid?: string) => {
    setLoadingApps(true);
    setLoadAppsError('');
    let firstAppId: string | undefined;
    // A consultant lands in their own workspace; a client lands on Home (or onboarding when new).
    let target: Route = roles.includes('consultant') ? { name: 'ctabs', tab: 'schedule' } : { name: 'tabs', tab: 'home' };
    try {
      const { applications } = await fetchApplications();
      firstAppId = applications[0]?.id;
      setAppList(applications.map(normalizeApp));
      if (!roles.includes('consultant') && applications.length === 0 && !resumed) target = { name: 'onboarding', step: 0 };
    } catch (e: any) {
      setLoadAppsError(e?.message ?? 'Failed to load applications. Please try again.');
    } finally {
      setLoadingApps(false);
    }
    void Promise.all([loadConsultants(), loadSessionOpts(), loadNotifications(), loadDocuments(firstAppId), loadBookings(), loadGrants(), ...(roles.includes('consultant') ? [loadConsultantData()] : [])]);
    // First time on this account: ask for the face check before anything else (once — "Later" is remembered).
    if (!roles.includes('consultant')) {
      try {
        const fs = await fetchFaceStatus();
        setFaceStatus(fs);
        if (!fs.enrolled && uid && faceSdkAvailable() && !(await faceGateSkipped(uid))) {
          postAuthRoute.current = target;
          setRoute({ name: 'faceVerification', firstRun: true });
          return;
        }
      } catch { /* the app works without it; Home offers the check later */ }
    }
    setRoute(target);
  }, []);

  /** After the first-time face check (done or postponed): carry on to where the user was headed. */
  const finishFirstFaceCheck = () => {
    const next = postAuthRoute.current ?? { name: 'tabs', tab: 'home' } as Route;
    postAuthRoute.current = null;
    setRoute(next);
  };

  // Registers this device for real push notifications once signed in.
  // Best-effort and silent on failure — a user who denies the permission (or
  // is on an emulator with no Google Play Services) should see no difference
  // in the rest of the app, just no push notifications.
  useEffect(() => {
    if (!authUser) return;
    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
        if (!granted) return;
        const token = await Notifications.getDevicePushTokenAsync();
        await registerDeviceToken(token.data, Platform.OS);
      } catch { /* no Play Services, permission denied, or offline — silently skip */ }
    })();
  }, [authUser?.uid]);

  const loadConsultants = async () => {
    setLoadConsultantsError('');
    try {
      const { consultants } = await apiFetchConsultants();
      setConsultantList(consultants.map((c, i) => normalizeConsultant(c, i)));
    } catch (e: any) {
      setLoadConsultantsError(e?.message ?? 'Failed to load consultants. Please try again.');
    }
  };

  const loadSessionOpts = async () => {
    setLoadSessionOptsError('');
    try {
      const { options } = await apiFetchSessionOptions();
      setSessionOpts(options.map(normalizeSessionOption));
    } catch (e: any) {
      setLoadSessionOptsError(e?.message ?? 'Failed to load session options.');
    }
  };

  const loadNotifications = async () => {
    setLoadNotificationsError('');
    try {
      const { notifications } = await fetchNotifications();
      setNotificationList(notifications);
    } catch (e: any) {
      setLoadNotificationsError(e?.message ?? 'Failed to load notifications.');
    }
  };

  const [myBookings, setMyBookings] = useState<ApiMyBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const loadBookings = async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const { bookings } = await fetchMyBookings();
      setMyBookings(bookings);
    } catch (e: any) {
      setBookingsError(e?.message ?? 'Could not load your appointments.');
    } finally {
      setBookingsLoading(false);
    }
  };
  const [faceStatus, setFaceStatus] = useState<ApiFaceStatus | null>(null);
  const loadFaceStatus = async () => {
    try { setFaceStatus(await fetchFaceStatus()); } catch { /* the app works without it; the badge just won't show */ }
  };
  const [myGrants, setMyGrants] = useState<ApiAccessGrant[]>([]);
  const loadGrants = async () => {
    try { setMyGrants((await fetchMyAccessGrants()).grants); } catch { /* the Bookings tab still works; sharing state just won't show */ }
  };
  const [consultantMe, setConsultantMe] = useState<ApiConsultantMe | null>(null);
  const [consultantAppts, setConsultantAppts] = useState<ApiConsultantAppointment[]>([]);
  const [consultantLoading, setConsultantLoading] = useState(false);
  const [consultantError, setConsultantError] = useState('');
  const loadConsultantData = async () => {
    setConsultantLoading(true);
    setConsultantError('');
    try {
      const [me, list] = await Promise.all([fetchConsultantMe(), fetchConsultantAppointments().catch((e: any) => { if (/not linked/i.test(e?.message ?? '')) return { appointments: [] as ApiConsultantAppointment[] }; throw e; })]);
      setConsultantMe(me);
      setConsultantAppts(list.appointments);
    } catch (e: any) {
      setConsultantError(e?.message ?? 'Could not load your schedule.');
    } finally {
      setConsultantLoading(false);
    }
  };
  // When a reschedule is confirmed, the old appointment is cancelled only after the new one exists.
  const rescheduleOf = useRef<string | null>(null);

  const loadDocuments = async (applicationId?: string) => {
    setLoadDocumentsError('');
    try {
      const { documents } = await fetchDocuments(applicationId);
      documentsRef.current = documents;
      setDocumentList(documents);
    } catch (e: any) {
      setLoadDocumentsError(e?.message ?? 'Failed to load documents.');
    }
  };

  const loadAuditResult = async (docId: string) => {
    setAuditErrors(prev => { const next = { ...prev }; delete next[docId]; return next; });
    try {
      const data = await fetchAuditResult(docId);
      setAuditData(prev => ({ ...prev, [docId]: data }));
    } catch {
      setAuditErrors(prev => ({ ...prev, [docId]: "Couldn't load this audit report. Check your connection and try again." }));
    }
  };

  const handleCreateApplication = async () => {
    const visaLabel = VISA_TYPES.find(v => v.id === newAppVisaType)?.label ?? newAppVisaType;
    const destLabel = VISA_TYPES.find(v => v.id === newAppVisaType)?.dest ?? newAppDestination;
    const destination = newAppDestination.trim() || destLabel;
    const intendedFrom = newAppTravelFrom.trim() || new Date().toISOString().split('T')[0];
    if (!destination || !visaLabel) return;
    setNewAppCreating(true);
    setCreateAppError('');
    try {
      const { application } = await apiCreateApplication({
        destinationCountry: destination,
        visaType: visaLabel,
        intendedFrom,
        applicantName: authUser?.name ?? 'Applicant',
        nationality: newAppNationality.trim() || undefined,
        residenceCountry: newAppResidence.trim() || undefined,
      });
      const normalized = normalizeApp(application);
      setAppList(prev => [normalized, ...prev]);
      // Nationality and residence are carried forward for the next
      // application instead of being cleared — only destination and travel
      // date are actually specific to a single application.
      savePreferences({ nationality: newAppNationality.trim(), residenceCountry: newAppResidence.trim() });
      setNewAppDestination('');
      setNewAppTravelFrom('');
      openApplication(normalized.id);
    } catch (e: any) {
      setCreateAppError(e?.message ?? 'Could not create application. Please check your connection and try again.');
    } finally {
      setNewAppCreating(false);
    }
  };

  const handleConfirmBooking = async (consultantId: string, optionId: string, slotISO?: string, categories: string[] = []) => {
    const appId = appList[0]?.id ?? `app-${Date.now()}`;
    try {
      const booking = await apiCreateBooking({ consultantId, applicationId: appId, sessionType: optionId, slotISO });
      if (categories.length > 0) {
        await apiCreateAccessGrant({
          applicationId: appId, consultantId, categories,
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          acceptedTerms: true // the consent screen only lets you continue once the terms are ticked
        });
      }
      setLastBooking(booking);
      if (rescheduleOf.current) {
        try { await cancelMyBooking(rescheduleOf.current); } catch { /* the old appointment can still be cancelled from Bookings */ }
        rescheduleOf.current = null;
      }
      void loadBookings();
      setRoute({ name: 'confirmation', consultantId });
    } catch (err) {
      Alert.alert('Could not confirm booking', err instanceof Error ? err.message : 'Please check your connection and try again.');
    }
  };

  // Grant a consultant access to an existing appointment's application (without booking again).
  const handleShareCase = async (applicationId: string, consultantId: string, categories: string[]) => {
    try {
      await apiCreateAccessGrant({ applicationId, consultantId, categories, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), acceptedTerms: true });
      await loadGrants();
      setRoute({ name: 'tabs', tab: 'bookings' });
      Alert.alert('Access granted', 'Your consultant can now see what you selected. You can revoke it any time from Bookings.');
    } catch (err) {
      Alert.alert('Could not grant access', err instanceof Error ? err.message : 'Please check your connection and try again.');
    }
  };
  const signOutNow = () => {
    void endSession();
    // Forget the Google account too, so the next "Continue with Google" shows the account chooser (shared phones).
    void GoogleSignin.signOut().catch(() => { /* not signed in with Google */ });
    setAuthUser(null);
    setAppList([]);
    setSessionMessages([]);
    setDocumentList([]);
    setAuditData({});
    setNotificationList([]);
    documentsRef.current = [];
    docFlow.current = { handled: new Set() };
    chatPending.current = null;
    postAuthRoute.current = null;
    setMyBookings([]);
    setMyGrants([]);
    setConsultantMe(null);
    setConsultantAppts([]);
    setFaceStatus(null);
    setRoute({ name: 'welcome' });
  };
  // An expired or revoked session on any signed-in call returns the user to sign-in with a clear reason.
  const signOutRef = useRef(signOutNow);
  signOutRef.current = signOutNow;
  useEffect(() => {
    setUnauthorizedHandler(() => { signOutRef.current(); setLoginError('Your session has expired. Please sign in again.'); });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Deleting an application removes it for good, and the server also cancels its upcoming
  // appointments and revokes any consultant access granted for it.
  const handleDeleteApplication = async (id: string) => {
    try {
      const result = await apiDeleteApplication(id);
      const { applications } = await fetchApplications();
      setAppList(applications.map(normalizeApp));
      await Promise.all([loadBookings(), loadDocuments(applications[0]?.id)]);
      setRoute({ name: 'tabs', tab: 'apps' });
      const extras = [result.cancelledBookings ? `${result.cancelledBookings} appointment${result.cancelledBookings === 1 ? '' : 's'} cancelled` : '', result.revokedGrants ? 'consultant access removed' : ''].filter(Boolean).join(' · ');
      Alert.alert('Application deleted', extras || 'It has been removed from your account.');
    } catch (e: any) {
      Alert.alert('Could not delete', e?.message ?? 'Please check your connection and try again.');
    }
  };

  // ── Fingerprint / face lock ─────────────────────────────────────────────────────────────────────────────
  // After sign-in the phone can guard the app with the biometrics it already has enrolled. It is per account,
  // asked once, and always has a "sign in with password" way out.
  const offerBiometricLock = async (uid: string) => {
    try {
      const support = await getBiometricSupport();
      if (!support.available || (await wasAsked(uid)) || (await isLockEnabled(uid))) return;
      await markAsked(uid);
      Alert.alert(
        `Unlock with ${support.label.toLowerCase()}?`,
        'Skip typing your password: the app opens with your phone’s biometrics and locks itself when you leave it. You can change this in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Turn on', onPress: () => { void (async () => {
            const r = await authenticateBiometric(`Confirm to turn on ${support.label.toLowerCase()} unlock`);
            if (r.ok) await setLockEnabled(uid, true);
          })(); } },
        ],
      );
    } catch { /* optional convenience — never blocks sign-in */ }
  };

  /** Runs the device check for a saved session; on success continues into the app. */
  const unlockWithBiometrics = async (): Promise<boolean> => {
    const r = await authenticateBiometric('Unlock Visa With Ease');
    if (!r.ok) return false;
    const session = pendingSession.current;
    pendingSession.current = null;
    setLocked(false);
    if (session) {
      setAuthUser(session.user);
      await routeAfterAuth(true, session.user.roles, session.user.uid);
    }
    return true;
  };

  /** "Use my password instead": ends the saved session so the normal sign-in shows. */
  const leaveLockToPassword = () => {
    pendingSession.current = null;
    setLocked(false);
    signOutNow();
  };

  // Lock again when the app has been away for a minute (long enough for the camera / picker to come and go).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') { backgroundedAt.current = Date.now(); return; }
      if (state !== 'active' || backgroundedAt.current === null) return;
      const away = Date.now() - backgroundedAt.current;
      backgroundedAt.current = null;
      const uid = authUserRef.current?.uid;
      if (!uid || away < 60_000) return;
      void isLockEnabled(uid).then((on) => { if (on) setLocked(true); });
    });
    return () => sub.remove();
  }, []);

  // useCallback is load-bearing here, not just tidiness: WelcomeScreen's
  // sticky-footer effect lists this function in its own dependency array
  // and calls a setState (setStickyFooter) that lives in this component —
  // an unstable (redefined-every-render) function reference there caused a
  // genuine infinite render loop (new render -> new handleLogin -> effect
  // refires -> setStickyFooter -> new render -> ...), pegging the JS thread
  // at 100%+ CPU and starving every Pressable's onPress on that screen of
  // any chance to run (real bug, found by noticing the sign-in screen's
  // checkbox/buttons were completely unresponsive to taps).
  const handleLogin = useCallback(async () => {
    if (loginLoading) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      const session = await apiLogin(authEmail, authPassword, true);
      await startSession(session);
      setAuthUser(session.user);
      await routeAfterAuth(false, session.user.roles, session.user.uid);
      void offerBiometricLock(session.user.uid);
    } catch (e: any) {
      setLoginError(e?.message ?? 'Login failed. Check your connection.');
    } finally {
      setLoginLoading(false);
    }
  }, [authEmail, authPassword, loginLoading, routeAfterAuth]);

  const handleGoogleLogin = async () => {
    if (loginLoading) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      // Backing out of the Google account screen is not an error.
      if ((userInfo as { type?: string }).type === 'cancelled' || !userInfo.data) return;
      const idToken = userInfo.data.idToken;
      if (!idToken) throw new Error('Google did not return an identity token. This usually means the app’s Google setup is incomplete — sign in with email for now.');
      const session = await apiGoogleLogin(idToken);
      await startSession(session);
      setAuthUser(session.user);
      await routeAfterAuth(false, session.user.roles, session.user.uid);
      void offerBiometricLock(session.user.uid);
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS) return;
      // Say what actually went wrong instead of a raw SDK code.
      setLoginError(
        e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ? 'Google Play services are missing or out of date on this phone. Update them, or sign in with email.'
        : String(e?.code) === '10' || /DEVELOPER_ERROR/i.test(String(e?.message)) ? 'Google sign-in is not set up for this build of the app yet. Sign in with email for now.'
        : /network/i.test(String(e?.message)) ? 'No connection. Check your internet and try again.'
        : (e?.message ?? 'Google sign-in failed. Try email & password.'),
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Assistant chat ──────────────────────────────────────────────────────────
  useEffect(() => { fetchFaqCatalog().then(setFaqCatalog).catch(() => { /* chips just don't show; typing still works */ }); }, []);
  const uid = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const pushAi = (m: Partial<ChatMsg> & { text: string }) => setSessionMessages(prev => [...prev, { id: `a-${uid()}`, role: 'ai', ...m }]);
  const patchMsg = (id: string, patch: (m: ChatMsg) => ChatMsg) => setSessionMessages(prev => prev.map(m => (m.id === id ? patch(m) : m)));

  /** Shows a reply from the server: text, follow-up questions, quick actions — and starts the upload flow when asked. */
  const showReply = (r: { reply: string; degraded?: boolean; related?: ChatRelated[]; suggestedActions?: string[]; startDocumentFlow?: boolean }) => {
    pushAi({
      text: r.reply,
      related: r.related,
      actions: r.suggestedActions,
      note: r.degraded ? 'Basic answer from your application data — the AI assistant is temporarily unavailable.' : undefined,
    });
    if (r.startDocumentFlow) void startDocFlow();
  };
  const chatFailure = () => pushAi({ text: "I couldn't reach the assistant just now. Check your connection and send your message again.", note: 'No answer was generated.' });

  const handleSendChat = async (override?: string) => {
    const trimmed = (override ?? message).trim();
    if (!trimmed || isTyping) return;
    setSessionMessages(prev => [...prev, { id: `u-${uid()}`, role: 'user', text: trimmed }]);
    setMessage('');
    // Reject off-topic messages before making any API call — saves tokens
    if (isOffTopicMessage(trimmed)) {
      pushAi({ text: OFF_TOPIC_REPLY });
      return;
    }
    setIsTyping(true);
    try {
      showReply(await sendChatMessage(trimmed, appList[0]?.id));
    } catch {
      // Never dress a failure up as an AI answer: say plainly that nothing came back.
      chatFailure();
    } finally {
      setIsTyping(false);
    }
  };

  /** Tap on a suggested FAQ: answered straight from the knowledge base, no AI call. */
  const askFaq = async (id: string, question: string) => {
    if (isTyping) return;
    setSessionMessages(prev => [...prev, { id: `u-${uid()}`, role: 'user', text: question }]);
    setIsTyping(true);
    try { showReply(await fetchFaqAnswer(id)); } catch { chatFailure(); } finally { setIsTyping(false); }
  };

  /** Quick-action chips under a reply ("Upload my documents", "Find a consultant"...). */
  const runChatAction = (label: string) => {
    if (/upload my documents|upload a document/i.test(label)) { void startDocFlow(); return; }
    if (/find a consultant|consultant/i.test(label) && !/review/i.test(label)) { setRoute({ name: 'consultants' }); return; }
    if (/verify my face/i.test(label)) { setRoute({ name: 'faceVerification' }); return; }
    if (/start a new application/i.test(label)) { setRoute({ name: 'newApp', step: 0 }); return; }
    void handleSendChat(label);
  };

  // ── Uploading documents inside the chat: ask for one, check it in the background, ask for the next ──
  const offerNextDoc = () => {
    const flow = docFlow.current;
    // Missing documents first, then any that were checked but scored poorly (worth re-uploading).
    const docs = documentsRef.current;
    const next = docs.find(d => d.status === 'Missing' && !flow.handled.has(d.type)) ?? docs.find(d => d.status === 'Audited' && d.score < 60 && !flow.handled.has(d.type));
    if (!next) {
      pushAi({ text: flow.handled.size > 0 ? 'That is every document I needed. Results for the last ones appear here as they finish — nothing more to do meanwhile.' : 'All your required documents are already uploaded.', actions: ['Find a consultant'] });
      return;
    }
    flow.handled.add(next.type);
    pushAi({
      text: next.status === 'Audited' ? `Scored ${next.score} last time — a clearer upload will raise your readiness.` : '',
      docCard: { type: next.type, title: next.title, icon: (next.icon as IoniconName) ?? 'document-outline', tip: CHAT_DOC_TIPS[next.type] ?? 'Make sure the whole page is sharp and readable.', state: 'open' },
    });
  };

  const startDocFlow = async () => {
    const app = appList[0];
    if (!app) { pushAi({ text: 'Start an application first — then I can ask for each document in turn.', actions: ['Start a new application'] }); return; }
    docFlow.current = { handled: new Set() };
    try {
      const { documents } = await fetchDocuments(app.id);
      documentsRef.current = documents;
      setDocumentList(documents);
    } catch { /* fall back to whatever was loaded */ }
    offerNextDoc();
  };

  const skipChatDoc = (msgId: string) => {
    patchMsg(msgId, m => (m.docCard ? { ...m, docCard: { ...m.docCard, state: 'skipped' } } : m));
    offerNextDoc();
  };

  /** Sends a captured/picked document: the card closes, a progress card appears, the next document is asked for
   *  straight away, and the check runs in the background. */
  const submitChatDoc = (msgId: string, card: NonNullable<ChatMsg['docCard']>, payload: { extractedText?: string; imageBase64?: string; mime: string }) => {
    const app = appList[0];
    if (!app) return;
    patchMsg(msgId, m => (m.docCard ? { ...m, docCard: { ...m.docCard, state: 'sent' } } : m));
    const documentId = `doc-${card.type}-${Date.now()}`;
    const progressId = `a-${uid()}`;
    setSessionMessages(prev => [...prev, { id: progressId, role: 'ai', text: '', progress: { title: card.title, type: card.type, state: 'running', documentId } }]);
    offerNextDoc();
    void (async () => {
      try {
        await createUploadSlot({ applicationId: app.id, documentId });
        const { result } = await enqueueAudit({ applicationId: app.id, documentId, documentType: card.type, extractedText: payload.extractedText, imageBase64: payload.imageBase64, mimeType: payload.mime });
        setAuditData(prev => ({ ...prev, [documentId]: result }));
        patchMsg(progressId, m => (m.progress ? { ...m, progress: { ...m.progress, state: 'done', result } } : m));
        void loadDocuments(app.id);
        void loadApplications();
      } catch (e: any) {
        patchMsg(progressId, m => (m.progress ? { ...m, progress: { ...m.progress, state: 'error', error: e?.message ?? 'The check failed.' } } : m));
      }
    })();
  };

  /** Scan opens the guided scanner (document guide, auto-capture, quality checks). Files and gallery images go through
   *  the same review screen; PDFs are sent straight to the check. */
  const uploadChatDoc = async (msgId: string, source: 'scan' | 'gallery' | 'file') => {
    const card = sessionMessages.find(m => m.id === msgId)?.docCard;
    if (!appList[0] || !card) return;
    try {
      if (source === 'scan') {
        chatPending.current = { msgId, card };
        setRoute({ name: 'camera', docType: card.type });
        return;
      }
      if (source === 'gallery') {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
        if (r.canceled || !r.assets?.[0]) return;
        chatPending.current = { msgId, card };
        setRoute({ name: 'camera', docType: card.type, uri: r.assets[0].uri, mime: r.assets[0].mimeType || 'image/jpeg' });
        return;
      }
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      const asset = r.assets[0];
      const isImage = /\.(jpe?g|png|heic)$/i.test(asset.name ?? '') || (asset.mimeType?.startsWith('image/') ?? false);
      const mime = asset.mimeType || (isImage ? 'image/jpeg' : 'application/pdf');
      if (isImage) {
        chatPending.current = { msgId, card };
        setRoute({ name: 'camera', docType: card.type, uri: asset.uri, mime });
        return;
      }
      let imageBase64: string | undefined;
      try { imageBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }); } catch { /* honest "couldn't verify" fallback applies */ }
      submitChatDoc(msgId, card, { imageBase64, mime });
    } catch {
      pushAi({ text: 'I could not read that file. Try again, or choose a different one.' });
    }
  };

  const retryChatDoc = (type: string) => { docFlow.current.handled.delete(type); offerNextDoc(); };

  return (
    <SafeAreaView style={[styles.shell, ['splash','welcome','register','forgotPassword'].includes(route.name) && { backgroundColor: '#fff' }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {locked && <LockScreen userName={(pendingSession.current?.user ?? authUser)?.name} label={bioLabel} onUnlock={unlockWithBiometrics} onPassword={leaveLockToPassword} />}
      {/* Padded by the keyboard's real overlap, which lifts the absolutely-
          positioned pinned footer/composer above it too. */}
      <View style={{ flex: 1, paddingBottom: ['camera','liveAnalysis'].includes(route.name) ? 0 : keyboardHeight }}>
  {/* Camera screen renders fullscreen outside ScrollView */}
      {route.name === 'camera' && (
        <CameraScreen
          docType={route.docType}
          initialUri={route.uri}
          initialMime={route.mime}
          back={() => { if (chatPending.current) { chatPending.current = null; setRoute({ name: 'tabs', tab: 'chat' }); } else setRoute({ name: 'upload', state: 'select' }); }}
          onCapture={(extractedText, imageBase64, mimeType) => {
            const fromChat = chatPending.current;
            if (fromChat) {
              chatPending.current = null;
              submitChatDoc(fromChat.msgId, fromChat.card, { extractedText, imageBase64, mime: mimeType ?? 'image/jpeg' });
              setRoute({ name: 'tabs', tab: 'chat' });
              return;
            }
            setPendingDocumentId(`doc-passport-${Date.now()}`);
            setPendingDocType(route.docType);
            setPendingExtractedText(extractedText);
            setPendingImageBase64(imageBase64);
            setPendingMimeType(mimeType);
            setRoute({ name: 'liveAnalysis', docTitle: route.docType });
          }}
        />
      )}
      {route.name === 'liveAnalysis' && (
        <LiveAnalysisScreen
          docTitle={route.docTitle}
          documentId={pendingDocumentId}
          documentType={pendingDocType}
          extractedText={pendingExtractedText}
          imageBase64={pendingImageBase64}
          mimeType={pendingMimeType}
          applicationId={appList[0]?.id}
          onVerifyFace={() => setRoute({ name: 'faceVerification' })}
          onDone={(result) => {
            setAuditData(prev => ({ ...prev, [pendingDocumentId]: result }));
            setRoute({ name: 'auditReport', docId: pendingDocumentId });
          }}
        />
      )}
      {!['camera','liveAnalysis'].includes(route.name) && route.name !== 'welcome' && route.name !== 'onboarding' && route.name !== 'splash' && route.name !== 'register' && route.name !== 'verify' && route.name !== 'forgotPassword' && (
        <Header
          onSearch={() => setRoute({ name: 'search' })}
          onNotifications={() => setRoute({ name: 'notifications' })}
          userName={authUser?.name}
          unreadCount={notificationList.filter(n => !n.read).length}
        />
      )}
      {isChatRoute && (
        <ChatScreen
          message={message}
          setMessage={setMessage}
          sessionMessages={sessionMessages}
          sendMessage={() => { void handleSendChat(); }}
          isTyping={isTyping}
          appList={appList}
          faq={faqCatalog}
          askFaq={askFaq}
          askText={(t) => { void handleSendChat(t); }}
          runAction={runChatAction}
          startDocFlow={() => { void startDocFlow(); }}
          uploadDoc={uploadChatDoc}
          skipDoc={skipChatDoc}
          retryDoc={retryChatDoc}
          openReport={(docId) => setRoute({ name: 'auditReport', docId })}
          openConsultants={() => setRoute({ name: 'consultants' })}
          bottomInset={bottomNavVisible ? bottomNavH : keyboardVisible ? 4 : Math.max(insets.bottom, 8)}
        />
      )}
      {!['camera','liveAnalysis'].includes(route.name) && !isChatRoute && (
      /* keyboardShouldPersistTaps="handled": without it, ScrollView's default
         ('never') swallows the FIRST tap on anything below an open keyboard
         just to dismiss it — so tapping an autocomplete suggestion row (which
         isn't itself a text input) never reached that row's onPress at all. */
      <ScrollView
        ref={mainScrollRef}
        persistentScrollbar
        scrollEventThrottle={64}
        onScroll={(e) => { mainScroll.current.y = e.nativeEvent.contentOffset.y; updateCanScroll(); }}
        onLayout={(e) => { mainScroll.current.viewH = e.nativeEvent.layout.height; updateCanScroll(); }}
        onContentSizeChange={(_w, h) => { mainScroll.current.contentH = h; updateCanScroll(); }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, !['welcome','onboarding','splash','register','verify','forgotPassword'].includes(route.name) && { paddingBottom: bottomNavH + 20 }, !!stickyFooter && { paddingBottom: (bottomNavVisible ? bottomNavH + 20 : 28) + STICKY_FOOTER_H }]}>
        {route.name === 'splash' && (
          <SplashScreen onDone={() => { void (async () => {
            const session = await restoreSession();
            if (!session) { setRoute({ name: 'welcome' }); return; }
            // A biometric lock is waiting on this account: hold the session behind it.
            if (await isLockEnabled(session.user.uid) && (await getBiometricSupport()).available) {
              pendingSession.current = session;
              setLocked(true);
              return;
            }
            setAuthUser(session.user);
            await routeAfterAuth(true, session.user.roles, session.user.uid);
          })(); }} />
        )}
        {route.name === 'welcome' && (
          <WelcomeScreen
            accepted={acceptedTerms}
            email={authEmail}
            password={authPassword}
            setEmail={setAuthEmail}
            setPassword={setAuthPassword}
            toggleAccepted={() => setAcceptedTerms((value) => !value)}
            start={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onForgot={() => setRoute({ name: 'forgotPassword' })}
            onRegister={() => setRoute({ name: 'register' })}
            loginError={loginError}
            loginLoading={loginLoading}
            setStickyFooter={setStickyFooter}
          />
        )}
        {route.name === 'forgotPassword' && (
          <ForgotPasswordScreen back={() => setRoute({ name: 'welcome' })} />
        )}
        {route.name === 'onboarding' && (
          <NewApplicationScreen
            step={route.step}
            visaTypeId={newAppVisaType}
            setVisaTypeId={setNewAppVisaType}
            nationality={newAppNationality}
            setNationality={setNewAppNationality}
            residence={newAppResidence}
            setResidence={setNewAppResidence}
            destination={newAppDestination}
            setDestination={setNewAppDestination}
            travelFrom={newAppTravelFrom}
            setTravelFrom={setNewAppTravelFrom}
            creating={newAppCreating}
            createError={createAppError}
            setStickyFooter={setStickyFooter}
            backLabel={route.step === 0 ? 'Skip for now' : 'Back'}
            back={() => { setCreateAppError(''); route.step === 0 ? goHome() : setRoute({ name: 'onboarding', step: route.step - 1 }); }}
            next={() => {
              if (route.step < 3) {
                setCreateAppError('');
                setRoute({ name: 'onboarding', step: route.step + 1 });
              } else {
                handleCreateApplication();
              }
            }}
          />
        )}
        {route.name === 'ctabs' && route.tab === 'schedule' && (
          <ConsultantScheduleScreen me={consultantMe} appointments={consultantAppts} loading={consultantLoading} error={consultantError} retry={loadConsultantData} openCase={(bookingId) => setRoute({ name: 'ccase', bookingId })} />
        )}
        {route.name === 'ctabs' && route.tab === 'clients' && (
          <ConsultantClientsScreen appointments={consultantAppts} openCase={(bookingId) => setRoute({ name: 'ccase', bookingId })} />
        )}
        {route.name === 'ctabs' && route.tab === 'cprofile' && (
          <ConsultantWorkspaceProfileScreen me={consultantMe} authUser={authUser} canSwitch={!!authUser?.roles.includes('consumer')} switchToPersonal={() => setRoute({ name: 'tabs', tab: 'home' })} onSignOut={signOutNow} />
        )}
        {route.name === 'ccase' && (
          <ConsultantCaseScreen bookingId={route.bookingId} appointment={consultantAppts.find((a) => a.bookingId === route.bookingId) ?? null} back={() => setRoute({ name: 'ctabs', tab: 'schedule' })} />
        )}
        {route.name === 'tabs' && route.tab === 'home' && (
          <DashboardScreen
            appList={appList}
            loadingApps={loadingApps}
            loadAppsError={loadAppsError}
            userName={authUser?.name}
            roles={authUser?.roles ?? []}
            documents={documentList}
            navigate={setRoute}
            openApplication={openApplication}
            openUpload={() => setRoute({ name: 'upload', state: 'select' })}
            openAnalysis={() => setRoute({ name: 'analysis' })}
            openRequirements={() => setRoute({ name: 'requirements' })}
            openChat={goChat}
            openConsultants={() => setRoute({ name: 'consultants' })}
            openCalculator={() => setRoute({ name: 'visaCalculator' })}
            openFaceVerification={() => setRoute({ name: 'faceVerification' })}
            newApplication={() => setRoute({ name: 'newApp', step: 0 })}
            retryLoad={loadApplications}
            faceStatus={faceStatus}
            nextBooking={myBookings.filter((b) => b.status !== 'cancelled' && b.slotISO && new Date(b.slotISO).getTime() > Date.now()).sort((x, y) => x.slotISO!.localeCompare(y.slotISO!))[0] ?? null}
            openBookings={() => setRoute({ name: 'tabs', tab: 'bookings' })}
          />
        )}
        {route.name === 'tabs' && route.tab === 'bookings' && (
          <BookingsScreen
            bookings={myBookings}
            loading={bookingsLoading}
            error={bookingsError}
            retry={loadBookings}
            sessionOpts={sessionOpts}
            grants={myGrants}
            shareCase={(b) => setRoute({ name: 'consent', consultantId: b.consultantId, optionId: b.sessionType, shareFor: { applicationId: b.applicationId } })}
            revokeGrant={async (g) => {
              try { await revokeAccessGrant(g.grantId); await loadGrants(); } catch (e: any) { Alert.alert('Could not revoke', e?.message ?? 'Please try again.'); }
            }}
            findConsultant={() => { rescheduleOf.current = null; setRoute({ name: 'consultants' }); }}
            openConsultant={(id) => { rescheduleOf.current = null; setRoute({ name: 'consultant', id }); }}
            reschedule={(b) => { rescheduleOf.current = b.bookingId; setRoute({ name: 'calendarPicker', consultantId: b.consultantId, optionId: b.sessionType }); }}
            cancelBooking={async (b) => {
              try {
                await cancelMyBooking(b.bookingId);
                await loadBookings();
              } catch (e: any) {
                Alert.alert('Could not cancel', e?.message ?? 'Please check your connection and try again.');
              }
            }}
          />
        )}
        {route.name === 'tabs' && route.tab === 'apps' && (
          <ApplicationsScreen
            appList={appList}
            loadingApps={loadingApps}
            openApplication={openApplication}
            newApplication={() => setRoute({ name: 'newApp', step: 0 })}
            onDelete={handleDeleteApplication}
          />
        )}
        {route.name === 'tabs' && route.tab === 'docs' && (
          <DocumentsScreen
            openUpload={() => setRoute({ name: 'upload', state: 'select' })}
            openAudit={(docId) => setRoute({ name: 'auditReport', docId })}
            documents={documentList}
            loadError={loadDocumentsError}
            retryLoad={() => loadDocuments(appList[0]?.id)}
            onMount={() => loadDocuments(appList[0]?.id)}
          />
        )}
        {route.name === 'tabs' && route.tab === 'profile' && (
          <ProfileScreen
            authUser={authUser}
            openSettings={() => setRoute({ name: 'settings' })}
            openConsultants={() => setRoute({ name: 'consultants' })}
            openConsole={() => setRoute({ name: 'ctabs', tab: 'schedule' })}
            openHr={() => setRoute({ name: 'hrPortal' })}
            openEmployee={() => setRoute({ name: 'employeePortal' })}
            openAdmin={() => setRoute({ name: 'adminOverview' })}
            openCalculator={() => setRoute({ name: 'visaCalculator' })}
            openBankBalance={() => setRoute({ name: 'bankBalance' })}
            openEmbassy={() => setRoute({ name: 'embassyFinder' })}
            openFaceVerification={() => setRoute({ name: 'faceVerification' })}
            openHowTo={() => setRoute({ name: 'howTo' })}
            startTour={() => setTourVisible(true)}
            openTimeline={() => setRoute({ name: 'timelineTracker' })}
            openComparison={() => setRoute({ name: 'countryComparison' })}
            openVisaWaiver={() => setRoute({ name: 'visaWaiver' })}
            openRejectionAnalyzer={() => setRoute({ name: 'rejectionAnalyzer' })}
            openProfileHub={() => setRoute({ name: 'profileHub' })}
            openProTier={() => setRoute({ name: 'proTier' })}
            openPartners={() => setRoute({ name: 'ecosystemPartners', score: appList[0]?.readinessScore ?? 0 })}
            openMyMessages={() => setRoute({ name: 'myMessages' })}
            openAccessGrants={() => setRoute({ name: 'accessGrants' })}
            onSignOut={signOutNow}
          />
        )}
        {route.name === 'application' && (
          <ApplicationDetailScreen
            id={route.id}
            appList={appList}
            tab={route.tab}
            setTab={(tab) => openApplication(route.id, tab)}
            back={() => setRoute({ name: 'tabs', tab: 'apps' })}
            upload={() => setRoute({ name: 'upload', state: 'select' })}
            openAudit={(docId) => setRoute({ name: 'auditReport', docId })}
            openAnalysis={() => setRoute({ name: 'analysis' })}
            openBooking={() => openBooking()}
            documents={documentList}
            onDelete={() => handleDeleteApplication(route.id)}
          />
        )}
        {route.name === 'newApp' && (
          <NewApplicationScreen
            step={route.step}
            visaTypeId={newAppVisaType}
            setVisaTypeId={setNewAppVisaType}
            nationality={newAppNationality}
            setNationality={setNewAppNationality}
            residence={newAppResidence}
            setResidence={setNewAppResidence}
            destination={newAppDestination}
            setDestination={setNewAppDestination}
            travelFrom={newAppTravelFrom}
            setTravelFrom={setNewAppTravelFrom}
            creating={newAppCreating}
            createError={createAppError}
            setStickyFooter={setStickyFooter}
            back={() => { setCreateAppError(''); route.step === 0 ? setRoute({ name: 'tabs', tab: 'apps' }) : setRoute({ name: 'newApp', step: route.step - 1 }); }}
            next={() => {
              if (route.step < 3) {
                setCreateAppError('');
                setRoute({ name: 'newApp', step: route.step + 1 });
              } else {
                handleCreateApplication();
              }
            }}
          />
        )}
        {route.name === 'upload' && (
          <UploadScreen
            state={route.state}
            activeApplicationId={appList[0]?.id}
            openNewApplication={() => setRoute({ name: 'newApp', step: 0 })}
            back={() => setRoute({ name: 'tabs', tab: 'docs' })}
            onCamera={(docType) => setRoute({ name: 'camera', docType })}
            onReview={(docType, uri, mime) => setRoute({ name: 'camera', docType, uri, mime })}
            onPicked={(documentType, extractedText, imageBase64, mimeType) => { setPendingDocType(documentType); setPendingExtractedText(extractedText); setPendingImageBase64(imageBase64); setPendingMimeType(mimeType); }}
            next={(documentId) => {
              if (documentId) setPendingDocumentId(documentId);
              const nextState = route.state === 'select' ? 'uploading' : 'done';
              setRoute(nextState === 'done' ? { name: 'liveAnalysis', docTitle: 'Document' } : { name: 'upload', state: nextState });
            }}
          />
        )}
        {route.name === 'auditReport' && (
          <AuditReportScreen
            docId={route.docId}
            back={() => setRoute({ name: 'tabs', tab: 'docs' })}
            openRequirements={() => setRoute({ name: 'requirements' })}
            fetchedAudit={auditData[route.docId]}
            auditError={auditErrors[route.docId]}
            onMount={() => loadAuditResult(route.docId)}
            onRetry={() => loadAuditResult(route.docId)}
          />
        )}
        {route.name === 'analysis' && (
          <AnalysisScreen
            back={goHome}
            upload={() => setRoute({ name: 'upload', state: 'select' })}
            openConsultants={() => setRoute({ name: 'consultants' })}
            app={appList[0] ?? null}
          />
        )}
        {route.name === 'requirements' && <RequirementsScreen back={goHome} openConsultants={() => setRoute({ name: 'consultants' })} destinationCountry={appList[0]?.destinationCountry} />}
        {route.name === 'consultants' && (
          <ConsultantsScreen
            consultantList={consultantList}
            loadError={loadConsultantsError}
            retryLoad={loadConsultants}
            back={goHome}
            openProfile={(id) => setRoute({ name: 'consultant', id })}
          />
        )}
        {route.name === 'consultant' && (
          <ConsultantProfileScreen
            id={route.id}
            consultantList={consultantList}
            back={() => setRoute({ name: 'consultants' })}
            book={(id) => openBooking(id)}
          />
        )}
        {route.name === 'booking' && (
          <BookingScreen
            consultantId={route.consultantId}
            consultantList={consultantList}
            sessionOpts={sessionOpts}
            loadError={loadSessionOptsError}
            retryLoad={loadSessionOpts}
            onMount={loadSessionOpts}
            selected={route.optionId}
            back={() => setRoute({ name: 'consultant', id: route.consultantId })}
            select={(optionId) => openBooking(route.consultantId, optionId)}
            pickSlot={(optionId) => setRoute({ name: 'calendarPicker', consultantId: route.consultantId, optionId })}
            continueToConsent={(optionId) => setRoute({ name: 'consent', consultantId: route.consultantId, optionId })}
          />
        )}
        {route.name === 'calendarPicker' && (
          <CalendarPickerScreen
            consultantId={route.consultantId}
            consultantName={consultantList.find((c) => c.id === route.consultantId)?.name ?? 'your consultant'}
            rescheduling={!!rescheduleOf.current}
            back={() => setRoute({ name: 'booking', consultantId: route.consultantId, optionId: route.optionId })}
            confirm={(slotISO) => setRoute({ name: 'consent', consultantId: route.consultantId, optionId: route.optionId, slotISO })}
          />
        )}
        {route.name === 'consent' && (
          <ConsentScreen
            consultantName={consultantList.find((c) => c.id === route.consultantId)?.name ?? 'your consultant'}
            mode={route.shareFor ? 'share' : 'book'}
            back={() => (route.shareFor ? setRoute({ name: 'tabs', tab: 'bookings' }) : openBooking(route.consultantId, route.optionId))}
            confirm={(categories) => (route.shareFor
              ? handleShareCase(route.shareFor.applicationId, route.consultantId, categories)
              : handleConfirmBooking(route.consultantId, route.optionId, route.slotISO, categories))}
          />
        )}
        {route.name === 'confirmation' && (
          <ConfirmationScreen
            consultantId={route.consultantId}
            consultantList={consultantList}
            booking={lastBooking}
            done={goHome}
            score={appList[0]?.readinessScore ?? 0}
            openPartners={() => setRoute({ name: 'ecosystemPartners', score: appList[0]?.readinessScore ?? 0 })}
            openBookings={() => setRoute({ name: 'tabs', tab: 'bookings' })}
          />
        )}
        {route.name === 'ecosystemPartners' && <EcosystemPartnersScreen back={goHome} score={route.score} />}
        {route.name === 'notifications' && (
          <NotificationsScreen
            back={goHome}
            notifications={notificationList}
            loadError={loadNotificationsError}
            retryLoad={loadNotifications}
            onMarkRead={(id) => {
              setNotificationList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
              markNotificationRead(id).catch(() => { /* best-effort */ });
            }}
          />
        )}
        {route.name === 'search' && <SearchScreen back={goHome} openApplication={openApplication} openConsultant={(id) => setRoute({ name: 'consultant', id })} appList={appList} consultantList={consultantList} />}
        {route.name === 'settings' && (
          <SettingsScreen
            back={() => setRoute({ name: 'tabs', tab: 'profile' })}
            authUser={authUser}
            openProfileHub={() => setRoute({ name: 'profileHub' })}
            onSignOut={signOutNow}
          />
        )}
        {route.name === 'consultantConsole' && <ConsultantConsoleScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'hrPortal' && <HrPortalScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'employeePortal' && <EmployeePortalScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} authUser={authUser} />}
        {route.name === 'adminOverview' && <AdminOverviewScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'myMessages' && <MyConversationsScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'accessGrants' && <AccessGrantsScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'visaCalculator' && <VisaCalculatorScreen back={goHome} />}
        {route.name === 'bankBalance' && <BankBalanceScreen back={goHome} />}
        {route.name === 'embassyFinder' && <EmbassyFinderScreen back={goHome} residenceCountry={newAppResidence} />}
        {route.name === 'faceVerification' && <FaceVerifyScreen back={route.firstRun ? finishFirstFaceCheck : goHome} uid={authUser?.uid ?? ''} status={faceStatus} reload={loadFaceStatus} openScanner={() => setRoute({ name: 'upload', state: 'select' })} firstRun={!!route.firstRun} onLater={() => { if (authUser?.uid) void markFaceGateSkipped(authUser.uid); finishFirstFaceCheck(); }} />}
        {route.name === 'timelineTracker' && (
          <TimelineTrackerScreen
            back={goHome}
            openUpload={() => setRoute({ name: 'upload', state: 'select' })}
            app={appList[0] ?? null}
            documents={documentList}
            hasAuditResult={Object.keys(auditData).length > 0}
            hasBooking={!!lastBooking}
          />
        )}
        {route.name === 'countryComparison' && <CountryComparisonScreen back={goHome} />}
        {route.name === 'profileHub' && <ProfileHubScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} authUser={authUser} applicationId={appList[0]?.id} />}
        {route.name === 'visaWaiver' && <VisaWaiverScreen back={goHome} />}
        {route.name === 'rejectionAnalyzer' && <RejectionAnalyzerScreen back={goHome} openChat={goChat} />}
        {route.name === 'proTier' && <ProTierScreen back={goHome} appList={appList} />}
        {route.name === 'register' && (
          <RegisterScreen
            back={() => setRoute({ name: 'welcome' })}
            onSuccess={(session) => {
              void startSession(session);
              setAuthUser(session.user);
              void Promise.all([loadApplications(), loadConsultants(), loadSessionOpts(), loadNotifications()]);
              void sendVerificationEmail(session.user.email);
              setRoute({ name: 'verify', email: session.user.email });
            }}
            setStickyFooter={setStickyFooter}
          />
        )}
        {route.name === 'howTo' && <HowToUseScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} startTour={() => setTourVisible(true)} />}
        {route.name === 'verify' && <VerifyEmailScreen email={route.email} onDone={() => { void (async () => {
          const uid = authUser?.uid;
          try {
            const fs = await fetchFaceStatus();
            setFaceStatus(fs);
            if (!fs.enrolled && uid && faceSdkAvailable() && !(await faceGateSkipped(uid))) {
              postAuthRoute.current = { name: 'onboarding', step: 0 };
              setRoute({ name: 'faceVerification', firstRun: true });
              return;
            }
          } catch { /* Home offers the check later */ }
          setRoute({ name: 'onboarding', step: 0 });
          if (uid) void offerBiometricLock(uid);
        })(); }} />}
      </ScrollView>
      )}
      {canScrollDown && !isChatRoute && !['camera','liveAnalysis'].includes(route.name) && (
        <Pressable
          accessibilityLabel="Scroll down"
          onPress={() => mainScrollRef.current?.scrollTo({ y: mainScroll.current.y + mainScroll.current.viewH * 0.8, animated: true })}
          style={{ position: 'absolute', right: 14, bottom: keyboardHeight + (bottomNavVisible ? bottomNavH : 0) + (stickyFooter ? STICKY_FOOTER_H : 0) + 12, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.royal600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 }}
        >
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </Pressable>
      )}
      {(stickyFooter || bottomNavVisible) && (
        // Stacked in normal flow inside one bottom-anchored container instead
        // of two independently absolute-positioned bars — plain stacking
        // can't drift out of sync. BottomNav pads its own bottom edge by the
        // real safe-area inset (not a Dimensions(screen)-Dimensions(window)
        // guess), so it clears the OS nav bar/gesture pill on every device.
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: keyboardHeight }}>
          {stickyFooter && <View style={[styles.stickyFooterBar, !bottomNavVisible && !keyboardVisible && { paddingBottom: 14 + insets.bottom }]}>{stickyFooter}</View>}
          {bottomNavVisible && (
            <BottomNav
              activeTab={activeTab}
              items={inConsultantWorkspace ? CONSULTANT_TABS : undefined}
              setTab={(tab) => setRoute(inConsultantWorkspace ? { name: 'ctabs', tab } : { name: 'tabs', tab })}
              unreadCount={notificationList.filter(n => !n.read && n.type === 'booking').length}
              style={{ position: 'relative' }}
            />
          )}
        </View>
      )}
      </View>
      <AppTour
        visible={tourVisible}
        onClose={closeTour}
        onGo={(target: TourTarget) => {
          closeTour();
          if (target === 'newApp') setRoute({ name: 'newApp', step: 0 });
          else if (target === 'requirements') setRoute({ name: 'requirements' });
          else if (target === 'upload') setRoute({ name: 'upload', state: 'select' });
          else if (target === 'chat') setRoute({ name: 'tabs', tab: 'chat' });
          else if (target === 'consultants') setRoute({ name: 'consultants' });
          else setRoute({ name: 'howTo' });
        }}
      />
    </SafeAreaView>
  );
}

/** Full-screen gate shown while a saved session waits for the phone's fingerprint / face check. */
function LockScreen({ userName, label, onUnlock, onPassword }: { userName?: string; label: string; onUnlock: () => Promise<boolean>; onPassword: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try { if (!(await onUnlock())) setFailed(true); } finally { setBusy(false); }
  }, [busy, onUnlock]);
  // Prompt straight away so a returning user just touches the sensor.
  useEffect(() => { void run(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14, zIndex: 100 }} accessibilityLabel="App locked">
      <Image source={require('./assets/logo-icon.png')} style={{ width: 72, height: 72, borderRadius: 16 }} resizeMode="contain" />
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Welcome back'}</Text>
      <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center' }}>Use {label.toLowerCase()} to open Visa With Ease.</Text>
      <Pressable onPress={run} disabled={busy} accessibilityLabel="Unlock" style={{ marginTop: 10, width: 84, height: 84, borderRadius: 42, backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center' }}>
        {busy ? <ActivityIndicator color={colors.royal600} /> : <Ionicons name="finger-print" size={44} color={colors.royal600} />}
      </Pressable>
      {failed && <Text style={{ color: '#B91C1C', fontSize: 13, fontWeight: '700' }}>Couldn’t unlock. Tap the icon to try again.</Text>}
      <Pressable onPress={onPassword} accessibilityLabel="Use my password instead" hitSlop={10} style={{ marginTop: 16 }}>
        <Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 14 }}>Use my password instead</Text>
      </Pressable>
    </View>
  );
}

/** Last line of defence: an unexpected render error shows a recoverable screen instead of closing the app. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn('UI error caught by boundary', error); }
  render() {
    if (!this.state.failed) return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff', gap: 12 }}>
        <Ionicons name="alert-circle-outline" size={44} color="#DC2626" />
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', textAlign: 'center' }}>Something went wrong</Text>
        <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center' }}>Your data is safe. Tap below to reload the app.</Text>
        <Pressable onPress={() => this.setState(s => ({ failed: false, attempt: s.attempt + 1 }))} accessibilityLabel="Reload the app" style={{ backgroundColor: '#1A56DB', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Reload</Text>
        </Pressable>
      </View>
    );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function Header({ onSearch, onNotifications, userName, unreadCount }: { onSearch: () => void; onNotifications: () => void; userName?: string; unreadCount?: number }) {
  const count = unreadCount ?? 0;
  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  return (
    <View style={styles.header}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <Image source={require('./assets/logo-icon.png')} style={{ width: 40, height: 40, borderRadius: 8 }} resizeMode="contain" />
      <View style={styles.headerActions}>
        <IconButton icon="search-outline" onPress={onSearch} />
        <Pressable style={styles.iconButton} onPress={onNotifications}>
          <Ionicons name="notifications-outline" size={20} color={colors.slate700} />
          {count > 0 && (
            <View style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{count}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function daysUntil(dateISO: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function tripCountdown(dateISO: string) {
  const days = daysUntil(dateISO);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  return `${days} DAYS`;
}

function WelcomeScreen({
  accepted, email, password, setEmail, setPassword, toggleAccepted, start, onForgot, onRegister, onGoogleLogin, loginError, loginLoading, setStickyFooter,
}: {
  accepted: boolean; email: string; password: string;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  toggleAccepted: () => void; start: () => void; onForgot: () => void; onRegister: () => void;
  onGoogleLogin: () => void;
  loginError?: string; loginLoading?: boolean;
  setStickyFooter: (node: React.ReactNode) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const canStart = accepted && email.includes('@') && password.length >= 6;

  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  useEffect(() => {
    if (!showForm) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible()) { Keyboard.dismiss(); return true; }
      setShowForm(false);
      return true;
    });
    return () => sub.remove();
  }, [showForm]);

  if (!showForm) {
    // ── Start screen: plain white, brand only — no illustrations ─────────
    return (
      <View style={{ minHeight: winH - insets.top, margin: -18, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 + insets.bottom, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 24 }}>
          <Image source={require('./assets/logo-icon.png')} style={{ width: 112, height: 112 }} resizeMode="contain" />
          <Text style={{ color: colors.navy900, fontSize: 30, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' }}>
            VISA WITH <Text style={{ color: colors.teal500 }}>EASE</Text>
          </Text>
          <Text style={{ color: colors.slate600, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 300 }}>
            Know exactly what your visa needs — before you apply.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
            {[['shield-checkmark-outline','GDPR'],['sparkles','AI-powered'],['headset-outline','Expert support']].map(([icon, label]) => (
              <View key={label} style={{ alignItems: 'center', gap: 6 }}>
                <Ionicons name={icon as IoniconName} size={22} color={colors.teal500} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.slate500 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View>
          <Pressable style={[styles.secondaryButton, { flexDirection: 'row', gap: 10, marginBottom: 12 }]}
            onPress={onGoogleLogin} disabled={loginLoading}>
            <Ionicons name="logo-google" size={18} color={colors.slate700} />
            <Text style={[styles.secondaryButtonText, { fontWeight: '700' }]}>Continue with Google</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, { marginTop: 0, flexDirection: 'row', gap: 8 }]} onPress={onRegister}>
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Sign up with email</Text>
          </Pressable>
          <Pressable style={{ alignItems: 'center', paddingVertical: 14 }} onPress={() => setShowForm(true)}>
            <Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 14 }}>I already have an account</Text>
          </Pressable>
          <Text style={{ color: colors.slate600, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>
            By continuing you agree to our{' '}
            <Text style={{ color: colors.royal600, fontWeight: '700' }} onPress={() => Linking.openURL('https://www.visawithease.com/terms')}>Terms</Text>
            {' & '}
            <Text style={{ color: colors.royal600, fontWeight: '700' }} onPress={() => Linking.openURL('https://www.visawithease.com/privacy')}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    );
  }

  // ── Sign-in form view ─────────────────────────────────────────────────
  // The Sign in button sits directly under the form (right above "Create a
  // new account"), not pinned to the screen bottom — pinned bars collide with
  // gesture bars, 3-button nav and the keyboard differently on every Android
  // maker's skin, whereas in-flow content just follows the form.
  return (
    <View style={{ gap: 12, paddingTop: 4, paddingBottom: 12 }}>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 }} onPress={() => setShowForm(false)}>
        <Ionicons name="chevron-back" size={18} color={colors.royal600} />
        <Text style={{ color: colors.royal600, fontWeight: '700' }}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { marginBottom: 4 }]}>Sign in</Text>
      <View style={styles.stepCard}>
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Email address</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={styles.searchInput} />
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          style={styles.searchInput}
          returnKeyType="done"
          onSubmitEditing={() => { if (canStart && !loginLoading) start(); }}
        />
        <Pressable onPress={onForgot} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
          <Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 13 }}>Forgot password?</Text>
        </Pressable>
        <Pressable style={styles.checkboxRow} onPress={toggleAccepted}>
          <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
            {accepted && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>I accept Terms, Privacy and AI disclaimer.</Text>
        </Pressable>
      </View>
      {loginError ? (
        <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{loginError}</Text>
        </View>
      ) : null}
      <Pressable testID="signin-submit-button" style={[styles.primaryButton, { marginTop: 0 }, (!canStart || loginLoading) && styles.disabledButton]} onPress={canStart && !loginLoading ? start : undefined}>
        {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, !canStart && styles.disabledButtonText]}>Sign in</Text>}
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onRegister}>
        <Text style={styles.secondaryButtonText}>Create a new account</Text>
      </Pressable>
    </View>
  );
}

function ForgotPasswordScreen({ back }: { back: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <View style={styles.welcome}>
      <LinearGradient colors={['#0B1F4B', '#1A56DB']} style={styles.brandMark}>
        <Ionicons name="mail-outline" size={32} color="#fff" />
      </LinearGradient>
      <Text style={styles.welcomeTitle}>Reset password</Text>
      <Text style={styles.welcomeCopy}>Enter your account email and we'll send a secure reset link.</Text>
      {sent ? (
        <View style={[styles.stepCard, { alignItems: 'center', gap: 12 }]}>
          <Ionicons name="checkmark-circle" size={48} color={colors.green500} />
          <Text style={styles.rowTitle}>Reset link sent</Text>
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Check your inbox. The link expires in 15 minutes.</Text>
        </View>
      ) : (
        <View style={styles.stepCard}>
          <Text style={styles.rowTitle}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={styles.searchInput} />
          <Pressable style={[styles.primaryButton, { marginTop: 8 }]} onPress={async () => {
            if (!email.includes('@')) return;
            try {
              await forgotPassword(email);
              setSent(true);
            } catch {
              Alert.alert('Error', 'Unable to send reset email. Please try again.');
            }
          }}>
            <Text style={styles.primaryButtonText}>Send reset link</Text>
          </Pressable>
        </View>
      )}
      <Pressable style={styles.secondaryButton} onPress={back}>
        <Text style={styles.secondaryButtonText}>Back to sign in</Text>
      </Pressable>
    </View>
  );
}


// Banner slides on Home. Each promotes something the app really does and jumps to it.
type DashboardBanner = { id: string; eyebrow: string; title: string; body: string; cta: string; colors: [string, string]; icon: IoniconName };

/** The "what should I do next" list — every item is derived from the user's real data, never canned. */
type NextStep = { id: string; icon: IoniconName; tone: 'urgent' | 'todo' | 'good'; title: string; body: string; cta: string; go: () => void };

function ProChip() {
  return (
    <View style={{ backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ color: '#B45309', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 }}>PRO</Text>
    </View>
  );
}

function Card({ children, style, onPress, label }: { children: React.ReactNode; style?: object; onPress?: () => void; label?: string }) {
  const base = { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate100 };
  return onPress
    ? <Pressable onPress={onPress} accessibilityLabel={label} style={[base, style]}>{children}</Pressable>
    : <View style={[base, style]}>{children}</View>;
}
function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={{ color: colors.slate900, fontWeight: '900', fontSize: 16 }}>{title}</Text>
      {action && <Pressable onPress={onAction} hitSlop={8}><Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 13 }}>{action}</Text></Pressable>}
    </View>
  );
}

function DashboardScreen({ appList, loadingApps, loadAppsError, userName, roles, documents, navigate, openApplication, openUpload, openAnalysis, openRequirements, openChat, openConsultants, openCalculator, openFaceVerification, newApplication, retryLoad, nextBooking, openBookings, faceStatus }: {
  faceStatus: ApiFaceStatus | null;
  nextBooking: ApiMyBooking | null;
  openBookings: () => void;
  roles: string[];
  documents: ApiDocument[];
  navigate: (route: Route) => void;
  appList: ReturnType<typeof normalizeApp>[];
  loadingApps: boolean;
  loadAppsError?: string;
  userName?: string;
  openApplication: (id: string) => void;
  openUpload: () => void;
  openAnalysis: () => void;
  openRequirements: () => void;
  openChat: () => void;
  openConsultants: () => void;
  openCalculator: () => void;
  openFaceVerification: () => void;
  newApplication: () => void;
  retryLoad: () => void;
}) {
  const { width: winW } = useWindowDimensions();
  const app = appList[0] ?? null;
  const countdown = app ? tripCountdown(app.intendedFrom) : '';
  const firstName = userName ? userName.split(' ')[0] : null;
  const [showMore, setShowMore] = useState(false);
  const isCompany = roles.includes('hr_admin') || roles.includes('platform_admin');
  const isConsultant = roles.includes('consultant') || roles.includes('platform_admin');

  // Opening a tool goes through the plan check: with PLAN_ENFORCED off (testing) it always opens;
  // once plans are enforced, a pro-only tool sends free users to the upgrade screen instead.
  const open = (feature: FeatureId, action: () => void) => () => {
    if (canUse(feature)) action();
    else navigate({ name: 'proTier' });
  };

  // ── Banner carousel: one slide per real feature, paged, auto-advancing, with dots.
  const bannerW = winW - 36;
  const banners: DashboardBanner[] = [
    { id: 'scan', eyebrow: 'New', title: 'Scan documents in seconds', body: 'The camera reads each page, checks it and captures automatically.', cta: 'Start scanning', colors: ['#0B1F4B', '#1A56DB'], icon: 'scan-outline' },
    { id: 'reqs', eyebrow: 'Know before you apply', title: 'What does your visa need?', body: 'Every requirement comes with why it matters and its official source.', cta: 'See requirements', colors: ['#0F766E', '#0EA5E9'], icon: 'list-outline' },
    { id: 'expert', eyebrow: 'Verified experts', title: 'Get an expert to review your case', body: 'Choose which documents they can see. Revoke access any time.', cta: 'Find a consultant', colors: ['#4C1D95', '#7C3AED'], icon: 'people-outline' },
  ];
  const bannerActions: Record<string, () => void> = { scan: openUpload, reqs: openRequirements, expert: openConsultants };
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const userDragging = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => {
      if (userDragging.current) return;
      setBannerIndex((i) => {
        const next = (i + 1) % banners.length;
        bannerRef.current?.scrollTo({ x: next * (bannerW + 12), animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [bannerW, banners.length]);

  // ── Next steps, from real state.
  const uploaded = documents.filter((d) => d.status !== 'Missing');
  const missing = documents.filter((d) => d.status === 'Missing');
  const failing = uploaded.filter((d) => (d.score ?? 0) < 50);
  const passportDone = uploaded.some((d) => d.type?.toLowerCase() === 'passport' && (d.score ?? 0) >= 50);
  const daysLeft = app ? daysUntil(app.intendedFrom) : null;
  const steps: NextStep[] = [];
  if (app && faceStatus && !faceStatus.enrolled) steps.push({ id: 'face', icon: 'shield-checkmark-outline', tone: faceStatus.requiredForAnalysis ? 'urgent' : 'todo', title: 'Verify it’s you', body: 'A quick live check matched to your passport photo gives you the “Face verified” badge and locks this account to you.', cta: 'Verify now', go: openFaceVerification });
  if (app && faceStatus?.enrolled && !faceStatus.sessionFresh && faceStatus.requiredForAnalysis) steps.push({ id: 'face-recheck', icon: 'shield-outline', tone: 'urgent', title: 'Confirm it’s still you', body: 'A quick face check is needed before you can analyse documents.', cta: 'Check now', go: openFaceVerification });
  if (app) {
    if (!passportDone) steps.push({ id: 'passport', icon: 'id-card-outline', tone: 'urgent', title: failing.some((d) => d.type?.toLowerCase() === 'passport') ? 'Re-scan your passport' : 'Start with your passport', body: 'Every other check is compared against it. The scanner reads it in seconds.', cta: 'Scan passport', go: openUpload });
    if (failing.length > 0 && passportDone) steps.push({ id: 'fix', icon: 'alert-circle-outline', tone: 'urgent', title: `Fix ${failing.length} document${failing.length === 1 ? '' : 's'}`, body: `${failing.map((d) => d.title).slice(0, 2).join(' and ')} didn’t pass its check — open the report to see why.`, cta: 'Open documents', go: () => navigate({ name: 'tabs', tab: 'docs' }) });
    if (missing.length > 0 && passportDone) steps.push({ id: 'missing', icon: 'cloud-upload-outline', tone: 'todo', title: `Upload ${missing.length} more document${missing.length === 1 ? '' : 's'}`, body: `${missing.map((d) => d.title).slice(0, 2).join(', ')}${missing.length > 2 ? ` and ${missing.length - 2} more` : ''} still needed for ${app.destinationCountry}.`, cta: 'Upload', go: openUpload });
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 45 && app.readinessScore < 80) steps.push({ id: 'time', icon: 'time-outline', tone: 'urgent', title: `Travel in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`, body: 'Visa processing takes time — an expert can help you finish faster.', cta: 'Book an expert', go: openConsultants });
    if (!nextBooking && app.readinessScore < 80 && uploaded.length > 0) steps.push({ id: 'expert', icon: 'ribbon-outline', tone: 'todo', title: 'Get an expert review', body: 'A verified consultant checks your documents and your case before you submit.', cta: 'Find a consultant', go: openConsultants });
    if (steps.length === 0) steps.push({ id: 'good', icon: 'checkmark-circle-outline', tone: 'good', title: 'You’re in good shape', body: 'Nothing urgent. Review your requirements one last time before you submit.', cta: 'See requirements', go: openRequirements });
  }
  const stepTone = { urgent: { bg: '#FEF2F2', fg: '#B91C1C' }, todo: { bg: colors.royal50, fg: colors.royal600 }, good: { bg: '#ECFDF5', fg: '#047857' } };

  // ── Tools: one list, each with a plan tier (see src/plan.ts).
  const tools: Array<{ feature: FeatureId; icon: IoniconName; label: string; bg: string; color: string; onPress: () => void }> = [
    { feature: 'upload', icon: 'cloud-upload-outline', label: 'Upload', bg: '#EFF6FF', color: colors.royal600, onPress: openUpload },
    { feature: 'analyze', icon: 'analytics-outline', label: 'Analyze', bg: '#EDE9FE', color: colors.purple600, onPress: openAnalysis },
    { feature: 'askAi', icon: 'chatbubble-ellipses-outline', label: 'Ask AI', bg: '#E0F2FE', color: colors.teal500, onPress: openChat },
    { feature: 'newApplication', icon: 'add-circle-outline', label: 'New application', bg: '#D1FAE5', color: colors.green500, onPress: newApplication },
    { feature: 'scoreCalculator', icon: 'calculator-outline', label: 'Score calculator', bg: '#EDE9FE', color: colors.purple600, onPress: openCalculator },
    { feature: 'timeline', icon: 'time-outline', label: 'Timeline', bg: '#F3E8FF', color: colors.purple600, onPress: () => navigate({ name: 'timelineTracker' }) },
    { feature: 'embassyFinder', icon: 'business-outline', label: 'Embassy finder', bg: '#E0E7FF', color: colors.navy900, onPress: () => navigate({ name: 'embassyFinder' }) },
    { feature: 'waiverChecker', icon: 'checkmark-done-outline', label: 'Visa-free check', bg: '#CCFBF1', color: colors.teal500, onPress: () => navigate({ name: 'visaWaiver' }) },
    { feature: 'compareCountries', icon: 'git-compare-outline', label: 'Compare countries', bg: '#FEF3C7', color: colors.gold500, onPress: () => navigate({ name: 'countryComparison' }) },
    { feature: 'bankEstimator', icon: 'wallet-outline', label: 'Bank balance', bg: '#D1FAE5', color: colors.green500, onPress: () => navigate({ name: 'bankBalance' }) },
    { feature: 'rejectionAnalyzer', icon: 'document-text-outline', label: 'Rejection analyzer', bg: '#FEE2E2', color: '#DC2626', onPress: () => navigate({ name: 'rejectionAnalyzer' }) },
    { feature: 'faceVerify', icon: 'scan-outline', label: 'Face verify', bg: '#CCFBF1', color: colors.teal500, onPress: openFaceVerification },
  ];
  const visibleTools = showMore ? tools : tools.slice(0, 6);
  const cardW = (winW - 36 - 10) / 2;

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={[styles.eyebrow, { marginBottom: 2 }]}>{firstName ? `Hi, ${firstName}` : 'Welcome'}</Text>
        <Text style={[styles.title, { marginBottom: 0, fontSize: 26 }]}>{app ? 'Your visa journey' : 'Get started'}</Text>
        {faceStatus?.enrolled && (
          <Pressable onPress={openFaceVerification} accessibilityLabel="Face verified" style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginTop: 8 }}>
            <Ionicons name="shield-checkmark" size={14} color="#15803D" />
            <Text style={{ color: '#15803D', fontSize: 12, fontWeight: '800' }}>Face verified{faceStatus.passportSimilarity !== null ? ` · ${Math.round(faceStatus.passportSimilarity * 100)}% match` : ''}</Text>
          </Pressable>
        )}
      </View>

      {/* Banner carousel */}
      <View>
        <ScrollView
          ref={bannerRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={bannerW + 12}
          decelerationRate="fast"
          contentContainerStyle={{ gap: 12 }}
          onScrollBeginDrag={() => { userDragging.current = true; }}
          onMomentumScrollEnd={(e) => {
            userDragging.current = false;
            setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (bannerW + 12)));
          }}
        >
          {banners.map((b) => (
            <LinearGradient key={b.id} colors={b.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: bannerW, borderRadius: 20, padding: 18, minHeight: 150, justifyContent: 'space-between', overflow: 'hidden' }}>
              <Ionicons name={b.icon} size={84} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', right: -6, top: 8 }} />
              <View style={{ gap: 4, paddingRight: 70 }}>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>{b.eyebrow}</Text>
                <Text style={{ color: '#fff', fontSize: 19, fontWeight: '900', lineHeight: 24 }}>{b.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 18 }}>{b.body}</Text>
              </View>
              <Pressable onPress={bannerActions[b.id]} accessibilityLabel={b.cta} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 14, marginTop: 10 }}>
                <Text style={{ color: colors.navy900, fontWeight: '800', fontSize: 13 }}>{b.cta}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.navy900} />
              </Pressable>
            </LinearGradient>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {banners.map((b, i) => <View key={b.id} style={{ width: i === bannerIndex ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === bannerIndex ? colors.royal600 : colors.slate200 }} />)}
        </View>
      </View>

      {loadingApps && (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <ActivityIndicator size="large" color={colors.royal600} />
          <Text style={[styles.rowMeta, { marginTop: 12 }]}>Loading your applications…</Text>
        </View>
      )}

      {!loadingApps && loadAppsError ? (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 16, alignItems: 'center', gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={{ color: '#991B1B', fontWeight: '700', textAlign: 'center' }}>{loadAppsError}</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retryLoad}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loadingApps && !app && (
        <Card style={{ padding: 22, alignItems: 'center', gap: 10 }}>
          <Ionicons name="document-text-outline" size={38} color={colors.royal600} />
          <Text style={[styles.rowTitle, { textAlign: 'center' }]}>No applications yet</Text>
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Create your first visa application to get a readiness score and a personal document checklist.</Text>
          <Pressable style={[styles.primaryButton, { alignSelf: 'stretch' }]} onPress={newApplication}>
            <Text style={styles.primaryButtonText}>+ Create application</Text>
          </Pressable>
        </Card>
      )}

      {/* Score + status: two compact portrait tiles */}
      {!loadingApps && app && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card onPress={() => openApplication(app.id)} label="Application readiness score" style={{ flex: 1, padding: 14, alignItems: 'center', gap: 6, minHeight: 176, justifyContent: 'center' }}>
              <ScoreRing value={app.readinessScore} size={84} />
              <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>Readiness</Text>
              <Text style={{ color: colors.slate500, fontSize: 12 }} numberOfLines={1}>{app.destinationFlag} {app.destinationCountry}</Text>
            </Card>
            <Card onPress={() => openApplication(app.id)} label="Application status" style={{ flex: 1, padding: 14, gap: 8, minHeight: 176, justifyContent: 'space-between' }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>Status</Text>
                <View style={[styles.statusPill, { backgroundColor: `${app.statusColor}18`, alignSelf: 'flex-start' }]}>
                  <View style={[styles.statusDot, { backgroundColor: app.statusColor }]} />
                  <Text style={[styles.statusText, { color: app.statusColor }]}>{app.status}</Text>
                </View>
                <Text style={{ color: colors.slate600, fontSize: 12 }} numberOfLines={1}>{app.visaType}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>{app.documentsUploaded}/{app.documentsRequired} documents</Text>
                <Text style={{ color: app.issuesCount > 0 ? '#B45309' : colors.slate500, fontSize: 12 }}>{app.issuesCount} issue{app.issuesCount === 1 ? '' : 's'} · {countdown.toLowerCase()}</Text>
              </View>
            </Card>
          </View>
          {/* Document progress */}
          <Card onPress={() => navigate({ name: 'tabs', tab: 'docs' })} label="Document progress" style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>Document progress</Text>
              <Text style={{ color: colors.slate500, fontSize: 12.5, fontWeight: '700' }}>{uploaded.length} of {documents.length || app.documentsRequired} uploaded</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.slate100, overflow: 'hidden' }}>
              <View style={{ height: 8, borderRadius: 4, width: `${Math.min(100, Math.round((uploaded.length / Math.max(1, documents.length || app.documentsRequired)) * 100))}%`, backgroundColor: colors.royal600 }} />
            </View>
          </Card>
        </View>
      )}

      {/* What to do next — derived from real state */}
      {!loadingApps && app && steps.length > 0 && (
        <View>
          <SectionHead title="What to do next" />
          <View style={{ gap: 10 }}>
            {steps.slice(0, 3).map((st) => (
              <Card key={st.id} style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: stepTone[st.tone].bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={st.icon} size={22} color={stepTone[st.tone].fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>{st.title}</Text>
                  <Text style={{ color: colors.slate500, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{st.body}</Text>
                </View>
                <Pressable onPress={st.go} accessibilityLabel={st.cta} style={{ backgroundColor: stepTone[st.tone].bg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11 }}>
                  <Text style={{ color: stepTone[st.tone].fg, fontWeight: '800', fontSize: 12.5 }}>{st.cta}</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* Next appointment — only when a real, future, non-cancelled booking exists */}
      {nextBooking && (() => {
        const slot = formatSlot(nextBooking.slotISO);
        return (
          <Pressable onPress={openBookings} accessibilityLabel="Next appointment" style={{ backgroundColor: colors.navy900, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>Next appointment · {relativeSlot(nextBooking.slotISO)}</Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginTop: 2 }} numberOfLines={1}>{nextBooking.consultantName}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12.5 }}>{slot ? `${slot.day} · ${slot.time}` : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </Pressable>
        );
      })()}

      {/* Book a consultant */}
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="ribbon-outline" size={24} color={colors.gold500} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.slate900, fontWeight: '900', fontSize: 15 }}>Book a consultant</Text>
          <Text style={{ color: colors.slate500, fontSize: 12, lineHeight: 17, marginTop: 2 }}>A verified expert reviews your case and your documents.</Text>
        </View>
        <Pressable onPress={openConsultants} accessibilityLabel="Book a consultant" style={{ backgroundColor: colors.royal600, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Book</Text>
        </Pressable>
      </Card>

      {/* Workspace: company and consultant tools, shown only to the roles that can use them */}
      {(isCompany || isConsultant) && (
        <View>
          <SectionHead title="Your workspace" />
          <View style={{ gap: 10 }}>
            {isCompany && (
              <Card onPress={open('teamWorkspace', () => navigate({ name: 'hrPortal' }))} label="Company team workspace" style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="people-circle-outline" size={24} color={colors.navy900} /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>Team & cases</Text>{tierOf('teamWorkspace') === 'pro' && <ProChip />}</View>
                  <Text style={{ color: colors.slate500, fontSize: 12, marginTop: 1 }}>Employee applications, bulk uploads and team reports.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
              </Card>
            )}
            {isConsultant && (
              <Card onPress={() => navigate({ name: 'consultantConsole' })} label="Consultant console" style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="briefcase-outline" size={22} color={colors.gold500} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>Client queue</Text>
                  <Text style={{ color: colors.slate500, fontSize: 12, marginTop: 1 }}>Cases shared with you, by urgency.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
              </Card>
            )}
          </View>
        </View>
      )}

      {/* Tools — everything, with the intended plan tier marked */}
      <View>
        <SectionHead title="Tools" action={showMore ? 'Less' : `All ${tools.length}`} onAction={() => setShowMore((v) => !v)} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {visibleTools.map((q) => (
            <Pressable key={q.label} onPress={open(q.feature, q.onPress)} style={{ width: cardW, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.slate100, padding: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: q.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={q.icon} size={18} color={q.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.slate800, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{q.label}</Text>
                {tierOf(q.feature) === 'pro' && <View style={{ alignSelf: 'flex-start' }}><ProChip /></View>}
              </View>
            </Pressable>
          ))}
        </View>
        {!PLAN_ENFORCED && <Text style={{ color: colors.slate500, fontSize: 11.5, marginTop: 10 }}>Test mode: every tool is unlocked. “PRO” marks what will become a paid feature.</Text>}
      </View>

      {!loadingApps && appList.length > 1 && (
        <View>
          <SectionHead title="Other applications" action="See all" onAction={() => navigate({ name: 'tabs', tab: 'apps' })} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {appList.slice(1).map((a) => (
              <Pressable key={a.id} onPress={() => openApplication(a.id)} style={{ width: 130, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate100, padding: 12, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 22 }}>{a.destinationFlag}</Text>
                <ScoreRing value={a.readinessScore} />
                <Text style={[styles.rowMeta, { fontSize: 12, textAlign: 'center' }]} numberOfLines={1}>{a.destinationCountry}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${a.statusColor}18` }]}>
                  <View style={[styles.statusDot, { backgroundColor: a.statusColor }]} />
                  <Text style={[styles.statusText, { color: a.statusColor, fontSize: 9 }]}>{a.status}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function ApplicationsScreen({ appList, loadingApps, openApplication, newApplication, onDelete }: {
  onDelete: (id: string) => Promise<void>;
  appList: ReturnType<typeof normalizeApp>[];
  loadingApps: boolean;
  openApplication: (id: string) => void;
  newApplication: () => void;
}) {
  return (
    <View>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Applications</Text>
          <Text style={styles.title}>Every journey</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={newApplication}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.smallButtonText}>New</Text>
        </Pressable>
      </View>
      {loadingApps && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={colors.royal600} />
        </View>
      )}
      {!loadingApps && appList.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
          <Ionicons name="document-text-outline" size={48} color={colors.slate300} />
          <Text style={[styles.rowTitle, { color: colors.slate500 }]}>No applications yet</Text>
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Tap "+ New" to create your first visa application.</Text>
          <Pressable style={styles.primaryButton} onPress={newApplication}>
            <Text style={styles.primaryButtonText}>Create application</Text>
          </Pressable>
        </View>
      )}
      {!loadingApps && appList.map((app) => (
        <Pressable key={app.id} style={styles.appCard} onPress={() => openApplication(app.id)}>
          <Text style={styles.flagEmoji}>{app.destinationFlag}</Text>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{app.destinationCountry}</Text>
            <Text style={styles.rowMeta}>{app.visaType} · {app.intendedFrom}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${app.statusColor}18` }]}>
              <View style={[styles.statusDot, { backgroundColor: app.statusColor }]} />
              <Text style={[styles.statusText, { color: app.statusColor }]}>{app.status}</Text>
            </View>
          </View>
          <ScoreRing value={app.readinessScore} />
          <Pressable
            hitSlop={10}
            accessibilityLabel={`Delete ${app.destinationCountry} application`}
            onPress={() => Alert.alert('Delete this application?', `${app.destinationCountry} · ${app.visaType} will be removed permanently. Upcoming appointments for it are cancelled.`, [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Delete application', style: 'destructive', onPress: () => { void onDelete(app.id); } },
            ])}
            style={{ padding: 6 }}
          >
            <Ionicons name="trash-outline" size={19} color="#B91C1C" />
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
}

function ApplicationDetailScreen({ id, appList, tab, setTab, back, upload, openAudit, openAnalysis, openBooking, documents, onDelete }: {
  onDelete: () => Promise<void>;
  id: string;
  appList: ReturnType<typeof normalizeApp>[];
  tab: DetailTab;
  setTab: (tab: DetailTab) => void;
  back: () => void;
  upload: () => void;
  openAudit: (docId: string) => void;
  openAnalysis: () => void;
  openBooking: () => void;
  documents: ApiDocument[];
}) {
  const app = appList.find((item) => item.id === id) ?? null;
  if (!app) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <BackButton label="Applications" onPress={back} />
        <Ionicons name="document-text-outline" size={48} color={colors.slate300} />
        <Text style={[styles.rowTitle, { color: colors.slate500 }]}>Application not found</Text>
        <Text style={[styles.rowMeta, { textAlign: 'center' }]}>This application may have been removed or the ID is invalid.</Text>
      </View>
    );
  }
  return (
    <View>
      <BackButton label="Applications" onPress={back} />
      <View style={styles.detailHero}>
        <Text style={styles.heroMeta}>APPLICATION DETAIL</Text>
        <Text style={styles.heroTitle}>{app.destinationFlag} {app.destinationCountry}</Text>
        <Text style={styles.heroCopy}>{app.visaType} · {app.refCode}</Text>
        <ScoreRing value={app.readinessScore} large subLabel={app.status} />
      </View>
      <Segmented tabs={['overview', 'documents', 'requirements', 'chat']} active={tab} onPress={(value) => setTab(value as DetailTab)} />
      {tab === 'overview' && (() => {
        const missingDocs = documents.filter((d) => d.status === 'Missing');
        return (
          <Section title="Readiness overview">
            {documents.length > 0 && (
              (() => {
                const passportOnFile = documents.some((d) => d.type?.toLowerCase() === 'passport' && d.status !== 'Missing');
                return <TaskRow title={passportOnFile ? 'Passport uploaded' : 'Passport not uploaded yet'} meta={passportOnFile ? 'Identity document is on file for this application.' : 'Upload your passport bio page first — every other check is compared against it.'} done={passportOnFile} />;
              })()
            )}
            {missingDocs.length > 0 ? (
              <TaskRow
                title={`${missingDocs.length} document${missingDocs.length === 1 ? '' : 's'} missing`}
                meta={`${missingDocs.map((d) => d.title).slice(0, 2).join(' and ')}${missingDocs.length > 2 ? `, and ${missingDocs.length - 2} more` : ''} still need upload.`}
              />
            ) : documents.length > 0 ? (
              <TaskRow title="All documents uploaded" meta="No missing documents for this application." done />
            ) : null}
            <Pressable style={styles.primaryButton} onPress={openAnalysis}><Text style={styles.primaryButtonText}>Open visa analysis</Text></Pressable>
            <Pressable style={styles.goldButton} onPress={openBooking}><Text style={styles.primaryButtonText}>Get expert help</Text></Pressable>
          </Section>
        );
      })()}
      {tab === 'documents' && <DocumentList upload={upload} openAudit={openAudit} grid documents={documents} />}
      {tab === 'requirements' && <RequirementList documents={documents} destinationCountry={app.destinationCountry} />}
      {tab === 'chat' && <MiniChat openBooking={openBooking} documents={documents} />}

      <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.slate100, paddingTop: 16, gap: 8 }}>
        <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>Manage</Text>
        <Pressable
          accessibilityLabel="Delete application"
          onPress={() => Alert.alert(
            'Delete this application?',
            `${app.destinationCountry} · ${app.visaType} (${app.refCode}) will be removed permanently.\n\nUpcoming appointments for it are cancelled and any consultant access you granted is removed.`,
            [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Delete application', style: 'destructive', onPress: () => { void onDelete(); } },
            ]
          )}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}
        >
          <Ionicons name="trash-outline" size={18} color="#B91C1C" />
          <Text style={{ color: '#B91C1C', fontWeight: '800', fontSize: 14 }}>Delete application</Text>
        </Pressable>
      </View>
    </View>
  );
}

const VISA_TYPES = [
  { id: 'schengen-tourist',   label: 'Schengen Tourist',       flag: '🇪🇺', popular: true,  desc: 'Europe multi-country travel · EUR 80',      dest: 'France' },
  { id: 'uk-visitor',         label: 'UK Standard Visitor',    flag: '🇬🇧', popular: true,  desc: 'Business or leisure · £115',                 dest: 'United Kingdom' },
  { id: 'us-b1b2',            label: 'US B1/B2 Tourist',       flag: '🇺🇸', popular: true,  desc: 'USA tourism or business · $185',              dest: 'United States' },
  { id: 'canada-tourist',     label: 'Canada Visitor',         flag: '🇨🇦', popular: true,  desc: 'Canada tourism · C$100',                     dest: 'Canada' },
  { id: 'australia-tourist',  label: 'Australia Visitor',      flag: '🇦🇺', popular: false, desc: 'Australia tourism · A$145',                  dest: 'Australia' },
  { id: 'japan-tourist',      label: 'Japan Tourist',          flag: '🇯🇵', popular: true,  desc: 'Japan tourism · free (visa-free for many)',   dest: 'Japan' },
  { id: 'uae-tourist',        label: 'UAE Tourist',            flag: '🇦🇪', popular: false, desc: 'Dubai & Abu Dhabi · AED 250 on arrival',      dest: 'United Arab Emirates' },
  { id: 'singapore-tourist',  label: 'Singapore Tourist',      flag: '🇸🇬', popular: false, desc: 'Singapore · SGD 30 (most nationalities free)', dest: 'Singapore' },
  { id: 'thailand-tourist',   label: 'Thailand Tourist',       flag: '🇹🇭', popular: false, desc: 'Thailand · visa-free 30 days for many',       dest: 'Thailand' },
  { id: 'malaysia-tourist',   label: 'Malaysia eVisa',         flag: '🇲🇾', popular: false, desc: 'Malaysia eVisa · MYR 200',                    dest: 'Malaysia' },
  { id: 'turkey-e-visa',      label: 'Turkey e-Visa',          flag: '🇹🇷', popular: false, desc: 'Online e-Visa · $50',                         dest: 'Turkey' },
  { id: 'china-tourist',      label: 'China Tourist (L)',      flag: '🇨🇳', popular: false, desc: 'China tourist visa · ~$140',                  dest: 'China' },
  { id: 'india-tourist',      label: 'India e-Visa',           flag: '🇮🇳', popular: false, desc: 'India e-Visa · $25–$80',                      dest: 'India' },
  { id: 'sri-lanka-eta',      label: 'Sri Lanka ETA',          flag: '🇱🇰', popular: false, desc: 'Sri Lanka ETA · $35',                         dest: 'Sri Lanka' },
  { id: 'new-zealand-nzeta',  label: 'New Zealand NZeTA',      flag: '🇳🇿', popular: false, desc: 'New Zealand NZeTA · NZD 23',                  dest: 'New Zealand' },
  { id: 'south-korea-tourist',label: 'South Korea Tourist',    flag: '🇰🇷', popular: false, desc: 'South Korea · KRW 40,000 (many visa-free)',   dest: 'South Korea' },
  { id: 'germany-schengen',   label: 'Germany / Schengen',     flag: '🇩🇪', popular: false, desc: 'Schengen entry via Germany · EUR 80',         dest: 'Germany' },
  { id: 'spain-schengen',     label: 'Spain / Schengen',       flag: '🇪🇸', popular: false, desc: 'Schengen entry via Spain · EUR 80',           dest: 'Spain' },
  { id: 'italy-schengen',     label: 'Italy / Schengen',       flag: '🇮🇹', popular: false, desc: 'Schengen entry via Italy · EUR 80',           dest: 'Italy' },
  { id: 'netherlands-schengen',label: 'Netherlands / Schengen',flag: '🇳🇱', popular: false, desc: 'Schengen entry via Netherlands · EUR 80',     dest: 'Netherlands' },
  { id: 'saudi-tourist',      label: 'Saudi Arabia Tourist',   flag: '🇸🇦', popular: false, desc: 'Saudi e-Visa · SAR 300',                      dest: 'Saudi Arabia' },
  { id: 'bahrain-evisa',      label: 'Bahrain e-Visa',         flag: '🇧🇭', popular: false, desc: 'Bahrain e-Visa · BHD 5',                      dest: 'Bahrain' },
  { id: 'oman-evisa',         label: 'Oman e-Visa',            flag: '🇴🇲', popular: false, desc: 'Oman e-Visa · OMR 20',                        dest: 'Oman' },
  { id: 'kenya-evisa',        label: 'Kenya e-Visa',           flag: '🇰🇪', popular: false, desc: 'Kenya e-Visa · $51',                          dest: 'Kenya' },
  { id: 'south-africa-tourist',label: 'South Africa Tourist',  flag: '🇿🇦', popular: false, desc: 'South Africa · ZAR 425 visa on arrival',      dest: 'South Africa' },
  { id: 'brazil-tourist',     label: 'Brazil Tourist',         flag: '🇧🇷', popular: false, desc: 'Brazil tourist visa · ~$80',                  dest: 'Brazil' },
  { id: 'us-student-f1',      label: 'USA Student (F-1)',      flag: '🇺🇸', popular: false, desc: 'USA F-1 student visa · $185',                 dest: 'United States' },
  { id: 'uk-student',         label: 'UK Student Visa',        flag: '🇬🇧', popular: false, desc: 'UK student visa · £490',                      dest: 'United Kingdom' },
  { id: 'canada-study',       label: 'Canada Study Permit',    flag: '🇨🇦', popular: false, desc: 'Canada study permit · C$150',                 dest: 'Canada' },
  { id: 'australia-student',  label: 'Australia Student (500)',flag: '🇦🇺', popular: false, desc: 'Australia student visa · A$650',              dest: 'Australia' },
];

function NewApplicationScreen({
  step, visaTypeId, setVisaTypeId, nationality, setNationality, residence, setResidence,
  destination, setDestination, travelFrom, setTravelFrom, creating, createError, back, next, backLabel, setStickyFooter,
}: {
  step: number;
  visaTypeId: string; setVisaTypeId: (v: string) => void;
  nationality: string; setNationality: (v: string) => void;
  residence: string; setResidence: (v: string) => void;
  destination: string; setDestination: (v: string) => void;
  travelFrom: string; setTravelFrom: (v: string) => void;
  creating: boolean;
  createError?: string;
  back: () => void;
  next: () => void;
  backLabel?: string;
  setStickyFooter: (node: React.ReactNode) => void;
}) {
  const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const travelFromValid = !travelFrom.trim() || ISO_DATE_RE.test(travelFrom.trim());
  const selectedVt = VISA_TYPES.find(v => v.id === visaTypeId) ?? VISA_TYPES[0];

  // `next` is a fresh inline function from the parent on every render — put
  // it behind a ref so the footer effect below doesn't retrigger every time
  // that reference changes (that caused an infinite update loop).
  const nextRef = useRef(next);
  nextRef.current = next;
  const callNext = useRef(() => nextRef.current()).current;

  // The primary action is pinned to the bottom of the screen instead of
  // scrolling away below a long option list (visa types, country lists,
  // etc.) — this is the same footer slot every step below feeds into.
  useEffect(() => {
    if (step === 1) {
      const disabled = !nationality.trim() || !residence.trim();
      setStickyFooter(
        <Pressable style={[styles.primaryButton, { marginTop: 0 }, disabled && styles.disabledButton]} onPress={disabled ? undefined : callNext}>
          <Text style={[styles.primaryButtonText, disabled && styles.disabledButtonText]}>Continue →</Text>
        </Pressable>
      );
    } else if (step === 3) {
      const disabled = creating || !travelFromValid;
      setStickyFooter(
        <Pressable style={[styles.primaryButton, { marginTop: 0 }, disabled && styles.disabledButton]} onPress={disabled ? undefined : callNext}>
          {creating
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.primaryButtonText, !travelFromValid && styles.disabledButtonText]}>Create application</Text>
          }
        </Pressable>
      );
    } else {
      setStickyFooter(
        <Pressable style={[styles.primaryButton, { marginTop: 0 }]} onPress={callNext}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </Pressable>
      );
    }
    return () => setStickyFooter(null);
  }, [step, nationality, residence, creating, travelFromValid, callNext]);

  if (step === 0) {
    return (
      <View>
        <BackButton label={backLabel ?? 'Applications'} onPress={back} />
        <Text style={styles.eyebrow}>New application · Step 1 of 4</Text>
        <Text style={styles.title}>Choose visa type</Text>
        {VISA_TYPES.map(vt => (
          <Pressable key={vt.id} onPress={() => setVisaTypeId(vt.id)}
            style={[styles.optionCard, visaTypeId === vt.id && styles.optionCardActive, { position: 'relative' }]}>
            {vt.popular && (
              <View style={{ position: 'absolute', top: -8, right: 12, backgroundColor: colors.gold500, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>POPULAR</Text>
              </View>
            )}
            <Text style={{ fontSize: 24, marginRight: 4 }}>{vt.flag}</Text>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{vt.label}</Text>
              <Text style={styles.rowMeta}>{vt.desc}</Text>
            </View>
            {visaTypeId === vt.id && <Ionicons name="checkmark-circle" size={22} color={colors.royal600} />}
          </Pressable>
        ))}
        <ProgressDots count={4} active={step} />
      </View>
    );
  }

  if (step === 1) {
    return (
      <View>
        <BackButton label={backLabel ?? 'Applications'} onPress={back} />
        <Text style={styles.eyebrow}>New application · Step 2 of 4</Text>
        <Text style={styles.title}>Your nationality</Text>
        <Text style={styles.bodyText}>Enter the country that issued your primary passport.</Text>
        <View style={styles.stepCard}>
          <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Passport country</Text>
          <CountryAutocompleteInput
            value={nationality}
            onChangeText={setNationality}
            placeholder="e.g. India, Philippines, Pakistan"
          />
          <Text style={[styles.rowMeta, { marginBottom: 6, marginTop: 12 }]}>Country of residence</Text>
          <CountryAutocompleteInput
            value={residence}
            onChangeText={setResidence}
            placeholder="e.g. United Arab Emirates, UK"
          />
        </View>
        <ProgressDots count={4} active={step} />
      </View>
    );
  }

  if (step === 2) {
    const defaultDest = selectedVt.dest;
    return (
      <View>
        <BackButton label={backLabel ?? 'Applications'} onPress={back} />
        <Text style={styles.eyebrow}>New application · Step 3 of 4</Text>
        <Text style={styles.title}>Destination</Text>
        <Text style={styles.bodyText}>Confirm the destination country for your {selectedVt.label} visa.</Text>
        <View style={styles.stepCard}>
          <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Destination country</Text>
          <CountryAutocompleteInput
            value={destination}
            onChangeText={setDestination}
            placeholder={defaultDest}
          />
        </View>
        <ProgressDots count={4} active={step} />
      </View>
    );
  }

  // step === 3 — travel dates + confirm
  return (
    <View>
      <BackButton label={backLabel ?? 'Applications'} onPress={back} />
      <Text style={styles.eyebrow}>New application · Step 4 of 4</Text>
      <Text style={styles.title}>Travel date</Text>
      <Text style={styles.bodyText}>When do you plan to start your trip? (We use this to track your timeline.)</Text>
      <View style={styles.stepCard}>
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Intended departure date (YYYY-MM-DD)</Text>
        <TextInput
          value={travelFrom}
          onChangeText={setTravelFrom}
          placeholder={new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]}
          style={[styles.searchInput, !travelFromValid && { borderColor: '#DC2626', borderWidth: 1.5 }]}
          keyboardType="numbers-and-punctuation"
        />
        {!travelFromValid && (
          <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>Date must be in YYYY-MM-DD format (e.g. 2026-09-15)</Text>
        )}
        <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.royal50, borderRadius: 10 }}>
          <Text style={[styles.rowMeta, { fontWeight: '700', marginBottom: 4 }]}>Summary</Text>
          <Text style={styles.rowMeta}>{selectedVt.flag} {destination.trim() || selectedVt.dest}</Text>
          <Text style={styles.rowMeta}>{selectedVt.label}</Text>
          {nationality.trim() ? <Text style={styles.rowMeta}>From {nationality.trim()} · Living in {residence.trim()}</Text> : null}
          {travelFrom.trim() ? <Text style={styles.rowMeta}>Departing {travelFrom.trim()}</Text> : null}
        </View>
      </View>
      <ProgressDots count={4} active={step} />
      {createError ? (
        <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{createError}</Text>
        </View>
      ) : null}
    </View>
  );
}

function DocumentsScreen({ openUpload, openAudit, documents, loadError, retryLoad, onMount }: { openUpload: () => void; openAudit: (docId: string) => void; documents: ApiDocument[]; loadError?: string; retryLoad?: () => void; onMount?: () => void }) {
  useEffect(() => { onMount?.(); }, []);
  return (
    <View>
      <Text style={styles.eyebrow}>Documents</Text>
      <Text style={styles.title}>Audit-ready vault</Text>
      {loadError && documents.length === 0 && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 16, marginBottom: 12, alignItems: 'center', gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={{ color: '#991B1B', textAlign: 'center' }}>{loadError}</Text>
          {retryLoad && (
            <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retryLoad}>
              <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}
      <Pressable style={styles.uploadZone} onPress={openUpload}>
        <Ionicons name="cloud-upload-outline" size={36} color={colors.royal600} />
        <Text style={styles.rowTitle}>Upload document</Text>
        <Text style={styles.rowMeta}>PDF, JPG, PNG, HEIC · Auto-deletes in 72h</Text>
      </Pressable>
      <DocumentList upload={openUpload} openAudit={openAudit} documents={documents} />
    </View>
  );
}

function DocumentList({ upload, openAudit, grid, documents }: { upload: () => void; openAudit: (docId: string) => void; grid?: boolean; documents: ApiDocument[] }) {
  if (documents.length === 0) {
    return (
      <Section title="Application documents">
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="document-outline" size={32} color={colors.slate300} />
          <Text style={[styles.rowMeta, { textAlign: 'center', marginTop: 8 }]}>No documents yet. Upload your first document to begin the AI audit.</Text>
        </View>
      </Section>
    );
  }

  if (grid) {
    return (
      <View style={{ padding: 4 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {documents.map((doc) => (
            <Pressable key={doc.id} onPress={() => doc.status === 'Missing' ? upload() : openAudit(doc.id)}
              style={{ width: '47.5%', backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.slate100, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.documentIcon, { backgroundColor: `${doc.statusColor}18`, width: 38, height: 38, borderRadius: 10 }]}>
                  <Ionicons name={doc.icon as IoniconName} size={20} color={doc.statusColor} />
                </View>
                {doc.score > 0
                  ? <ScoreRing value={doc.score} />
                  : <View style={[styles.statusPill, { backgroundColor: `${doc.statusColor}18` }]}>
                      <View style={[styles.statusDot, { backgroundColor: doc.statusColor }]} />
                      <Text style={[styles.statusText, { color: doc.statusColor }]}>{doc.status}</Text>
                    </View>
                }
              </View>
              <Text style={[styles.rowTitle, { fontSize: 13 }]} numberOfLines={2}>{doc.title}</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>{doc.issue}</Text>
              {doc.retention !== 'Not uploaded' && (
                <Text style={{ fontSize: 9, color: colors.slate300 }}>{doc.retention}</Text>
              )}
            </Pressable>
          ))}
          <Pressable onPress={upload} style={{ width: '47.5%', backgroundColor: colors.royal50, borderRadius: 14, borderWidth: 1.5, borderColor: '#93C5FD', borderStyle: 'dashed', padding: 14, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 110 }}>
            <Ionicons name="add-circle-outline" size={28} color={colors.royal600} />
            <Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 12, textAlign: 'center' }}>Add document</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Section title="Application documents">
      {documents.map((doc) => (
        <Pressable key={doc.id} style={styles.documentRow} onPress={() => doc.status === 'Missing' ? upload() : openAudit(doc.id)}>
          <View style={[styles.documentIcon, { backgroundColor: `${doc.statusColor}18` }]}>
            <Ionicons name={doc.icon as IoniconName} size={18} color={doc.statusColor} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{doc.title}</Text>
            <Text style={styles.rowMeta}>{doc.issue}</Text>
            {doc.retention !== 'Not uploaded' && (
              <Text style={{ fontSize: 10, color: colors.slate300, marginTop: 2 }}>{doc.retention}</Text>
            )}
          </View>
          {!!doc.fileUrl && (
            <Pressable onPress={() => openUrlSafely(doc.fileUrl!)} hitSlop={8} style={{ padding: 4, marginRight: 4 }}>
              <Ionicons name="eye-outline" size={18} color={colors.slate500} />
            </Pressable>
          )}
          {doc.score > 0
            ? <ScoreRing value={doc.score} />
            : <View style={[styles.statusPill, { backgroundColor: `${doc.statusColor}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: doc.statusColor }]} />
                <Text style={[styles.statusText, { color: doc.statusColor }]}>{doc.status}</Text>
              </View>
          }
        </Pressable>
      ))}
    </Section>
  );
}

function slugifyDocumentId(name: string | null | undefined): string {
  const slug = (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  return slug ? `doc-${slug}` : `doc-upload-${Date.now()}`;
}

// Real per-document type — sent to the backend so the AI audit knows what
// it's checking, and so the Documents list can show a real per-type record
// instead of a generic, unidentifiable "Document" upload. Ids match the
// backend's DOCUMENT_TEMPLATES exactly (see apps/backend/src/app.ts).
const DOCUMENT_TYPE_OPTIONS: { id: string; label: string; icon: IoniconName }[] = [
  { id: 'passport',   label: 'Passport bio page',          icon: 'id-card-outline' },
  { id: 'bank',       label: 'Bank statement',              icon: 'cash-outline' },
  { id: 'employment', label: 'Employment / student letter', icon: 'briefcase-outline' },
  { id: 'insurance',  label: 'Travel medical insurance',    icon: 'shield-checkmark-outline' },
  { id: 'itinerary',  label: 'Flight & hotel reservation',  icon: 'airplane-outline' },
  { id: 'photo',      label: 'Biometric photo',             icon: 'camera-outline' },
  { id: 'other',      label: 'Other supporting document',   icon: 'document-outline' },
];

function UploadScreen({ state, activeApplicationId, openNewApplication, back, next, onCamera, onReview, onPicked }: {
  state: 'select' | 'uploading' | 'auditing' | 'done';
  activeApplicationId?: string;
  openNewApplication: () => void;
  back: () => void;
  next: (documentId?: string) => void;
  onCamera?: (docType: string) => void;
  onPicked: (documentType: string, extractedText?: string, imageBase64?: string, mimeType?: string) => void;
  /** Images go to the same review screen as a camera capture (verdict + parsed passport data) before upload. */
  onReview?: (documentType: string, uri: string, mimeType: string) => void;
}) {
  const [docType, setDocType] = useState<string | null>(null);
  const copy: Record<typeof state, [string, string]> = {
    select:    ['Select document',    'Choose how to add your document below.'],
    uploading: ['Uploading securely', 'Encrypting file and preparing OCR. Retention timer starts now.'],
    auditing:  ['AI audit in progress','Only validated findings are shown. Raw OCR is never exposed in UI.'],
    done:      ['Audit complete',     'Your report is ready to view.'],
  };

  if (!activeApplicationId) {
    return (
      <View>
        <BackButton label="Documents" onPress={back} />
        <Text style={styles.eyebrow}>Document flow</Text>
        <Text style={styles.title}>Create an application first</Text>
        <Text style={styles.bodyText}>Documents are audited against a specific visa application, so start one before uploading.</Text>
        <Pressable style={[styles.primaryButton, { marginTop: 16 }]} onPress={openNewApplication}>
          <Text style={styles.primaryButtonText}>New application</Text>
        </Pressable>
      </View>
    );
  }

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      onReview?.(docType ?? 'other', asset.uri, asset.mimeType || 'image/jpeg');
    } catch { next(); }
  };
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const isImage = /\.(jpe?g|png|heic)$/i.test(asset.name ?? '') || (asset.mimeType?.startsWith('image/') ?? false);
      const mimeType = asset.mimeType || (isImage ? 'image/jpeg' : 'application/pdf');
      if (isImage && onReview) { onReview(docType ?? 'other', asset.uri, mimeType); return; }
      // On-device OCR only runs on images — PDFs skip straight to the real
      // file bytes below, which Gemini can read directly (including PDFs).
      let extractedText: string | undefined;
      let ocrBlocks: OcrLike['blocks'];
      if (isImage) {
        try {
          const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
          const ocr = await TextRecognition.recognize(asset.uri);
          extractedText = ocr?.text?.trim() || undefined;
          ocrBlocks = ocr?.blocks;
        } catch { /* extractedText stays undefined */ }
      }
      let imageBase64: string | undefined;
      try {
        imageBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      } catch { /* imageBase64 stays undefined — honest "couldn't verify" fallback applies */ }
      if (docType && isImage && !(await confirmDocumentMatch(docType, extractedText ? { text: extractedText, blocks: ocrBlocks } : null))) return;
      onPicked(docType ?? 'other', extractedText, imageBase64, mimeType);
      next(slugifyDocumentId(asset.name));
    } catch { next(); }
  };
  const sources: [IoniconName, string, string, (() => void) | undefined][] = [
    ['camera-outline',   'Take photo',         'Capture with your camera',       onCamera ? () => onCamera(docType ?? 'other') : undefined],
    ['images-outline',   'Choose from gallery', 'Pick an existing image',         pickFromGallery],
    ['document-outline', 'Browse files',        'PDF, JPG, PNG, HEIC',            pickDocument],
    ['logo-google',      'Import from Drive',   'Select from Google Drive',       pickDocument],
  ];
  return (
    <View>
      <BackButton label="Documents" onPress={docType ? () => setDocType(null) : back} />
      <Text style={styles.eyebrow}>Document flow</Text>
      <Text style={styles.title}>{state === 'select' && !docType ? 'What are you uploading?' : copy[state][0]}</Text>
      <Text style={styles.bodyText}>{state === 'select' && !docType ? 'Pick the document type so the AI audit checks the right things.' : copy[state][1]}</Text>
      {state === 'select' && !docType && (
        <Section title="Document type">
          {DOCUMENT_TYPE_OPTIONS.map((opt) => (
            <Pressable key={opt.id} style={styles.taskRow} onPress={() => setDocType(opt.id)}>
              <View style={[styles.quickIconBox, { backgroundColor: colors.royal50, width: 40, height: 40 }]}>
                <Ionicons name={opt.icon} size={20} color={colors.royal600} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{opt.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
            </Pressable>
          ))}
        </Section>
      )}
      {state === 'select' && !!docType && (
        <Section title="Add from">
          {sources.map(([icon, label, sub, onPress]) => (
            <Pressable key={label} style={styles.taskRow} onPress={onPress ?? (() => next())}>
              <View style={[styles.quickIconBox, { backgroundColor: colors.royal50, width: 40, height: 40 }]}>
                <Ionicons name={icon} size={20} color={colors.royal600} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{label}</Text>
                <Text style={styles.rowMeta}>{sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
            </Pressable>
          ))}
        </Section>
      )}
      {state === 'select' && !!docType && (
        <Section title={`Before you scan or upload — ${DOC_GUIDES[toDocKind(docType)].title}`}>
          <DocGuideCard kind={toDocKind(docType)} />
        </Section>
      )}
      {state !== 'select' && (
        // Nothing has been analysed yet at this step, so nothing is claimed as done.
        <View style={styles.timelineCard}>
          <TaskRow title="File ready" meta="The audit reads your file and checks it against this application's requirements when you start it." />
        </View>
      )}
      {state !== 'select' && (
        <Pressable style={styles.primaryButton} onPress={() => next()}>
          <Text style={styles.primaryButtonText}>Start audit</Text>
        </Pressable>
      )}
    </View>
  );
}

// Human labels for a stored audit's document type / status.
const AUDIT_STATUS_LABEL: Record<string, string> = { excellent: 'Passed all checks', attention_needed: 'Needs attention', issues_to_fix: 'Issues to fix' };
function documentTypeLabel(type: string): string {
  const label = DOC_KIND_LABEL[toDocKind(type.toLowerCase())];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function AuditReportScreen({ docId, back, openRequirements, fetchedAudit, auditError, onMount, onRetry }: { docId: string; back: () => void; openRequirements: () => void; fetchedAudit?: any; auditError?: string; onMount?: () => void; onRetry?: () => void }) {
  useEffect(() => { onMount?.(); }, []);

  const audit = fetchedAudit ?? {};
  const score: number = audit.score ?? 0;
  const status: string = AUDIT_STATUS_LABEL[audit.status] ?? audit.status ?? 'Pending';
  const title: string = audit.documentType ? documentTypeLabel(audit.documentType) : docId;
  const generatedAt: string = audit.generatedAt ? new Date(audit.generatedAt).toLocaleString() : 'Pending';
  const findings: any[] = audit.findings ?? [];
  const severityColor = { pass: colors.green500, info: colors.royal600, warn: colors.gold500, red_flag: '#DC2626', redflag: '#DC2626' } as Record<string, string>;

  const handleSharePdf = async () => {
    try {
      const html = `<html><body style="font-family:sans-serif;padding:24px"><h1>Visa With Ease Audit Report</h1><h2>${title}</h2><p><strong>Score:</strong> ${score}/100 — ${status}</p><p><em>Generated: ${generatedAt}</em></p><hr/>${findings.map(f => `<p><strong>[${f.severity}]</strong> ${f.title}<br/>${f.description}<br/><em>Confidence: ${f.confidence}%</em></p>`).join('')}</body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Audit Report' });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
      }
    } catch {
      Alert.alert('Export failed', 'Could not generate PDF. Please try again.');
    }
  };

  if (!fetchedAudit) {
    return (
      <View>
        <BackButton label="Documents" onPress={back} />
        <Text style={styles.eyebrow}>AI audit report</Text>
        {auditError ? (
          <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
            <Text style={[styles.rowMeta, { textAlign: 'center' }]}>{auditError}</Text>
            {onRetry && (
              <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={onRetry}>
                <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ alignItems: 'center', padding: 40, gap: 14 }}>
            <ActivityIndicator size="large" color={colors.royal600} />
            <Text style={styles.rowMeta}>Loading audit report…</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      <BackButton label="Documents" onPress={back} />
      <Text style={styles.eyebrow}>AI audit report</Text>
      <Text style={styles.title}>{title} — {score}/100</Text>

      <LinearGradient colors={['#0B1F4B', '#1547C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.reportHero}>
        <ScoreRing value={score} large subLabel={status} />
        <Text style={styles.reportText}>Generated {generatedAt}</Text>
      </LinearGradient>

      {/* Summary counted from the real findings — nothing here is asserted unless the analysis produced it */}
      <Section title="At a glance">
        {[
          { label: 'Serious problems', n: findings.filter((f) => f.severity === 'red_flag').length, color: '#DC2626', icon: 'close-circle' as IoniconName },
          { label: 'Warnings', n: findings.filter((f) => f.severity === 'warn').length, color: colors.gold500, icon: 'warning' as IoniconName },
          { label: 'Checks passed', n: findings.filter((f) => f.severity === 'pass').length, color: colors.green500, icon: 'checkmark-circle' as IoniconName },
        ].map((row) => (
          <View key={row.label} style={[styles.taskRow, { gap: 10 }]}>
            <Ionicons name={row.icon} size={22} color={row.color} />
            <Text style={[styles.rowTitle, { flex: 1 }]}>{row.label}</Text>
            <Text style={{ fontWeight: '900', color: row.n > 0 ? row.color : colors.slate500, fontSize: 16 }}>{row.n}</Text>
          </View>
        ))}
      </Section>

      <Section title="AI findings — full report">
        {findings.map((finding: any) => {
          const color: string = severityColor[finding.severity] ?? colors.slate500;
          return (
            <View key={finding.id} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.slate100, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={finding.severity === 'pass' ? 'checkmark-circle' : finding.severity === 'warn' ? 'warning' : 'information-circle'} size={16} color={color} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.rowTitle, { color }]}>{finding.severity.toUpperCase()}</Text>
                  <Text style={styles.rowTitle}>{finding.title}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.statusText, { color }]}>{finding.confidence}% conf.</Text>
                </View>
              </View>
              <Text style={[styles.rowMeta, { marginLeft: 38, lineHeight: 18 }]}>{finding.description}</Text>
            </View>
          );
        })}
      </Section>
      <Pressable style={[styles.primaryButton, { flexDirection: 'row', gap: 8 }]} onPress={handleSharePdf}>
        <Ionicons name="share-outline" size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>Share PDF report</Text>
      </Pressable>
      <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={openRequirements}>
        <Text style={styles.secondaryButtonText}>Compare requirements</Text>
      </Pressable>
    </View>
  );
}

function AnalysisScreen({ back, upload, openConsultants, app }: { back: () => void; upload: () => void; openConsultants: () => void; app?: ReturnType<typeof normalizeApp> | null }) {
  const score = app?.readinessScore ?? 0;
  const riskLevel = score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High';
  const decision = score >= 80 ? 'Strong application — ready for submission review' : score >= 60 ? 'Good progress — resolve remaining gaps before submitting' : 'Needs work — several issues must be resolved';
  const docsUploaded = app?.documentsUploaded ?? 0;
  const docsRequired = app?.documentsRequired ?? 6;
  const docScore = Math.round((docsUploaded / Math.max(docsRequired, 1)) * 100);
  const factors = [
    { id: 'documents', title: 'Documents uploaded', score: docScore, detail: `${docsUploaded} of ${docsRequired} required documents uploaded.` },
    { id: 'readiness', title: 'Overall readiness', score, detail: `Readiness score reflects document completeness and consistency.` },
    { id: 'timing', title: 'Timing risk', score: app?.intendedFrom ? Math.max(20, Math.min(95, 100 - Math.floor((new Date(app.intendedFrom).getTime() - Date.now()) / 86400000 / 0.3))) : 50, detail: app?.intendedFrom ? `Travel date: ${app.intendedFrom}. Book your appointment at least 4 weeks before departure.` : 'No travel date set — set a date to assess timing risk.' },
    { id: 'issues', title: 'Open issues', score: Math.max(0, 100 - (app?.issuesCount ?? 0) * 15), detail: `${app?.issuesCount ?? 0} issue${(app?.issuesCount ?? 0) !== 1 ? 's' : ''} detected. Resolve all before submission.` },
  ];
  const fixes = [
    docsUploaded < docsRequired ? `Upload ${docsRequired - docsUploaded} remaining required document${docsRequired - docsUploaded !== 1 ? 's' : ''}.` : null,
    (app?.issuesCount ?? 0) > 0 ? `Resolve ${app?.issuesCount} open issue${(app?.issuesCount ?? 1) !== 1 ? 's' : ''} flagged in your audit.` : null,
    !app?.intendedFrom ? 'Set your intended travel date to track your application timeline.' : null,
    'Book a VFS appointment at least 4–6 weeks before your travel date.',
    'Request a consultant review to catch issues the AI may have missed.',
  ].filter(Boolean) as string[];

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Visa analysis</Text>
      <Text style={styles.title}>Submission risk: {riskLevel}</Text>
      <LinearGradient colors={['#6D28D9', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.reportHero}>
        <ScoreRing value={score} large />
        <Text style={styles.reportText}>{decision}</Text>
      </LinearGradient>
      {app && (
        <Section title={`${app.destinationFlag} ${app.destinationCountry} · ${app.visaType}`}>
          <Finding title={`Ref: ${app.refCode}`} meta={`Status: ${app.status} · Departure: ${app.intendedFrom ?? 'Not set'}`} />
        </Section>
      )}
      <Section title="Risk factors">
        {factors.map((factor) => (
          <View key={factor.id} style={styles.analysisRow}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{factor.title}</Text>
              <Text style={styles.rowMeta}>{factor.detail}</Text>
            </View>
            <ScoreRing value={factor.score} />
          </View>
        ))}
      </Section>
      {fixes.length > 0 && (
        <Section title="Recommended fixes">
          {fixes.map((item, index) => (
            <TaskRow key={item} title={item} meta={index === 0 ? 'Tap upload to resolve this blocker.' : 'Review before submission.'} />
          ))}
        </Section>
      )}
      <Pressable style={styles.primaryButton} onPress={upload}><Text style={styles.primaryButtonText}>Upload missing proof</Text></Pressable>
      <Pressable style={styles.goldButton} onPress={openConsultants}><Text style={styles.primaryButtonText}>Review with consultant</Text></Pressable>
    </View>
  );
}


function RequirementsScreen({ back, openConsultants, destinationCountry }: { back: () => void; openConsultants: () => void; destinationCountry?: string }) {
  const [reqData, setReqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    fetchRequirements(destinationCountry)
      .then(data => { setReqData(data); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, [destinationCountry, attempt]);

  const fees: string | null = reqData?.fees ?? null;
  const processingTime: string | null = reqData?.processingTime ?? null;
  const provenance = reqData ? verificationLabel(reqData.verification) : null;
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const reqList: any[] = reqData?.requirements ?? [];
  const sourceUrls: any[] = reqData?.sourceUrls ?? [];

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Official-source intelligence</Text>
      <Text style={styles.title}>Visa requirements{destinationCountry ? ` — ${destinationCountry}` : ''}</Text>
      {provenance && (
        <View style={[styles.notice, { flexDirection: 'row', gap: 6, alignItems: 'center' }, provenance.ok && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <Ionicons name={provenance.ok ? 'checkmark-circle' : 'alert-circle-outline'} size={16} color={provenance.ok ? '#047857' : '#92400E'} />
          <Text style={[styles.noticeText, { flex: 1 }, provenance.ok && { color: '#065F46' }]}>{provenance.text}</Text>
        </View>
      )}
      {loadError ? (
        <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Couldn't load official requirements for {destinationCountry ?? 'this destination'}. Showing nothing rather than a guess.</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={() => setAttempt(a => a + 1)}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>
      ) : (
        <>
          <Section title="Visa fee">
            <Text style={styles.rowTitle}>Visa fee</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.slate900, marginTop: 4 }}>{fees}</Text>
            <Text style={[styles.rowMeta, { marginTop: 6 }]}>Processing: {processingTime} · Embassy fee is non-refundable.</Text>
          </Section>
          <Section title="Requirements checklist">
            {reqList.map((item: any) => (
              <View key={item.id}>
                <TaskRow title={item.title} meta={item.description} done={item.satisfied} />
                <Pressable onPress={() => setOpenWhy(openWhy === item.id ? null : item.id)} style={{ paddingLeft: 4, paddingBottom: 6 }} accessibilityLabel={`Why is ${item.title} needed`}>
                  <Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 12 }}>{openWhy === item.id ? 'Hide' : 'Why is this needed?'}</Text>
                </Pressable>
                {openWhy === item.id && (
                  <View style={{ backgroundColor: colors.slate50, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                    <Text style={styles.rowMeta}>{item.why ?? 'This is listed as required for this visa by the official sources below. Exact requirements can vary with your circumstances, so confirm on the official site.'}</Text>
                    {!item.required && <Text style={[styles.rowMeta, { marginTop: 6 }]}>Marked optional — it can strengthen your application but isn't strictly required.</Text>}
                    {(item.sourceIds ?? []).map((sid: string) => sourceUrls.find((s: any) => s.id === sid)).filter(Boolean).map((s: any) => (
                      <Pressable key={s.id} onPress={() => openUrlSafely(s.url)}><Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 12, marginTop: 6 }}>Source: {s.label}</Text></Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {reqList.length === 0 && <Text style={styles.rowMeta}>No requirements data available.</Text>}
          </Section>
        </>
      )}
      {sourceUrls.length > 0 && (
        <Section title="Sources">
          {sourceUrls.map((source: any) => (
            <Pressable key={source.id} style={styles.taskRow} onPress={() => openUrlSafely(source.url)}>
              <Ionicons name="globe-outline" size={16} color={colors.royal600} />
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.royal600 }]}>{source.label}</Text>
                <Text style={styles.rowMeta}>{source.url}</Text>
              </View>
              <Ionicons name="open-outline" size={14} color={colors.royal600} />
            </Pressable>
          ))}
        </Section>
      )}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Guidance compiled from the official sources listed above. Requirements change and vary by applicant — always confirm on the official site before applying.</Text>
      </View>
      <Pressable style={styles.goldButton} onPress={openConsultants}><Text style={styles.primaryButtonText}>Ask a verified consultant</Text></Pressable>
    </View>
  );
}

// Maps a real per-country requirement's title/id to the locally-uploaded
// document type that would satisfy it — the backend's own `satisfied` flag
// isn't tied to any specific application's uploads, so this is computed here.
function matchesUploadedDoc(req: { id: string; title: string }, docMap: Map<string | undefined, ApiDocument>): boolean {
  // The documents list always contains a placeholder for every document type
  // (status 'Missing' until something is really uploaded), so being *present*
  // in the map proves nothing — only a non-Missing status counts as uploaded.
  // A tick also needs the document to have actually passed its check: a photo
  // that scored 18/100 (e.g. "doesn't look like a passport") is not a met requirement.
  const uploaded = (...types: string[]) => types.some((t) => {
    const d = docMap.get(t);
    return !!d && d.status !== 'Missing' && (d.score ?? 0) >= 50;
  });
  const text = `${req.id} ${req.title}`.toLowerCase();
  if (text.includes('passport')) return uploaded('passport');
  if (text.includes('bank') || text.includes('financ') || text.includes('fund')) return uploaded('bank', 'finance');
  if (text.includes('insur')) return uploaded('insurance');
  if (text.includes('itinerary') || text.includes('flight') || text.includes('hotel') || text.includes('reserv')) return uploaded('itinerary');
  if (text.includes('photo')) return uploaded('photo');
  if (text.includes('employ') || text.includes('student') || text.includes('enroll')) return uploaded('employment');
  return false;
}

function RequirementList({ documents, destinationCountry }: { documents: ApiDocument[]; destinationCountry?: string }) {
  const docMap = new Map(documents.map(d => [d.type?.toLowerCase(), d]));
  const [reqs, setReqs] = useState<ApiRequirement[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setReqs(null);
    fetchRequirements(destinationCountry)
      .then(data => { if (!cancelled) setReqs(data.requirements); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [destinationCountry, attempt]);

  if (error) {
    return (
      <Section title="Checklist">
        <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Couldn't load the requirements checklist for {destinationCountry ?? 'this destination'}.</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={() => setAttempt(a => a + 1)}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      </Section>
    );
  }

  if (!reqs) {
    return (
      <Section title="Checklist">
        <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>
      </Section>
    );
  }

  return (
    <Section title="Checklist">
      {reqs.map((item) => (
        <TaskRow key={item.id} title={item.title} meta={item.description} done={matchesUploadedDoc(item, docMap)} />
      ))}
      {reqs.length === 0 && <Text style={styles.rowMeta}>No requirements data available for {destinationCountry ?? 'this destination'}.</Text>}
    </Section>
  );
}

/** Tap-to-ask FAQ: category chips, then that category's questions as small tappable rows. */
function FaqPanel({ faq, askFaq, limit = 4 }: { faq: ApiFaqCatalog | null; askFaq: (id: string, q: string) => void; limit?: number }) {
  const [cat, setCat] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  if (!faq || faq.categories.length === 0) return null;
  const active = cat ?? faq.categories[0].id;
  const questions = faq.questions.filter(q => q.category === active);
  const shown = all ? questions : questions.slice(0, limit);
  return (
    <View style={{ gap: 6 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
        {faq.categories.map(c => {
          const on = c.id === active;
          return (
            <Pressable key={c.id} onPress={() => { setCat(c.id); setAll(false); }} accessibilityLabel={`FAQ category ${c.label}`} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: on ? colors.royal600 : colors.white, borderWidth: 1, borderColor: on ? colors.royal600 : colors.slate200 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#fff' : colors.slate700 }}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {shown.map(q => (
        <Pressable key={q.id} onPress={() => askFaq(q.id, q.question)} accessibilityLabel={`Ask: ${q.question}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: colors.slate100 }}>
          <Text style={{ flex: 1, fontSize: 13, color: colors.slate800, fontWeight: '600' }} numberOfLines={1}>{q.question}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.slate300} />
        </Pressable>
      ))}
      {!all && questions.length > limit && (
        <Pressable onPress={() => setAll(true)} accessibilityLabel="Show more questions"><Text style={{ fontSize: 12, fontWeight: '700', color: colors.royal600, paddingVertical: 2 }}>More questions ({questions.length - limit})</Text></Pressable>
      )}
    </View>
  );
}

/** "Please upload X": one slim row. Scan opens the guided scanner; File/Gallery use the review screen. */
function ChatDocCard({ msg, uploadDoc, skipDoc }: { msg: ChatMsg; uploadDoc: (id: string, source: 'scan' | 'gallery' | 'file') => void; skipDoc: (id: string) => void }) {
  const card = msg.docCard!;
  const open = card.state === 'open';
  const btn = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 };
  return (
    <View style={{ alignSelf: 'stretch', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: open ? colors.royal600 : colors.slate100, paddingHorizontal: 12, paddingVertical: 10, gap: 8, opacity: open ? 1 : 0.7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={open ? card.icon : card.state === 'sent' ? 'checkmark-circle' : 'remove-circle-outline'} size={20} color={open ? colors.royal600 : card.state === 'sent' ? '#16A34A' : colors.slate500} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.slate900 }} numberOfLines={1}>{card.title}</Text>
          <Text style={{ fontSize: 11.5, color: colors.slate500 }} numberOfLines={open ? 2 : 1}>{open ? (msg.text || card.tip) : card.state === 'sent' ? 'Sent — checking in the background' : 'Skipped'}</Text>
        </View>
      </View>
      {open && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => uploadDoc(msg.id, 'scan')} accessibilityLabel={`Scan ${card.title}`} style={[btn, { backgroundColor: colors.royal600 }]}>
            <Ionicons name="scan-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Scan</Text>
          </Pressable>
          <Pressable onPress={() => uploadDoc(msg.id, 'file')} accessibilityLabel={`Choose file for ${card.title}`} style={[btn, { backgroundColor: colors.royal50 }]}>
            <Ionicons name="document-attach-outline" size={16} color={colors.royal600} />
            <Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 12.5 }}>File</Text>
          </Pressable>
          <Pressable onPress={() => uploadDoc(msg.id, 'gallery')} accessibilityLabel="Choose from gallery" style={[btn, { backgroundColor: colors.royal50 }]}>
            <Ionicons name="images-outline" size={16} color={colors.royal600} />
            <Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 12.5 }}>Gallery</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => skipDoc(msg.id)} accessibilityLabel={`Skip ${card.title}`} hitSlop={8}><Text style={{ color: colors.slate500, fontSize: 12, fontWeight: '700' }}>Skip</Text></Pressable>
        </View>
      )}
    </View>
  );
}

/** Result of a background check, as one slim row (spinner → score + top finding). */
function ChatProgressCard({ msg, openReport, retryDoc }: { msg: ChatMsg; openReport: (docId: string) => void; retryDoc: (type: string) => void }) {
  const pr = msg.progress!;
  const r = pr.result;
  const tone = r?.status === 'excellent' ? { c: '#15803D', bg: '#DCFCE7', t: 'Passed' } : r?.status === 'attention_needed' ? { c: '#B45309', bg: '#FEF3C7', t: 'Needs attention' } : { c: '#B91C1C', bg: '#FEE2E2', t: 'Issues found' };
  const top = r?.findings.find(f => f.severity === 'red_flag' || f.severity === 'warn') ?? r?.findings[0];
  return (
    <View style={{ alignSelf: 'stretch', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.slate100, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {pr.state === 'running' && (
        <>
          <ActivityIndicator size="small" color={colors.royal600} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.slate700, fontWeight: '600' }} numberOfLines={1}>Checking {pr.title}…</Text>
        </>
      )}
      {pr.state === 'error' && (
        <>
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#B91C1C' }} numberOfLines={1}>{pr.title} could not be checked</Text>
            <Text style={{ fontSize: 11.5, color: colors.slate500 }} numberOfLines={1}>{pr.error}</Text>
          </View>
          <Pressable onPress={() => retryDoc(pr.type)} accessibilityLabel={`Upload ${pr.title} again`} hitSlop={8}><Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 12.5 }}>Retry</Text></Pressable>
        </>
      )}
      {pr.state === 'done' && r && (
        <>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: tone.c }}>{r.score}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.slate900 }} numberOfLines={1}>{pr.title} · <Text style={{ color: tone.c }}>{tone.t}</Text></Text>
            {!!top && <Text style={{ fontSize: 11.5, color: colors.slate500 }} numberOfLines={1}>{top.title}</Text>}
          </View>
          <Pressable onPress={() => openReport(pr.documentId)} accessibilityLabel={`View report for ${pr.title}`} hitSlop={8}><Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 12.5 }}>Report</Text></Pressable>
        </>
      )}
    </View>
  );
}

function ChatScreen({ message, setMessage, sessionMessages, isTyping, sendMessage, openConsultants, appList, bottomInset, faq, askFaq, askText, runAction, startDocFlow, uploadDoc, skipDoc, retryDoc, openReport }: {
  message: string;
  setMessage: (value: string) => void;
  sessionMessages: ChatMsg[];
  isTyping: boolean;
  sendMessage: () => void;
  openConsultants: () => void;
  appList: ReturnType<typeof normalizeApp>[];
  /** Space reserved under the composer for the tab bar (0-ish when hidden). */
  bottomInset: number;
  faq: ApiFaqCatalog | null;
  askFaq: (id: string, question: string) => void;
  askText: (text: string) => void;
  runAction: (label: string) => void;
  startDocFlow: () => void;
  uploadDoc: (msgId: string, source: 'scan' | 'gallery' | 'file') => void;
  skipDoc: (msgId: string) => void;
  retryDoc: (type: string) => void;
  openReport: (docId: string) => void;
}) {
  const activeApp = appList[0] ?? null;
  const listRef = useRef<ScrollView>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [showFaq, setShowFaq] = useState(false);
  const scrollToEnd = useCallback((animated = true) => listRef.current?.scrollToEnd({ animated }), []);
  // Newest message (or the typing dots) always comes into view.
  useEffect(() => { scrollToEnd(); }, [sessionMessages.length, isTyping, scrollToEnd]);
  const missingDocs = activeApp ? Math.max(activeApp.documentsRequired - activeApp.documentsUploaded, 0) : 0;
  const chip = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.royal50 };
  const chipText = { fontSize: 12, fontWeight: '700' as const, color: colors.royal600 };
  const lastAiIdx = (() => { for (let i = sessionMessages.length - 1; i >= 0; i--) if (sessionMessages[i].role === 'ai') return i; return -1; })();
  return (
    // Fixed column: scrolling conversation on top, composer pinned underneath
    // it — the input can never drift down the page or under the tab bar, and
    // the keyboard lifts the whole column (see KeyboardAvoidingView in AppInner).
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={listRef}
        style={{ flex: 1 }}
        persistentScrollbar
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.chatScreen, { padding: 16, paddingBottom: 10, gap: 8 }]}
        scrollEventThrottle={64}
        onContentSizeChange={() => { if (atBottom) scrollToEnd(false); }}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          setAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 40);
        }}
      >
        {sessionMessages.length === 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: colors.slate900 }}>Assistant</Text>
              {activeApp && <Badge tone="neutral" label={`${activeApp.destinationCountry} · ${activeApp.documentsUploaded}/${activeApp.documentsRequired} docs`} />}
            </View>
            <Text style={{ fontSize: 13.5, color: colors.slate600, lineHeight: 19 }}>
              {activeApp ? `Ask anything about your ${activeApp.destinationCountry} application, tap a question, or add your documents here.` : 'Ask anything about visa requirements and documents, or tap a question.'}
            </Text>
            {activeApp && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {missingDocs > 0 && (
                  <Pressable onPress={startDocFlow} accessibilityLabel="Upload my documents" style={[chip, { backgroundColor: colors.royal600, paddingVertical: 9 }]}>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>Add documents ({missingDocs})</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => askText(`What is the status of my ${activeApp.destinationCountry} visa application?`)} accessibilityLabel="Visa status" style={[chip, { paddingVertical: 9 }]}>
                  <Ionicons name="pulse-outline" size={16} color={colors.royal600} />
                  <Text style={chipText}>Visa status</Text>
                </Pressable>
              </View>
            )}
            <FaqPanel faq={faq} askFaq={askFaq} />
          </>
        )}
        {sessionMessages.map((item, idx) => (
          <View key={item.id} style={{ gap: 6 }}>
            {item.docCard ? (
              <ChatDocCard msg={item} uploadDoc={uploadDoc} skipDoc={skipDoc} />
            ) : item.progress ? (
              <ChatProgressCard msg={item} openReport={openReport} retryDoc={retryDoc} />
            ) : (
              <View style={item.role === 'user' ? styles.userBubble : styles.aiBubble}>
                <Text style={item.role === 'user' ? styles.userText : styles.bodyText}>{item.role === 'ai' ? item.text.replace(/\*\*/g, '') : item.text}</Text>
                {!!item.note && <Text style={{ color: colors.slate500, fontSize: 11, fontStyle: 'italic', marginTop: -8 }}>{item.note}</Text>}
              </View>
            )}
            {/* Quick actions and follow-up questions belong to the latest answer only, so old ones don't pile up. */}
            {idx === lastAiIdx && (!!item.actions?.length || !!item.related?.length) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
                {item.actions?.map(a => (
                  <Pressable key={a} onPress={() => runAction(a)} accessibilityLabel={a} style={[chip, { backgroundColor: colors.royal600 }]}>
                    <Text style={[chipText, { color: '#fff' }]}>{a}</Text>
                  </Pressable>
                ))}
                {item.related?.map(q => (
                  <Pressable key={q.id} onPress={() => askFaq(q.id, q.question)} accessibilityLabel={`Ask: ${q.question}`} style={chip}>
                    <Ionicons name="help-circle-outline" size={14} color={colors.royal600} />
                    <Text style={chipText}>{q.question}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ))}
        {isTyping && (
          <View style={[styles.aiBubble, { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 12 }]}>
            {[0,1,2].map(i => (
              <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.slate300 }} />
            ))}
          </View>
        )}
        {activeApp && activeApp.issuesCount > 0 && sessionMessages.length > 0 && (
          <View style={styles.escalationCard}>
            <Text style={styles.rowTitle}>Complexity detected</Text>
            <Text style={styles.rowMeta}>{activeApp.issuesCount} open issue{activeApp.issuesCount === 1 ? '' : 's'} on your {activeApp.destinationCountry} application may affect submission risk. Share only selected context with a consultant.</Text>
            <Pressable style={styles.goldButton} onPress={openConsultants}><Text style={styles.primaryButtonText}>Find consultant</Text></Pressable>
          </View>
        )}
      </ScrollView>
      {!atBottom && (
        <Pressable
          accessibilityLabel="Scroll to latest message"
          onPress={() => scrollToEnd()}
          style={{ position: 'absolute', right: 14, bottom: 104 + bottomInset, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.royal600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6 }}
        >
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </Pressable>
      )}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: bottomInset + 6, gap: 6, backgroundColor: colors.slate50, borderTopWidth: 1, borderTopColor: colors.slate100 }}>
        {showFaq && (
          <View style={{ maxHeight: 210 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FaqPanel faq={faq} limit={3} askFaq={(id, q) => { setShowFaq(false); askFaq(id, q); }} />
            </ScrollView>
          </View>
        )}
        {sessionMessages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
            <Pressable onPress={() => setShowFaq(v => !v)} accessibilityLabel="FAQs" style={[chip, showFaq && { backgroundColor: colors.royal600 }]}>
              <Ionicons name="help-circle-outline" size={14} color={showFaq ? '#fff' : colors.royal600} />
              <Text style={[chipText, showFaq && { color: '#fff' }]}>FAQs</Text>
            </Pressable>
            {activeApp && (
              <Pressable onPress={() => askText(`What is the status of my ${activeApp.destinationCountry} visa application?`)} accessibilityLabel="Visa status" style={chip}>
                <Ionicons name="pulse-outline" size={14} color={colors.royal600} />
                <Text style={chipText}>Visa status</Text>
              </Pressable>
            )}
            {activeApp && (
              <Pressable onPress={startDocFlow} accessibilityLabel="Upload my documents" style={chip}>
                <Ionicons name="cloud-upload-outline" size={14} color={colors.royal600} />
                <Text style={chipText}>Documents</Text>
              </Pressable>
            )}
            <Pressable onPress={openConsultants} accessibilityLabel="Consultants" style={chip}>
              <Ionicons name="people-outline" size={14} color={colors.royal600} />
              <Text style={chipText}>Consultant</Text>
            </Pressable>
          </ScrollView>
        )}
        <Text style={{ fontSize: 10, color: '#92400E' }} numberOfLines={1}>AI guidance — not legal advice. Verify with the official embassy.</Text>
        <View style={styles.composer}>
          <TextInput value={message} onChangeText={setMessage} placeholder="Ask about your application" style={styles.input} returnKeyType="send" onSubmitEditing={sendMessage} />
          <Pressable style={styles.send} onPress={sendMessage} accessibilityLabel="Send message">
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MiniChat({ openBooking, documents }: { openBooking: () => void; documents: ApiDocument[] }) {
  const missingDocs = documents.filter((d) => d.status === 'Missing');
  const summary = missingDocs.length > 0
    ? `${missingDocs.map((d) => d.title).slice(0, 2).join(' and ')}${missingDocs.length > 2 ? `, and ${missingDocs.length - 2} more` : ''} ${missingDocs.length === 1 ? 'is' : 'are'} the current blocker${missingDocs.length === 1 ? '' : 's'}.`
    : 'No documents are currently blocking this application.';
  return (
    <Section title="Application chat">
      <Finding title="AI summary" meta={summary} />
      <Pressable style={styles.goldButton} onPress={openBooking}><Text style={styles.primaryButtonText}>Escalate to consultant</Text></Pressable>
    </Section>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(value) ? 'star' : 'star-outline'} size={11} color="#F59E0B" />
      ))}
      <Text style={{ fontSize: 11, color: colors.slate600, marginLeft: 4, fontWeight: '700' }}>{value.toFixed(1)}</Text>
    </View>
  );
}

function ConsultantsScreen({ consultantList, loadError, retryLoad, back, openProfile }: {
  consultantList: ReturnType<typeof normalizeConsultant>[];
  loadError?: string;
  retryLoad: () => void;
  back: () => void;
  openProfile: (id: string) => void;
}) {
  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Marketplace</Text>
      <Text style={styles.title}>Verified consultants</Text>
      {consultantList.length === 0 && !loadError && (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <ActivityIndicator size="large" color={colors.royal600} />
          <Text style={styles.rowMeta}>Loading consultants…</Text>
        </View>
      )}
      {loadError && consultantList.length === 0 && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 16, marginBottom: 12, alignItems: 'center', gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={{ color: '#991B1B', fontWeight: '700', textAlign: 'center' }}>{loadError}</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retryLoad}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      )}
      {consultantList.map((c) => (
        <Pressable key={c.id} style={styles.consultantCard} onPress={() => openProfile(c.id)}>
          <View style={{ position: 'relative' }}>
            <View style={[styles.consultantAvatar, { backgroundColor: c.avatarColor }]}>
              <Text style={styles.consultantAvatarText}>{c.initials}</Text>
            </View>
            {c.availableToday && (
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.green500, borderWidth: 2, borderColor: colors.white }} />
            )}
          </View>
          <View style={styles.flex}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.rowTitle}>{c.name}</Text>
              {c.verified && <Ionicons name="shield-checkmark" size={14} color={colors.royal600} />}
            </View>
            <Text style={styles.rowMeta}>{c.specialty}</Text>
            <StarRating value={c.rating} />
            <Text style={[styles.rowMeta, { marginTop: 2 }]}>{c.reviews} reviews · {c.responseTime}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontWeight: '900', color: colors.slate900, fontSize: 14 }}>{c.price}</Text>
            <Text style={[styles.rowMeta, { fontSize: 10 }]}>{c.availableToday ? '● Today' : c.nextSlot}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ConsultantProfileScreen({ id, consultantList, back, book }: {
  id: string;
  consultantList: ReturnType<typeof normalizeConsultant>[];
  back: () => void;
  book: (id: string) => void;
}) {
  const c = consultantList.find((item) => item.id === id) ?? null;
  if (!c) return <View><BackButton label="Consultants" onPress={back} /><Text style={[styles.rowMeta,{textAlign:'center',padding:32}]}>Consultant not found.</Text></View>;
  const stats: [IoniconName, string, string][] = [
    ['star',               'Rating',       `${c.rating}/5 (${c.reviews} reviews)`],
    ['time-outline',       'Response time',c.responseTime],
    ['location-outline',   'Jurisdictions',c.jurisdictions],
    ['language-outline',   'Languages',    c.languages],
    ['calendar-outline',   'Next slot',    c.nextSlot],
  ];
  return (
    <View>
      <BackButton label="Consultants" onPress={back} />
      <LinearGradient colors={['#0B1F4B', '#1547C0']} style={[styles.profileHero, { gap: 10 }]}>
        <View style={[styles.consultantAvatarLarge, { backgroundColor: `${c.avatarColor}30` }]}>
          <Text style={[styles.consultantAvatarText, { fontSize: 28, color: '#fff' }]}>{c.initials}</Text>
        </View>
        {c.verified && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
            <Ionicons name="shield-checkmark" size={13} color="#93C5FD" />
            <Text style={{ color: '#93C5FD', fontSize: 12, fontWeight: '700' }}>Verified Consultant</Text>
          </View>
        )}
        <Text style={styles.heroTitle}>{c.name}</Text>
        <Text style={styles.heroCopy}>{c.specialty}</Text>
        <StarRating value={c.rating} />
      </LinearGradient>
      <Section title="About">
        <Text style={[styles.rowMeta, { lineHeight: 20 }]}>{c.bio}</Text>
      </Section>
      <Section title="Details">
        {stats.map(([icon, label, val]) => (
          <View key={label} style={styles.taskRow}>
            <Ionicons name={icon} size={16} color={colors.royal600} style={{ width: 22 }} />
            <Text style={[styles.rowMeta, { width: 100 }]}>{label}</Text>
            <Text style={[styles.rowTitle, styles.flex]}>{val}</Text>
          </View>
        ))}
      </Section>
      <Pressable style={styles.primaryButton} onPress={() => book(c.id)}>
        <Text style={styles.primaryButtonText}>Book session · from {c.price}</Text>
      </Pressable>
      <ConsultantMessageBox consultantId={c.id} />
    </View>
  );
}

function ConsultantMessageBox({ consultantId }: { consultantId: string }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await apiSendMessage({ consultantId, text: trimmed });
      setText('');
      setSent(true);
    } catch {
      setError("Couldn't send your message. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Section title="Message this consultant">
      {sent && <Text style={[styles.rowMeta, { color: colors.green500, marginBottom: 8 }]}>Sent — find their reply under Profile → My messages.</Text>}
      {error && <Text style={[styles.rowMeta, { color: '#DC2626', marginBottom: 8 }]}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          value={text}
          onChangeText={(v) => { setText(v); setSent(false); }}
          placeholder="Ask a question before you book…"
          style={[styles.input, { flex: 1 }]}
          multiline
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressable style={[styles.send, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </Pressable>
      </View>
    </Section>
  );
}

// The client-side counterpart to ConsultantConsoleScreen's conversation
// list — without this, a message sent via ConsultantMessageBox had no way
// to ever be read again once a consultant replied (the reply-viewing UI only
// existed on the staff side). Same expand/reply pattern as the console.
function MyConversationsScreen({ back }: { back: () => void }) {
  const [threads, setThreads] = useState<ApiConversationThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ApiMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetchMyConversations()
      .then(r => setThreads(r.threads))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggleThread(threadId: string) {
    if (openThreadId === threadId) {
      setOpenThreadId(null);
      return;
    }
    setOpenThreadId(threadId);
    setReplyText('');
    setThreadMessages([]);
    setThreadLoading(true);
    try {
      const { messages } = await fetchMessages(threadId);
      setThreadMessages(messages);
    } catch {
      // Leave the thread empty — the reply box still works even if history fails to load.
    } finally {
      setThreadLoading(false);
    }
  }

  async function sendReply(consultantId: string) {
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const { message } = await apiSendMessage({ consultantId, text: trimmed });
      setThreadMessages((prev) => [...prev, message]);
      setReplyText('');
    } catch {
      Alert.alert('Could not send', 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Consultant messages</Text>
      <Text style={styles.title}>My messages</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
      {error && <LoadErrorNotice onRetry={load} />}
      {!loading && !error && (
        <Section title="Conversations">
          {threads.length === 0 && <Text style={[styles.rowMeta, { padding: 12 }]}>No conversations yet — message a consultant from their profile to start one.</Text>}
          {threads.map((t) => {
            const isOpen = openThreadId === t.threadId;
            return (
              <View key={t.threadId}>
                <Pressable onPress={() => toggleThread(t.threadId)}>
                  <View style={styles.taskRow}>
                    <View style={[styles.consultantAvatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.royal50 }]}>
                      <Text style={[styles.consultantAvatarText, { fontSize: 13 }]}>{t.consultantName.split(' ').map((n) => n[0]).join('')}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>{t.consultantName}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>{t.lastMessage}</Text>
                    </View>
                    {t.status === 'New reply' && <View style={[styles.statusDot, { backgroundColor: colors.royal600, marginRight: 4 }]} />}
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.slate500} />
                  </View>
                </Pressable>
                {isOpen && (
                  <View style={{ paddingHorizontal: 4, paddingBottom: 12, gap: 8 }}>
                    {threadLoading && <ActivityIndicator color={colors.royal600} />}
                    {!threadLoading && threadMessages.map((m) => (
                      <View key={m.id} style={{ alignSelf: m.senderRole === 'client' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.senderRole === 'client' ? colors.royal50 : colors.slate100, borderRadius: 10, padding: 8 }}>
                        <Text style={{ fontSize: 13, color: colors.slate900 }}>{m.text}</Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Reply…"
                        style={[styles.input, { flex: 1 }]}
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={() => sendReply(t.consultantId)}
                      />
                      <Pressable style={[styles.send, sending && { opacity: 0.6 }]} onPress={() => sendReply(t.consultantId)} disabled={sending}>
                        {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Section>
      )}
    </View>
  );
}

// Real "view and revoke" screen for consultant access grants — the profile
// screen used to describe this feature ("View and revoke consultant access
// from your profile") next to a plain, unclickable info row with no screen
// behind it at all. GET /access-grants and DELETE /access-grants/:id were
// already real and tested on the backend; only the mobile UI was missing.
function AccessGrantsScreen({ back }: { back: () => void }) {
  const [grants, setGrants] = useState<ApiAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(false);
    fetchMyAccessGrants()
      .then(r => setGrants(r.grants))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function confirmRevoke(grant: ApiAccessGrant) {
    Alert.alert(
      'Revoke access?',
      `${grant.consultantName} will immediately lose access to this application.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke', style: 'destructive', onPress: async () => {
            setRevokingId(grant.grantId);
            try {
              await revokeAccessGrant(grant.grantId);
              setGrants((prev) => prev.filter((g) => g.grantId !== grant.grantId));
            } catch {
              Alert.alert('Could not revoke access', 'Please try again.');
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Privacy and access</Text>
      <Text style={styles.title}>Consultant access grants</Text>
      <Text style={styles.bodyText}>Consultants you've shared application details with. Revoking removes their access immediately.</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
      {error && <LoadErrorNotice onRetry={load} />}
      {!loading && !error && (
        <Section title="Active grants">
          {grants.length === 0 && <Text style={[styles.rowMeta, { padding: 12 }]}>You haven't shared access with any consultant yet.</Text>}
          {grants.map((g) => (
            <View key={g.grantId} style={styles.taskRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{g.consultantName}{g.destinationCountry ? ` · ${g.destinationCountry}` : ''}</Text>
                <Text style={styles.rowMeta}>{g.categories.join(', ')}</Text>
                <Text style={[styles.rowMeta, { fontSize: 11 }]}>Expires {new Date(g.expiresAt).toLocaleDateString()}</Text>
              </View>
              <Pressable
                onPress={() => confirmRevoke(g)}
                disabled={revokingId === g.grantId}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.slate100 }}
              >
                {revokingId === g.grantId
                  ? <ActivityIndicator size="small" color="#DC2626" />
                  : <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>Revoke</Text>}
              </Pressable>
            </View>
          ))}
        </Section>
      )}
    </View>
  );
}

function BookingScreen({ consultantId, consultantList, sessionOpts, loadError, retryLoad, onMount, selected, back, select, pickSlot, continueToConsent }: {
  consultantId: string;
  consultantList: ReturnType<typeof normalizeConsultant>[];
  sessionOpts: ReturnType<typeof normalizeSessionOption>[];
  loadError?: string;
  retryLoad: () => void;
  onMount: () => void;
  selected?: string;
  back: () => void;
  select: (optionId: string) => void;
  pickSlot: (optionId: string) => void;
  continueToConsent: (optionId: string) => void;
}) {
  useEffect(() => { onMount(); }, []);
  const consultant = consultantList.find((item) => item.id === consultantId) ?? consultantList[0];
  const chosen = selected ?? (sessionOpts[1]?.id ?? sessionOpts[0]?.id ?? '');
  return (
    <View>
      <BackButton label="Consultant" onPress={back} />
      <Text style={styles.eyebrow}>VIP booking</Text>
      <Text style={styles.title}>Book {consultant?.name ?? 'consultant'}</Text>
      {sessionOpts.length === 0 && loadError && (
        <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>{loadError}</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retryLoad}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      )}
      {sessionOpts.length === 0 && !loadError && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="large" color={colors.royal600} />
          <Text style={[styles.rowMeta, { marginTop: 8 }]}>Loading session options…</Text>
        </View>
      )}
      {sessionOpts.map((option) => (
        <Pressable key={option.id} style={[styles.optionCard, chosen === option.id && styles.optionCardActive]} onPress={() => select(option.id)}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{option.title} · {option.price}</Text>
            <Text style={styles.rowMeta}>{option.duration} · {option.detail}</Text>
          </View>
          {chosen === option.id && <Ionicons name="checkmark-circle" size={22} color={colors.royal600} />}
          {option.recommended && <View style={{ position: 'absolute', top: -8, right: 12, backgroundColor: colors.royal600, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}><Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>BEST VALUE</Text></View>}
        </Pressable>
      ))}
      <Pressable style={[styles.secondaryButton, { flexDirection: 'row', gap: 8, marginTop: 8 }]} onPress={() => pickSlot(chosen)}>
        <Ionicons name="calendar-outline" size={18} color={colors.royal600} />
        <Text style={styles.secondaryButtonText}>Pick a time slot</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={() => continueToConsent(chosen)}>
        <Text style={styles.primaryButtonText}>Continue to consent</Text>
      </Pressable>
    </View>
  );
}

// ─── Consent (grant access + accept terms) ────────────────────────────────────
const SHARE_TERMS_VERSION = '2026-09';
const CONSENT_ITEMS = [
  { label: 'Profile & identity check', category: 'profile', detail: 'Name, nationality, destination, readiness score and whether your face was verified against your passport.', on: true },
  { label: 'Documents & passport details', category: 'documents', detail: 'Which documents you uploaded and the passport details read from it. Original files are not shared.', on: true },
  { label: 'Audit findings', category: 'audit_findings', detail: 'The score and findings for each document.', on: true },
  { label: 'Requirements checklist', category: 'requirements', detail: 'Which requirements you have met and which are missing.', on: true },
  { label: 'Contact details', category: 'contact', detail: 'How to reach you through the platform.', on: false },
  { label: 'Selected chat messages', category: 'ai_messages', detail: 'Your assistant conversation about this application.', on: false },
] as const;

function ConsentScreen({ consultantName, mode, back, confirm }: {
  consultantName: string;
  /** 'book' finishes a booking; 'share' only grants access for an existing appointment. */
  mode: 'book' | 'share';
  back: () => void;
  confirm: (categories: string[]) => Promise<void> | void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [consent, setConsent] = useState<boolean[]>(CONSENT_ITEMS.map((c) => c.on));
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const chosen = CONSENT_ITEMS.filter((_, i) => consent[i]).map((c) => c.category as string);
  const canConfirm = accepted && chosen.length > 0 && !confirming;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setConfirming(true);
    try { await confirm(chosen); } finally { setConfirming(false); }
  };

  return (
    <View style={{ gap: 14 }}>
      <BackButton label={mode === 'book' ? 'Booking' : 'Bookings'} onPress={back} />
      <View>
        <Text style={styles.eyebrow}>You stay in control</Text>
        <Text style={[styles.title, { marginBottom: 4 }]}>Share your case with {consultantName}?</Text>
        <Text style={[styles.rowMeta, { lineHeight: 19 }]}>{consultantName} can see nothing about you until you grant access. Choose exactly what to share — you can revoke it at any time.</Text>
      </View>
      {CONSENT_ITEMS.map((item, index) => (
        <Pressable key={item.category} style={styles.consentRow} onPress={() => setConsent((prev) => prev.map((v, i) => (i === index ? !v : v)))} accessibilityLabel={item.label}>
          <View style={[styles.checkbox, consent[index] && styles.checkboxOn]}>
            {consent[index] && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{item.label}</Text>
            <Text style={styles.rowMeta}>{item.detail}</Text>
          </View>
        </Pressable>
      ))}

      <View style={{ backgroundColor: colors.slate50, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.slate100 }}>
        <Pressable onPress={() => setAccepted((v) => !v)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }} accessibilityLabel="I accept the data sharing terms">
          <View style={[styles.checkbox, accepted && styles.checkboxOn, { marginTop: 2 }]}>
            {accepted && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={{ flex: 1, color: colors.slate800, fontSize: 13.5, lineHeight: 20 }}>
            I accept the data-sharing terms and grant {consultantName} access to the items I selected above.
          </Text>
        </Pressable>
        <Pressable onPress={() => setShowTerms((v) => !v)} hitSlop={6}>
          <Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 13 }}>{showTerms ? 'Hide the terms' : 'Read the terms'}</Text>
        </Pressable>
        {showTerms && (
          <View style={{ gap: 6 }}>
            {[
              `${consultantName} may view only the items you selected, for this application, to prepare for and hold your appointment.`,
              'Access ends automatically after 7 days, and you can revoke it at any time from Bookings or Profile → Privacy and access.',
              'They must not copy, store outside this platform, or share what they see with anyone else.',
              'Every time a consultant opens your case it is recorded.',
              'Nothing you do not select is shared, and your original document files are never shared.',
            ].map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: colors.slate500 }}>•</Text>
                <Text style={{ flex: 1, color: colors.slate600, fontSize: 12.5, lineHeight: 18 }}>{t}</Text>
              </View>
            ))}
            <Text style={{ color: colors.slate500, fontSize: 11 }}>Terms version {SHARE_TERMS_VERSION}</Text>
          </View>
        )}
      </View>

      <Pressable style={[styles.primaryButton, { marginTop: 0 }, !canConfirm && styles.disabledButton]} onPress={canConfirm ? handleConfirm : undefined} accessibilityLabel={mode === 'book' ? 'Confirm booking' : 'Grant access'}>
        {confirming ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, !canConfirm && styles.disabledButtonText]}>{mode === 'book' ? 'Grant access & confirm booking' : 'Grant access'}</Text>}
      </Pressable>
      {!accepted && <Text style={{ color: colors.slate500, fontSize: 12, textAlign: 'center' }}>Accept the terms to continue.</Text>}
    </View>
  );
}

// ─── Call button (Google Meet) ────────────────────────────────────────────────
function CallButton({ bookingId, call, compact }: { bookingId: string; call: ApiCallInfo; compact?: boolean }) {
  const [joining, setJoining] = useState(false);
  if (!call.available) return null;
  const opensAt = new Date(call.opensAt);
  const closed = Date.now() > Date.parse(call.closesAt);
  const join = async () => {
    setJoining(true);
    try {
      const { url } = await joinBookingCall(bookingId);
      openUrlSafely(url);
    } catch (e: any) {
      Alert.alert('Can’t join yet', e?.message ?? 'Please try again in a moment.');
    } finally {
      setJoining(false);
    }
  };
  if (closed) return null;
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        disabled={!call.open || joining}
        onPress={join}
        accessibilityLabel="Join call"
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: compact ? 10 : 12, borderRadius: 12, backgroundColor: call.open ? colors.green500 : colors.slate100 }}
      >
        {joining ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="videocam" size={18} color={call.open ? '#fff' : colors.slate500} />}
        <Text style={{ color: call.open ? '#fff' : colors.slate500, fontWeight: '800', fontSize: 13.5 }}>
          {call.open ? 'Join call' : `Call opens ${opensAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
        </Text>
      </Pressable>
      {call.open && <Text style={{ color: colors.slate500, fontSize: 11, textAlign: 'center' }}>Opens Google Meet — turn your camera off there for a voice-only call.</Text>}
    </View>
  );
}

// ─── Consultant workspace ─────────────────────────────────────────────────────
const CONSULTANT_TABS = [
  { id: 'schedule', label: 'Schedule', icon: 'calendar' as IoniconName, iconOff: 'calendar-outline' as IoniconName },
  { id: 'clients', label: 'Clients', icon: 'people' as IoniconName, iconOff: 'people-outline' as IoniconName },
  { id: 'cprofile', label: 'Profile', icon: 'person' as IoniconName, iconOff: 'person-outline' as IoniconName },
] as const;
type ConsultantTabId = (typeof CONSULTANT_TABS)[number]['id'];

function WorkspaceBadge() {
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy900, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginBottom: 10 }}>
      <Ionicons name="briefcase" size={12} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 }}>CONSULTANT WORKSPACE</Text>
    </View>
  );
}

function AccessChip({ access }: { access: ApiConsultantAppointment['access'] }) {
  const granted = access.granted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: granted ? '#DCFCE7' : '#FEF3C7', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' }}>
      <Ionicons name={granted ? 'lock-open' : 'lock-closed'} size={11} color={granted ? '#15803D' : '#B45309'} />
      <Text style={{ color: granted ? '#15803D' : '#B45309', fontSize: 11, fontWeight: '800' }}>{granted ? 'Case shared' : 'Waiting for client access'}</Text>
    </View>
  );
}

function ConsultantScheduleScreen({ me, appointments, loading, error, retry, openCase }: {
  me: ApiConsultantMe | null;
  appointments: ApiConsultantAppointment[];
  loading: boolean;
  error: string;
  retry: () => void;
  openCase: (bookingId: string) => void;
}) {
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const now = Date.now();
  const isPast = (a: ApiConsultantAppointment) => a.status === 'cancelled' || (!!a.slotISO && Date.parse(a.slotISO) < now);
  const upcoming = appointments.filter((a) => !isPast(a)).sort((x, y) => (x.slotISO ?? '9').localeCompare(y.slotISO ?? '9'));
  const past = appointments.filter(isPast).sort((x, y) => (y.slotISO ?? y.createdAt).localeCompare(x.slotISO ?? x.createdAt));
  const shown = filter === 'upcoming' ? upcoming : past;
  const today = upcoming.filter((a) => a.slotISO && new Date(a.slotISO).toDateString() === new Date().toDateString());
  return (
    <View style={{ gap: 14 }}>
      <View>
        <WorkspaceBadge />
        <Text style={[styles.title, { marginBottom: 2 }]}>{me?.name ? `Hi, ${me.name.split(' ')[0]}` : 'Your schedule'}</Text>
        <Text style={styles.rowMeta}>{today.length ? `${today.length} appointment${today.length === 1 ? '' : 's'} today` : upcoming.length ? `${upcoming.length} upcoming` : 'No upcoming appointments'}{me?.specialty ? ` · ${me.specialty}` : ''}</Text>
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: 14, padding: 4 }}>
        {([['upcoming', `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}`], ['past', 'Past & cancelled']] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setFilter(id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11, backgroundColor: filter === id ? colors.white : 'transparent' }}>
            <Text style={{ color: filter === id ? colors.navy900 : colors.slate500, fontWeight: '800', fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {loading && appointments.length === 0 && <View style={{ padding: 30, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.royal600} /></View>}
      {!!error && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 16, alignItems: 'center', gap: 10 }}>
          <Text style={{ color: '#991B1B', fontWeight: '700', textAlign: 'center' }}>{error}</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retry}><Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text></Pressable>
        </View>
      )}
      {!loading && !error && shown.length === 0 && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 30, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate100 }}>
          <Ionicons name="calendar-outline" size={30} color={colors.royal600} />
          <Text style={{ color: colors.slate900, fontWeight: '900', fontSize: 16 }}>{filter === 'upcoming' ? 'Nothing scheduled' : 'Nothing here yet'}</Text>
          <Text style={{ color: colors.slate500, textAlign: 'center', fontSize: 13, paddingHorizontal: 28 }}>Appointments clients book with you will appear here.</Text>
        </View>
      )}
      {shown.map((a) => {
        const slot = formatSlot(a.slotISO);
        const cancelled = a.status === 'cancelled';
        return (
          <Pressable key={a.bookingId} onPress={() => openCase(a.bookingId)} accessibilityLabel={`Open ${a.clientName}`} style={{ backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate100, padding: 14, gap: 10, opacity: cancelled ? 0.7 : 1 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 52, borderRadius: 14, backgroundColor: colors.royal50, alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: colors.royal600, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{slot ? slot.weekday : '—'}</Text>
                <Text style={{ color: colors.navy900, fontSize: 20, fontWeight: '900' }}>{slot ? slot.dayNum : '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{a.clientName}</Text>
                <Text style={{ color: colors.slate500, fontSize: 12.5 }} numberOfLines={1}>{a.sessionLabel}{a.destinationCountry ? ` · ${a.destinationCountry}` : ''}</Text>
                <Text style={{ color: colors.slate700, fontSize: 12.5, fontWeight: '700', marginTop: 2 }}>{slot ? `${slot.day} · ${slot.time}` : 'Time to be confirmed'}</Text>
              </View>
              {cancelled ? <Text style={{ color: '#B91C1C', fontWeight: '800', fontSize: 11 }}>Cancelled</Text> : <Ionicons name="chevron-forward" size={18} color={colors.slate300} />}
            </View>
            {!cancelled && <AccessChip access={a.access} />}
            {!cancelled && filter === 'upcoming' && <CallButton bookingId={a.bookingId} call={a.call} compact />}
          </Pressable>
        );
      })}
    </View>
  );
}

function ConsultantClientsScreen({ appointments, openCase }: { appointments: ApiConsultantAppointment[]; openCase: (bookingId: string) => void }) {
  // One row per client application (their latest active appointment), so a consultant sees who they
  // are working with and whether they can open the case.
  const byApp = new Map<string, ApiConsultantAppointment>();
  for (const a of appointments.filter((x) => x.status !== 'cancelled')) {
    const cur = byApp.get(a.applicationId);
    if (!cur || (a.slotISO ?? '') > (cur.slotISO ?? '')) byApp.set(a.applicationId, a);
  }
  const clients = [...byApp.values()];
  return (
    <View style={{ gap: 14 }}>
      <View>
        <WorkspaceBadge />
        <Text style={[styles.title, { marginBottom: 2 }]}>Clients</Text>
        <Text style={styles.rowMeta}>You can open a client’s case only after they grant you access.</Text>
      </View>
      {clients.length === 0 && <Text style={[styles.rowMeta, { textAlign: 'center', paddingVertical: 30 }]}>No clients yet.</Text>}
      {clients.map((a) => (
        <Pressable key={a.applicationId} onPress={() => openCase(a.bookingId)} style={{ backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.slate100, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.royal600, fontWeight: '900' }}>{a.clientName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 15 }}>{a.clientName}</Text>
              <Text style={{ color: colors.slate500, fontSize: 12.5 }}>{a.destinationCountry ?? '—'}{a.visaType ? ` · ${a.visaType}` : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
          </View>
          <AccessChip access={a.access} />
        </Pressable>
      ))}
    </View>
  );
}

function ApiPassportCard({ data }: { data: ApiPassportData }) {
  const months = data.expiryDate ? monthsUntil(data.expiryDate) : null;
  const rows: Array<[string, string]> = [
    ['Name', `${data.givenNames} ${data.surname}`.trim()],
    ['Passport no.', data.documentNumber],
    ['Nationality', data.nationality],
    ['Date of birth', data.birthDate ?? '—'],
    ['Expiry', data.expiryDate ? `${data.expiryDate}${months !== null ? (months < 0 ? ' · expired' : ` · ${months} mo left`) : ''}` : '—'],
  ];
  return (
    <View style={{ backgroundColor: colors.navy900, borderRadius: 16, padding: 14, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="id-card-outline" size={16} color="#93C5FD" />
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, flex: 1 }}>Passport details (read on the client’s phone)</Text>
        <Text style={{ color: data.checksumsValid ? '#34D399' : '#F59E0B', fontSize: 11, fontWeight: '800' }}>{data.checksumsValid ? 'Checksums valid' : 'Some unclear'}</Text>
      </View>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{k}</Text>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function FaceBadge({ face }: { face: { verified: false } | { verified: true; passportSimilarity: number } }) {
  return face.verified ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' }}>
      <Ionicons name="shield-checkmark" size={14} color="#15803D" />
      <Text style={{ color: '#15803D', fontSize: 12, fontWeight: '800' }}>Face verified · {Math.round(face.passportSimilarity * 100)}% match to passport</Text>
    </View>
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' }}>
      <Ionicons name="shield-outline" size={14} color="#B45309" />
      <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '800' }}>Face not verified yet</Text>
    </View>
  );
}

function ConsultantCaseScreen({ bookingId, appointment, back }: { bookingId: string; appointment: ApiConsultantAppointment | null; back: () => void }) {
  const [data, setData] = useState<ApiConsultantCase | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetchConsultantCase(bookingId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: any) => { if (!cancelled) setError({ message: e?.message ?? 'Could not load the case.' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bookingId, attempt]);
  const slot = formatSlot(appointment?.slotISO ?? null);
  const sevColor = (sev: string) => (sev === 'red_flag' ? '#DC2626' : sev === 'warn' ? '#D97706' : sev === 'pass' ? '#16A34A' : colors.royal600);
  return (
    <View style={{ gap: 14 }}>
      <BackButton label="Schedule" onPress={back} />
      <View>
        <WorkspaceBadge />
        <Text style={[styles.title, { marginBottom: 2 }]}>{appointment?.clientName ?? 'Client case'}</Text>
        <Text style={styles.rowMeta}>{appointment ? `${appointment.sessionLabel}${appointment.destinationCountry ? ` · ${appointment.destinationCountry}` : ''}${slot ? ` · ${slot.day}, ${slot.time}` : ''}` : ''}</Text>
      </View>
      {appointment && appointment.status !== 'cancelled' && <CallButton bookingId={appointment.bookingId} call={appointment.call} />}

      {loading && <View style={{ padding: 30, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.royal600} /></View>}

      {!loading && error && (
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 18, gap: 8, alignItems: 'center' }}>
          <Ionicons name="lock-closed" size={30} color="#B45309" />
          <Text style={{ color: '#92400E', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>Access not granted</Text>
          <Text style={{ color: '#92400E', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
            This client hasn’t granted you access to their case. They can share it from their Bookings screen — you’ll see it here the moment they do.
          </Text>
          <Pressable style={[styles.smallButton, { marginTop: 4 }]} onPress={() => setAttempt((a) => a + 1)}><Text style={styles.smallButtonText}>Check again</Text></Pressable>
        </View>
      )}

      {!loading && data && (
        <View style={{ gap: 14 }}>
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name="lock-open" size={18} color="#047857" />
            <Text style={{ flex: 1, color: '#065F46', fontSize: 12.5, lineHeight: 18 }}>
              Shared by the client: {data.shared.map((c) => c.replace('_', ' ')).join(', ')}. Access ends {new Date(data.access.expiresAt).toLocaleDateString()}. Your view is recorded.
            </Text>
          </View>

          {data.profile && (
            <Section title="Applicant">
              <FaceBadge face={data.profile.faceVerified} />
              <Finding title={data.profile.applicantName} meta={`${data.profile.destinationCountry} · ${data.profile.visaType}`} />
              <Finding title="Nationality / residence" meta={`${data.profile.nationality ?? '—'} · ${data.profile.residenceCountry ?? '—'}`} />
              <Finding title={`Readiness ${data.profile.readinessScore}/100`} meta={`Status: ${data.profile.status} · travel ${data.profile.intendedFrom}`} />
            </Section>
          )}
          {data.passportData && <ApiPassportCard data={data.passportData} />}
          {data.documents && (
            <Section title="Documents">
              {data.documents.length === 0 && <Text style={styles.rowMeta}>No documents uploaded yet.</Text>}
              {data.documents.map((d) => <Finding key={d.type} title={documentTypeLabel(d.type)} meta={`Score ${d.score}/100 · ${AUDIT_STATUS_LABEL[d.status] ?? d.status}`} />)}
            </Section>
          )}
          {data.requirements && (
            <Section title="Requirements">
              {data.requirements.map((r) => <TaskRow key={r.id} title={r.title} meta={r.required ? 'Required' : 'Optional'} done={r.met} />)}
            </Section>
          )}
          {data.auditFindings && data.auditFindings.map((doc) => (
            <Section key={doc.type} title={`${documentTypeLabel(doc.type)} — findings`}>
              {doc.findings.length === 0 && <Text style={styles.rowMeta}>No findings.</Text>}
              {doc.findings.map((f) => (
                <View key={f.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.slate100 }}>
                  <Text style={{ color: sevColor(f.severity), fontWeight: '800', fontSize: 13 }}>{f.title}</Text>
                  <Text style={{ color: colors.slate600, fontSize: 12.5, lineHeight: 18, marginTop: 2 }}>{f.description}</Text>
                </View>
              ))}
            </Section>
          ))}
          {data.contact && <Section title="Contact"><Text style={styles.rowMeta}>{data.contact.note}</Text></Section>}
        </View>
      )}
    </View>
  );
}

function ConsultantWorkspaceProfileScreen({ me, authUser, canSwitch, switchToPersonal, onSignOut }: { me: ApiConsultantMe | null; authUser: AuthUser | null; canSwitch: boolean; switchToPersonal: () => void; onSignOut: () => void }) {
  return (
    <View style={{ gap: 14 }}>
      <WorkspaceBadge />
      <Text style={[styles.title, { marginBottom: 0 }]}>{me?.name ?? authUser?.name ?? 'Consultant'}</Text>
      <Text style={styles.rowMeta}>{me?.specialty ?? 'Consultant'} · {authUser?.email}</Text>
      {me && !me.linked && (
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14 }}>
          <Text style={{ color: '#92400E', fontWeight: '800' }}>Your login isn’t linked to a consultant profile yet.</Text>
          <Text style={{ color: '#92400E', fontSize: 12.5, marginTop: 4 }}>Ask a platform admin to link {authUser?.email} so clients can book you.</Text>
        </View>
      )}
      <Section title="How client data works">
        <TaskRow title="Nothing is visible by default" meta="You see a client’s name and destination for your appointments — nothing more." done />
        <TaskRow title="Clients grant access explicitly" meta="After they accept the sharing terms and choose what to share." done />
        <TaskRow title="Every view is recorded" meta="Access expires automatically and clients can revoke it any time." done />
      </Section>
      {canSwitch && (
        <Pressable style={styles.secondaryButton} onPress={switchToPersonal}><Text style={styles.secondaryButtonText}>Switch to my personal account</Text></Pressable>
      )}
      <Pressable style={[styles.secondaryButton, { borderColor: '#FECACA' }]} onPress={() => Alert.alert('Sign out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: onSignOut }])}>
        <Text style={[styles.secondaryButtonText, { color: '#B91C1C' }]}>Sign out</Text>
      </Pressable>
    </View>
  );
}

function ConfirmationScreen({ consultantId, consultantList, booking, done, score, openPartners, openBookings }: {
  openBookings?: () => void;
  consultantId: string;
  consultantList: ReturnType<typeof normalizeConsultant>[];
  booking: ApiBooking | null;
  done: () => void;
  score?: number;
  openPartners?: () => void;
}) {
  const consultant = consultantList.find((item) => item.id === consultantId) ?? consultantList[0] ?? null;
  const showUpsell = (score ?? 0) >= 95;
  if (!consultant) return (
    <View>
      <LinearGradient colors={['#059669', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successHero}>
        <Ionicons name="checkmark-circle" size={64} color="#fff" />
        <Text style={styles.heroTitle}>Booking requested</Text>
        <Text style={styles.heroCopy}>Your consultant will reach out shortly.</Text>
      </LinearGradient>
      {booking?.bookingId && <Section title="Booking ID"><Finding title={booking.bookingId} meta="Keep this for your records." /></Section>}
      <Pressable style={styles.primaryButton} onPress={done}><Text style={styles.primaryButtonText}>Back to dashboard</Text></Pressable>
    </View>
  );
  const PARTNER_HIGHLIGHTS = [
    { icon: 'airplane-outline' as IoniconName, name: 'Emirates', tagline: '8% off your flight booking', color: '#1A56DB' },
    { icon: 'home-outline' as IoniconName, name: 'Airbnb', tagline: '10% off your first stay', color: '#7C3AED' },
    { icon: 'shield-checkmark-outline' as IoniconName, name: 'AXA Travel', tagline: 'Schengen insurance from AED 80', color: '#059669' },
  ];

  return (
    <View>
      <LinearGradient colors={['#059669', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successHero}>
        <Ionicons name="checkmark-circle" size={64} color="#fff" />
        <Text style={styles.heroTitle}>Booking requested</Text>
        <Text style={styles.heroCopy}>{consultant.name} receives only your consent-approved summary.</Text>
      </LinearGradient>
      <Section title="Next steps">
        {booking?.calendlyUrl ? (
          <Pressable style={styles.taskRow} onPress={() => openUrlSafely(booking.calendlyUrl)}>
            <Ionicons name="calendar" size={20} color={colors.royal600} />
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Schedule your session</Text>
              <Text style={[styles.rowMeta, { color: colors.royal600 }]}>Tap to open Calendly and pick a time slot</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.royal600} />
          </Pressable>
        ) : (
          <TaskRow title="Calendar invite" meta="Booking confirmed — consultant will reach out shortly." done />
        )}
        <TaskRow title="Access grant" meta="Revocable sharing snapshot is recorded." done />
        {booking?.bookingId && (
          <TaskRow title={`Booking ID: ${booking.bookingId}`} meta="Keep this for your records." done />
        )}
      </Section>

      {/* FEAT I: Ecosystem partner upsell for high-scoring applicants */}
      {showUpsell && (
        <View style={{ marginHorizontal: 0, marginTop: 4 }}>
          <LinearGradient colors={['#0B1F4B', '#1A56DB']} style={{ borderRadius: 16, padding: 20, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="star" size={22} color="#FCD34D" />
              <View style={styles.flex}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Your score is visa-ready!</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Exclusive partner offers for Visa With Ease members</Text>
              </View>
            </View>
            {PARTNER_HIGHLIGHTS.map((p) => (
              <View key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${p.color}25`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={p.icon} size={18} color="#fff" />
                </View>
                <View style={styles.flex}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{p.name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>{p.tagline}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </View>
            ))}
            <Pressable onPress={openPartners} style={{ backgroundColor: '#FCD34D', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: '#0B1F4B', fontWeight: '900', fontSize: 14 }}>Explore all partner offers</Text>
            </Pressable>
          </LinearGradient>
        </View>
      )}

      {openBookings && <Pressable style={styles.primaryButton} onPress={openBookings}><Text style={styles.primaryButtonText}>View my bookings</Text></Pressable>}
      <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={done}><Text style={styles.secondaryButtonText}>Back to dashboard</Text></Pressable>
    </View>
  );
}

function ProfileScreen({
  authUser, openSettings, openConsultants, openConsole, openHr, openEmployee, openAdmin,
  openCalculator, openBankBalance, openEmbassy, openFaceVerification, openTimeline, openComparison,
  openVisaWaiver, openRejectionAnalyzer, openProfileHub, openProTier, openPartners, openMyMessages, openAccessGrants, onSignOut,
  openHowTo, startTour,
}: {
  authUser: AuthUser | null;
  openSettings: () => void; openConsultants: () => void; openConsole: () => void;
  openHr: () => void; openEmployee: () => void; openAdmin: () => void;
  openCalculator: () => void; openBankBalance: () => void; openEmbassy: () => void; openFaceVerification: () => void;
  openTimeline: () => void; openComparison: () => void;
  openVisaWaiver: () => void; openRejectionAnalyzer: () => void; openProfileHub: () => void; openProTier: () => void;
  openPartners: () => void; openMyMessages: () => void; openAccessGrants: () => void; onSignOut: () => void;
  openHowTo: () => void; startTour: () => void;
}) {
  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
    ]);
  };
  const tools: [IoniconName, string, () => void, string][] = [
    ['calculator-outline',   'Visa Score Calculator',   openCalculator,  colors.royal600],
    ['wallet-outline',       'Bank Balance Estimator',  openBankBalance, colors.green500],
    ['business-outline',     'Embassy Finder',          openEmbassy,     colors.navy900],
    ['scan-outline',         'Face Verification',       openFaceVerification, colors.teal500],
    ['time-outline',         'Timeline Tracker',        openTimeline,    colors.purple600],
    ['git-compare-outline',  'Country Comparison',      openComparison,  colors.gold500],
    ['checkmark-done-outline','Visa Waiver Checker',   openVisaWaiver,  colors.teal500],
    ['document-text-outline','Rejection Analyzer',     openRejectionAnalyzer, '#DC2626'],
    ['person-circle-outline','Profile Completeness',   openProfileHub,  colors.purple600],
    ['star-outline',          'Pro Tier Features',      openProTier,     colors.gold500],
    ['gift-outline',          'Ecosystem Partners',     openPartners,    '#059669'],
  ];
  return (
    <View>
      <Text style={styles.eyebrow}>Profile</Text>
      <Text style={styles.title}>{authUser?.name ?? 'Your profile'}</Text>
      <Section title="Account">
        <Finding title="Email" meta={authUser?.email ?? '—'} />
        <Finding title="Account ID" meta={authUser?.uid ?? '—'} />
      </Section>
      <Section title="Help and guides">
        {([
          ['compass-outline', 'Take a tour of the app', startTour, colors.royal600],
          ['book-outline', 'How to use Visa With Ease', openHowTo, colors.teal500],
        ] as [IoniconName, string, () => void, string][]).map(([icon, label, onPress, color]) => (
          <Pressable key={label} style={styles.taskRow} onPress={onPress}>
            <View style={[styles.quickIconBox, { backgroundColor: `${color}18`, width: 36, height: 36 }]}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
          </Pressable>
        ))}
      </Section>
      <Section title="AI Tools">
        {tools.map(([icon, label, onPress, color]) => (
          <Pressable key={label} style={styles.taskRow} onPress={onPress}>
            <View style={[styles.quickIconBox, { backgroundColor: `${color}18`, width: 36, height: 36 }]}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
          </Pressable>
        ))}
      </Section>
      <Section title="Privacy and access">
        <TaskRow title="Data deletion request" meta="GDPR / UAE PDPL queue with 30-day SLA." />
        <Pressable style={styles.taskRow} onPress={openAccessGrants}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>Consultant access grants</Text>
            <Text style={styles.rowMeta}>View and revoke consultant access from your profile.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
        </Pressable>
        <Pressable style={styles.taskRow} onPress={openSettings} accessibilityLabel="Fingerprint or face unlock settings">
          <View style={[styles.taskMark]}><Ionicons name="finger-print" size={14} color={colors.royal600} /></View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>Fingerprint or face unlock</Text>
            <Text style={styles.rowMeta}>Open the app with your phone’s biometrics. Turn it on in Settings.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
        </Pressable>
      </Section>
      <OfflineCacheCard />
      <Pressable style={styles.primaryButton} onPress={openSettings}><Text style={styles.primaryButtonText}>Settings</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={openMyMessages}><Text style={styles.secondaryButtonText}>My messages</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={openConsultants}><Text style={styles.secondaryButtonText}>Manage consultants</Text></Pressable>
      {(authUser?.roles.includes('consultant') || authUser?.roles.includes('platform_admin')) && (
        <Pressable style={styles.secondaryButton} onPress={openConsole}><Text style={styles.secondaryButtonText}>Consultant console</Text></Pressable>
      )}
      {(authUser?.roles.includes('hr_admin') || authUser?.roles.includes('platform_admin')) && (
        <Pressable style={styles.secondaryButton} onPress={openHr}><Text style={styles.secondaryButtonText}>HR portal</Text></Pressable>
      )}
      {(authUser?.roles.includes('employee') || authUser?.roles.includes('consumer') || authUser?.roles.includes('platform_admin')) && (
        <Pressable style={styles.secondaryButton} onPress={openEmployee}><Text style={styles.secondaryButtonText}>Employee portal</Text></Pressable>
      )}
      {authUser?.roles.includes('platform_admin') && (
        <Pressable style={styles.secondaryButton} onPress={openAdmin}><Text style={styles.secondaryButtonText}>Admin overview</Text></Pressable>
      )}
      <Pressable
        style={{ marginTop: 24, minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#DC2626', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        onPress={confirmSignOut}
      >
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        <Text style={{ color: '#DC2626', fontWeight: '900' }}>Sign out</Text>
      </Pressable>
    </View>
  );
}

import { BASE_URL, getToken } from './src/api';

function useApiData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${BASE_URL}${path}`, { headers })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [path, attempt]);
  return { data, loading, error, retry: () => setAttempt(a => a + 1) };
}

function LoadErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ padding: 20, alignItems: 'center', gap: 10 }}>
      <Text style={styles.rowMeta}>Couldn't load this right now.</Text>
      <Pressable style={[styles.primaryButton, { paddingHorizontal: 24 }]} onPress={onRetry}>
        <Text style={styles.primaryButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function ConsultantConsoleScreen({ back }: { back: () => void }) {
  const { data, loading, error, retry } = useApiData<any>('/consultant-console');
  const crm = data?.crm ?? [];
  const queue = data?.queue ?? [];
  const conversations = data?.conversations ?? [];
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [threadMessages, setThreadMessages] = useState<ApiMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  async function toggleThread(threadId: string) {
    if (openThreadId === threadId) {
      setOpenThreadId(null);
      return;
    }
    setOpenThreadId(threadId);
    setReplyText('');
    setThreadMessages([]);
    setThreadLoading(true);
    try {
      const { messages } = await fetchMessages(threadId);
      setThreadMessages(messages);
    } catch {
      // Leave the thread empty — the reply box still works even if history fails to load.
    } finally {
      setThreadLoading(false);
    }
  }

  async function sendReply(threadId: string) {
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const { message } = await apiSendMessage({ threadId, text: trimmed });
      setThreadMessages((prev) => [...prev, message]);
      setReplyText('');
    } catch {
      Alert.alert('Could not send', 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Consultant console</Text>
      <Text style={styles.title}>Queue and CRM</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
      {error && <LoadErrorNotice onRetry={retry} />}
      {crm.length > 0 && (
        <View style={styles.quickGrid}>
          {crm.slice(0, 4).map((item: any) => (
            <View key={item.label} style={[styles.quickAction, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.navy900 }}>{item.value}</Text>
              <Text style={[styles.rowMeta, { textAlign: 'center', marginTop: 2 }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
      {!loading && !error && (
        <Section title="Today's queue">
          {queue.length === 0 && <Text style={[styles.rowMeta, { padding: 12 }]}>No shared applications yet — a client hasn't granted you access to any application.</Text>}
          {queue.map((item: any) => (
            <View key={item.id} style={styles.taskRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.applicant} → {item.destination}</Text>
                <Text style={styles.rowMeta}>{item.urgency}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}
      {!loading && !error && (
        <Section title="Conversations">
          {conversations.length === 0 && <Text style={[styles.rowMeta, { padding: 12 }]}>No messages yet.</Text>}
          {conversations.map((item: any) => {
            const isOpen = openThreadId === item.id;
            return (
              <View key={item.id}>
                <Pressable onPress={() => toggleThread(item.id)}>
                  <View style={styles.taskRow}>
                    <View style={[styles.consultantAvatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.purple100 }]}>
                      <Text style={[styles.consultantAvatarText, { fontSize: 13 }]}>{item.applicant.split(' ').map((n: string) => n[0]).join('')}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>{item.applicant}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>{item.lastMessage}</Text>
                    </View>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.slate500} />
                  </View>
                </Pressable>
                {isOpen && (
                  <View style={{ paddingHorizontal: 4, paddingBottom: 12, gap: 8 }}>
                    {threadLoading && <ActivityIndicator color={colors.royal600} />}
                    {!threadLoading && threadMessages.map((m) => (
                      <View key={m.id} style={{ alignSelf: m.senderRole === 'consultant' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.senderRole === 'consultant' ? colors.royal50 : colors.slate100, borderRadius: 10, padding: 8 }}>
                        <Text style={{ fontSize: 13, color: colors.slate900 }}>{m.text}</Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Reply…"
                        style={[styles.input, { flex: 1 }]}
                        returnKeyType="send"
                        onSubmitEditing={() => sendReply(item.id)}
                      />
                      <Pressable style={[styles.send, sending && { opacity: 0.6 }]} onPress={() => sendReply(item.id)} disabled={sending}>
                        {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Section>
      )}
    </View>
  );
}

function HrPortalScreen({ back }: { back: () => void }) {
  const { data, loading, error, retry } = useApiData<any>('/hr');
  const reports = data?.reports ?? [];
  const teams = data?.teams ?? [];
  const bulkUploads = data?.bulkUploads ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>B2B mobility</Text>
      <Text style={styles.title}>HR dashboard</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
      {error && <LoadErrorNotice onRetry={retry} />}
      {reports.length > 0 && (
        <Section title="Reports">
          {reports.map((item: any) => <Finding key={item.label} title={`${item.label}: ${item.value}`} meta={item.trend} />)}
        </Section>
      )}
      {teams.length > 0 && (
        <Section title="Teams">
          {teams.map((team: any) => <TaskRow key={team.id} title={team.name} meta={`${team.members} employees — ${team.openCases} open cases`} />)}
        </Section>
      )}
      {bulkUploads.length > 0 && (
        <Section title="Bulk uploads">
          {bulkUploads.map((upload: any) => <Finding key={upload.id} title={upload.fileName} meta={upload.status} />)}
        </Section>
      )}
    </View>
  );
}

function EmployeePortalScreen({ back, authUser }: { back: () => void; authUser?: AuthUser | null }) {
  const { data, loading, error, retry } = useApiData<any>('/employee');
  const profile = data?.profile ?? {};
  const tasks = data?.tasks ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Employee portal</Text>
      <Text style={styles.title}>{authUser?.name ?? profile.name ?? 'Employee'}</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
      {error && <LoadErrorNotice onRetry={retry} />}
      {(profile.company || tasks.length > 0) && (
        <Section title={profile.company ?? 'Your company'}>
          {profile.homeCountry && <Finding title="Home country" meta={profile.homeCountry} />}
          {tasks.map((task: any) => <TaskRow key={task.id} title={task.title} meta={`${task.due} — ${task.status}`} />)}
        </Section>
      )}
    </View>
  );
}

function AdminOverviewScreen({ back }: { back: () => void }) {
  const { data, loading, error, retry } = useApiData<any>('/admin/overview');
  const metrics = data?.metrics ?? [];
  const aiMonitoring = data?.aiMonitoring ?? [];
  const requirementsDb = data?.requirementsDb ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Platform admin</Text>
      <Text style={styles.title}>Operations overview</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
      {error && <LoadErrorNotice onRetry={retry} />}
      {metrics.length > 0 && (
        <Section title="Platform metrics">
          {metrics.map((item: any) => <Finding key={item.label} title={`${item.label}: ${item.value}`} meta={item.trend} />)}
        </Section>
      )}
      {aiMonitoring.length > 0 && (
        <Section title="AI providers">
          {aiMonitoring.map((item: any) => <TaskRow key={item.provider} title={`${item.provider} — ${item.status}`} meta={`${item.latency} latency`} />)}
        </Section>
      )}
      {requirementsDb.length > 0 && (
        <Section title="Requirements DB">
          {requirementsDb.map((item: any) => <Finding key={item.route} title={item.route} meta={`${item.coverage} — ${item.freshness ?? item.lastScraped ?? ''}`} />)}
        </Section>
      )}
    </View>
  );
}

const NOTIF_ICONS: Record<string, [IoniconName, string]> = {
  audit:        ['checkmark-circle-outline', '#10B981'],
  warning:      ['alert-circle-outline',     '#F59E0B'],
  booking:      ['calendar-outline',         '#1A56DB'],
  requirements: ['globe-outline',            '#7C3AED'],
};

const NOTIF_TABS = [
  { id: 'all',          label: 'All' },
  { id: 'audit',        label: 'Audits' },
  { id: 'requirements', label: 'Updates' },
  { id: 'booking',      label: 'Bookings' },
  { id: 'warning',      label: 'Alerts' },
] as const;

function NotificationsScreen({ back, notifications, loadError, retryLoad, onMarkRead }: { back: () => void; notifications: ApiNotification[]; loadError?: string; retryLoad?: () => void; onMarkRead: (id: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const filtered = activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter);

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Notifications</Text>
      <Text style={styles.title}>Recent updates</Text>
      {loadError && notifications.length === 0 && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 16, marginBottom: 12, alignItems: 'center', gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={{ color: '#991B1B', textAlign: 'center' }}>{loadError}</Text>
          {retryLoad && (
            <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retryLoad}>
              <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {NOTIF_TABS.map(tab => {
            const count = tab.id === 'all' ? notifications.length : notifications.filter(n => n.type === tab.id).length;
            const active = activeFilter === tab.id;
            return (
              <Pressable key={tab.id} onPress={() => setActiveFilter(tab.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? colors.royal600 : colors.royal50 }}>
                <Text style={{ color: active ? '#fff' : colors.royal700, fontWeight: '700', fontSize: 13 }}>{tab.label}</Text>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.royal100, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: active ? '#fff' : colors.royal600, fontSize: 10, fontWeight: '900' }}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Section title={activeFilter === 'all' ? 'All notifications' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}>
        {filtered.map((n) => {
          const [icon, color] = NOTIF_ICONS[n.type] ?? ['notifications-outline' as IoniconName, colors.slate500];
          return (
            <Pressable key={n.id} onPress={() => !n.read && onMarkRead(n.id)} style={[styles.taskRow, { gap: 12, opacity: n.read ? 0.6 : 1 }]}>
              <View style={[styles.quickIconBox, { width: 36, height: 36, backgroundColor: n.read ? colors.slate100 : `${color}18` }]}>
                <Ionicons name={icon} size={18} color={n.read ? colors.slate500 : color} />
              </View>
              <View style={styles.flex}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  {!n.read && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' }} />}
                </View>
                <Text style={styles.rowMeta}>{n.body}</Text>
              </View>
              <Text style={[styles.rowMeta, { fontSize: 10, flexShrink: 0 }]}>{n.time}</Text>
            </Pressable>
          );
        })}
        {filtered.length === 0 && (
          <Text style={[styles.rowMeta, { textAlign: 'center', paddingVertical: 24 }]}>No {activeFilter} notifications</Text>
        )}
      </Section>
    </View>
  );
}

const SEARCH_ICONS: Record<string, IoniconName> = { app: 'document-text-outline', doc: 'folder-outline', consultant: 'person-outline' };

function SearchScreen({ back, openApplication, openConsultant, appList, consultantList }: {
  back: () => void;
  openApplication: (id: string) => void;
  openConsultant: (id: string) => void;
  appList: ReturnType<typeof normalizeApp>[];
  consultantList: ReturnType<typeof normalizeConsultant>[];
}) {
  const [query, setQuery] = useState('');

  const appEntries = appList.map(a => ({
    title: `${a.destinationFlag} ${a.destinationCountry} — ${a.visaType}`,
    meta: `Score ${a.readinessScore} · ${a.issuesCount} issues · ${a.status}`,
    type: 'app' as const,
    id: a.id,
  }));
  const consultantEntries = consultantList.map(c => ({
    title: c.name,
    meta: `${c.specialty} · ${c.availableToday ? 'Available today' : c.responseTime}`,
    type: 'consultant' as const,
    id: c.id,
  }));
  const allEntries = [...appEntries, ...consultantEntries];
  const results = query.length > 1
    ? allEntries.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.meta.toLowerCase().includes(query.toLowerCase()))
    : allEntries;

  const isQuestion = query.includes('?') || query.toLowerCase().startsWith('how') || query.toLowerCase().startsWith('what') || query.toLowerCase().startsWith('do i');
  const firstApp = appList[0];
  const aiAnswer = isQuestion && firstApp
    ? `Based on your ${firstApp.destinationCountry} application (score ${firstApp.readinessScore}), focus on uploading missing documents and resolving the ${firstApp.issuesCount} flagged issue${firstApp.issuesCount !== 1 ? 's' : ''} before your departure on ${firstApp.intendedFrom}.`
    : isQuestion ? "I can help with your visa application questions. Upload documents and create an application to get personalized guidance." : null;

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Search</Text>
      <Text style={styles.title}>Find anything</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search applications, documents, consultants…"
        style={styles.searchInput}
        autoFocus
        clearButtonMode="while-editing"
      />
      {/* AI answer card */}
      {aiAnswer && (
        <LinearGradient colors={['#6D28D9', '#7C3AED']} style={{ borderRadius: 16, padding: 16, marginBottom: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>Quick answer</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20, fontWeight: '500' }}>{aiAnswer}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Visa-scoped · Not legal advice</Text>
        </LinearGradient>
      )}
      {allEntries.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
          <Ionicons name="search-outline" size={40} color={colors.slate300} />
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Create an application to start searching your visa data.</Text>
        </View>
      )}
      {allEntries.length > 0 && (
        <Section title={query.length > 1 ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Suggested'}>
          {results.map((r) => (
            <Pressable key={`${r.type}-${r.id}`} style={styles.taskRow} onPress={() => {
              if (r.type === 'app' && r.id) openApplication(r.id);
              else if (r.type === 'consultant' && r.id) openConsultant(r.id);
            }}>
              <View style={[styles.quickIconBox, { width: 36, height: 36, backgroundColor: r.type === 'app' ? colors.royal50 : colors.purple100 }]}>
                <Ionicons name={SEARCH_ICONS[r.type]} size={18} color={r.type === 'app' ? colors.royal600 : colors.purple600} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{r.title}</Text>
                <Text style={styles.rowMeta}>{r.meta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.slate300} />
            </Pressable>
          ))}
          {query.length > 1 && results.length === 0 && (
            <Text style={[styles.rowMeta, { textAlign: 'center', paddingVertical: 24 }]}>No results for "{query}"</Text>
          )}
        </Section>
      )}
    </View>
  );
}

function SettingsScreen({ back, authUser, onSignOut, openProfileHub }: { back: () => void; authUser: AuthUser | null; onSignOut: () => void; openProfileHub: () => void }) {
  const [prefs, setPrefs] = useState<SettingsPreferences>(DEFAULT_PREFERENCES);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'code-sent'>('idle');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  useEffect(() => {
    getBiometricSupport().then((sup) => { setBiometricSupport(sup); setBiometricAvailable(sup.available); }).catch(() => setBiometricAvailable(false));
    if (authUser?.uid) isLockEnabled(authUser.uid).then((on) => setPrefs((prev) => ({ ...prev, biometricEnabled: on })));
    loadPreferences().then(setPrefs);
    fetch2faStatus().then((r) => setTwoFactorEnabled(r.enabled)).catch(() => setTwoFactorEnabled(false));
  }, []);

  const handleToggle2fa = async () => {
    if (twoFactorEnabled) {
      Alert.alert('Turn off two-factor authentication?', 'Your account will only require a password to sign in.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn off', style: 'destructive', onPress: async () => {
            setTwoFactorBusy(true);
            try {
              await disable2fa();
              setTwoFactorEnabled(false);
            } catch (err) {
              Alert.alert('Could not turn off 2FA', err instanceof Error ? err.message : 'Please check your connection and try again.');
            } finally {
              setTwoFactorBusy(false);
            }
          },
        },
      ]);
      return;
    }
    setTwoFactorBusy(true);
    try {
      const { devCode } = await send2faCode();
      setTwoFactorStep('code-sent');
      setTwoFactorCode('');
      Alert.alert('Verification code sent', devCode ? `Demo mode — your code is ${devCode}.` : 'Check your email for a 6-digit code.');
    } catch (err) {
      Alert.alert('Could not send code', err instanceof Error ? err.message : 'Please try again later.');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleVerify2fa = async () => {
    if (twoFactorCode.length !== 6) return;
    setTwoFactorBusy(true);
    try {
      await verify2faCode(twoFactorCode);
      setTwoFactorEnabled(true);
      setTwoFactorStep('idle');
      setTwoFactorCode('');
    } catch (err) {
      Alert.alert('Invalid code', err instanceof Error ? err.message : 'The verification code is incorrect or expired.');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const updatePref = (key: keyof SettingsPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    savePreferences({ [key]: value });
  };

  const toggleBiometric = async () => {
    const uid = authUser?.uid;
    if (!uid) return;
    if (prefs.biometricEnabled) {
      await setLockEnabled(uid, false);
      setPrefs((prev) => ({ ...prev, biometricEnabled: false }));
      return;
    }
    const result = await authenticateBiometric('Confirm it’s you to turn on the app lock');
    if (result.ok) {
      await setLockEnabled(uid, true);
      setPrefs((prev) => ({ ...prev, biometricEnabled: true }));
    } else if (!result.cancelled) {
      Alert.alert('Could not turn on the lock', 'Your phone did not confirm the check. Try again.');
    }
  };

  const handleChangePassword = async () => {
    if (!authUser?.email) return;
    setChangingPassword(true);
    try {
      await forgotPassword(authUser.email);
      Alert.alert('Check your inbox', `We sent password reset instructions to ${authUser.email}.`);
    } catch (err) {
      Alert.alert('Could not send reset email', err instanceof Error ? err.message : 'Please try again later.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Clear offline cache?', 'Removes downloaded data used for offline browsing. Nothing on your account is affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          setClearingCache(true);
          await clearCache();
          setClearingCache(false);
          Alert.alert('Cache cleared');
        },
      },
    ]);
  };


  const handleDeleteData = () => {
    Alert.alert(
      'Delete my data?',
      'This creates a GDPR / UAE PDPL deletion request. Your account, documents and access grants will be removed within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setDeletingData(true);
            try {
              const r = await deleteAccount();
              Alert.alert('Deletion request submitted', r.message);
            } catch (err) {
              Alert.alert('Could not submit request', err instanceof Error ? err.message : 'Please try again later.');
            } finally {
              setDeletingData(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Coming soon', 'Data export is coming soon — we\'ll notify you when a downloadable account package is available.');
  };

  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Settings</Text>
      <Text style={styles.title}>Account controls</Text>

      <Section title="Account">
        <Finding title={authUser?.name ?? 'Your account'} meta={authUser?.email ?? '—'} />
        <LinkRow title="Edit profile" meta="Update your name, phone and travel documents." onPress={openProfileHub} />
        <LinkRow
          title="Change password"
          meta={changingPassword ? 'Sending reset email…' : "We'll email you a secure reset link."}
          onPress={handleChangePassword}
          disabled={changingPassword}
        />
      </Section>

      <Section title="Notifications">
        <ToggleRow
          title="Push notifications"
          meta="Alerts about application updates and consultant replies."
          value={prefs.pushNotifications}
          onToggle={() => updatePref('pushNotifications', !prefs.pushNotifications)}
        />
        <ToggleRow
          title="Email digest"
          meta="Weekly summary of your visa readiness progress."
          value={prefs.emailDigest}
          onToggle={() => updatePref('emailDigest', !prefs.emailDigest)}
        />
        <ToggleRow
          title="Trip reminders"
          meta="Reminders as your travel date approaches."
          value={prefs.tripReminders}
          onToggle={() => updatePref('tripReminders', !prefs.tripReminders)}
        />
      </Section>

      <Section title="Security">
        <ToggleRow
          title={`${biometricSupport?.label ?? 'Biometric'} unlock`}
          meta={biometricAvailable === false ? 'Set up a fingerprint or face on your phone first' : prefs.biometricEnabled ? 'On — the app locks when you leave it' : 'Open the app without typing your password'}
          value={prefs.biometricEnabled}
          onToggle={toggleBiometric}
          disabled={biometricAvailable === false}
        />
        <ToggleRow
          title="Two-factor authentication"
          meta={twoFactorEnabled ? 'Enabled — a code is required on new sign-ins.' : 'Add an extra verification step at sign-in.'}
          value={!!twoFactorEnabled}
          onToggle={handleToggle2fa}
          disabled={twoFactorEnabled === null || twoFactorBusy}
        />
        {twoFactorStep === 'code-sent' && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 }}>
            <TextInput
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              style={[styles.searchInput, { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: 6 }]}
            />
            <Pressable
              style={[styles.primaryButton, { paddingHorizontal: 20 }, twoFactorCode.length !== 6 && styles.disabledButton]}
              onPress={twoFactorCode.length === 6 ? handleVerify2fa : undefined}
            >
              {twoFactorBusy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, twoFactorCode.length !== 6 && styles.disabledButtonText]}>Verify</Text>}
            </Pressable>
          </View>
        )}
      </Section>

      <Section title="Privacy">
        <LinkRow
          title="Delete my data"
          meta={deletingData ? 'Submitting request…' : 'Creates a compliance request for admin queue.'}
          onPress={handleDeleteData}
          disabled={deletingData}
          tone="danger"
        />
        <LinkRow title="Export my data" meta="Creates a downloadable account package when backend export service is enabled." onPress={handleExportData} />
      </Section>

      <Section title="App">
        <LinkRow
          title="Clear offline cache"
          meta={clearingCache ? 'Clearing…' : 'Frees up space used for offline browsing.'}
          onPress={handleClearCache}
          disabled={clearingCache}
        />
        <Finding title="App version" meta={String((require('./app.json') as { expo: { version: string } }).expo.version)} />
      </Section>

      <Section title="About">
        <LinkRow title="Contact support" meta="support@visawithease.app" onPress={() => openUrlSafely('mailto:support@visawithease.app')} />
        <LinkRow title="Privacy Policy" meta="visawithease.com/privacy" onPress={() => openUrlSafely('https://www.visawithease.com/privacy')} />
        <LinkRow title="Terms of Service" meta="visawithease.com/terms" onPress={() => openUrlSafely('https://www.visawithease.com/terms')} />
      </Section>

      <OfflineCacheCard />

      <Text style={[styles.rowMeta, { textAlign: 'center', marginTop: 20 }]}>
        Looking to sign out? That's on the main Profile screen now.
      </Text>
    </View>
  );
}

function BottomNav({ activeTab, setTab, unreadCount = 0, style, items }: { activeTab: string; setTab: (tab: any) => void; unreadCount?: number; style?: object; items?: ReadonlyArray<{ id: string; label: string; icon: IoniconName; iconOff: IoniconName }> }) {
  const chatUnread = unreadCount;
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomNav, { height: 64 + insets.bottom, paddingBottom: insets.bottom }, style]}>
      {(items ?? tabs).map((item) => {
        const active = activeTab === item.id;
        const badge = item.id === 'chat' ? chatUnread : 0;
        return (
          <Pressable key={item.id} style={styles.navItem} onPress={() => setTab(item.id)}>
            {active && <View style={styles.navPill} />}
            <View style={{ position: 'relative' }}>
              <Ionicons name={active ? item.icon : item.iconOff} size={22} color={active ? colors.royal600 : colors.slate500} />
              {badge > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>{badge}</Text>
                </View>
              )}
            </View>
            <Text maxFontSizeMultiplier={1} numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.backButton} onPress={onPress}>
      <Ionicons name="chevron-back" size={20} color={colors.royal600} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ icon, onPress }: { icon: IoniconName; onPress: () => void }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.slate700} />
    </Pressable>
  );
}

function QuickAction({ icon, label, bg, iconColor, onPress }: { icon: IoniconName; label: string; bg: string; iconColor: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TaskRow({ title, meta, done }: { title: string; meta: string; done?: boolean }) {
  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskMark, done && styles.taskMarkDone]}>
        <Ionicons name={done ? 'checkmark' : 'alert'} size={14} color={done ? colors.green500 : colors.gold500} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function ToggleRow({ title, meta, value, onToggle, disabled }: { title: string; meta: string; value: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <View style={styles.taskRow}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <Pressable
        disabled={disabled}
        onPress={onToggle}
        style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: value ? colors.royal600 : colors.slate200, justifyContent: 'center', paddingHorizontal: 2, opacity: disabled ? 0.5 : 1 }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: value ? 'flex-end' : 'flex-start' }} />
      </Pressable>
    </View>
  );
}

function LinkRow({ title, meta, onPress, disabled, tone }: { title: string; meta: string; onPress: () => void; disabled?: boolean; tone?: 'danger' }) {
  return (
    <Pressable style={[styles.taskRow, disabled && { opacity: 0.5 }]} onPress={disabled ? undefined : onPress}>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, tone === 'danger' && { color: '#DC2626' }]}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      {disabled ? <ActivityIndicator size="small" color={colors.slate300} /> : <Ionicons name="chevron-forward" size={16} color={colors.slate300} />}
    </Pressable>
  );
}

function Finding({ title, meta }: { title: string; meta: string }) {
  return (
    <View style={styles.findingCard}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowMeta}>{meta}</Text>
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: 'light' | 'neutral' | 'warn' }) {
  return <Text style={[styles.badge, styles[`badge_${tone}`]]}>{label}</Text>;
}

function Segmented({ tabs: items, active, onPress }: { tabs: string[]; active: string; onPress: (value: string) => void }) {
  return (
    <View style={styles.segmented}>
      {items.map((item) => (
        <Pressable key={item} style={[styles.segment, active === item && styles.segmentActive]} onPress={() => onPress(item)}>
          <Text style={[styles.segmentText, active === item && styles.segmentTextActive]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ProgressDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => <View key={index} style={[styles.dot, index <= active && styles.dotActive]} />)}
    </View>
  );
}

function ScoreRing({ value, large, subLabel, size: sizeProp }: { value: number; large?: boolean; subLabel?: string; size?: number }) {
  const size = sizeProp ?? (large ? 100 : 54);
  const strokeWidth = size >= 90 ? 8 : size >= 70 ? 7 : 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(value, 100) / 100);
  const color = scoreColor(value);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.slate100} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText
          x={size / 2} y={size / 2}
          textAnchor="middle" dy="0.35em"
          fontSize={size >= 90 ? 24 : size >= 70 ? 21 : 13} fontWeight="900"
          fill={large ? '#fff' : colors.slate900}
        >{value}</SvgText>
      </Svg>
      {subLabel && <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>{subLabel}</Text>}
    </View>
  );
}

// ─── Pro Tier Dashboard ───────────────────────────────────────────────────────
const PRO_FEATURES = [
  { icon: 'albums-outline'         as IoniconName, label: '7 concurrent applications',          sub: 'vs 2 on Free tier' },
  { icon: 'analytics-outline'      as IoniconName, label: 'Live AI streaming analysis',         sub: 'Real-time readiness updates' },
  { icon: 'document-text-outline'  as IoniconName, label: 'PDF audit report export',            sub: 'Branded, shareable reports' },
  { icon: 'calendar-outline'       as IoniconName, label: 'Priority consultant matching',       sub: 'Faster response, lower rates' },
  { icon: 'notifications-outline'  as IoniconName, label: 'Smart appointment reminders',       sub: 'Push before appointment cutoffs' },
  { icon: 'language-outline'       as IoniconName, label: 'Multi-language support',            sub: 'Arabic, Hindi, French (coming)' },
];
function ProTierScreen({ back, appList }: { back: () => void; appList: ReturnType<typeof normalizeApp>[] }) {
  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <LinearGradient colors={['#F59E0B','#D97706']} style={{ borderRadius: 20, padding: 20, marginBottom: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="star" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Visa With Ease Pro</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20 }}>Manage up to 7 simultaneous applications with live AI analysis, PDF exports and priority consultant matching.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {[['7', 'Applications'], ['AI', 'Powered'], ['Pro', 'Support']].map(([v, l]) => (
            <View key={l} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{v}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 }}>{l}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      <Section title="Pro features">
        {PRO_FEATURES.map(f => (
          <View key={f.label} style={styles.taskRow}>
            <View style={[styles.quickIconBox, { width: 36, height: 36, backgroundColor: colors.gold100 }]}>
              <Ionicons name={f.icon} size={18} color={colors.gold500} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{f.label}</Text>
              <Text style={styles.rowMeta}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </Section>
      <Section title="All 7 application slots">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const a = appList[i];
            return a ? (
              <View key={a.id} style={{ width: '30%', backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.slate100, padding: 12, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 24 }}>{a.destinationFlag}</Text>
                {a.readinessScore > 0 ? <ScoreRing value={a.readinessScore} /> : (
                  <View style={[styles.statusPill, { backgroundColor: colors.slate100 }]}>
                    <Text style={[styles.statusText, { color: colors.slate500, fontSize: 9 }]}>Draft</Text>
                  </View>
                )}
                <Text style={[styles.rowMeta, { fontSize: 10, textAlign: 'center' }]}>{a.destinationCountry}</Text>
              </View>
            ) : (
              <View key={`empty-${i}`} style={{ width: '30%', backgroundColor: colors.slate50, borderRadius: 12, borderWidth: 1, borderColor: colors.slate100, borderStyle: 'dashed', padding: 12, alignItems: 'center', gap: 6 }}>
                <Ionicons name="add-outline" size={24} color={colors.slate300} />
                <Text style={[styles.rowMeta, { fontSize: 10, textAlign: 'center', color: colors.slate500 }]}>Available</Text>
              </View>
            );
          })}
        </View>
      </Section>
      <Pressable
        onPress={() => Alert.alert('Coming soon', 'Payment integration is coming soon — Pro upgrades will be available once billing is connected.')}
        style={{ marginTop: 16 }}
      >
        <LinearGradient colors={['#F59E0B','#D97706']} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Upgrade to Pro — $19/month</Text>
        </LinearGradient>
      </Pressable>
      <Text style={[styles.rowMeta, { textAlign: 'center', marginTop: 10 }]}>Cancel anytime · 7-day free trial</Text>
    </View>
  );
}

// ─── FEAT D: Ecosystem Partners ──────────────────────────────────────────────
// Cosmetic-only per-category icon/color — the actual partner list, discounts,
// and links come from the real /partners endpoint via fetchPartners().
const PARTNER_CATEGORY_META: Record<string, { label: string; icon: IoniconName; color: string }> = {
  flights:   { label: 'Flights',   icon: 'airplane-outline',          color: '#1A56DB' },
  housing:   { label: 'Housing',   icon: 'home-outline',              color: '#7C3AED' },
  corporate: { label: 'Corporate', icon: 'business-outline',          color: '#059669' },
  insurance: { label: 'Insurance', icon: 'shield-checkmark-outline',  color: '#DC2626' },
};

function EcosystemPartnersScreen({ back, score }: { back: () => void; score?: number }) {
  const [data, setData] = useState<{ categories: string[]; partners: import('./src/api').ApiPartner[] } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    setError(false);
    setData(null);
    fetchPartners()
      .then(d => { setData(d); setActiveCat(prev => prev ?? d.categories[0]); })
      .catch(() => setError(true));
  }, [attempt]);

  if (error) {
    return (
      <View>
        <BackButton label="Home" onPress={back} />
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Couldn't load partner offers.</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={() => setAttempt(a => a + 1)}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!data || !activeCat) {
    return (
      <View>
        <BackButton label="Home" onPress={back} />
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.royal600} /></View>
      </View>
    );
  }

  const catPartners = data.partners.filter(p => p.category === activeCat);
  const meta = PARTNER_CATEGORY_META[activeCat] ?? { label: activeCat, icon: 'gift-outline' as IoniconName, color: colors.royal600 };

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Marketplace</Text>
      <Text style={styles.title}>Ecosystem Partners</Text>
      {score !== undefined && score >= 95 && (
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="star" size={18} color="#D97706" />
          <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700', flex: 1 }}>Your score qualifies for exclusive member discounts!</Text>
        </View>
      )}
      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {data.categories.map(catId => {
            const catMeta = PARTNER_CATEGORY_META[catId] ?? { label: catId, icon: 'gift-outline' as IoniconName, color: colors.royal600 };
            const active = catId === activeCat;
            return (
              <Pressable key={catId} onPress={() => setActiveCat(catId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 2, borderColor: active ? catMeta.color : '#E2E8F0', backgroundColor: active ? `${catMeta.color}12` : '#fff' }}>
                <Ionicons name={catMeta.icon} size={15} color={active ? catMeta.color : '#94A3B8'} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? catMeta.color : '#64748B' }}>{catMeta.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {/* Partner cards */}
      <Section title={`${meta.label} partners`}>
        {catPartners.map(partner => (
          <View key={partner.id} style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 16, marginBottom: 10, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${meta.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={styles.flex}>
                <Text style={{ fontWeight: '900', fontSize: 15, color: '#0F172A' }}>{partner.name}</Text>
                {!!partner.tagline && <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{partner.tagline}</Text>}
              </View>
            </View>
            <View style={{ backgroundColor: `${meta.color}12`, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="gift-outline" size={14} color={meta.color} />
              <Text style={{ color: meta.color, fontWeight: '700', fontSize: 13 }}>{partner.discount}</Text>
            </View>
            {!!partner.url && (
              <Pressable style={{ borderRadius: 10, borderWidth: 2, borderColor: meta.color, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => openUrlSafely(partner.url!)}>
                <Ionicons name="open-outline" size={14} color={meta.color} />
                <Text style={{ color: meta.color, fontWeight: '700', fontSize: 13 }}>Visit {partner.name}</Text>
              </Pressable>
            )}
          </View>
        ))}
        {catPartners.length === 0 && <Text style={[styles.rowMeta, { textAlign: 'center', paddingVertical: 12 }]}>No partners in this category yet.</Text>}
      </Section>
      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginTop: 4 }}>
        <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18 }}><Text style={{ color: '#0F172A', fontWeight: '700' }}>Transparency note: </Text>Visa With Ease earns a referral commission when you use partner links. This funds the free tier and keeps the app ad-free.</Text>
      </View>
    </View>
  );
}

// ─── Calendar Picker ─────────────────────────────────────────────────────────
const SLOTS_AM = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM'];
const SLOTS_PM = ['2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
function parseSlotTo24h(t: string): { h: number; m: number } {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!match) return { h: 0, m: 0 };
  let h = Number(match[1]) % 12;
  if (/pm/i.test(match[3])) h += 12;
  return { h, m: Number(match[2]) };
}

function CalendarPickerScreen({ consultantName, consultantId, back, confirm, rescheduling }: { consultantName: string; consultantId: string; back: () => void; confirm: (slotISO: string) => void; rescheduling?: boolean }) {
  // All slot times are quoted in GST (UTC+4, no DST) — the same convention the backend uses
  // to decide which slots are taken. Each slot is turned into a real instant here, then shown
  // in the phone's own time zone too, so nobody has to convert in their head.
  const GST_MS = 4 * 3600 * 1000;
  const gstNow = new Date(Date.now() + GST_MS);
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(Date.UTC(gstNow.getUTCFullYear(), gstNow.getUTCMonth(), gstNow.getUTCDate() + i));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(), key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` };
  });
  const [dayIndex, setDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const day = days[dayIndex];
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const slotInstant = (label: string, dy = day) => {
    const { h, m } = parseSlotTo24h(label);
    return new Date(Date.UTC(dy.y, dy.m, dy.d, h, m) - GST_MS);
  };
  const localTime = (label: string) => slotInstant(label).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  useEffect(() => {
    if (!consultantId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError(false);
    setSelectedSlot(null);
    fetchBookingSlots(consultantId, day.key)
      .then((d) => { if (!cancelled) setTakenSlots(d.takenSlots ?? []); })
      .catch(() => { if (!cancelled) { setTakenSlots([]); setSlotsError(true); } })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [consultantId, dayIndex]);

  const state = (t: string) => (takenSlots.includes(t) ? 'taken' : slotInstant(t).getTime() <= Date.now() + 30 * 60 * 1000 ? 'past' : 'free');
  const SlotChip = ({ t }: { t: string }) => {
    const st = state(t);
    const sel = selectedSlot === t && st === 'free';
    const off = st !== 'free';
    return (
      <Pressable
        disabled={off}
        onPress={() => setSelectedSlot(t)}
        accessibilityLabel={`${t} GST${off ? ', unavailable' : ''}`}
        style={{ flexBasis: '31%', flexGrow: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
          backgroundColor: sel ? colors.royal600 : off ? colors.slate50 : colors.white, borderWidth: 1, borderColor: sel ? colors.royal600 : colors.slate200 }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: sel ? '#fff' : off ? colors.slate300 : colors.slate900, textDecorationLine: st === 'taken' ? 'line-through' : 'none' }}>{t}</Text>
        <Text style={{ fontSize: 10.5, color: sel ? 'rgba(255,255,255,0.85)' : off ? colors.slate300 : colors.slate500, marginTop: 1 }}>{st === 'taken' ? 'Booked' : st === 'past' ? 'Passed' : localTime(t)}</Text>
      </Pressable>
    );
  };
  const allSlots = [...SLOTS_AM, ...SLOTS_PM];
  const anyFree = allSlots.some((t) => state(t) === 'free');
  const chosen = selectedSlot ? slotInstant(selectedSlot) : null;

  return (
    <View style={{ gap: 14 }}>
      <BackButton label="Booking" onPress={back} />
      <View>
        <Text style={styles.eyebrow}>{rescheduling ? 'Reschedule session' : 'Schedule session'}</Text>
        <Text style={[styles.title, { marginBottom: 4 }]}>Pick a time</Text>
        <Text style={[styles.rowMeta, { lineHeight: 19 }]}>With {consultantName}. Slots are in GST (UTC+4); your own time is shown under each one.</Text>
      </View>

      <View>
        <Text style={{ color: colors.slate900, fontWeight: '900', fontSize: 15, marginBottom: 8 }}>{MONTHS[day.m]} {day.y}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {days.map((dy, i) => {
            const sel = i === dayIndex;
            return (
              <Pressable key={dy.key} onPress={() => setDayIndex(i)} accessibilityLabel={`${WEEKDAYS[dy.dow]} ${dy.d} ${MONTHS[dy.m]}`}
                style={{ width: 54, paddingVertical: 10, borderRadius: 16, alignItems: 'center', backgroundColor: sel ? colors.royal600 : colors.white, borderWidth: 1, borderColor: sel ? colors.royal600 : colors.slate200 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: sel ? 'rgba(255,255,255,0.85)' : colors.slate500 }}>{i === 0 ? 'Today' : WEEKDAYS[dy.dow]}</Text>
                <Text style={{ fontSize: 19, fontWeight: '900', color: sel ? '#fff' : colors.slate900, marginTop: 2 }}>{dy.d}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loadingSlots ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={colors.royal600} />
      ) : (
        <View style={{ gap: 12 }}>
          {slotsError && (
            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: '#92400E', fontSize: 12.5, fontWeight: '700' }}>Couldn’t check which slots are already booked. You can still choose a time — a clash will be caught when you confirm.</Text>
            </View>
          )}
          <View>
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Morning</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{SLOTS_AM.map((t) => <SlotChip key={t} t={t} />)}</View>
          </View>
          <View>
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Afternoon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{SLOTS_PM.map((t) => <SlotChip key={t} t={t} />)}</View>
          </View>
          {!anyFree && !slotsError && <Text style={{ color: colors.slate600, textAlign: 'center', fontSize: 13 }}>No times left on this day — try another date.</Text>}
        </View>
      )}

      <View style={{ backgroundColor: chosen ? colors.royal50 : colors.slate50, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={chosen ? 'checkmark-circle' : 'time-outline'} size={20} color={chosen ? colors.royal600 : colors.slate500} />
        <Text style={{ flex: 1, color: chosen ? colors.navy900 : colors.slate500, fontWeight: chosen ? '800' : '500', fontSize: 13.5, lineHeight: 19 }}>
          {chosen
            ? `${chosen.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · ${chosen.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} your time (${selectedSlot} GST)`
            : 'Choose a time to continue'}
        </Text>
      </View>
      <Pressable
        disabled={!chosen}
        style={[styles.primaryButton, !chosen && styles.disabledButton, { marginTop: 0 }]}
        onPress={() => { if (chosen) confirm(chosen.toISOString()); }}
      >
        <Text style={[styles.primaryButtonText, !chosen && styles.disabledButtonText]}>Continue to consent</Text>
      </Pressable>
    </View>
  );
}

// ─── Visa Score Calculator ────────────────────────────────────────────────────
const CALC_DESTINATIONS = [
  'France (Schengen)', 'Germany (Schengen)', 'Spain (Schengen)', 'Italy (Schengen)', 'Netherlands (Schengen)',
  'United Kingdom', 'United States', 'Canada', 'Australia', 'New Zealand',
  'Japan', 'South Korea', 'Singapore', 'Thailand', 'Malaysia',
  'Turkey', 'India', 'Sri Lanka', 'Saudi Arabia', 'Bahrain', 'Oman',
  'Kenya', 'South Africa', 'Brazil',
];
const CALC_VISA_TYPES = ['Tourist', 'Business', 'Student', 'Work', 'Family Reunion', 'Transit', 'Medical'];
// What consulates weigh most heavily per visa type — used to make the
// recommendation actually reflect the selected type, not just the sliders.
const CALC_VISA_TYPE_TIP: Record<string, string> = {
  Tourist: 'a clear day-by-day itinerary and a return/onward ticket',
  Business: 'an invitation letter from the host company and proof of your own employment',
  Student: 'your enrollment/admission letter and proof of tuition + living-cost funds',
  Work: 'your signed job offer and the employer’s sponsorship or work-permit approval',
  'Family Reunion': 'proof of the relationship (marriage/birth certificates) and your sponsor’s financial standing',
  Transit: 'your onward ticket and the visa (if required) for your final destination',
  Medical: 'a letter from the treating hospital and proof of funds to cover treatment',
};

function VisaCalculatorScreen({ back }: { back: () => void }) {
  const [destination, setDestination] = useState(0);
  const [visaType, setVisaType] = useState(0);
  const [finance, setFinance] = useState(3);
  const [travel, setTravel] = useState(3);
  const [employment, setEmployment] = useState(3);
  const [ties, setTies] = useState(3);
  const score = Math.round((finance * 0.30 + travel * 0.25 + employment * 0.25 + ties * 0.20) * 20);
  const destinationLabel = CALC_DESTINATIONS[destination];
  const visaTypeLabel = CALC_VISA_TYPES[visaType];

  const getReco = () => {
    if (finance < 3) return `Strengthen bank statements with 3+ months of consistent income — for a ${destinationLabel} ${visaTypeLabel.toLowerCase()} visa, consulates also weigh ${CALC_VISA_TYPE_TIP[visaTypeLabel]}.`;
    if (travel < 3) return `Prior approved visas significantly boost approval odds for ${destinationLabel}. Also prioritize ${CALC_VISA_TYPE_TIP[visaTypeLabel]}.`;
    if (employment < 3) return `A strong employment letter with salary details helps credibility. For a ${visaTypeLabel.toLowerCase()} visa to ${destinationLabel}, don't skip ${CALC_VISA_TYPE_TIP[visaTypeLabel]}.`;
    return `Your profile looks solid for a ${destinationLabel} ${visaTypeLabel.toLowerCase()} visa. Make sure you have ${CALC_VISA_TYPE_TIP[visaTypeLabel]}, then upload everything for a full audit.`;
  };

  const Slider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={{ color: colors.royal600, fontWeight: '900' }}>{value}/5</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1,2,3,4,5].map(v => (
          <Pressable key={v} onPress={() => onChange(v)}
            style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: v <= value ? colors.royal600 : colors.slate200 }} />
        ))}
      </View>
    </View>
  );

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>AI readiness tool</Text>
      <Text style={styles.title}>Visa Score Calculator</Text>
      <LinearGradient colors={['#0B1F4B','#1A56DB']} style={[styles.reportHero, { marginBottom: 20 }]}>
        <ScoreRing value={score} large />
        <Text style={styles.reportText}>Estimated approval readiness based on your inputs</Text>
      </LinearGradient>
      <Section title="Destination">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {CALC_DESTINATIONS.map((d, i) => (
              <Pressable key={d} onPress={() => setDestination(i)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: destination === i ? colors.royal600 : colors.royal50 }}>
                <Text style={{ color: destination === i ? '#fff' : colors.royal700, fontWeight: '700', fontSize: 13 }}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Section>
      <Section title="Visa type">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CALC_VISA_TYPES.map((t, i) => (
            <Pressable key={t} onPress={() => setVisaType(i)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: visaType === i ? colors.purple600 : colors.purple100 }}>
              <Text style={{ color: visaType === i ? '#fff' : colors.purple700, fontWeight: '700', fontSize: 13 }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="Rate your profile (1 = weak · 5 = strong)">
        <Slider label="Financial evidence" value={finance} onChange={setFinance} />
        <Slider label="Travel history & prior visas" value={travel} onChange={setTravel} />
        <Slider label="Employment stability" value={employment} onChange={setEmployment} />
        <Slider label="Ties to home country" value={ties} onChange={setTies} />
      </Section>
      <View style={[styles.notice, { marginTop: 4 }]}>
        <Text style={styles.noticeText}>Recommendation: {getReco()}</Text>
      </View>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>This is an indicative score, not a guarantee. Verify requirements with official embassy sources.</Text>
      </View>
    </View>
  );
}

// ─── Bank Balance Estimator ───────────────────────────────────────────────────
const BANK_DATA: Record<string, { daily: number; currency: string; symbol: string; rate: number }> = {
  'France / Schengen': { daily: 65,  currency: 'EUR', symbol: '€',   rate: 0.924 },
  'Germany / Schengen':{ daily: 65,  currency: 'EUR', symbol: '€',   rate: 0.924 },
  'Spain / Schengen':  { daily: 65,  currency: 'EUR', symbol: '€',   rate: 0.924 },
  'Italy / Schengen':  { daily: 65,  currency: 'EUR', symbol: '€',   rate: 0.924 },
  'Netherlands':       { daily: 65,  currency: 'EUR', symbol: '€',   rate: 0.924 },
  'United Kingdom':    { daily: 75,  currency: 'GBP', symbol: '£',   rate: 0.793 },
  'United States':     { daily: 100, currency: 'USD', symbol: '$',   rate: 1.00  },
  'Canada':            { daily: 80,  currency: 'CAD', symbol: 'C$',  rate: 1.364 },
  'Australia':         { daily: 90,  currency: 'AUD', symbol: 'A$',  rate: 1.529 },
  'New Zealand':       { daily: 85,  currency: 'NZD', symbol: 'NZ$', rate: 1.634 },
  'Japan':             { daily: 8000,currency: 'JPY', symbol: '¥',   rate: 157.2 },
  'South Korea':       { daily: 80000,currency:'KRW', symbol: '₩',   rate: 1370  },
  'Singapore':         { daily: 100, currency: 'SGD', symbol: 'S$',  rate: 1.342 },
  'Thailand':          { daily: 1500,currency: 'THB', symbol: '฿',   rate: 35.5  },
  'Malaysia':          { daily: 200, currency: 'MYR', symbol: 'RM',  rate: 4.65  },
  'Turkey':            { daily: 800, currency: 'TRY', symbol: '₺',   rate: 32.5  },
  'India':             { daily: 3000,currency: 'INR', symbol: '₹',   rate: 83.5  },
  'Saudi Arabia':      { daily: 250, currency: 'SAR', symbol: 'SR',  rate: 3.751 },
  'UAE':               { daily: 350, currency: 'AED', symbol: 'AED', rate: 3.673 },
  'Bahrain':           { daily: 25,  currency: 'BHD', symbol: 'BD',  rate: 0.376 },
  'South Africa':      { daily: 800, currency: 'ZAR', symbol: 'R',   rate: 18.6  },
  'Kenya':             { daily: 5000,currency: 'KES', symbol: 'KSh', rate: 130   },
  'Brazil':            { daily: 200, currency: 'BRL', symbol: 'R$',  rate: 5.05  },
  'Switzerland':       { daily: 100, currency: 'CHF', symbol: 'CHF', rate: 0.899 },
};
const BANK_COUNTRIES = Object.keys(BANK_DATA);

function BankBalanceScreen({ back }: { back: () => void }) {
  const [country, setCountry] = useState(0);
  const [days, setDays] = useState(10);
  const [travelers, setTravelers] = useState(1);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);

  useEffect(() => {
    fetchExchangeRates()
      .then(d => { setRates(d.rates); })
      .catch(() => setRatesError(true))
      .finally(() => setRatesLoading(false));
  }, []);

  const data = BANK_DATA[BANK_COUNTRIES[country]];
  // data.daily is in the destination currency (EUR, GBP, etc.), not USD
  const totalLocal = data.daily * days * travelers;
  const usingLiveRate = !ratesError && rates[data.currency] != null;
  const liveRate = rates[data.currency] ?? data.rate;
  const totalUSD = Math.round(totalLocal / liveRate);

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Financial planning tool</Text>
      <Text style={styles.title}>Bank Balance Estimator</Text>
      <LinearGradient colors={['#059669','#10B981']} style={[styles.reportHero, { marginBottom: 20 }]}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900' }}>{data.symbol}{totalLocal.toLocaleString()} {data.currency}</Text>
          {ratesLoading
            ? <ActivityIndicator color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }} />
            : <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4 }}>≈ ${totalUSD.toLocaleString()} USD{usingLiveRate ? '' : ' (estimated rate)'}</Text>
          }
        </View>
        <Text style={styles.reportText}>Minimum recommended bank balance for your trip</Text>
      </LinearGradient>
      <Section title="Destination">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {BANK_COUNTRIES.map((c, i) => (
              <Pressable key={c} onPress={() => setCountry(i)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: country === i ? colors.green500 : colors.green100 }}>
                <Text style={{ color: country === i ? '#fff' : '#065F46', fontWeight: '700', fontSize: 13 }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Section>
      <Section title="Trip details">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
          <Text style={styles.rowTitle}>Duration (days)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={() => setDays(d => Math.max(1, d - 1))} style={styles.smallButton}><Text style={styles.smallButtonText}>−</Text></Pressable>
            <Text style={{ fontWeight: '900', fontSize: 18, color: colors.slate900, minWidth: 30, textAlign: 'center' }}>{days}</Text>
            <Pressable onPress={() => setDays(d => d + 1)} style={styles.smallButton}><Text style={styles.smallButtonText}>+</Text></Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopColor: colors.slate100, borderTopWidth: 1 }}>
          <Text style={styles.rowTitle}>Travelers</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={() => setTravelers(t => Math.max(1, t - 1))} style={styles.smallButton}><Text style={styles.smallButtonText}>−</Text></Pressable>
            <Text style={{ fontWeight: '900', fontSize: 18, color: colors.slate900, minWidth: 30, textAlign: 'center' }}>{travelers}</Text>
            <Pressable onPress={() => setTravelers(t => t + 1)} style={styles.smallButton}><Text style={styles.smallButtonText}>+</Text></Pressable>
          </View>
        </View>
        <View style={{ paddingVertical: 10, borderTopColor: colors.slate100, borderTopWidth: 1 }}>
          <Text style={styles.rowMeta}>Based on {data.symbol}{data.daily} per person/day for {BANK_COUNTRIES[country]}</Text>
        </View>
      </Section>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Threshold is indicative. Check the official embassy or consulate guidance for your visa type.</Text>
      </View>
    </View>
  );
}

// ─── Embassy Finder ───────────────────────────────────────────────────────────
// Every UN member state plus a handful of common travel destinations — this
// is what makes the destination picker below work for literally any country,
// not just the ~24 we have verified static addresses for.
const WORLD_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  "Cote d'Ivoire",'Croatia','Cuba','Cyprus','Czechia','Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland',
  'France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea',
  'Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait',
  'Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico',
  'Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru',
  'Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman',
  'Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey',
  'Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
];

// Drop-in replacement for a plain country TextInput — shows live matching
// suggestions from the full 190+ country list as the user types, instead of
// a bare free-text field with no help. Rendered inline (not absolutely
// positioned) so it just pushes following content down while open, which
// sidesteps the layering issues an overlay would have inside a ScrollView.
function CountryAutocompleteInput({ value, onChangeText, placeholder, style }: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  style?: any;
}) {
  const [focused, setFocused] = useState(false);
  const trimmed = value.trim().toLowerCase();
  const suggestions = focused && trimmed.length > 0
    ? WORLD_COUNTRIES.filter(c => c.toLowerCase().includes(trimmed) && c.toLowerCase() !== trimmed).slice(0, 6)
    : [];
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.slate500}
        style={style ?? styles.searchInput}
        autoCapitalize="words"
        onFocus={() => setFocused(true)}
        // Delayed so a tap on a suggestion row below registers before the
        // list disappears (blur fires before the row's onPress otherwise).
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {suggestions.length > 0 && (
        <View style={{ backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.slate100, marginTop: 6, overflow: 'hidden' }}>
          {suggestions.map((c, i) => (
            <Pressable
              key={c}
              onPress={() => { onChangeText(c); setFocused(false); }}
              style={{ paddingVertical: 11, paddingHorizontal: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.slate50 }}
            >
              <Text style={{ color: colors.slate800, fontSize: 14 }}>{c}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// Common name variants people actually type for their residence, mapped to
// the canonical key VERIFIED_EMBASSIES is keyed by.
const HOST_COUNTRY_ALIASES: Record<string, string> = {
  'uae': 'United Arab Emirates', 'dubai': 'United Arab Emirates', 'abu dhabi': 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
};
function normalizeHostCountry(input: string): string {
  const key = input.trim().toLowerCase();
  return HOST_COUNTRY_ALIASES[key] ?? input.trim();
}

const EMBASSIES: Record<string, { name: string; address: string; phone: string; hours: string; website: string }> = {
  'France':          { name: 'French Consulate General Dubai',      address: 'Al Hamra, Abu Dhabi, UAE',               phone: '+971 2 613 1700', hours: 'Mon–Fri 9:00–12:30', website: 'ae.ambafrance.org' },
  'United Kingdom':  { name: 'British Embassy Dubai',               address: 'Al Seef Road, Bur Dubai, UAE',            phone: '+971 4 309 4444', hours: 'Mon–Thu 8:00–16:00', website: 'gov.uk/world/uae' },
  'United States':   { name: 'U.S. Embassy Abu Dhabi',              address: 'Embassies District, Abu Dhabi',           phone: '+971 2 414 2200', hours: 'Mon–Fri 8:00–17:00', website: 'ae.usembassy.gov' },
  'Canada':          { name: 'Embassy of Canada',                   address: 'Al Nahyan, Abu Dhabi, UAE',               phone: '+971 2 694 0300', hours: 'Mon–Fri 8:00–16:30', website: 'international.gc.ca' },
  'Australia':       { name: 'Australian Embassy Abu Dhabi',        address: 'Al Bateen, Abu Dhabi',                    phone: '+971 2 401 7500', hours: 'Mon–Fri 8:00–16:00', website: 'uae.embassy.gov.au' },
  'Germany':         { name: 'German Consulate General Dubai',      address: 'Al Wasl Road, Jumeirah, Dubai',           phone: '+971 4 397 2333', hours: 'Mon–Fri 8:30–11:30', website: 'dubai.diplo.de' },
  'Japan':           { name: 'Consulate-General of Japan Dubai',    address: 'Al Hamriya Tower, Deira, Dubai',          phone: '+971 4 221 9191', hours: 'Mon–Fri 9:00–12:30', website: 'dubai.uae.emb-japan.go.jp' },
  'China':           { name: 'Consulate-General of China Dubai',    address: 'Jumeirah, Dubai, UAE',                    phone: '+971 4 394 4733', hours: 'Mon–Fri 9:00–11:30', website: 'dubai.china-consulate.gov.cn' },
  'India':           { name: 'Consulate General of India Dubai',    address: 'Al Hamriya, Bur Dubai, UAE',              phone: '+971 4 397 1222', hours: 'Mon–Fri 9:00–17:00', website: 'cgidubai.gov.in' },
  'South Korea':     { name: 'Consulate General of Korea Dubai',   address: 'Al Barsha 1, Dubai, UAE',                 phone: '+971 4 343 4321', hours: 'Mon–Fri 9:00–12:00', website: 'overseas.mofa.go.kr/ae-dubai-en' },
  'Singapore':       { name: 'Singapore Embassy Abu Dhabi',        address: 'Khalidiyah, Abu Dhabi, UAE',              phone: '+971 2 670 7766', hours: 'Mon–Fri 9:00–17:00', website: 'mfa.gov.sg/abudhabi' },
  'Thailand':        { name: 'Royal Thai Consulate-General Dubai', address: 'Bur Dubai, Dubai, UAE',                   phone: '+971 4 396 5600', hours: 'Mon–Fri 9:00–12:00', website: 'thaiconsulatdubai.com' },
  'Malaysia':        { name: 'Malaysia Embassy Abu Dhabi',         address: 'Khalidiyah, Abu Dhabi, UAE',              phone: '+971 2 665 4906', hours: 'Mon–Fri 8:30–17:00', website: 'kln.gov.my/web/are_abu-dhabi' },
  'Turkey':          { name: 'Turkish Consulate General Dubai',    address: 'Al Maktoum Road, Deira, Dubai',           phone: '+971 4 220 0360', hours: 'Mon–Fri 9:00–17:00', website: 'dubai.bk.mfa.gov.tr' },
  'Italy':           { name: 'Italian Consulate Abu Dhabi',        address: 'Airport Road, Abu Dhabi, UAE',            phone: '+971 2 443 5622', hours: 'Mon–Fri 9:00–12:00', website: 'ambabordhabi.esteri.it' },
  'Spain':           { name: 'Spanish Consulate Abu Dhabi',        address: 'Al Bateen, Abu Dhabi, UAE',               phone: '+971 2 626 9544', hours: 'Mon–Fri 9:00–13:00', website: 'exteriores.gob.es' },
  'Netherlands':     { name: 'Netherlands Consulate Dubai',        address: 'Nassima Tower, Sheikh Zayed Rd, Dubai',   phone: '+971 4 340 8844', hours: 'Mon–Fri 9:00–12:00', website: 'netherlands-embassy.ae' },
  'New Zealand':     { name: 'New Zealand Embassy Abu Dhabi',      address: 'Corniche Road, Abu Dhabi',                phone: '+971 2 441 1222', hours: 'Mon–Fri 8:30–16:30', website: 'mfat.govt.nz/en/countries-and-regions/middle-east/uae' },
  'Saudi Arabia':    { name: 'Saudi Embassy Abu Dhabi',            address: 'Al Mushrif, Abu Dhabi, UAE',              phone: '+971 2 444 7800', hours: 'Mon–Thu 8:00–15:00', website: 'mofa.gov.sa' },
  'Pakistan':        { name: 'Pakistan Consulate General Dubai',   address: 'Oud Metha Road, Bur Dubai, UAE',          phone: '+971 4 220 0036', hours: 'Mon–Fri 9:00–17:00', website: 'pakconsulatdubai.org' },
  'Philippines':     { name: 'Philippine Consulate General Dubai', address: 'Al Qusais, Dubai, UAE',                   phone: '+971 4 220 7100', hours: 'Mon–Fri 8:00–17:00', website: 'dubaipcg.dfa.gov.ph' },
  'South Africa':    { name: 'South African Embassy Abu Dhabi',    address: 'Al Bateen, Abu Dhabi, UAE',               phone: '+971 2 671 5849', hours: 'Mon–Fri 8:30–16:00', website: 'dirco.gov.za' },
  'Kenya':           { name: 'Kenya High Commission Abu Dhabi',    address: 'Al Wahda, Abu Dhabi, UAE',                phone: '+971 2 635 8000', hours: 'Mon–Fri 8:00–16:00', website: 'kenyahighcommission.ae' },
  'Brazil':          { name: 'Brazilian Consulate General Dubai',  address: 'Business Bay, Dubai, UAE',                phone: '+971 4 311 7666', hours: 'Mon–Fri 9:00–17:00', website: 'dubai.itamaraty.gov.br' },
};
const EMBASSY_COUNTRIES = Object.keys(EMBASSIES);

// Verified static directories, keyed by the host country the missions sit
// in. Add more host countries here only with real, checked addresses —
// everywhere else falls back to a live, honest search instead of a made-up
// address (see the "no verified data" branch in EmbassyFinderScreen).
const VERIFIED_EMBASSIES: Record<string, typeof EMBASSIES> = {
  'United Arab Emirates': EMBASSIES,
};

function EmbassyFinderScreen({ back, residenceCountry }: { back: () => void; residenceCountry?: string }) {
  const [hostCountry, setHostCountry] = useState(residenceCountry?.trim() || 'United Arab Emirates');
  const [editingHost, setEditingHost] = useState(false);
  // Preferences can finish loading after this screen has already mounted —
  // pick up a residence country that arrives late, but only if the user
  // hasn't already started typing their own.
  const hostTouchedRef = useRef(false);
  useEffect(() => {
    if (!hostTouchedRef.current && residenceCountry?.trim()) setHostCountry(residenceCountry.trim());
  }, [residenceCountry]);
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(EMBASSY_COUNTRIES[0]);

  const normalizedHost = normalizeHostCountry(hostCountry);
  const verifiedForHost = VERIFIED_EMBASSIES[normalizedHost];
  const trimmedQuery = query.trim().toLowerCase();
  const searchPool = trimmedQuery ? WORLD_COUNTRIES : EMBASSY_COUNTRIES;
  const filteredCountries = searchPool.filter(c => c.toLowerCase().includes(trimmedQuery));
  const emb = verifiedForHost?.[selectedCountry];

  const mapsQuery = `Embassy or Consulate of ${selectedCountry} in ${hostCountry.trim() || 'my country'}`;
  const rows: [IoniconName, string, string, (() => void) | undefined][] = emb
    ? [
        ['location-outline', 'Address · tap for directions', emb.address, () => openUrlSafely(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emb.address)}`)],
        ['call-outline', 'Phone', emb.phone, () => openUrlSafely(`tel:${emb.phone}`)],
        ['time-outline', 'Consular hours', emb.hours, undefined],
        ['globe-outline', 'Website', emb.website, () => openUrlSafely(`https://${emb.website}`)],
      ]
    : [];

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Consulate directory</Text>
      <Text style={styles.title}>Embassy Finder</Text>

      <Section title="Your location">
        {editingHost ? (
          <View>
            <View style={[styles.searchInput, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <Ionicons name="location-outline" size={16} color={colors.slate500} />
              <TextInput
                value={hostCountry}
                onChangeText={(v) => { hostTouchedRef.current = true; setHostCountry(v); }}
                placeholder="Your country, e.g. India, Germany, Nigeria"
                placeholderTextColor={colors.slate500}
                autoCapitalize="words"
                autoFocus
                onSubmitEditing={() => setEditingHost(false)}
                style={{ flex: 1, fontSize: 14, color: colors.slate900, padding: 0 }}
              />
              <Pressable onPress={() => setEditingHost(false)}><Ionicons name="checkmark-circle" size={20} color={colors.green500} /></Pressable>
            </View>
            {(() => {
              const trimmedHost = hostCountry.trim().toLowerCase();
              const hostSuggestions = trimmedHost
                ? WORLD_COUNTRIES.filter(c => c.toLowerCase().includes(trimmedHost) && c.toLowerCase() !== trimmedHost).slice(0, 6)
                : [];
              return hostSuggestions.length > 0 ? (
                <View style={{ backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.slate100, marginTop: 6, overflow: 'hidden' }}>
                  {hostSuggestions.map((c, i) => (
                    <Pressable
                      key={c}
                      onPress={() => { hostTouchedRef.current = true; setHostCountry(c); setEditingHost(false); }}
                      style={{ paddingVertical: 11, paddingHorizontal: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.slate50 }}
                    >
                      <Text style={{ color: colors.slate800, fontSize: 14 }}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null;
            })()}
          </View>
        ) : (
          <Pressable style={styles.taskRow} onPress={() => setEditingHost(true)}>
            <View style={[styles.quickIconBox, { backgroundColor: colors.royal50, width: 36, height: 36 }]}>
              <Ionicons name="location" size={18} color={colors.royal600} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{hostCountry.trim() || 'Set your country'}</Text>
              <Text style={styles.rowMeta}>{residenceCountry?.trim() === hostCountry.trim() ? 'From your profile settings · tap to change' : 'Tap to change'}</Text>
            </View>
            <Ionicons name="create-outline" size={16} color={colors.slate300} />
          </Pressable>
        )}
      </Section>

      <View style={[styles.searchInput, { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }]}>
        <Ionicons name="search-outline" size={16} color={colors.slate500} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search any country in the world…"
          placeholderTextColor={colors.slate500}
          style={{ flex: 1, fontSize: 14, color: colors.slate900, padding: 0 }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.slate500} />
          </Pressable>
        )}
      </View>
      <Section title="Select destination country">
        {filteredCountries.length === 0 ? (
          <Text style={[styles.rowMeta, { paddingVertical: 8 }]}>No countries match "{query}".</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
              {filteredCountries.map((c) => (
                <Pressable key={c} onPress={() => setSelectedCountry(c)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedCountry === c ? colors.navy900 : colors.slate100 }}>
                  <Text style={{ color: selectedCountry === c ? '#fff' : colors.slate700, fontWeight: '700', fontSize: 13 }}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </Section>
      <LinearGradient colors={['#0B1F4B','#1547C0']} style={[styles.reportHero, { marginBottom: 16 }]}>
        <Ionicons name="business-outline" size={36} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>{emb ? emb.name : `${selectedCountry} in ${hostCountry.trim() || 'your country'}`}</Text>
      </LinearGradient>
      {emb ? (
        <Section title="Contact details">
          {rows.map(([icon, label, value, onPress]) => (
            <Pressable key={label} style={[styles.taskRow, { gap: 14 }]} onPress={onPress} disabled={!onPress}>
              <View style={[styles.quickIconBox, { backgroundColor: onPress ? colors.royal50 : colors.slate50, width: 36, height: 36 }]}>
                <Ionicons name={icon} size={18} color={onPress ? colors.royal600 : colors.slate500} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{label}</Text>
                <Text style={[styles.rowMeta, { color: onPress ? colors.royal600 : colors.slate500 }]}>{value}</Text>
              </View>
              {onPress && <Ionicons name="open-outline" size={14} color={colors.royal600} />}
            </Pressable>
          ))}
        </Section>
      ) : (
        <Section title="Find the official location">
          <Finding
            title="We don't have a verified address on file for this pair yet"
            meta={`Rather than guess, search live for the real result — this looks up "${mapsQuery}" directly.`}
          />
          <Pressable style={[styles.taskRow, { gap: 14 }]} onPress={() => openUrlSafely(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`)}>
            <View style={[styles.quickIconBox, { backgroundColor: colors.royal50, width: 36, height: 36 }]}>
              <Ionicons name="map-outline" size={18} color={colors.royal600} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Find on Google Maps</Text>
              <Text style={[styles.rowMeta, { color: colors.royal600 }]}>Live search · opens in Maps</Text>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.royal600} />
          </Pressable>
          <Pressable style={[styles.taskRow, { gap: 14 }]} onPress={() => openUrlSafely(`https://www.google.com/search?q=${encodeURIComponent(`${selectedCountry} ministry of foreign affairs consulate in ${hostCountry.trim() || 'my country'}`)}`)}>
            <View style={[styles.quickIconBox, { backgroundColor: colors.royal50, width: 36, height: 36 }]}>
              <Ionicons name="globe-outline" size={18} color={colors.royal600} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Search the official government site</Text>
              <Text style={[styles.rowMeta, { color: colors.royal600 }]}>Live search · opens in browser</Text>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.royal600} />
          </Pressable>
        </Section>
      )}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Verify hours and appointment requirements on the official embassy website before visiting.</Text>
      </View>
    </View>
  );
}

// ─── Face Verification ────────────────────────────────────────────────────────
// Real on-device liveness/identity check via Google ML Kit face detection —
// no simulated pass/fail. A capture is only marked verified when ML Kit
// itself finds exactly one face with both eyes open; if the model can't run
// at all, that's surfaced as its own "unavailable" state rather than a fake pass.
type FaceVerifyStage = 'intro' | 'camera' | 'checking' | 'pass' | 'fail' | 'unavailable';

// ─── Face verification ────────────────────────────────────────────────────────
type FaceStage = 'intro' | 'passport' | 'ready' | 'live' | 'saving' | 'done' | 'fail';

/** Finds the (largest) face in a passport photo and returns it cropped, ready for the matcher. */
async function cropPassportFace(uri: string): Promise<{ base64: string; previewUri: string } | { error: string }> {
  try {
    const { default: FaceDetection } = await import('@react-native-ml-kit/face-detection');
    const faces = await FaceDetection.detect(uri, { performanceMode: 'accurate', minFaceSize: 0.03 });
    if (faces.length === 0) return { error: 'No face was found in that photo. Photograph the passport photo page flat, in good light, with the picture sharp.' };
    const face = [...faces].sort((a, b) => b.frame.width * b.frame.height - a.frame.width * a.frame.height)[0];
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    // Pad the detected box so hair/chin are included, but never past the picture's edges.
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
    const pad = Math.max(face.frame.width, face.frame.height) * 0.45;
    const originX = Math.max(0, Math.round(face.frame.left - pad));
    const originY = Math.max(0, Math.round(face.frame.top - pad));
    const width = Math.min(size.width - originX, Math.round(face.frame.width + pad * 2));
    const height = Math.min(size.height - originY, Math.round(face.frame.height + pad * 2));
    const out = await manipulateAsync(uri, [{ crop: { originX, originY, width, height } }, { resize: { width: 480 } }], { compress: 0.92, format: SaveFormat.JPEG, base64: true });
    if (!out.base64) return { error: 'Could not prepare the passport photo. Try again.' };
    return { base64: out.base64, previewUri: out.uri };
  } catch {
    return { error: 'Could not read that photo. Try again in better light.' };
  }
}

function FaceVerifyScreen({ back, uid, status, reload, openScanner, firstRun, onLater }: {
  firstRun?: boolean;
  onLater?: () => void;
  back: () => void;
  uid: string;
  status: ApiFaceStatus | null;
  reload: () => Promise<void>;
  openScanner: () => void;
}) {
  const insets = useSafeAreaInsets();
  const available = faceSdkAvailable();
  const thresholds = status?.thresholds ?? { similarity: 0.7, liveness: 0.6 };
  const [stage, setStage] = useState<FaceStage>(status?.enrolled ? 'done' : 'intro');
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState<number | null>(status?.passportSimilarity ?? null);
  const [working, setWorking] = useState(false);

  const enrolled = !!status?.enrolled;
  const stale = enrolled && !status?.sessionFresh;

  const pickPassport = async (source: 'camera' | 'library') => {
    setMessage('');
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : { granted: true };
      if (!perm.granted) { setMessage('Camera permission is needed to photograph your passport.'); return; }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.95 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.95 });
      if (result.canceled || !result.assets?.[0]) return;
      setWorking(true);
      const cropped = await cropPassportFace(result.assets[0].uri);
      if ('error' in cropped) { setMessage(cropped.error); return; }
      const r = await enrolPassportFace(uid, cropped.base64);
      if (!r.faceFeature) { setMessage(r.message || 'The matcher could not use that face. Try a sharper photo.'); return; }
      setPreview(cropped.previewUri);
      setStage('ready');
    } catch (e: any) {
      setMessage(e?.message ?? 'Something went wrong reading the passport photo.');
    } finally {
      setWorking(false);
    }
  };

  const runLiveCheck = async () => {
    setMessage('');
    setWorking(true);
    setStage('live');
    try {
      const check = await liveVerify(passportFaceId(uid), thresholds);
      if (check.liveness < thresholds.liveness) { setMessage('The liveness check did not pass. Follow each instruction on screen, in good light, without glasses or a hat.'); setStage('fail'); return; }
      if (check.similarity < thresholds.similarity) { setScore(check.similarity); setMessage(`Your face doesn’t match the passport photo closely enough (${Math.round(check.similarity * 100)}%). Make sure it’s your own passport and try again.`); setStage('fail'); return; }
      // The live face template is what locks this account to one person.
      let feature = check.faceFeature;
      if (!feature) {
        const captured = await captureAccountFace(uid);
        feature = captured.faceFeature;
      }
      if (!feature) { setMessage('Could not save your face template. Try again.'); setStage('fail'); return; }
      setStage('saving');
      await enrollFace({ faceFeature: feature, passportSimilarity: check.similarity, liveness: check.liveness, steps: ['blink', 'mouth', 'nod', 'turn'] });
      await forgetPassportFace(uid);
      setScore(check.similarity);
      await reload();
      setStage('done');
    } catch (e: any) {
      setMessage(e?.message ?? 'Face verification failed. Try again.');
      setStage('fail');
    } finally {
      setWorking(false);
    }
  };

  // Returning check on this or a new phone: the person must still match the face locked to the account.
  const recheck = async () => {
    setMessage('');
    setWorking(true);
    try {
      const { faceFeature } = await fetchFaceTemplate();
      await loadAccountTemplate(uid, faceFeature);
      const check = await liveVerify(accountFaceId(uid), thresholds);
      if (!check.ok) { setMessage(check.liveness < thresholds.liveness ? 'The liveness check did not pass. Try again.' : 'This face does not match the verified face on this account.'); return; }
      await confirmFaceCheck({ similarity: check.similarity, liveness: check.liveness });
      await reload();
      Alert.alert('Verified', 'Thanks — you’re confirmed as the account holder.');
    } catch (e: any) {
      setMessage(e?.message ?? 'Could not complete the check.');
    } finally {
      setWorking(false);
    }
  };

  const Step = ({ n, title, body, done }: { n: number; title: string; body: string; done?: boolean }) => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? colors.green500 : colors.royal50, alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={{ color: colors.royal600, fontWeight: '900', fontSize: 13 }}>{n}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 14 }}>{title}</Text>
        <Text style={{ color: colors.slate500, fontSize: 12.5, lineHeight: 18, marginTop: 1 }}>{body}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ gap: 16, paddingBottom: insets.bottom }}>
      {firstRun ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>STEP 1 · SECURE YOUR ACCOUNT</Text>
          {!enrolled && <Pressable onPress={onLater} accessibilityLabel="Do this later" hitSlop={10}><Text style={{ color: colors.slate500, fontWeight: '800', fontSize: 13 }}>Later</Text></Pressable>}
        </View>
      ) : (
        <BackButton label="Back" onPress={back} />
      )}
      <View>
        <Text style={styles.eyebrow}>Identity check</Text>
        <Text style={[styles.title, { marginBottom: 4 }]}>Verify it’s really you</Text>
        <Text style={[styles.rowMeta, { lineHeight: 19 }]}>Like a bank app: a live check confirms a real person, and your face is matched to your passport photo. One person per account.</Text>
      </View>

      {!available && (
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, gap: 6 }}>
          <Text style={{ color: '#92400E', fontWeight: '900' }}>Needs a physical phone</Text>
          <Text style={{ color: '#92400E', fontSize: 12.5, lineHeight: 18 }}>The face engine uses your phone’s camera and processor and can’t run on an emulator or an unsupported device. Open the app on a real Android phone to verify.</Text>
        </View>
      )}

      {enrolled && (
        <View style={{ backgroundColor: '#ECFDF5', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#A7F3D0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#065F46', fontWeight: '900', fontSize: 16 }}>Face verified</Text>
              <Text style={{ color: '#047857', fontSize: 12.5 }}>{score !== null ? `${Math.round(score * 100)}% match to your passport photo` : 'Matched to your passport photo'}{status?.enrolledAt ? ` · ${new Date(status.enrolledAt).toLocaleDateString()}` : ''}</Text>
            </View>
          </View>
          <Text style={{ color: '#065F46', fontSize: 12.5, lineHeight: 18 }}>This account is locked to your face. Only you can run analysis here, and a different face can’t be added.</Text>
          {stale && (
            <Pressable disabled={!available || working} onPress={recheck} accessibilityLabel="Re-check my face" style={[styles.primaryButton, { marginTop: 4 }, (!available || working) && styles.disabledButton]}>
              {working ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Quick face check</Text>}
            </Pressable>
          )}
          {!stale && !firstRun && <Text style={{ color: '#047857', fontSize: 12, fontWeight: '700' }}>Checked recently — no action needed.</Text>}
          {firstRun && (
            <Pressable onPress={back} accessibilityLabel="Continue" style={[styles.primaryButton, { marginTop: 4 }]}><Text style={styles.primaryButtonText}>Continue</Text></Pressable>
          )}
        </View>
      )}

      {!enrolled && (
        <View style={{ gap: 14 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate100, padding: 16, gap: 14 }}>
            <Step n={1} title="Photograph your passport photo page" body="We cut out just the face to compare with. The picture isn’t kept." done={stage === 'ready' || stage === 'live' || stage === 'saving' || stage === 'done'} />
            <Step n={2} title="Do the live check" body="Follow the on-screen prompts: blink, open your mouth, nod and turn your head. This proves a real person is there." done={stage === 'saving' || stage === 'done'} />
            <Step n={3} title="Get your badge" body="Your face is matched to the passport photo and locked to this account." done={stage === 'done'} />
          </View>

          {preview && (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Image source={{ uri: preview }} style={{ width: 96, height: 96, borderRadius: 16, backgroundColor: colors.slate100 }} />
              <Text style={{ color: colors.slate500, fontSize: 12 }}>Face found in your passport photo</Text>
            </View>
          )}

          {(stage === 'intro' || stage === 'passport' || stage === 'fail') && !preview && (
            <View style={{ gap: 10 }}>
              <Pressable disabled={!available || working} onPress={() => pickPassport('camera')} accessibilityLabel="Photograph passport" style={[styles.primaryButton, { marginTop: 0, flexDirection: 'row', gap: 8 }, (!available || working) && styles.disabledButton]}>
                {working ? <ActivityIndicator color="#fff" /> : <><Ionicons name="camera-outline" size={18} color="#fff" /><Text style={styles.primaryButtonText}>Photograph passport photo page</Text></>}
              </Pressable>
              <Pressable disabled={!available || working} onPress={() => pickPassport('library')} style={[styles.secondaryButton, (!available || working) && { opacity: 0.5 }]}>
                <Text style={styles.secondaryButtonText}>Choose a photo of my passport</Text>
              </Pressable>
            </View>
          )}

          {(stage === 'ready' || (stage === 'fail' && preview)) && (
            <Pressable disabled={!available || working} onPress={runLiveCheck} accessibilityLabel="Start live check" style={[styles.primaryButton, { marginTop: 0, flexDirection: 'row', gap: 8 }, (!available || working) && styles.disabledButton]}>
              {working ? <ActivityIndicator color="#fff" /> : <><Ionicons name="scan-circle-outline" size={20} color="#fff" /><Text style={styles.primaryButtonText}>{stage === 'fail' ? 'Try the live check again' : 'Start live check'}</Text></>}
            </Pressable>
          )}
          {stage === 'live' && <Text style={{ color: colors.slate600, textAlign: 'center' }}>Follow the prompts on screen…</Text>}
          {stage === 'saving' && <View style={{ alignItems: 'center', gap: 8 }}><ActivityIndicator color={colors.royal600} /><Text style={{ color: colors.slate600 }}>Locking your face to this account…</Text></View>}

          <View style={{ backgroundColor: colors.slate50, borderRadius: 14, padding: 14, gap: 6 }}>
            <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>For a clean check</Text>
            {['Good, even light on your face', 'No glasses, hat or mask', 'Only you in the frame', 'Use your own current passport'].map((t) => (
              <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Ionicons name="checkmark-circle" size={15} color={colors.green500} /><Text style={{ color: colors.slate700, fontSize: 13 }}>{t}</Text></View>
            ))}
          </View>
        </View>
      )}

      {!!message && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 14 }}>
          <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 13, lineHeight: 19 }}>{message}</Text>
        </View>
      )}
      <Text style={{ color: colors.slate500, fontSize: 11.5, lineHeight: 17 }}>Your face template stays on your phone and on your account only to confirm it’s you. It is never shared with consultants — they only see the “Face verified” badge, and only if you share your profile.</Text>
    </View>
  );
}


// ─── Timeline Tracker ─────────────────────────────────────────────────────────
// Each stage's "done" status is derived from real app state (uploaded
// documents, real audit results, actual application status) — not from how
// many days are left before the trip.
function buildTimelineStages(app: ReturnType<typeof normalizeApp> | null, documents: ApiDocument[], hasAuditResult: boolean, hasBooking: boolean) {
  const decided = app?.statusRaw === 'approved' || app?.statusRaw === 'rejected';
  const submitted = decided || app?.statusRaw === 'submitted';
  // The documents list holds a 'Missing' placeholder for every document type,
  // so only non-Missing entries are actually uploaded.
  const uploadedDocs = documents.filter((d) => d.status !== 'Missing');
  const insuranceUploaded = uploadedDocs.some((d) => d.type?.toLowerCase() === 'insurance');
  return [
    { label: 'Documents collected', done: uploadedDocs.length > 0, note: uploadedDocs.length > 0 ? `${uploadedDocs.length} uploaded` : 'None uploaded yet' },
    { label: 'AI audit complete', done: hasAuditResult, note: hasAuditResult ? 'At least one document audited' : 'Run an audit from Documents' },
    { label: 'Requirements met', done: !!app && app.documentsUploaded >= app.documentsRequired && app.documentsRequired > 0, note: app ? `${app.documentsUploaded}/${app.documentsRequired} required documents` : 'No application yet' },
    { label: 'Insurance uploaded', done: insuranceUploaded, note: insuranceUploaded ? 'Uploaded' : 'Not uploaded yet' },
    { label: 'Consultant appointment booked', done: hasBooking, note: hasBooking ? 'Booked this session' : 'Not booked yet' },
    { label: 'Application submitted', done: submitted, note: submitted ? 'Submitted' : 'Not submitted yet' },
    { label: 'Decision received', done: decided, note: decided ? (app?.statusRaw === 'approved' ? 'Approved' : 'Rejected') : 'Awaiting decision' },
  ];
}

function TimelineTrackerScreen({ back, openUpload, app, documents, hasAuditResult, hasBooking }: { back: () => void; openUpload: () => void; app: ReturnType<typeof normalizeApp> | null; documents: ApiDocument[]; hasAuditResult: boolean; hasBooking: boolean }) {
  const stages = buildTimelineStages(app, documents, hasAuditResult, hasBooking);
  const currentIdx = stages.findIndex(s => !s.done);
  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Application progress</Text>
      <Text style={styles.title}>Timeline Tracker</Text>
      {!app && (
        <View style={[styles.notice, { marginBottom: 12 }]}>
          <Text style={styles.noticeText}>Create an application to start tracking real progress.</Text>
        </View>
      )}
      <Section title="Current application timeline">
        {stages.map((stage, i) => {
          const isCurrent = i === currentIdx;
          return (
            <View key={stage.label} style={{ flexDirection: 'row', gap: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.slate100 }}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: stage.done ? colors.green500 : isCurrent ? colors.royal600 : colors.slate200, alignItems: 'center', justifyContent: 'center' }}>
                  {stage.done
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : isCurrent
                    ? <Ionicons name="time-outline" size={14} color="#fff" />
                    : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.slate300 }} />}
                </View>
                {i < stages.length - 1 && (
                  <View style={{ width: 2, flex: 1, marginTop: 4, backgroundColor: stage.done ? colors.green500 : colors.slate200 }} />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: 8 }}>
                <Text style={[styles.rowTitle, isCurrent && { color: colors.royal600 }]}>{stage.label}</Text>
                <Text style={styles.rowMeta}>{stage.note}{isCurrent ? ' · Current step' : ''}</Text>
              </View>
            </View>
          );
        })}
      </Section>
      <Pressable style={styles.primaryButton} onPress={openUpload}>
        <Text style={styles.primaryButtonText}>Upload documents to advance</Text>
      </Pressable>
    </View>
  );
}

// ─── Country Comparison ───────────────────────────────────────────────────────
const COMPARISON_DATA: Record<string, { fee: string; time: string; docs: number; difficulty: string; color: string }> = {
  'France':          { fee: '€80',    time: '10–15 days',  docs: 12, difficulty: 'Medium',    color: '#2563EB' },
  'Germany':         { fee: '€80',    time: '10–15 days',  docs: 11, difficulty: 'Medium',    color: '#0369A1' },
  'Spain':           { fee: '€80',    time: '10–15 days',  docs: 11, difficulty: 'Medium',    color: '#DC2626' },
  'Italy':           { fee: '€80',    time: '10–15 days',  docs: 12, difficulty: 'Medium',    color: '#16A34A' },
  'Netherlands':     { fee: '€80',    time: '10–15 days',  docs: 11, difficulty: 'Medium',    color: '#D97706' },
  'United Kingdom':  { fee: '£115',   time: '15–20 days',  docs: 14, difficulty: 'High',      color: '#7C3AED' },
  'United States':   { fee: '$185',   time: '30–60 days',  docs: 16, difficulty: 'Very High', color: '#059669' },
  'Canada':          { fee: 'C$100',  time: '20–45 days',  docs: 13, difficulty: 'High',      color: '#F59E0B' },
  'Australia':       { fee: 'A$145',  time: '20–30 days',  docs: 13, difficulty: 'Medium',    color: '#0EA5E9' },
  'New Zealand':     { fee: 'NZ$23',  time: '5–10 days',   docs: 8,  difficulty: 'Easy',      color: '#10B981' },
  'Japan':           { fee: 'Free',   time: '5–10 days',   docs: 9,  difficulty: 'Medium',    color: '#EF4444' },
  'South Korea':     { fee: 'KRW 40k',time: '5–7 days',    docs: 9,  difficulty: 'Medium',    color: '#6366F1' },
  'Singapore':       { fee: 'SGD 30', time: '1–3 days',    docs: 6,  difficulty: 'Easy',      color: '#EC4899' },
  'Thailand':        { fee: 'Free',   time: 'On arrival',  docs: 4,  difficulty: 'Very Easy',  color: '#8B5CF6' },
  'Malaysia':        { fee: 'MYR 200',time: '1–3 days',    docs: 6,  difficulty: 'Easy',      color: '#F97316' },
  'Turkey':          { fee: '$50',    time: 'Instant',     docs: 3,  difficulty: 'Very Easy',  color: '#EF4444' },
  'India':           { fee: '$25–80', time: '1–4 days',    docs: 5,  difficulty: 'Easy',      color: '#F59E0B' },
  'Saudi Arabia':    { fee: 'SAR 300',time: '24–48 hours', docs: 5,  difficulty: 'Easy',      color: '#16A34A' },
  'Switzerland':     { fee: '€80',    time: '10–15 days',  docs: 12, difficulty: 'Medium',    color: '#DC2626' },
  'South Africa':    { fee: 'Free',   time: 'On arrival',  docs: 4,  difficulty: 'Very Easy',  color: '#0369A1' },
  'Brazil':          { fee: '$80',    time: '5–10 days',   docs: 8,  difficulty: 'Medium',    color: '#16A34A' },
  'Kenya':           { fee: '$51',    time: '3–5 days',    docs: 6,  difficulty: 'Easy',      color: '#D97706' },
};
const COMP_COUNTRIES = Object.keys(COMPARISON_DATA);

function CountryComparisonScreen({ back }: { back: () => void }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const da = COMPARISON_DATA[COMP_COUNTRIES[a]];
  const db = COMPARISON_DATA[COMP_COUNTRIES[b]];

  const Row = ({ label, va, vb }: { label: string; va: string; vb: string }) => (
    <View style={{ flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.slate100 }}>
      <Text style={[styles.rowMeta, { width: 90 }]}>{label}</Text>
      <Text style={[styles.rowTitle, { flex: 1, textAlign: 'center' }]}>{va}</Text>
      <Text style={[styles.rowTitle, { flex: 1, textAlign: 'center' }]}>{vb}</Text>
    </View>
  );

  const CountryPicker = ({ value, other, onChange }: { value: number; other: number; onChange: (i: number) => void }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {COMP_COUNTRIES.map((c, i) => {
          const isSame = i === other;
          return (
            <Pressable key={c} onPress={() => !isSame && onChange(i)} disabled={isSame}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, opacity: isSame ? 0.35 : 1, backgroundColor: value === i ? colors.royal600 : colors.slate100 }}>
              <Text style={{ color: value === i ? '#fff' : colors.slate700, fontWeight: '700', fontSize: 12 }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Side-by-side analysis</Text>
      <Text style={styles.title}>Country Comparison</Text>
      <Section title="Country A">
        <CountryPicker value={a} other={b} onChange={setA} />
      </Section>
      <Section title="Country B">
        <CountryPicker value={b} other={a} onChange={setB} />
      </Section>
      <Section title="Comparison">
        <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
          <Text style={[styles.rowMeta, { width: 90 }]} />
          <Text style={[styles.rowTitle, { flex: 1, textAlign: 'center', color: COMPARISON_DATA[COMP_COUNTRIES[a]].color }]}>{COMP_COUNTRIES[a]}</Text>
          <Text style={[styles.rowTitle, { flex: 1, textAlign: 'center', color: COMPARISON_DATA[COMP_COUNTRIES[b]].color }]}>{COMP_COUNTRIES[b]}</Text>
        </View>
        <Row label="Fee" va={da.fee} vb={db.fee} />
        <Row label="Processing" va={da.time} vb={db.time} />
        <Row label="Documents" va={`${da.docs} items`} vb={`${db.docs} items`} />
        <Row label="Difficulty" va={da.difficulty} vb={db.difficulty} />
      </Section>
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Requirements and fees change. Always verify with official embassy sources before applying.</Text>
      </View>
    </View>
  );
}

// ─── Splash Screen ───────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  // Same look as the native launch screen (white, logo) so there's no flash
  // between them; stays only as long as the saved-session check needs.
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ minHeight: winH - insets.top, margin: -18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <StatusBar barStyle="dark-content" />
      <Image source={require('./assets/logo-icon.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
      <Text style={{ color: colors.navy900, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>
        VISA WITH <Text style={{ color: colors.teal500 }}>EASE</Text>
      </Text>
      <ActivityIndicator color={colors.royal600} style={{ marginTop: 18 }} />
    </View>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────────
function RegisterScreen({ back, onSuccess, setStickyFooter }: { back: () => void; onSuccess: (session: AuthSession) => void; setStickyFooter: (node: React.ReactNode) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calcStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  };
  const strengthColors = ['#DC2626','#F59E0B','#3B82F6','#10B981'];
  const strengthLabels = ['Weak','Fair','Good','Strong'];
  const canCreate = name.length > 1 && email.includes('@') && password.length >= 8 && accepted && !loading;

  const handleCreate = async () => {
    if (!canCreate) return;
    setError('');
    setLoading(true);
    try {
      const session = await apiRegister(name.trim(), email.trim(), password);
      onSuccess(session);
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 12, paddingTop: 4, paddingBottom: 12 }}>
      <BackButton label="Sign in" onPress={back} />
      <Text style={[styles.title, { marginBottom: 4 }]}>Create account</Text>
      <Text style={styles.bodyText}>Join Visa With Ease to get AI-powered visa readiness, document audit and expert matching.</Text>
      <View style={styles.stepCard}>
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Full name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your full name" style={styles.searchInput} />
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Email address</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={styles.searchInput} />
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Password</Text>
        <TextInput value={password} onChangeText={v => { setPassword(v); calcStrength(v); }} secureTextEntry placeholder="Minimum 8 characters" style={styles.searchInput} />
        {password.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
              {[0,1,2,3].map(i => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < strength ? strengthColors[strength - 1] : colors.slate200 }} />
              ))}
            </View>
            <Text style={[styles.rowMeta, { color: strength > 0 ? strengthColors[strength - 1] : colors.slate500 }]}>{strength > 0 ? strengthLabels[strength - 1] : 'Enter password'}</Text>
          </View>
        )}
        <Pressable style={styles.checkboxRow} onPress={() => setAccepted(v => !v)}>
          <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
            {accepted && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>I agree to the Terms of Service and Privacy Policy.</Text>
        </Pressable>
      </View>
      {error ? (
        <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}
      <Pressable style={[styles.primaryButton, { marginTop: 0 }, !canCreate && styles.disabledButton]} onPress={canCreate ? handleCreate : undefined}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, !canCreate && styles.disabledButtonText]}>Create account</Text>}
      </Pressable>
    </View>
  );
}

// ─── Email Verification Screen ───────────────────────────────────────────────
const OTP_LENGTH = 6;

function OtpBoxes({ digits, onChange, onComplete, shake }: {
  digits: string[];
  onChange: (next: string[]) => void;
  onComplete: (code: string) => void;
  shake: boolean;
}) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const scales = useRef(digits.map(() => new Animated.Value(1))).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shake) return;
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  const popBox = (i: number) => {
    Animated.sequence([
      Animated.timing(scales[i], { toValue: 1.22, duration: 90, useNativeDriver: true }),
      Animated.spring(scales[i], { toValue: 1, useNativeDriver: true, friction: 4, tension: 140 }),
    ]).start();
  };

  const setDigit = (i: number, next: string[]) => {
    onChange(next);
    const joined = next.join('');
    if (joined.length === OTP_LENGTH && next.every(d => d !== '')) {
      onComplete(joined);
    }
  };

  const handleChange = (i: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length > 1) {
      // Pasted or autofilled multiple digits at once — spread across boxes.
      const chars = clean.split('').slice(0, OTP_LENGTH - i);
      const next = [...digits];
      chars.forEach((c, idx) => { next[i + idx] = c; });
      chars.forEach((_, idx) => popBox(i + idx));
      const lastIdx = Math.min(i + chars.length, OTP_LENGTH - 1);
      inputRefs.current[lastIdx]?.focus();
      setDigit(i, next);
      return;
    }
    const next = [...digits];
    next[i] = clean;
    if (clean) {
      popBox(i);
      if (i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    }
    setDigit(i, next);
  };

  const handleKeyPress = (i: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  return (
    <Animated.View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', transform: [{ translateX: shakeX }] }}>
      {digits.map((d, i) => (
        <Animated.View key={i} style={{ transform: [{ scale: scales[i] }] }}>
          <TextInput
            ref={r => { inputRefs.current[i] = r; }}
            value={d}
            onChangeText={(v) => handleChange(i, v)}
            onKeyPress={(e) => handleKeyPress(i, e)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoFocus={i === 0}
            maxLength={OTP_LENGTH}
            style={{
              width: 46, height: 56, borderRadius: 12, borderWidth: 2,
              borderColor: d ? colors.royal600 : colors.slate200,
              backgroundColor: d ? colors.royal50 : '#fff',
              textAlign: 'center', fontSize: 24, fontWeight: '900', color: colors.slate900,
            }}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
}

function VerifyEmailScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [shake, setShake] = useState(false);
  const code = digits.join('');
  const [resendSeconds, setResendSeconds] = useState(60);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const doVerify = async (submittedCode: string) => {
    if (verifying) return;
    setVerifying(true);
    try {
      await verifyEmailOtp(email, submittedCode);
      setVerified(true);
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      setDigits(Array(OTP_LENGTH).fill(''));
      Alert.alert('Invalid code', 'The verification code is incorrect or expired. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  return (
    <View style={[styles.welcome, { alignItems: 'center' }]}>
      <LinearGradient colors={['#EFF6FF','#DBEAFE']} style={[styles.brandMark, { width: 80, height: 80, borderRadius: 40 }]}>
        <Ionicons name="mail-outline" size={36} color={colors.royal600} />
      </LinearGradient>
      {verified ? (
        <>
          <LinearGradient colors={['#D1FAE5','#A7F3D0']} style={[styles.brandMark, { width: 80, height: 80, borderRadius: 40 }]}>
            <Ionicons name="checkmark-circle" size={42} color={colors.green500} />
          </LinearGradient>
          <Text style={styles.title}>Email verified!</Text>
          <Text style={[styles.bodyText, { textAlign: 'center' }]}>Your account is ready. Let's set up your visa context.</Text>
          <Pressable style={styles.primaryButton} onPress={onDone}>
            <Text style={styles.primaryButtonText}>Get started</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={[styles.bodyText, { textAlign: 'center' }]}>We sent a 6-digit code to {email}. Enter it below to verify your account.</Text>
          <View style={{ marginVertical: 20 }}>
            <OtpBoxes digits={digits} onChange={setDigits} onComplete={doVerify} shake={shake} />
          </View>
          <Pressable style={[styles.primaryButton, (code.length < 6 || verifying) && styles.disabledButton]} disabled={code.length < 6 || verifying} onPress={code.length === 6 ? () => doVerify(code) : undefined}>
            {verifying
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.primaryButtonText, code.length < 6 && styles.disabledButtonText]}>Verify email</Text>
            }
          </Pressable>
          <Pressable
            disabled={resendSeconds > 0 || resendStatus === 'sending'}
            style={{ marginTop: 14, minHeight: 24 }}
            onPress={async () => {
              setResendStatus('sending');
              try {
                await sendVerificationEmail(email);
                setResendSeconds(60);
                setResendStatus('sent');
              } catch {
                setResendStatus('error');
              }
            }}
          >
            <Text style={[styles.rowMeta, { textAlign: 'center', fontWeight: '700', color:
              resendStatus === 'error' ? '#DC2626'
              : resendStatus === 'sent' ? colors.green500
              : resendSeconds > 0 ? colors.slate500
              : colors.royal600 }]}>
              {resendStatus === 'sending' ? 'Sending…'
                : resendStatus === 'error' ? "Couldn't resend — tap to try again"
                : resendStatus === 'sent' && resendSeconds > 0 ? `Sent! Resend again in ${resendSeconds}s`
                : resendSeconds > 0 ? `Resend in ${resendSeconds}s`
                : 'Resend code'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─── Camera Scanner Screen ────────────────────────────────────────────────────
const SCAN_BOX = SCREEN_W - 64;

const DOC_KINDS: DocKind[] = ['passport', 'bank', 'employment', 'insurance', 'itinerary', 'photo', 'other'];
function toDocKind(id: string): DocKind {
  return (DOC_KINDS as string[]).includes(id) ? (id as DocKind) : 'other';
}

/**
 * Gallery/file picks skip the live camera check, so run the same "is this
 * really that document?" recognition on the picked image's OCR text and let
 * the user back out before it's uploaded. Returns true to proceed.
 */
function confirmDocumentMatch(docTypeId: string, ocr: OcrLike | null): Promise<boolean> {
  const kind = toDocKind(docTypeId);
  // Photos and "other" can't be judged from text alone.
  if (kind === 'photo' || kind === 'other' || !ocr) return Promise.resolve(true);
  const verdict = judge(kind, recognise(ocr));
  if (verdict.status !== 'mismatch') return Promise.resolve(true);
  return new Promise((resolve) => {
    Alert.alert(verdict.title, verdict.detail, [
      { text: 'Choose another', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Use anyway', style: 'destructive', onPress: () => resolve(true) },
    ], { onDismiss: () => resolve(false) });
  });
}

/** Numbered how-to for one document type — used before scanning and before uploading. */
function DocGuideCard({ kind, dark }: { kind: DocKind; dark?: boolean }) {
  const guide = DOC_GUIDES[kind];
  const text = dark ? 'rgba(255,255,255,0.9)' : colors.slate700;
  const muted = dark ? 'rgba(255,255,255,0.6)' : colors.slate500;
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: muted, fontSize: 13, lineHeight: 19 }}>{guide.intro}</Text>
      {guide.steps.map((step, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: dark ? 'rgba(255,255,255,0.16)' : colors.royal50, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            <Text style={{ color: dark ? '#fff' : colors.royal600, fontSize: 11, fontWeight: '900' }}>{i + 1}</Text>
          </View>
          <Text style={{ flex: 1, color: text, fontSize: 13.5, lineHeight: 19 }}>{step}</Text>
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.14)' : colors.slate100, marginVertical: 2 }} />
      <Text style={{ color: muted, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>Avoid</Text>
      {guide.avoid.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Ionicons name="close-circle" size={16} color="#F87171" />
          <Text style={{ flex: 1, color: text, fontSize: 13, lineHeight: 18 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** What was actually read from the passport's machine-readable zone, with the checks that back it. */
function PassportDetailsCard({ mrz }: { mrz: MrzResult }) {
  const f = mrz.fields;
  const months = f.expiryDate ? monthsUntil(f.expiryDate) : null;
  const validity = months === null
    ? { text: 'Expiry unreadable', color: '#F59E0B' }
    : months < 0 ? { text: 'Expired', color: '#F87171' }
      : months < 6 ? { text: `Expires in ${months} month${months === 1 ? '' : 's'} — many countries need 6+`, color: '#F59E0B' }
        : { text: `Valid for ${months >= 24 ? `${Math.floor(months / 12)} years` : `${months} months`}`, color: '#34D399' };
  const rows: Array<[string, string]> = [
    ['Name', `${f.givenNames} ${f.surname}`.trim() || '—'],
    ['Passport no.', f.documentNumber || '—'],
    ['Nationality', f.nationality || '—'],
    ['Date of birth', f.birthDate ?? '—'],
    ['Expiry', f.expiryDate ?? '—'],
  ];
  return (
    <View style={{ backgroundColor: 'rgba(11,31,75,0.92)', borderRadius: 16, padding: 14, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="id-card-outline" size={16} color="#93C5FD" />
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, flex: 1 }}>Read from your passport</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={mrz.valid ? 'shield-checkmark' : 'alert-circle'} size={14} color={mrz.valid ? '#34D399' : '#F59E0B'} />
          <Text style={{ color: mrz.valid ? '#34D399' : '#F59E0B', fontSize: 11, fontWeight: '800' }}>{mrz.valid ? (mrz.checks.personalNumber === null || mrz.checks.composite === null ? 'Key checksums valid' : 'Checksums valid') : 'Some characters unclear'}</Text>
        </View>
      </View>
      {rows.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{k}</Text>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{v}</Text>
        </View>
      ))}
      <Text style={{ color: validity.color, fontSize: 12, fontWeight: '800', marginTop: 4 }}>{validity.text}</Text>
      {!mrz.valid && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>A check digit did not match, so a character was probably misread. Retake in sharper light for an exact reading.</Text>}
    </View>
  );
}

function CameraScreen({ docType, back, onCapture, initialUri, initialMime }: { docType: string; back: () => void; onCapture: (extractedText?: string, imageBase64?: string, mimeType?: string) => void; initialUri?: string; initialMime?: string }) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const docKind = toDocKind(docType);
  const guide = DOC_GUIDES[docKind];
  const docLabel = DOC_KIND_LABEL[docKind];
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [facing, setFacing] = useState<'front' | 'back'>(docKind === 'photo' ? 'front' : 'back');
  const [captured, setCaptured] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [mrzRead, setMrzRead] = useState<MrzResult | null>(null);
  const [checkUnavailable, setCheckUnavailable] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [auto, setAuto] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  // Bumping this remounts the camera view, which drops any picture request a
  // background preview probe left hanging on the native side.
  const [cameraKey, setCameraKey] = useState(0);
  const [liveHint, setLiveHint] = useState('Point the camera at the document');
  const [liveChecksState, setLiveChecksState] = useState<LiveCheck[]>([]);
  const [liveReady, setLiveReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const busyRef = useRef(false);
  // A picture requested before the camera reports ready (right after mounting or a
  // reset) can hang forever, so capture waits for this — and never waits unbounded.
  const readyRef = useRef(false);
  const waitForCamera = async (ms: number) => {
    for (let waited = 0; !readyRef.current && waited < ms; waited += 100) await new Promise((r) => setTimeout(r, 100));
  };
  const resetCamera = () => { readyRef.current = false; setCameraKey((k) => k + 1); };
  const withTimeout = <T,>(work: Promise<T>, ms: number, label: string): Promise<T> =>
    Promise.race([work, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(label)), ms))]);

  // Frame shape follows the document, and is capped so the checklist and the
  // shutter always fit on short screens instead of being pushed off.
  const maxFrameH = Math.max(150, winH - insets.top - insets.bottom - 470);
  const wantW = guide.frame === 'face' ? SCAN_BOX * 0.7 : guide.frame === 'landscape' ? SCAN_BOX : SCAN_BOX * 0.78;
  const wantH = guide.frame === 'face' ? wantW * 1.3 : guide.frame === 'landscape' ? SCAN_BOX * 0.7 : wantW * 1.3;
  const frameH = Math.min(wantH, maxFrameH);
  const frameW = wantH > maxFrameH ? wantW * (maxFrameH / wantH) : wantW;

  const analyse = async (uri: string) => {
    setAnalysing(true);
    setVerdict(null);
    setMrzRead(null);
    setCheckUnavailable(false);
    try {
      setImageBase64(await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }));
    } catch {
      setImageBase64(undefined);
    }
    try {
      const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
      const ocr = await TextRecognition.recognize(uri);
      setDetectedText((ocr?.text ?? '').trim());
      let faces: FaceLike[] = [];
      if (docKind === 'photo' || docKind === 'passport') {
        try {
          const { default: FaceDetection } = await import('@react-native-ml-kit/face-detection');
          faces = await FaceDetection.detect(uri, { performanceMode: 'fast', minFaceSize: 0.05 });
        } catch { /* face check unavailable — text signals still apply */ }
      }
      let result = judge(docKind, recognise(ocr, faces));
      if (docKind === 'passport') {
        const parsed = parsePassportMrz(ocr?.text ?? '');
        setMrzRead(parsed);
        // An expired passport is a hard stop for an application — say so instead of a plain tick.
        if (parsed?.fields.expiryDate && monthsUntil(parsed.fields.expiryDate) < 0) {
          result = { status: 'mismatch', title: 'This passport has expired', detail: `It expired on ${parsed.fields.expiryDate}. A valid passport is needed to apply — use a current one.` };
        }
      }
      setVerdict(result);
    } catch {
      setCheckUnavailable(true);
    } finally {
      setAnalysing(false);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || busyRef.current) return;
    busyRef.current = true;
    try {
      // Up to three attempts: each waits for the camera to be ready and gives up after
      // 15s, then resets the camera view — a hung request can never freeze the screen.
      let uri: string | null = null;
      for (let attempt = 0; attempt < 3 && !uri; attempt++) {
        try {
          await waitForCamera(6000);
          const photo = await withTimeout(cameraRef.current!.takePictureAsync({ quality: 0.85, base64: false }), 15000, 'capture timeout');
          uri = photo?.uri ?? null;
        } catch {
          resetCamera();
          await new Promise((r) => setTimeout(r, 900));
        }
      }
      if (!uri) {
        setLiveReady(false);
        setCaptureError("Couldn't take the photo — tap the shutter again");
        return;
      }
      setCaptured(uri);
      await analyse(uri);
    } finally {
      busyRef.current = false;
    }
  };

  // Manual shutter: stop the auto loop, let any in-flight preview probe finish
  // (it holds the camera), and reset the camera if it doesn't — a tap is never dropped.
  const onShutter = async () => {
    if (capturing) return;
    setCapturing(true);
    setCaptureError(null);
    setAuto(false);
    for (let waited = 0; busyRef.current && waited < 2500; waited += 150) await new Promise((r) => setTimeout(r, 150));
    busyRef.current = false; // a probe that will not finish must not block the user's own shutter press
    await capturePhoto();
    setCapturing(false);
  };

  // A picked photo/file skips the live camera and goes straight to the same review.
  useEffect(() => {
    if (!initialUri) return;
    setShowGuide(false);
    setAuto(false);
    setCaptured(initialUri);
    void analyse(initialUri);
  }, [initialUri]);

  const retake = () => {
    if (initialUri) { back(); return; } // picked file: "retake" means choose another
    readyRef.current = false;
    setAuto(true);
    setCaptureError(null);
    setCaptured(null); setVerdict(null); setMrzRead(null); setCheckUnavailable(false); setDetectedText(''); setImageBase64(undefined);
    setLiveReady(false); setStreak(0); setLiveChecksState([]); setLiveHint('Point the camera at the document');
  };

  // Live detection, like a dedicated scanner app: about twice a second a small
  // preview frame is read on-device and scored against this document's own
  // checklist. The shutter fires by itself once EVERY required check has held
  // for two frames in a row (the same page, not a passing glance) — the
  // multi-frame confirmation that stops flicker triggering a blurry shot.
  useEffect(() => {
    if (!permission?.granted || captured || !auto || showGuide) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let prev: Set<string> | null = null;
    let run = 0;
    let failures = 0;

    const tick = async () => {
      if (stopped) return;
      try {
        if (cameraRef.current && !busyRef.current) {
          busyRef.current = true;
          let outcome: { checks: LiveCheck[]; ready: boolean; hint: string; tokens: Set<string> } | undefined;
          try {
            await waitForCamera(3000);
            if (!readyRef.current) return;
            const shot = await withTimeout(cameraRef.current.takePictureAsync({ quality: 0.3, base64: false, shutterSound: false }), 8000, 'probe timeout');
            if (stopped || !shot?.uri) return;
            const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
            const ocr = await TextRecognition.recognize(shot.uri);
            let faces: FaceLike[] = [];
            if (docKind === 'photo' || docKind === 'passport') {
              try {
                const { default: FaceDetection } = await import('@react-native-ml-kit/face-detection');
                faces = await FaceDetection.detect(shot.uri, { performanceMode: 'fast', minFaceSize: 0.05 });
              } catch { /* face detection optional for passports */ }
            }
            const size = { width: shot.width, height: shot.height };
            const rec = recognise(ocr, faces, size);
            const mrz = docKind === 'passport' ? parsePassportMrz(ocr?.text ?? '') : null;
            const checks = liveChecks(docKind, rec, faces, size, mrz);
            const failing = checks.find((c) => !c.optional && !c.ok);
            const wrongKind = rec.kind !== 'unknown' && rec.kind !== 'photo' && docKind !== 'other' && docKind !== 'photo' && rec.kind !== docKind;
            outcome = {
              checks,
              ready: !failing && rec.textLength >= 15 || (docKind === 'photo' && !failing),
              hint: rec.textLength < 15 && docKind !== 'photo'
                ? 'Point the camera at the document — more light or closer'
                : wrongKind ? `This looks like a ${DOC_KIND_LABEL[rec.kind as DocKind]} — not a ${docLabel}` : failing ? failing.hint : 'Hold steady…',
              tokens: tokensOf(ocr?.text ?? ''),
            };
          } finally {
            busyRef.current = false;
          }
          if (stopped || !outcome) return;
          failures = 0;
          setLiveChecksState(outcome.checks);
          setLiveHint(outcome.hint);
          setLiveReady(outcome.ready);
          if (outcome.ready) {
            const same = prev !== null && (docKind === 'photo' || similarity(prev, outcome.tokens) >= 0.5);
            run = same ? run + 1 : 1;
            prev = outcome.tokens;
            setStreak(run);
            if (run >= 2) { stopped = true; await capturePhoto(); return; }
          } else {
            run = 0; prev = null; setStreak(0);
          }
        }
      } catch (err) {
        failures += 1;
        // A probe that hangs leaves the camera wedged; reset it so scanning (and the shutter) recover.
        if (err instanceof Error && err.message === 'probe timeout') { resetCamera(); return; }
        if (failures >= 3) {
          setLiveHint('Auto-detect unavailable — tap the shutter to capture');
          setAuto(false);
          return;
        }
      }
      if (!stopped) timer = setTimeout(tick, 500);
    };
    timer = setTimeout(tick, 900);
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [permission?.granted, captured, auto, showGuide, docKind, facing, cameraKey]);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fff" /></View>;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navy900, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.4)" />
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>Camera access needed</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 }}>Visa With Ease needs camera access to capture your documents. No images leave your device until you confirm upload.</Text>
        <Pressable style={[styles.primaryButton, { width: '100%' }]} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={back}><Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>Upload a file instead</Text></Pressable>
      </View>
    );
  }

  const frameColor = liveReady ? '#10B981' : liveChecksState.some((c) => c.ok) ? '#38BDF8' : 'rgba(255,255,255,0.9)';
  const verdictTone = verdict?.status === 'match'
    ? { bg: 'rgba(16,185,129,0.95)', icon: 'checkmark-circle' as IoniconName }
    : verdict?.status === 'mismatch'
      ? { bg: 'rgba(220,38,38,0.95)', icon: 'close-circle' as IoniconName }
      : { bg: 'rgba(217,119,6,0.95)', icon: 'warning' as IoniconName };
  const problem = verdict?.status === 'mismatch' || verdict?.status === 'unclear';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      {!captured ? (
        // The preview is a plain sibling behind the UI, not the parent of it: UI drawn as
        // children of the camera surface can keep stale pixels (e.g. a dismissed
        // overlay's dimming) on some devices.
        <View style={{ flex: 1 }}>
        <CameraView key={cameraKey} ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} flash={facing === 'back' ? flash : 'off'} onCameraReady={() => { readyRef.current = true; }} />
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {/* Top bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 }}>
            <Pressable onPress={back} accessibilityLabel="Close scanner" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' }} numberOfLines={1}>Scan {docLabel}</Text>
            </View>
            {facing === 'front' || docKind === 'photo' ? (
              <Pressable onPress={() => { readyRef.current = false; setFacing((f) => (f === 'back' ? 'front' : 'back')); }} accessibilityLabel="Switch camera" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
              </Pressable>
            ) : null}
            <Pressable onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))} accessibilityLabel="Toggle flash" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={20} color={flash === 'on' ? '#F59E0B' : '#fff'} />
            </Pressable>
          </View>
          {/* Live guidance — what the scanner sees right now */}
          <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: liveReady ? 'rgba(16,185,129,0.92)' : 'rgba(0,0,0,0.62)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, maxWidth: '100%' }}>
              <Ionicons name={liveReady ? 'checkmark-circle' : 'scan-outline'} size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5, flexShrink: 1 }}>{capturing ? 'Capturing…' : captureError ?? (auto ? liveHint : 'Auto-capture off — tap the shutter')}</Text>
            </View>
          </View>
          {/* Frame guide */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: frameW, height: frameH, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' }}>
              {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([h, v], i) => (
                <View key={i} style={{ position: 'absolute', top: v < 0 ? 0 : undefined, bottom: v > 0 ? 0 : undefined, left: h < 0 ? 0 : undefined, right: h > 0 ? 0 : undefined, width: 30, height: 30, borderTopWidth: v < 0 ? 4 : 0, borderBottomWidth: v > 0 ? 4 : 0, borderLeftWidth: h < 0 ? 4 : 0, borderRightWidth: h > 0 ? 4 : 0, borderColor: frameColor, borderRadius: 5 }} />
              ))}
              {guide.frame === 'face' && (
                <View style={{ position: 'absolute', top: '8%', bottom: '8%', left: '12%', right: '12%', borderRadius: 999, borderWidth: 2, borderColor: frameColor, borderStyle: 'dashed', opacity: 0.85 }} />
              )}
              {docKind === 'passport' && (
                <Text style={{ marginBottom: 8, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 6, borderRadius: 4 }}>KEEP THE TWO &lt;&lt;&lt; LINES INSIDE</Text>
              )}
              {liveReady && (
                <View style={{ position: 'absolute', top: 10, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Hold steady</Text>
                  {[0, 1].map((i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i < streak ? '#fff' : 'rgba(255,255,255,0.35)' }} />)}
                </View>
              )}
            </View>
          </View>
          {/* Live checklist — each requirement ticks the moment it is actually met */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 10, minHeight: 34 }}>
            {(liveChecksState.length ? liveChecksState : []).map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: c.ok ? 'rgba(16,185,129,0.92)' : 'rgba(0,0,0,0.55)', opacity: c.optional && !c.ok ? 0.75 : 1 }}>
                <Ionicons name={c.ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{c.label}</Text>
              </View>
            ))}
          </View>
          {/* Capture controls — paddingBottom clears the Android nav bar/gesture pill */}
          <View style={{ paddingBottom: 20 + insets.bottom, alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 26 }}>
              <Pressable onPress={() => setAuto((a) => !a)} accessibilityLabel="Toggle auto capture" style={{ width: 64, alignItems: 'center', gap: 4 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: auto ? colors.royal600 : 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="scan-circle-outline" size={26} color="#fff" />
                </View>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Auto {auto ? 'on' : 'off'}</Text>
              </Pressable>
              <Pressable onPress={onShutter} accessibilityLabel="Take photo" style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' }} />
              </Pressable>
              <Pressable onPress={() => setShowGuide(true)} accessibilityLabel="Show scanning guide" style={{ width: 64, alignItems: 'center', gap: 4 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="help-circle-outline" size={26} color="#fff" />
                </View>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Guide</Text>
              </Pressable>
            </View>
          </View>
          {/* Guide sheet: shown first, and again from the Guide button */}
          {showGuide && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,20,54,0.96)' }}>
              <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 28, paddingBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="scan-outline" size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>How to scan</Text>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{guide.title}</Text>
                  </View>
                </View>
                <DocGuideCard kind={docKind} dark />
              </ScrollView>
              <View style={{ padding: 18, paddingBottom: 18 + insets.bottom, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                <Pressable style={[styles.primaryButton, { marginTop: 0 }]} onPress={() => setShowGuide(false)}>
                  <Text style={styles.primaryButtonText}>Start scanning</Text>
                </Pressable>
                <Pressable onPress={back} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '700' }}>I’ll upload a file instead</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: captured }} style={{ flex: 1, resizeMode: 'contain', backgroundColor: '#000' }} />
          {/* What the scanner actually recognised — never a bare "text found" tick */}
          <ScrollView style={{ position: 'absolute', top: 0, left: 0, right: 0, maxHeight: '62%' }} contentContainerStyle={{ padding: 16, gap: 10 }}>
            {analysing && (
              <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: 12, borderRadius: 20 }}>
                <ActivityIndicator size="small" color="#0EA5E9" />
                <Text style={{ color: '#fff', fontWeight: '700' }}>Checking what this is…</Text>
              </View>
            )}
            {!analysing && verdict && (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: verdictTone.bg, padding: 14, borderRadius: 16 }}>
                <Ionicons name={verdictTone.icon} size={24} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{verdict.title}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>{verdict.detail}</Text>
                </View>
              </View>
            )}
            {!analysing && mrzRead && <PassportDetailsCard mrz={mrzRead} />}
            {!analysing && !verdict && checkUnavailable && (
              <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(100,116,139,0.92)', padding: 12, borderRadius: 20 }}>
                <Ionicons name="information-circle-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700' }}>Captured — on-device check unavailable</Text>
              </View>
            )}
          </ScrollView>
          {/* Action buttons — same Android nav-bar clearance as the capture button above */}
          <View style={{ position: 'absolute', bottom: 24 + insets.bottom, left: 24, right: 24, flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={retake} style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: problem ? colors.royal600 : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>{initialUri ? 'Choose another' : 'Retake'}</Text>
            </Pressable>
            <Pressable
              disabled={analysing}
              onPress={() => onCapture(detectedText || undefined, imageBase64, initialMime ?? 'image/jpeg')}
              style={{ flex: 1, height: 52, borderRadius: 14, opacity: analysing ? 0.5 : 1, backgroundColor: verdict?.status === 'match' ? colors.green500 : problem ? 'rgba(255,255,255,0.15)' : colors.royal600, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>{problem ? 'Use anyway' : 'Use this photo'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── App tour + How-to guide ──────────────────────────────────────────────────
function AppTour({ visible, onClose, onGo }: { visible: boolean; onClose: () => void; onGo: (target: TourTarget) => void }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  useEffect(() => { if (visible) setIndex(0); }, [visible]);
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(8,20,54,0.72)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 18 + insets.bottom, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={step.icon as IoniconName} size={28} color={colors.royal600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.slate500, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>Step {index + 1} of {TOUR_STEPS.length}</Text>
              <Text style={{ color: colors.slate900, fontSize: 20, fontWeight: '900' }}>{step.title}</Text>
            </View>
          </View>
          <Text style={{ color: colors.slate700, fontSize: 14.5, lineHeight: 22 }}>{step.body}</Text>
          {step.action && (
            <Pressable onPress={() => onGo(step.action!.target)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.royal50 }}>
              <Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 13 }}>{step.action.label}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.royal600} />
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 2 }}>
            {TOUR_STEPS.map((_, i) => <View key={i} style={{ width: i === index ? 20 : 7, height: 7, borderRadius: 4, backgroundColor: i === index ? colors.royal600 : colors.slate200 }} />)}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            {!last ? (
              <Pressable onPress={onClose} style={{ paddingVertical: 14, paddingHorizontal: 12 }} accessibilityLabel="Skip tour">
                <Text style={{ color: colors.slate500, fontWeight: '800' }}>Skip</Text>
              </Pressable>
            ) : null}
            {index > 0 && (
              <Pressable onPress={() => setIndex((i) => i - 1)} style={{ paddingVertical: 14, paddingHorizontal: 12 }} accessibilityLabel="Previous step">
                <Text style={{ color: colors.royal600, fontWeight: '800' }}>Back</Text>
              </Pressable>
            )}
            <Pressable onPress={() => (last ? onClose() : setIndex((i) => i + 1))} style={[styles.primaryButton, { flex: 1, marginTop: 0 }]} accessibilityLabel={last ? 'Finish tour' : 'Next step'}>
              <Text style={styles.primaryButtonText}>{last ? 'Done' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HowToUseScreen({ back, startTour }: { back: () => void; startTour: () => void }) {
  const [openGuide, setOpenGuide] = useState<DocKind | null>(null);
  const guideKinds: DocKind[] = ['passport', 'bank', 'employment', 'insurance', 'itinerary', 'photo'];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Guide</Text>
      <Text style={styles.title}>How to use Visa With Ease</Text>
      <Pressable onPress={startTour} style={[styles.primaryButton, { marginTop: 0, marginBottom: 16, flexDirection: 'row', gap: 8 }]}>
        <Ionicons name="compass-outline" size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>Take the app tour</Text>
      </Pressable>
      {HOW_TO_SECTIONS.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 }}>
              <Ionicons name={section.icon as IoniconName} size={16} color={colors.royal600} style={{ marginTop: 2 }} />
              <Text style={[styles.bodyText, { flex: 1, marginBottom: 0 }]}>{item}</Text>
            </View>
          ))}
        </Section>
      ))}
      <Section title="Document scanning guides">
        {guideKinds.map((kind) => {
          const open = openGuide === kind;
          return (
            <View key={kind}>
              <Pressable style={styles.taskRow} onPress={() => setOpenGuide(open ? null : kind)} accessibilityLabel={`${DOC_GUIDES[kind].title} guide`}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{DOC_GUIDES[kind].title}</Text>
                  {!open && <Text style={styles.rowMeta} numberOfLines={1}>{DOC_GUIDES[kind].intro}</Text>}
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.slate300} />
              </Pressable>
              {open && <View style={{ paddingBottom: 12, paddingHorizontal: 4 }}><DocGuideCard kind={kind} /></View>}
            </View>
          );
        })}
      </Section>
    </View>
  );
}

// ─── Bookings tab ─────────────────────────────────────────────────────────────
function formatSlot(slotISO: string | null): { day: string; time: string; weekday: string; dayNum: string } | null {
  if (!slotISO) return null;
  const d = new Date(slotISO);
  if (isNaN(d.getTime())) return null;
  return {
    day: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    dayNum: String(d.getDate()),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function relativeSlot(slotISO: string | null): string {
  if (!slotISO) return 'Time to be confirmed';
  const ms = new Date(slotISO).getTime() - Date.now();
  if (ms < 0) return 'Completed';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `Starts in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `In ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
}

function BookingCard({ booking, sessionLabel, onCancel, onReschedule, onOpenConsultant, cancelling, grant, onShare, onRevoke }: {
  grant?: ApiAccessGrant | null;
  onShare?: () => void;
  onRevoke?: (grant: ApiAccessGrant) => void;
  booking: ApiMyBooking;
  sessionLabel: string;
  onCancel?: () => void;
  onReschedule?: () => void;
  onOpenConsultant: () => void;
  cancelling?: boolean;
}) {
  const slot = formatSlot(booking.slotISO);
  const cancelled = booking.status === 'cancelled';
  const past = !cancelled && !!booking.slotISO && new Date(booking.slotISO).getTime() < Date.now();
  const tone = cancelled ? { bg: '#FEE2E2', fg: '#B91C1C', label: 'Cancelled' }
    : past ? { bg: colors.slate100, fg: colors.slate600, label: 'Completed' }
      : slot ? { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Requested' }
        : { bg: '#FEF3C7', fg: '#B45309', label: 'Awaiting time' };
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate100, padding: 14, gap: 12, opacity: cancelled ? 0.75 : 1 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 52, borderRadius: 14, backgroundColor: colors.royal50, alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: colors.royal600, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{slot ? slot.weekday : '—'}</Text>
          <Text style={{ color: colors.navy900, fontSize: 20, fontWeight: '900' }}>{slot ? slot.dayNum : '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.slate900, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{booking.consultantName}</Text>
          <Text style={{ color: colors.slate500, fontSize: 12.5 }} numberOfLines={1}>{sessionLabel}{booking.destinationCountry ? ` · ${booking.destinationCountry}` : ''}</Text>
          <Text style={{ color: colors.slate700, fontSize: 12.5, fontWeight: '700', marginTop: 2 }}>{slot ? `${slot.day} · ${slot.time}` : 'Time to be confirmed'}</Text>
        </View>
        <View style={{ backgroundColor: tone.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 }}>
          <Text style={{ color: tone.fg, fontSize: 11, fontWeight: '800' }}>{tone.label}</Text>
        </View>
      </View>
      {!cancelled && !past && <Text style={{ color: colors.royal600, fontSize: 12, fontWeight: '800' }}>{relativeSlot(booking.slotISO)}</Text>}
      {!cancelled && !past && <CallButton bookingId={booking.bookingId} call={booking.call} />}
      {!cancelled && !past && onShare && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: grant ? '#F0FDF4' : '#FFFBEB', borderRadius: 12, padding: 10 }}>
          <Ionicons name={grant ? 'lock-open' : 'lock-closed'} size={16} color={grant ? '#15803D' : '#B45309'} />
          <Text style={{ flex: 1, color: grant ? '#166534' : '#92400E', fontSize: 12.5, lineHeight: 17 }}>
            {grant ? `Shared with ${booking.consultantName}: ${grant.categories.map((c) => c.replace('_', ' ')).join(', ')}` : `${booking.consultantName} can’t see your case yet.`}
          </Text>
          <Pressable onPress={() => (grant ? onRevoke?.(grant) : onShare())} hitSlop={6} accessibilityLabel={grant ? 'Revoke access' : 'Share my case'}>
            <Text style={{ color: grant ? '#B91C1C' : colors.royal600, fontWeight: '800', fontSize: 12.5 }}>{grant ? 'Revoke' : 'Share case'}</Text>
          </Pressable>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onOpenConsultant} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100 }} accessibilityLabel={`View ${booking.consultantName}`}>
          <Text style={{ color: colors.slate700, fontWeight: '700', fontSize: 13 }}>{cancelled || past ? 'Book again' : 'View expert'}</Text>
        </Pressable>
        {onReschedule && (
          <Pressable onPress={onReschedule} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: colors.royal50 }} accessibilityLabel="Reschedule appointment">
            <Text style={{ color: colors.royal600, fontWeight: '800', fontSize: 13 }}>Reschedule</Text>
          </Pressable>
        )}
        {onCancel && (
          <Pressable onPress={onCancel} disabled={cancelling} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#FEF2F2', opacity: cancelling ? 0.5 : 1 }} accessibilityLabel="Cancel appointment">
            {cancelling ? <ActivityIndicator size="small" color="#B91C1C" /> : <Text style={{ color: '#B91C1C', fontWeight: '800', fontSize: 13 }}>Cancel</Text>}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function BookingsScreen({ bookings, loading, error, retry, sessionOpts, grants, shareCase, revokeGrant, findConsultant, openConsultant, reschedule, cancelBooking }: {
  grants: ApiAccessGrant[];
  shareCase: (booking: ApiMyBooking) => void;
  revokeGrant: (grant: ApiAccessGrant) => Promise<void>;
  bookings: ApiMyBooking[];
  loading: boolean;
  error: string;
  retry: () => void;
  sessionOpts: ReturnType<typeof normalizeSessionOption>[];
  findConsultant: () => void;
  openConsultant: (consultantId: string) => void;
  reschedule: (booking: ApiMyBooking) => void;
  cancelBooking: (booking: ApiMyBooking) => Promise<void>;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const now = Date.now();
  const isPast = (b: ApiMyBooking) => b.status === 'cancelled' || (!!b.slotISO && new Date(b.slotISO).getTime() < now);
  const upcoming = bookings.filter((b) => !isPast(b)).sort((a, b) => (a.slotISO ?? '9').localeCompare(b.slotISO ?? '9'));
  const past = bookings.filter(isPast).sort((a, b) => (b.slotISO ?? b.createdAt).localeCompare(a.slotISO ?? a.createdAt));
  const shown = filter === 'upcoming' ? upcoming : past;
  const labelFor = (id: string) => sessionOpts.find((o) => o.id === id)?.title ?? id;

  const confirmCancel = (b: ApiMyBooking) => {
    const slot = formatSlot(b.slotISO);
    Alert.alert('Cancel this appointment?', `${b.consultantName}${slot ? ` · ${slot.day}, ${slot.time}` : ''}\n\nThe time will be released for others.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel appointment', style: 'destructive', onPress: async () => { setCancellingId(b.bookingId); try { await cancelBooking(b); } finally { setCancellingId(null); } } },
    ]);
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Appointments</Text>
          <Text style={[styles.title, { marginBottom: 0 }]}>My bookings</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={findConsultant} accessibilityLabel="Book a new appointment">
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.smallButtonText}>Book</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: 14, padding: 4 }}>
        {([['upcoming', `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}`], ['past', 'Past & cancelled']] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setFilter(id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11, backgroundColor: filter === id ? colors.white : 'transparent' }}>
            <Text style={{ color: filter === id ? colors.navy900 : colors.slate500, fontWeight: '800', fontSize: 13 }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading && bookings.length === 0 && <View style={{ padding: 30, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.royal600} /></View>}

      {!!error && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 16, alignItems: 'center', gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={26} color="#DC2626" />
          <Text style={{ color: '#991B1B', fontWeight: '700', textAlign: 'center' }}>{error}</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retry}><Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text></Pressable>
        </View>
      )}

      {!loading && !error && shown.length === 0 && (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 30, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.slate100 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="calendar-outline" size={30} color={colors.royal600} />
          </View>
          <Text style={{ color: colors.slate900, fontWeight: '900', fontSize: 16 }}>{filter === 'upcoming' ? 'No upcoming appointments' : 'Nothing here yet'}</Text>
          <Text style={{ color: colors.slate500, textAlign: 'center', fontSize: 13, paddingHorizontal: 28, lineHeight: 19 }}>
            {filter === 'upcoming' ? 'Book a verified consultant to review your documents and your case.' : 'Completed and cancelled appointments will appear here.'}
          </Text>
          {filter === 'upcoming' && <Pressable style={[styles.primaryButton, { marginTop: 4, paddingHorizontal: 22 }]} onPress={findConsultant}><Text style={styles.primaryButtonText}>Find a consultant</Text></Pressable>}
        </View>
      )}

      {shown.map((b) => (
        <BookingCard
          key={b.bookingId}
          booking={b}
          sessionLabel={labelFor(b.sessionType)}
          cancelling={cancellingId === b.bookingId}
          onOpenConsultant={() => openConsultant(b.consultantId)}
          grant={grants.find((g) => g.consultantId === b.consultantId && g.applicationId === b.applicationId && Date.parse(g.expiresAt) > Date.now()) ?? null}
          onShare={filter === 'upcoming' ? () => shareCase(b) : undefined}
          onRevoke={(g) => revokeGrant(g)}
          onCancel={filter === 'upcoming' ? () => confirmCancel(b) : undefined}
          onReschedule={filter === 'upcoming' ? () => reschedule(b) : undefined}
        />
      ))}
      <Text style={{ color: colors.slate500, fontSize: 11.5, textAlign: 'center' }}>Times are shown in your phone’s time zone.</Text>
    </View>
  );
}

// ─── Live AI Analysis Screen ──────────────────────────────────────────────────
// Progress labels only — shown while the real request is in flight. Nothing here
// claims a result: once the audit returns, the real findings replace this list.
const AI_STAGES = [
  { label: 'Reading the document' },
  { label: 'Checking it against the requirements' },
  { label: 'Preparing your report' },
];

function LiveAnalysisScreen({ docTitle, documentId, documentType, extractedText, imageBase64, mimeType, applicationId, onDone, onVerifyFace }: {
  onVerifyFace?: () => void;
  docTitle: string;
  documentId: string;
  documentType?: string;
  extractedText?: string;
  imageBase64?: string;
  mimeType?: string;
  applicationId?: string;
  onDone: (result: import('./src/api').ApiAuditResult) => void;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<import('./src/api').ApiAuditResult | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setError('No active application — go back and start one first.');
      return;
    }
    let cancelled = false;
    setError(null);
    setDone(false);
    setStageIdx(0);
    // Ticks through the stage list for perceived progress while the real
    // request is in flight — capped one stage short of "done" so it never
    // shows completion before the real result actually arrives.
    const stageTimer = setInterval(() => {
      setStageIdx(i => Math.min(i + 1, AI_STAGES.length - 1));
    }, 500);

    (async () => {
      try {
        await createUploadSlot({ applicationId, documentId });
        const { result: auditResult } = await enqueueAudit({ applicationId, documentId, documentType, extractedText, imageBase64, mimeType });
        if (cancelled) return;
        clearInterval(stageTimer);
        setStageIdx(AI_STAGES.length);
        setScore(auditResult.score);
        setResult(auditResult);
        setDone(true);
      } catch (err) {
        if (!cancelled) {
          clearInterval(stageTimer);
          setError(err instanceof Error ? err.message : 'Audit failed. Please try again.');
        }
      }
    })();

    return () => { cancelled = true; clearInterval(stageTimer); };
  }, [applicationId, documentId, documentType, extractedText, imageBase64, mimeType, attempt]);

  const stages = AI_STAGES.map((st, i) => ({
    ...st,
    done: i < stageIdx,
    active: i === stageIdx && !done,
  }));
  const liveInsets = useSafeAreaInsets();
  const statusTone = result?.status === 'excellent'
    ? { color: colors.green500, bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', title: 'Passed all checks' }
    : result?.status === 'attention_needed'
      ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', title: 'Needs attention' }
      : { color: '#F87171', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)', title: 'Issues found' };
  const severityIcon = (sev: string): { name: IoniconName; color: string } =>
    sev === 'pass' ? { name: 'checkmark-circle', color: colors.green500 }
      : sev === 'red_flag' ? { name: 'close-circle', color: '#F87171' }
        : sev === 'warn' ? { name: 'warning', color: '#F59E0B' }
          : { name: 'information-circle', color: '#93C5FD' };

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy900 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: '#fff', fontWeight: '900', fontSize: 16 }}>Live AI analysis</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED' }} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Real-time</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 + liveInsets.bottom }}>
        {/* Document preview card */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 160, height: 210, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20 }}>
            <LinearGradient colors={['#1A56DB','#0EA5E9']} style={{ height: 48, padding: 10, justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }} numberOfLines={2}>{documentTypeLabel(docTitle)}</Text>
            </LinearGradient>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="document-text-outline" size={44} color={colors.slate300} />
            </View>
            {/* Scan line — only while a real analysis is running */}
            {!done && !error && <View style={{ position: 'absolute', left: 0, right: 0, top: '60%', height: 2, backgroundColor: 'rgba(14,165,233,0.8)', shadowColor: '#0EA5E9', shadowRadius: 8, shadowOpacity: 1 }} />}
            {/* AI badge */}
            <View style={{ position: 'absolute', top: -10, right: -10, backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>AI</Text>
            </View>
          </View>
          {/* Score — real result from the backend, not shown until it actually arrives */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Readiness score</Text>
            {score === null
              ? <ActivityIndicator size="large" color={colors.teal500} style={{ marginVertical: 12 }} />
              : <Text style={{ color: score >= 75 ? colors.green500 : score >= 50 ? '#F59E0B' : '#F87171', fontSize: 56, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{score}</Text>}
            {score !== null && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/ 100</Text>}
            {!done && !error && <Text style={{ color: colors.teal500, fontSize: 11, fontWeight: '700', marginTop: 4 }}>Analyzing…</Text>}
          </View>
        </View>
        {/* Progress while running */}
        {!done && !error && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, gap: 4 }}>
            {stages.map((stage, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: stage.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  {stage.done && <Ionicons name="checkmark" size={13} color="#fff" />}
                  {stage.active && <ActivityIndicator size="small" color="#7C3AED" />}
                </View>
                <Text style={{ flex: 1, color: stage.active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: stage.active ? '700' : '500' }}>{stage.label}{stage.active && '…'}</Text>
              </View>
            ))}
          </View>
        )}
        {/* The real result: the actual findings, each with its own severity — never a fixed row of green ticks */}
        {done && result && (
          <>
            <View style={{ padding: 14, backgroundColor: statusTone.bg, borderRadius: 14, borderWidth: 1, borderColor: statusTone.border }}>
              <Text style={{ color: statusTone.color, fontWeight: '900', marginBottom: 4 }}>{statusTone.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 }}>
                {result.findings.length === 0 ? 'No findings were reported for this document.' : `${result.findings.length} finding${result.findings.length === 1 ? '' : 's'} from this check. Review each one and fix anything flagged.`}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginTop: 12, gap: 10 }}>
              {result.findings.slice(0, 6).map((f) => {
                const icon = severityIcon(f.severity);
                return (
                  <View key={f.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <Ionicons name={icon.name} size={20} color={icon.color} style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{f.title}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 17, marginTop: 2 }}>{f.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <Pressable style={[styles.primaryButton, { marginTop: 14 }]} onPress={() => onDone(result)}>
              <Text style={styles.primaryButtonText}>View full audit report</Text>
            </Pressable>
          </>
        )}
        {error && (
          <>
            <View style={{ marginTop: 16, padding: 14, backgroundColor: 'rgba(220,38,38,0.15)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' }}>
              <Text style={{ color: '#F87171', fontWeight: '900', marginBottom: 4 }}>Audit failed</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 }}>{error}</Text>
            </View>
            {onVerifyFace && /face/i.test(error) ? (
              <Pressable style={[styles.primaryButton, { marginTop: 14 }]} onPress={onVerifyFace} accessibilityLabel="Verify my face">
                <Text style={styles.primaryButtonText}>Verify my face</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.primaryButton, { marginTop: 14 }]} onPress={() => setAttempt(a => a + 1)}>
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>
            )}
          </>
        )}
        <View style={[styles.disclaimer, { marginTop: 16 }]}>
          <Text style={styles.disclaimerText}>AI validates document structure. Results are not a consulate decision. Verify with official embassy sources.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Profile Hub Screen ───────────────────────────────────────────────────────
const PROFILE_SECTIONS = [
  { id: 'personal',    label: 'Personal details',        icon: 'person-outline'        as IoniconName, done: false },
  { id: 'passport',    label: 'Passport & travel docs',  icon: 'id-card-outline'       as IoniconName, done: false },
  { id: 'travel',      label: 'Travel history',          icon: 'airplane-outline'      as IoniconName, done: false },
  { id: 'financials',  label: 'Financial evidence',      icon: 'cash-outline'          as IoniconName, done: false },
  { id: 'employment',  label: 'Employment & resume',     icon: 'briefcase-outline'     as IoniconName, done: false },
  { id: 'contacts',    label: 'Emergency contacts',      icon: 'call-outline'          as IoniconName, done: false },
];

function ProfileHubScreen({ back, authUser, applicationId }: { back: () => void; authUser: AuthUser | null; applicationId?: string }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoadFailed(false);
    fetchProfile().then(r => setProfile(r.profile)).catch(() => setLoadFailed(true));
  }, [attempt]);

  function isDone(id: string): boolean {
    if (!profile) return false;
    switch (id) {
      case 'personal':   return !!(profile.personal?.firstName);
      case 'passport':   return !!(profile.passport?.passportNumber);
      case 'travel':     return !!(profile.travelHistory && (profile.travelHistory.trips.length > 0 || profile.travelHistory.hasRejection));
      case 'financials': return !!(profile.financials && profile.financials.statements.length > 0);
      case 'employment': return !!(profile.employment?.employer);
      case 'contacts':   return !!(profile.contacts?.emergencyName);
      default: return false;
    }
  }

  async function handleSave(patch: Partial<Omit<UserProfile, 'uid' | 'updatedAt'>>) {
    try {
      const r = await updateProfile(patch);
      setProfile(r.profile);
      // Keep the "carried forward" nationality used by new-application
      // onboarding in sync with whatever the user edits here.
      if (patch.personal?.nationality) {
        savePreferences({ nationality: patch.personal.nationality });
      }
      setActiveSection(null);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please check your connection and try again. Your changes have not been saved.');
    }
  }

  const completed = PROFILE_SECTIONS.filter(s => isDone(s.id)).length;
  const pct = Math.round((completed / PROFILE_SECTIONS.length) * 100);

  if (activeSection === 'personal')   return <ProfilePersonalScreen   back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ personal: d })} />;
  if (activeSection === 'passport')   return <ProfilePassportScreen   back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ passport: d })} />;
  if (activeSection === 'travel')     return <ProfileTravelScreen     back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ travelHistory: d })} />;
  if (activeSection === 'financials') return <ProfileFinancialsScreen back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ financials: d })} applicationId={applicationId} />;
  if (activeSection === 'employment') return <ProfileEmploymentScreen back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ employment: d })} />;
  if (activeSection === 'contacts')   return <ProfileContactsScreen   back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ contacts: d })} />;

  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Account completeness</Text>
      <Text style={styles.title}>Complete your profile</Text>
      {loadFailed && <LoadErrorNotice onRetry={() => setAttempt(a => a + 1)} />}
      <LinearGradient colors={['#0B1F4B','#1547C0']} style={{ borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', gap: 10 }}>
        <ScoreRing value={pct} large subLabel={`${completed}/${PROFILE_SECTIONS.length} complete`} />
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' }}>A complete profile enables auto-fill on new applications and improves AI score accuracy.</Text>
      </LinearGradient>
      <View style={[styles.notice, { marginBottom: 4 }]}>
        <Text style={styles.noticeText}>AI tip: Consulates weigh financial and employment evidence heavily — completing those sections strengthens your application's readiness.</Text>
      </View>
      <Section title="Profile sections">
        {PROFILE_SECTIONS.map((s) => {
          const done = isDone(s.id);
          return (
            <Pressable key={s.id} style={styles.taskRow} onPress={() => setActiveSection(s.id)}>
              <View style={[styles.quickIconBox, { width: 36, height: 36, backgroundColor: done ? colors.green100 : colors.royal50 }]}>
                <Ionicons name={s.icon} size={18} color={done ? colors.green500 : colors.royal600} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{s.label}</Text>
                <Text style={styles.rowMeta}>{done ? 'Complete ✓' : 'Tap to fill in'}</Text>
              </View>
              {done
                ? <Ionicons name="checkmark-circle" size={20} color={colors.green500} />
                : <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
              }
            </Pressable>
          );
        })}
      </Section>
    </View>
  );
}

// ─── Profile: Personal Details ───────────────────────────────────────────────
function ProfilePersonalScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['personal']>) => void }) {
  const p = profile?.personal;
  const [firstName, setFirstName] = useState(p?.firstName ?? '');
  const [lastName,  setLastName]  = useState(p?.lastName ?? '');
  const [nationality, setNationality] = useState(p?.nationality ?? '');
  const [dob, setDob] = useState(p?.dateOfBirth ?? '');
  const [phone, setPhone] = useState(p?.phone ?? '');
  const [gender, setGender] = useState(p?.gender ?? '');
  const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;
  return (
    <View>
      <BackButton label="Profile hub" onPress={back} />
      <Text style={styles.eyebrow}>Step 1 of 6</Text>
      <Text style={styles.title}>Personal details</Text>
      <View style={styles.stepCard}>
        {([['First name', firstName, setFirstName], ['Last name', lastName, setLastName], ['Nationality', nationality, setNationality], ['Date of birth (YYYY-MM-DD)', dob, setDob], ['Phone number', phone, setPhone], ['Gender', gender, setGender]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
          <View key={label}>
            <Text style={[styles.rowMeta, { marginBottom: 6 }]}>{label}</Text>
            <TextInput value={val} onChangeText={setter} style={[styles.searchInput, { marginBottom: 12 }]} placeholder={label} />
          </View>
        ))}
      </View>
      {!canSave && <Text style={[styles.rowMeta, { color: colors.gold500, marginBottom: 8 }]}>First and last name are required.</Text>}
      <Pressable style={[styles.primaryButton, !canSave && styles.disabledButton]} onPress={canSave ? () => onSave({ firstName, lastName, nationality, dateOfBirth: dob, phone, gender }) : undefined}>
        <Text style={[styles.primaryButtonText, !canSave && styles.disabledButtonText]}>Save personal details</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Passport ────────────────────────────────────────────────────────
function ProfilePassportScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['passport']>) => void }) {
  const p = profile?.passport;
  const [passportNumber, setPassportNumber] = useState(p?.passportNumber ?? '');
  const [issueDate,      setIssueDate]      = useState(p?.issueDate ?? '');
  const [expiryDate,     setExpiryDate]     = useState(p?.expiryDate ?? '');
  const [issuingCountry, setIssuingCountry] = useState(p?.issuingCountry ?? '');
  const canSave = passportNumber.trim().length > 0 && expiryDate.trim().length > 0;
  return (
    <View>
      <BackButton label="Profile hub" onPress={back} />
      <Text style={styles.eyebrow}>Step 2 of 6</Text>
      <Text style={styles.title}>Passport & travel docs</Text>
      <View style={styles.stepCard}>
        {([['Passport number', passportNumber, setPassportNumber], ['Issue date (YYYY-MM-DD)', issueDate, setIssueDate], ['Expiry date (YYYY-MM-DD)', expiryDate, setExpiryDate], ['Issuing country', issuingCountry, setIssuingCountry]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
          <View key={label}>
            <Text style={[styles.rowMeta, { marginBottom: 6 }]}>{label}</Text>
            <TextInput value={val} onChangeText={setter} style={[styles.searchInput, { marginBottom: 12 }]} placeholder={label} />
          </View>
        ))}
      </View>
      {!canSave && <Text style={[styles.rowMeta, { color: colors.gold500, marginBottom: 8 }]}>Passport number and expiry date are required.</Text>}
      <Pressable style={[styles.primaryButton, !canSave && styles.disabledButton]} onPress={canSave ? () => onSave({ passportNumber, issueDate, expiryDate, issuingCountry }) : undefined}>
        <Text style={[styles.primaryButtonText, !canSave && styles.disabledButtonText]}>Save passport details</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Travel History ──────────────────────────────────────────────────
function ProfileTravelScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['travelHistory']>) => void }) {
  const [hasRejection, setHasRejection] = useState(profile?.travelHistory?.hasRejection ?? false);
  const [trips, setTrips] = useState<{ country: string; years: string; status: string }[]>(profile?.travelHistory?.trips ?? []);
  const [addingTrip, setAddingTrip] = useState(false);
  const [newTripInput, setNewTripInput] = useState('');

  const commitNewTrip = (country: string) => {
    if (!country?.trim()) return;
    const newTrip = { country: country.trim(), years: new Date().getFullYear().toString(), status: 'Approved' };
    setTrips(prev => [...prev, newTrip]);
  };

  const handleAddTrip = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Add trip',
        'Enter destination country',
        (country) => { commitNewTrip(country ?? ''); }
      );
    } else {
      setAddingTrip(true);
      setNewTripInput('');
    }
  };

  return (
    <View>
      <BackButton label="Profile hub" onPress={back} />
      <Text style={styles.eyebrow}>Step 3 of 6</Text>
      <Text style={styles.title}>Travel history</Text>
      <Text style={styles.bodyText}>Prior visa approvals significantly improve your approval odds. Add trips from the last 5 years.</Text>
      <Section title="Prior trips">
        {trips.map((t, i) => (
          <View key={`${t.country}-${i}`} style={styles.taskRow}>
            {/* Country is plain typed/dictated text with no flag emoji ever
                attached to it — splitting on spaces to fake a flag used to
                garble every name (e.g. "United Arab Emirates" rendered
                "United" as a giant icon and "Arab Emirates" as the title).
                A neutral icon plus the untouched full name is honest. */}
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="earth-outline" size={18} color={colors.royal600} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{t.country}</Text>
              <Text style={styles.rowMeta}>{t.years}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.green100 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.green500 }]} />
              <Text style={[styles.statusText, { color: colors.green500 }]}>{t.status}</Text>
            </View>
          </View>
        ))}
        {trips.length === 0 && (
          <Text style={[styles.rowMeta, { textAlign: 'center', paddingVertical: 12 }]}>No trips recorded yet — add any prior visa approvals below.</Text>
        )}
        {addingTrip && Platform.OS !== 'ios' && (
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 8, alignItems: 'center' }}>
            <TextInput
              value={newTripInput}
              onChangeText={setNewTripInput}
              placeholder="Destination country"
              style={[styles.searchInput, { flex: 1 }]}
              autoFocus
            />
            <Pressable onPress={() => { commitNewTrip(newTripInput); setAddingTrip(false); setNewTripInput(''); }}
              style={{ backgroundColor: colors.royal600, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
            </Pressable>
            <Pressable onPress={() => { setAddingTrip(false); setNewTripInput(''); }}>
              <Ionicons name="close-circle-outline" size={24} color={colors.slate300} />
            </Pressable>
          </View>
        )}
        <Pressable style={[styles.taskRow, { justifyContent: 'center', gap: 8 }]} onPress={handleAddTrip}>
          <Ionicons name="add-circle-outline" size={20} color={colors.royal600} />
          <Text style={{ color: colors.royal600, fontWeight: '700' }}>Add a trip</Text>
        </Pressable>
      </Section>
      <Section title="Prior visa rejections">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>Any prior rejections?</Text>
            <Text style={styles.rowMeta}>Disclosure is required — helps AI flag risk accurately</Text>
          </View>
          <Pressable onPress={() => setHasRejection(v => !v)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: hasRejection ? '#DC2626' : colors.slate200, justifyContent: 'center', paddingHorizontal: 2 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: hasRejection ? 'flex-end' : 'flex-start' }} />
          </Pressable>
        </View>
        {hasRejection && (
          <View style={[styles.notice, { marginTop: 8 }]}>
            <Text style={styles.noticeText}>Disclosing rejections is mandatory on most visa forms. Visa With Ease will help you address refusal reasons in your new application.</Text>
          </View>
        )}
      </Section>
      <Pressable style={styles.primaryButton} onPress={() => onSave({ trips, hasRejection })}>
        <Text style={styles.primaryButtonText}>Save travel history</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Financials ──────────────────────────────────────────────────────
function ProfileFinancialsScreen({ back, profile, onSave, applicationId }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['financials']>) => void; applicationId?: string }) {
  const [statements, setStatements] = useState<{ label: string; score: number }[]>(profile?.financials?.statements ?? []);
  const [auditingIdx, setAuditingIdx] = useState<number | null>(null);

  const uploadStatement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: false });
      if (result.canceled || !result.assets?.[0]) return;
      const now = new Date();
      const label = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const idx = statements.length;
      setStatements(prev => [...prev, { label, score: 0 }]);

      if (!applicationId) {
        // No active application to attach this document to — be honest that
        // it's saved locally but hasn't actually been scored, rather than
        // showing a fake "Pending" that can never resolve.
        Alert.alert('Saved without audit', 'Create a visa application first so this statement can be run through the real AI audit — for now it\'s saved but unscored.');
        return;
      }
      setAuditingIdx(idx);
      try {
        const asset = result.assets[0];
        const documentId = `doc-financials-${Date.now()}`;
        const imageBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        await createUploadSlot({ applicationId, documentId });
        const { result: auditResult } = await enqueueAudit({
          applicationId, documentId, documentType: 'bank', imageBase64,
          mimeType: asset.mimeType ?? 'application/octet-stream',
        });
        setStatements(prev => prev.map((s, i) => i === idx ? { ...s, score: auditResult.score } : s));
      } catch {
        Alert.alert('Audit failed', 'Your statement was saved, but the AI audit could not run. Check your connection and try again from Documents.');
      } finally {
        setAuditingIdx(null);
      }
    } catch { /* user cancelled the picker */ }
  };

  return (
    <View>
      <BackButton label="Profile hub" onPress={back} />
      <Text style={styles.eyebrow}>Step 4 of 6</Text>
      <Text style={styles.title}>Financial evidence</Text>
      <Text style={styles.bodyText}>Bank statements and financial proof are required for most long-stay and tourist visas. Upload 3 months of statements.</Text>
      <View style={[styles.notice, { marginBottom: 8 }]}>
        <Text style={styles.noticeText}>AI tip: Schengen requires evidence of at least €65/day. Upload your last 3 months of bank statements.</Text>
      </View>
      <Section title="Bank statements">
        {statements.map((m, idx) => (
          <View key={idx} style={styles.taskRow}>
            <View style={[styles.quickIconBox, { width: 36, height: 36, backgroundColor: auditingIdx === idx ? colors.royal50 : colors.green100 }]}>
              {auditingIdx === idx
                ? <ActivityIndicator size="small" color={colors.royal600} />
                : <Ionicons name="checkmark-circle-outline" size={18} color={colors.green500} />}
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{m.label}</Text>
              <Text style={styles.rowMeta}>
                {auditingIdx === idx ? 'Running AI audit…' : m.score > 0 ? `Audited · Score ${m.score}` : 'Saved — not yet audited'}
              </Text>
            </View>
          </View>
        ))}
        {statements.length === 0 && (
          <Text style={[styles.rowMeta, { textAlign: 'center', paddingVertical: 12 }]}>No statements uploaded yet. Upload at least 3 months.</Text>
        )}
        <Pressable style={[styles.uploadZone, { minHeight: 70, marginTop: 10 }]} onPress={uploadStatement}>
          <Ionicons name="cloud-upload-outline" size={24} color={colors.royal600} />
          <Text style={styles.rowTitle}>Upload bank statement (PDF)</Text>
        </Pressable>
      </Section>
      <Section title="Optional: additional assets">
        {['Property ownership', 'Investment portfolio', 'Savings / FD certificate'].map(a => (
          <Pressable key={a} style={styles.taskRow} onPress={() => Alert.alert('Coming soon', `Adding "${a}" as supporting evidence is coming soon.`)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.slate300} />
            <Text style={[styles.rowMeta, { marginLeft: 8 }]}>{a}</Text>
          </Pressable>
        ))}
      </Section>
      <Pressable style={styles.primaryButton} onPress={() => onSave({ statements })}>
        <Text style={styles.primaryButtonText}>Save financials</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Employment & Resume ──────────────────────────────────────────────
function ProfileEmploymentScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['employment']>) => void }) {
  const emp = profile?.employment;
  const [employer, setEmployer] = useState(emp?.employer ?? '');
  const [title, setTitle] = useState(emp?.jobTitle ?? '');
  const [income, setIncome] = useState(emp?.annualIncomeUsd ?? '');
  const [resumeUploaded, setResumeUploaded] = useState(emp?.resumeUploaded ?? false);
  const [resumeFileName, setResumeFileName] = useState(emp?.resumeFileName ?? '');

  return (
    <View>
      <BackButton label="Profile hub" onPress={back} />
      <Text style={styles.eyebrow}>Step 5 of 6</Text>
      <Text style={styles.title}>Employment & resume</Text>
      <Text style={styles.bodyText}>Employment details strengthen your application by showing stable income and ties to your home country.</Text>
      <View style={styles.stepCard}>
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Employer name</Text>
        <TextInput value={employer} onChangeText={setEmployer} style={styles.searchInput} placeholder="Company name" />
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Job title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.searchInput} placeholder="Your role" />
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Annual income (USD equivalent)</Text>
        <TextInput value={income} onChangeText={setIncome} style={styles.searchInput} placeholder="e.g. $50,000 – $70,000" />
      </View>
      {(!employer.trim() || !title.trim()) && <Text style={[styles.rowMeta, { color: colors.gold500, marginBottom: 4 }]}>Employer and job title are required.</Text>}
      <Section title="Resume / CV">
        {!resumeUploaded ? (
          <Pressable style={[styles.uploadZone, { minHeight: 80 }]} onPress={async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false });
              if (!result.canceled && result.assets?.[0]) {
                setResumeUploaded(true);
                setResumeFileName(result.assets[0].name);
              }
            } catch { /* user cancelled */ }
          }}>
            <Ionicons name="document-outline" size={28} color={colors.royal600} />
            <Text style={styles.rowTitle}>Upload resume (PDF)</Text>
            <Text style={styles.rowMeta}>Helps embassies verify employment claims</Text>
          </Pressable>
        ) : (
          <View style={styles.taskRow}>
            <Ionicons name="document-text" size={20} color={colors.green500} />
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{resumeFileName || 'resume.pdf'}</Text>
              <Text style={styles.rowMeta}>Uploaded · Ready for visa package</Text>
            </View>
            <Pressable onPress={() => { setResumeUploaded(false); setResumeFileName(''); }}>
              <Ionicons name="trash-outline" size={18} color={colors.slate300} />
            </Pressable>
          </View>
        )}
      </Section>
      <Pressable style={[styles.primaryButton, (!employer.trim() || !title.trim()) && styles.disabledButton]} onPress={(employer.trim() && title.trim()) ? () => onSave({ employer, jobTitle: title, annualIncomeUsd: income, resumeUploaded, resumeFileName }) : undefined}>
        <Text style={[styles.primaryButtonText, (!employer.trim() || !title.trim()) && styles.disabledButtonText]}>Save employment details</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Emergency Contacts ──────────────────────────────────────────────
function ProfileContactsScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['contacts']>) => void }) {
  const c = profile?.contacts;
  const [name, setName] = useState(c?.emergencyName ?? '');
  const [phone, setPhone] = useState(c?.emergencyPhone ?? '');
  const [relation, setRelation] = useState(c?.emergencyRelation ?? '');
  const canSave = name.trim().length > 0 && phone.trim().length > 0;
  return (
    <View>
      <BackButton label="Profile hub" onPress={back} />
      <Text style={styles.eyebrow}>Step 6 of 6</Text>
      <Text style={styles.title}>Emergency contacts</Text>
      <Text style={styles.bodyText}>Some embassies require an emergency contact on the application form.</Text>
      <View style={styles.stepCard}>
        {([['Full name', name, setName], ['Phone number', phone, setPhone], ['Relationship', relation, setRelation]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
          <View key={label}>
            <Text style={[styles.rowMeta, { marginBottom: 6 }]}>{label}</Text>
            <TextInput value={val} onChangeText={setter} style={[styles.searchInput, { marginBottom: 12 }]} placeholder={label} />
          </View>
        ))}
      </View>
      {!canSave && <Text style={[styles.rowMeta, { color: colors.gold500, marginBottom: 8 }]}>Name and phone number are required.</Text>}
      <Pressable style={[styles.primaryButton, !canSave && styles.disabledButton]} onPress={canSave ? () => onSave({ emergencyName: name, emergencyPhone: phone, emergencyRelation: relation }) : undefined}>
        <Text style={[styles.primaryButtonText, !canSave && styles.disabledButtonText]}>Save emergency contacts</Text>
      </Pressable>
    </View>
  );
}

// ─── Visa Waiver Quick Check ──────────────────────────────────────────────────
const WAIVER_RULES: Record<string, Record<string, { type: 'waiver' | 'visa' | 'eta'; note: string }>> = {
  'India': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee, 10–15 day processing.' },
    'Germany':        { type: 'visa',   note: 'Schengen visa required · EUR 80 fee, 10–15 day processing.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee, interview at US Embassy.' },
    'Canada':         { type: 'visa',   note: 'Visitor visa required · C$100 fee (eTA not available for Indian passport).' },
    'Australia':      { type: 'visa',   note: 'Visitor visa (subclass 600) required · AUD 145 fee.' },
    'New Zealand':    { type: 'visa',   note: 'Visitor visa required · NZD 211 fee.' },
    'Japan':          { type: 'visa',   note: 'Tourist visa required · free fee, 5 day processing at Japanese consulate.' },
    'South Korea':    { type: 'visa',   note: 'Tourist visa required · KRW 40,000 fee.' },
    'Singapore':      { type: 'visa',   note: 'Visa required for Indian passports · SGD 30 fee.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 14 days with return ticket and AED 100 deposit.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days — no visa required as of 2024.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days for Indian passports.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp for all nationalities.' },
    'Sri Lanka':      { type: 'eta',    note: 'ETA required · $35 fee, online application, instant approval.' },
    'Turkey':         { type: 'eta',    note: 'e-Visa required · $50 fee, instant online approval.' },
    'Saudi Arabia':   { type: 'visa',   note: 'Tourist e-Visa available · SAR 300 fee, 24–48 hour processing.' },
    'Bahrain':        { type: 'eta',    note: 'e-Visa available on arrival or online · BHD 5 fee.' },
    'Oman':           { type: 'visa',   note: 'e-Visa required · OMR 20 fee, 2–3 day processing.' },
    'Kenya':          { type: 'eta',    note: 'e-Visa required · $51 fee, apply online before travel.' },
    'South Africa':   { type: 'visa',   note: 'Visa required · ZAR 425 fee at South African embassy.' },
  },
  'Pakistan': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'Canada':         { type: 'visa',   note: 'Visitor visa required · C$100 fee.' },
    'Australia':      { type: 'visa',   note: 'Visitor visa required · AUD 145 fee.' },
    'Japan':          { type: 'visa',   note: 'Tourist visa required.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 14 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Turkey':         { type: 'waiver', note: 'Visa-free for 90 days — no visa required.' },
    'Saudi Arabia':   { type: 'visa',   note: 'Tourist e-Visa available · SAR 300 fee.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
  },
  'Philippines': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'Canada':         { type: 'visa',   note: 'Visitor visa required · C$100 fee.' },
    'Australia':      { type: 'visa',   note: 'Visitor visa required · AUD 145 fee.' },
    'Japan':          { type: 'waiver', note: 'Visa-free for 30 days for Philippine passports.' },
    'South Korea':    { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Singapore':      { type: 'waiver', note: 'Visa-free for 30 days.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 30 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
    'Turkey':         { type: 'visa',   note: 'e-Visa required · $50 fee.' },
    'Saudi Arabia':   { type: 'visa',   note: 'Tourist e-Visa available · SAR 300 fee.' },
  },
  'Egypt': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'Canada':         { type: 'visa',   note: 'Visitor visa required · C$100 fee.' },
    'Australia':      { type: 'visa',   note: 'Visitor visa required · AUD 145 fee.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 30 days.' },
    'Turkey':         { type: 'waiver', note: 'Visa-free for 90 days.' },
    'Saudi Arabia':   { type: 'visa',   note: 'Tourist e-Visa available · SAR 300 fee.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
    'Singapore':      { type: 'visa',   note: 'Visa required · SGD 30 fee.' },
  },
  'Nigeria': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'Canada':         { type: 'visa',   note: 'Visitor visa required · C$100 fee.' },
    'Australia':      { type: 'visa',   note: 'Visitor visa required · AUD 145 fee.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 30 days.' },
    'Turkey':         { type: 'visa',   note: 'e-Visa required · $50 fee.' },
    'Saudi Arabia':   { type: 'visa',   note: 'Tourist e-Visa available · SAR 300 fee.' },
    'Ghana':          { type: 'waiver', note: 'ECOWAS — visa-free entry.' },
    'Kenya':          { type: 'waiver', note: 'Visa-free for 30 days.' },
    'South Africa':   { type: 'visa',   note: 'Visa required · ZAR 425 fee.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
  },
  'South Africa': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'waiver', note: 'Visa-free for 6 months — no visa required.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'Canada':         { type: 'eta',    note: 'eTA required · C$7 fee, online, instant.' },
    'Australia':      { type: 'eta',    note: 'ETA (subclass 601) required · free fee.' },
    'New Zealand':    { type: 'eta',    note: 'NZeTA required · NZD 23 fee.' },
    'Japan':          { type: 'waiver', note: 'Visa-free for 90 days.' },
    'Singapore':      { type: 'waiver', note: 'Visa-free for 30 days.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 30 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
    'Turkey':         { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Kenya':          { type: 'eta',    note: 'eVisa required · $51 fee.' },
  },
  'Bangladesh': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
    'Turkey':         { type: 'eta',    note: 'e-Visa required · $50 fee.' },
  },
  'Nepal': {
    'India':          { type: 'waiver', note: 'Visa-free — no passport required, ID card accepted.' },
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 14 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'visa',   note: 'Visa required · apply at Malaysian embassy.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
  },
  'Sri Lanka': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'UAE':            { type: 'visa',   note: 'Visa on arrival for 14 days.' },
    'Singapore':      { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Maldives':       { type: 'waiver', note: 'Free on-arrival 30-day stamp.' },
  },
  'Jordan': {
    'France':         { type: 'visa',   note: 'Schengen visa required · EUR 80 fee.' },
    'United Kingdom': { type: 'visa',   note: 'Standard Visitor visa required · £115 fee.' },
    'United States':  { type: 'visa',   note: 'B1/B2 visa required · $185 fee.' },
    'UAE':            { type: 'waiver', note: 'Visa-free for 30 days for Jordanian passports.' },
    'Turkey':         { type: 'waiver', note: 'Visa-free for 90 days.' },
    'Thailand':       { type: 'waiver', note: 'Visa-free for 30 days.' },
    'Malaysia':       { type: 'waiver', note: 'Visa-free for 30 days.' },
  },
};
const NATIONALITIES = [
  'India', 'Pakistan', 'Philippines', 'Bangladesh', 'Nepal', 'Sri Lanka',
  'Egypt', 'Jordan', 'Lebanon', 'Morocco',
  'Nigeria', 'Kenya', 'Ghana', 'Ethiopia', 'South Africa',
  'Indonesia', 'Vietnam', 'Myanmar',
  'Brazil', 'Mexico',
];
const DESTINATIONS  = [
  'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Switzerland', 'Belgium', 'Austria',
  'United Kingdom', 'United States', 'Canada', 'Australia', 'New Zealand',
  'Japan', 'South Korea', 'China', 'Singapore', 'Thailand', 'Malaysia', 'Indonesia', 'Vietnam',
  'UAE', 'Saudi Arabia', 'Bahrain', 'Oman', 'Qatar', 'Kuwait',
  'Turkey', 'India', 'Sri Lanka', 'Maldives',
  'South Africa', 'Kenya', 'Ghana',
  'Brazil', 'Mexico',
];

function VisaWaiverScreen({ back }: { back: () => void }) {
  const [nationality, setNationality] = useState(0);
  const [destination, setDestination] = useState(0);
  const nat = NATIONALITIES[nationality];
  const dest = DESTINATIONS[destination];
  const [apiResult, setApiResult] = useState<{ type: 'waiver' | 'visa' | 'eta'; note: string } | null | undefined>(WAIVER_RULES[nat]?.[dest]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    fetchVisaWaiver(nat, dest)
      .then((data) => {
        if (cancelled) return;
        // Real curated data lives for a handful of nationalities; fall back to
        // the broader local table for combinations the backend doesn't cover
        // (including its own "unknown" no-match response).
        const usable = data?.type && data.type !== 'unknown' ? { type: data.type as 'waiver' | 'visa' | 'eta', note: data.note } : null;
        setApiResult(usable ?? WAIVER_RULES[nat]?.[dest] ?? null);
      })
      .catch(() => { if (!cancelled) setApiResult(WAIVER_RULES[nat]?.[dest] ?? null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [nat, dest]);

  const result = apiResult;
  const typeConfig = {
    waiver: { color: colors.green500, bg: colors.green100, icon: 'checkmark-circle' as IoniconName, label: 'Visa waiver' },
    eta:    { color: colors.teal500,  bg: '#E0F2FE',        icon: 'globe-outline'    as IoniconName, label: 'eTA / pre-arrival' },
    visa:   { color: '#DC2626',       bg: '#FEF2F2',        icon: 'alert-circle'     as IoniconName, label: 'Visa required' },
  };
  const cfg = result ? typeConfig[result.type] : null;

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Instant visa check</Text>
      <Text style={styles.title}>Visa Waiver Checker</Text>
      <Section title="Your nationality">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {NATIONALITIES.map((n, i) => (
              <Pressable key={n} onPress={() => setNationality(i)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: nationality === i ? colors.navy900 : colors.slate100 }}>
                <Text style={{ color: nationality === i ? '#fff' : colors.slate700, fontWeight: '700', fontSize: 13 }}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Section>
      <Section title="Destination country">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DESTINATIONS.map((d, i) => (
            <Pressable key={d} onPress={() => setDestination(i)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: destination === i ? colors.royal600 : colors.royal50 }}>
              <Text style={{ color: destination === i ? '#fff' : colors.royal700, fontWeight: '700', fontSize: 13 }}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </Section>
      {checking && (
        <View style={[styles.notice, { marginTop: 8 }]}>
          <Text style={styles.noticeText}>Checking {nat} → {dest}…</Text>
        </View>
      )}
      {!checking && cfg && result && (
        <View style={{ backgroundColor: cfg.bg, borderRadius: 16, padding: 18, gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={cfg.icon} size={28} color={cfg.color} />
            <View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: cfg.color }}>{cfg.label}</Text>
              <Text style={{ fontSize: 12, color: colors.slate600 }}>{nat} passport → {dest}</Text>
            </View>
          </View>
          <Text style={{ color: colors.slate700, lineHeight: 20 }}>{result.note}</Text>
        </View>
      )}
      {!checking && !result && (
        <View style={[styles.notice, { marginTop: 8 }]}>
          <Text style={styles.noticeText}>Data not available for this combination. Check the official embassy website or ask our AI assistant.</Text>
        </View>
      )}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Visa requirements change frequently. Always verify with the official embassy or consulate before travel.</Text>
      </View>
    </View>
  );
}

// ─── Rejection Letter Analyzer ────────────────────────────────────────────────
const REJECTION_REASONS: Record<string, { cause: string; fix: string; severity: 'high' | 'medium' }> = {
  'insufficient funds':   { cause: 'Financial evidence below threshold', fix: 'Upload 3 months of statements showing €65+/day available. Add a salary slip and employer letter.', severity: 'high' },
  'no ties':             { cause: 'Insufficient ties to home country',   fix: 'Provide employment letter, property documents, or family ties evidence. Show you will return.', severity: 'high' },
  'incomplete':          { cause: 'Missing required documents',          fix: 'Use the Visa With Ease requirements checklist to identify all missing items before reapplying.', severity: 'medium' },
  'purpose unclear':     { cause: 'Travel purpose not established',      fix: 'Provide a detailed itinerary, hotel bookings, and a clear cover letter explaining your trip.', severity: 'medium' },
  'previous overstay':   { cause: 'Prior immigration violation',         fix: 'Disclose the overstay honestly. Provide evidence of changed circumstances. Consult a visa expert.', severity: 'high' },
};

function RejectionAnalyzerScreen({ back, openChat }: { back: () => void; openChat: () => void }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Array<{ key: string; cause: string; fix: string; severity: 'high' | 'medium' }>>([]);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeLocally = () => {
    const found = Object.entries(REJECTION_REASONS)
      .filter(([key]) => text.toLowerCase().includes(key))
      .map(([key, val]) => ({ key, ...val }));
    setResults(found.length > 0 ? found : [{ key: 'general', cause: 'Rejection reason not identified', fix: 'Share your rejection letter with our AI assistant for a detailed analysis.', severity: 'medium' }]);
  };

  const analyze = async () => {
    setAnalyzing(true);
    setAiReply(null);
    setResults([]);
    try {
      const reply = await sendChatMessage(
        `Analyze this visa rejection letter and explain the likely reasons and how to fix them for a reapplication:\n\n${text}`
      );
      setAiReply(reply.reply);
    } catch {
      // Real AI unreachable — fall back to the local keyword-based checklist
      // rather than showing nothing.
      analyzeLocally();
    } finally {
      setAnalyzing(false);
      setAnalyzed(true);
    }
  };

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>AI-powered analysis</Text>
      <Text style={styles.title}>Rejection Letter Analyzer</Text>
      {!analyzed ? (
        <>
          <Text style={styles.bodyText}>Paste the key text from your rejection letter or describe the reason given. Our AI will identify the cause and recommend fixes.</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g. 'Your application was refused as you have not demonstrated sufficient funds to cover your intended stay...'"
            multiline
            style={[styles.searchInput, { minHeight: 130, textAlignVertical: 'top', paddingTop: 12, lineHeight: 20 }]}
          />
          <Pressable style={[styles.primaryButton, (!text.trim() || analyzing) && styles.disabledButton]} onPress={text.trim() && !analyzing ? analyze : undefined}>
            {analyzing ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, !text.trim() && styles.disabledButtonText]}>Analyze rejection</Text>}
          </Pressable>
        </>
      ) : (
        <>
          {aiReply ? (
            <Section title="AI analysis">
              <Text style={[styles.rowMeta, { lineHeight: 20, color: colors.slate700 }]}>{aiReply}</Text>
            </Section>
          ) : (
            <Section title={`${results.length} issue${results.length !== 1 ? 's' : ''} identified (offline checklist — AI was unreachable)`}>
              {results.map(r => (
                <View key={r.key} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.slate100 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name={r.severity === 'high' ? 'alert-circle' : 'information-circle'} size={18} color={r.severity === 'high' ? '#DC2626' : colors.gold500} />
                    <Text style={styles.rowTitle}>{r.cause}</Text>
                  </View>
                  <Text style={[styles.rowMeta, { lineHeight: 18 }]}>{r.fix}</Text>
                </View>
              ))}
            </Section>
          )}
          <Pressable style={styles.primaryButton} onPress={openChat}>
            <Text style={styles.primaryButtonText}>Ask AI for detailed guidance</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => { setText(''); setResults([]); setAiReply(null); setAnalyzed(false); }}>
            <Text style={styles.secondaryButtonText}>Analyze another letter</Text>
          </Pressable>
        </>
      )}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>AI analysis is not legal advice. Outcomes depend on specific circumstances. Consult a verified visa consultant for complex cases.</Text>
      </View>
    </View>
  );
}

function OfflineCacheCard() {
  const [snapshot, setSnapshot] = useState<{ count: number; lastUpdated?: string; applications?: unknown[]; requirements?: unknown; notifications?: unknown[] } | null>(null);

  useEffect(() => {
    getCacheSnapshot().then(setSnapshot).catch(() => setSnapshot({ count: 0 }));
  }, []);

  if (!snapshot) return null;

  const resources = [
    { key: 'applications', label: 'Applications', count: snapshot.applications?.length ?? 0 },
    { key: 'requirements', label: 'Requirements', count: snapshot.requirements ? 1 : 0 },
    { key: 'notifications', label: 'Notifications', count: snapshot.notifications?.length ?? 0 },
  ].filter((item) => item.count > 0);

  return (
    <Section title="Offline cache">
      <TaskRow
        title={snapshot.count > 0 ? 'Cached for offline use' : 'No offline data cached yet'}
        meta={snapshot.lastUpdated
          ? `Last refreshed ${new Date(snapshot.lastUpdated).toLocaleString()}. Mutations are blocked offline.`
          : 'Cache fills in automatically as you browse. Mutations are blocked offline.'}
        done={snapshot.count > 0}
      />
      {resources.map((item) => (
        <Finding key={item.key} title={item.label} meta={`${item.count} cached record${item.count === 1 ? '' : 's'} available read-only.`} />
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  // No manual paddingTop here — the root SafeAreaView (edges=['top']) applies
  // the real top inset itself, correct on notches/cutouts too, not just a
  // StatusBar.currentHeight guess.
  shell: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 18, paddingBottom: 28 },
  // Normal-flow block, not absolutely positioned — it's stacked above
  // BottomNav inside a shared bottom-anchored wrapper (see render), so its
  // own position never needs to be coordinated against BottomNav's height.
  stickyFooterBar: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.slate100, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 },
  flex: { flex: 1 },
  header: { height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderBottomColor: colors.slate100, borderBottomWidth: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.gold400, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '900' },
  logo: { fontSize: 23, fontWeight: '900', color: colors.navy900 },
  logoAccent: { color: colors.teal500 },
  iconButton: { width: 38, height: 38, borderRadius: 12, borderColor: colors.slate200, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconButtonText: { color: colors.slate700, fontWeight: '900' },
  welcome: { minHeight: 690, justifyContent: 'center', gap: 18 },
  brandMark: { width: 96, height: 96, borderRadius: 28, backgroundColor: colors.navy900, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  brandMarkText: { color: colors.white, fontSize: 28, fontWeight: '900' },
  welcomeTitle: { fontSize: 42, color: colors.navy900, fontWeight: '900', textAlign: 'center' },
  welcomeCopy: { color: colors.slate600, lineHeight: 22, textAlign: 'center', fontWeight: '600' },
  eyebrow: { color: colors.slate500, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 7 },
  title: { color: colors.slate900, fontSize: 28, fontWeight: '900', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bodyText: { color: colors.slate700, lineHeight: 22, marginBottom: 16 },
  heroCard: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  heroCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, marginTop: 12 },
  heroCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailHero: { minHeight: 220, borderRadius: 20, padding: 20, marginBottom: 14, backgroundColor: colors.navy900 },
  profileHero: { minHeight: 240, borderRadius: 20, padding: 20, marginBottom: 14, backgroundColor: colors.purple600, alignItems: 'center', justifyContent: 'center' },
  successHero: { minHeight: 220, borderRadius: 20, padding: 20, marginBottom: 14, alignItems: 'center', justifyContent: 'center', gap: 14, overflow: 'hidden' },
  reportHero: { borderRadius: 20, padding: 20, marginBottom: 14, alignItems: 'center', gap: 14, overflow: 'hidden' },
  reportText: { color: colors.white, textAlign: 'center', lineHeight: 21, fontWeight: '700' },
  heroMeta: { color: colors.royal100, fontSize: 12, fontWeight: '900', marginBottom: 10 },
  heroTitle: { color: colors.white, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  heroCopy: { color: colors.royal100, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  heroPills: { flexDirection: 'row', gap: 8, marginTop: 'auto' },
  primaryButton: { minHeight: 50, borderRadius: 14, backgroundColor: colors.royal600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 14 },
  goldButton: { minHeight: 48, borderRadius: 14, backgroundColor: colors.gold500, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 12 },
  secondaryButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.royal600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 10 },
  disabledButton: { backgroundColor: colors.slate300 },
  // White text on slate300 is ~1.5:1 contrast (fails WCAG AA) — every button
  // that pairs disabledButton with primaryButtonText must also apply this.
  disabledButtonText: { color: colors.slate700 },
  primaryButtonText: { color: colors.white, fontWeight: '900', textAlign: 'center' },
  secondaryButtonText: { color: colors.royal600, fontWeight: '900', textAlign: 'center' },
  smallButton: { backgroundColor: colors.royal600, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallButtonText: { color: colors.white, fontWeight: '900', fontSize: 13 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  quickAction: { width: '47.8%', minHeight: 90, borderRadius: 16, borderColor: colors.slate100, borderWidth: 1, backgroundColor: colors.white, padding: 14, gap: 10 },
  quickIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.slate800, fontWeight: '700', fontSize: 13 },
  section: { backgroundColor: colors.white, borderRadius: 16, borderColor: colors.slate100, borderWidth: 1, padding: 16, marginTop: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.slate900, marginBottom: 10 },
  rowTitle: { color: colors.slate800, fontWeight: '900', fontSize: 14 },
  rowMeta: { color: colors.slate500, fontSize: 12, marginTop: 4, lineHeight: 18 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopColor: colors.slate100, borderTopWidth: 1 },
  taskMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.orange100, alignItems: 'center', justifyContent: 'center' },
  taskMarkDone: { backgroundColor: colors.green100 },
  taskMarkText: { color: colors.slate800, fontSize: 10, fontWeight: '900' },
  appCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 16, borderColor: colors.slate100, borderWidth: 1, padding: 14, marginBottom: 12 },
  flag: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.royal50, color: colors.royal600, textAlign: 'center', textAlignVertical: 'center', fontWeight: '900' },
  flagEmoji: { fontSize: 28, width: 44, textAlign: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  uploadZone: { minHeight: 150, borderRadius: 18, borderColor: '#93C5FD', borderWidth: 2, borderStyle: 'dashed', backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center', padding: 18, marginBottom: 14 },
  uploadIcon: { color: colors.royal600, fontWeight: '900', fontSize: 24, marginBottom: 8 },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopColor: colors.slate100, borderTopWidth: 1 },
  documentIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.royal50, alignItems: 'center', justifyContent: 'center' },
  documentIconText: { color: colors.royal600, fontWeight: '900', fontSize: 11 },
  findingCard: { borderLeftColor: colors.green500, borderLeftWidth: 3, padding: 12, backgroundColor: colors.slate50, borderRadius: 12, marginTop: 10 },
  analysisRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopColor: colors.slate100, borderTopWidth: 1 },
  timelineCard: { backgroundColor: colors.white, borderRadius: 16, borderColor: colors.slate100, borderWidth: 1, padding: 16, marginTop: 10 },
  notice: { backgroundColor: colors.gold100, borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { color: '#92400E', fontSize: 12, fontWeight: '900', lineHeight: 18 },
  chatScreen: { gap: 12 },
  contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  aiBubble: { backgroundColor: colors.white, borderColor: colors.slate100, borderWidth: 1, borderRadius: 18, borderTopLeftRadius: 4, padding: 14 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.royal600, borderRadius: 18, borderBottomRightRadius: 4, padding: 14, maxWidth: '82%' },
  userText: { color: colors.white, fontWeight: '700', lineHeight: 20 },
  escalationCard: { backgroundColor: colors.purple100, borderRadius: 16, padding: 14 },
  disclaimer: { backgroundColor: colors.gold100, borderRadius: 12, padding: 10 },
  disclaimerText: { color: '#92400E', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 46, borderRadius: 23, borderColor: colors.slate200, borderWidth: 1, backgroundColor: colors.white, paddingHorizontal: 14, color: colors.slate900 },
  // color is load-bearing, not decoration: without it, typed text falls back
  // to the platform/theme default, which on some Android devices resolves
  // to near-white on this input's white background — the original
  // "white text on signup/OTP screens" bug, root-caused here.
  searchInput: { height: 50, borderRadius: 14, borderColor: colors.slate200, borderWidth: 1, backgroundColor: colors.white, paddingHorizontal: 14, marginBottom: 14, color: colors.slate900 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.royal600, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.white, fontWeight: '900' },
  consultantCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 16, borderColor: colors.slate100, borderWidth: 1, padding: 14, marginBottom: 12 },
  consultantAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple600, alignItems: 'center', justifyContent: 'center' },
  consultantAvatarLarge: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  consultantAvatarText: { color: colors.royal600, fontWeight: '900' },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 16, borderColor: colors.slate100, borderWidth: 1, padding: 14, marginBottom: 12 },
  optionCardActive: { borderColor: colors.royal600, backgroundColor: colors.royal50 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 14, borderColor: colors.slate100, borderWidth: 1, padding: 14, marginBottom: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  checkbox: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: colors.slate300, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.royal600, borderColor: colors.royal600 },
  checkboxText: { color: colors.white, fontWeight: '900', fontSize: 10 },
  checkboxLabel: { flex: 1, color: colors.slate700, fontWeight: '700', lineHeight: 18 },
  stepCard: { backgroundColor: colors.white, borderRadius: 18, borderColor: colors.slate100, borderWidth: 1, padding: 16 },
  segmented: { flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: 14, padding: 4, marginBottom: 10 },
  segment: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { color: colors.slate500, fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  segmentTextActive: { color: colors.royal600 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '900', overflow: 'hidden' },
  badge_light: { color: colors.white, backgroundColor: 'rgba(255,255,255,0.16)' },
  badge_neutral: { color: colors.slate700, backgroundColor: colors.slate100 },
  badge_warn: { color: '#92400E', backgroundColor: colors.gold100 },
  // height/paddingBottom below are placeholder fallbacks — BottomNav always
  // overrides them inline with the real safe-area inset for this device.
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 58, flexDirection: 'row', backgroundColor: colors.white, borderTopColor: colors.slate100, borderTopWidth: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 0 },
  navItem: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 6, borderRadius: 16, position: 'relative' },
  navPill: { position: 'absolute', top: 0, width: 32, height: 3, borderRadius: 2, backgroundColor: colors.royal600 },
  navLabel: { color: colors.slate500, fontSize: 10, fontWeight: '800' },
  navLabelActive: { color: colors.royal600 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backIcon: { color: colors.royal600, fontWeight: '900', fontSize: 18 },
  backText: { color: colors.royal600, fontWeight: '900' },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  dot: { flex: 1, height: 5, borderRadius: 999, backgroundColor: colors.slate200 },
  dotActive: { backgroundColor: colors.royal600 },
});
