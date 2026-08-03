import { useEffect, useRef, useState } from 'react';
import {
  login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, demoLogin as apiDemoLogin,
  sendChatMessage, setToken,
  fetchApplications, createApplication as apiCreateApplication,
  fetchConsultants as apiFetchConsultants,
  fetchSessionOptions as apiFetchSessionOptions,
  createBooking as apiCreateBooking,
  unlockReport,
  fetchNotifications, fetchDocuments, fetchAuditResult, fetchExchangeRates,
  fetchProfile, updateProfile,
  forgotPassword, verifyEmailOtp, fetchBookingSlots,
  fetch2faStatus, send2faCode, verify2faCode, disable2fa,
  type AuthUser, type AuthSession, type UserProfile,
  type ApiApplication, type ApiConsultant, type ApiSessionOption, type ApiBooking,
  type ApiNotification, type ApiDocument,
} from './src/api';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { ActivityIndicator, Alert, Animated, Dimensions, Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
import { CHAT_KB } from './src/data';
import { getCacheSnapshot, clearCache } from './src/offlineCache';
import { loadPreferences, savePreferences, DEFAULT_PREFERENCES, type SettingsPreferences } from './src/preferences';
import { colors, scoreColor } from './src/theme';

// ─── Device metrics — dynamic safe area support ───────────────────────────────
// StatusBar.currentHeight is reliable on Android; 0 on iOS (SafeAreaView handles it)
const STATUSBAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
// Nav bar height = screen minus window (the OS nav strip at the very bottom)
const { height: _SH, width: SCREEN_W } = Dimensions.get('screen');
const { height: _WH } = Dimensions.get('window');
const NAV_BAR_H = Platform.OS === 'android' ? Math.max(0, _SH - _WH) : 34;
// Total bottom nav height including OS navigation bar
const BOTTOM_NAV_H = 58 + NAV_BAR_H;

// ─── Visa topic guard — prevents off-topic AI calls ──────────────────────────
const VISA_RE = /visa|passport|embassy|consulate|schengen|immigrat|travel doc|residency|permit|arrival card|departure|customs|biometric|interview|overstay|appeal|rejection|refusal|bank statement|financial proof|insurance|invitation letter|sponsor|flight reserv|hotel reserv|itinerary|notarize|apostille|noc |no objection|salary certif|employment letter|work permit|study permit|student visa|tourist visa|business visa|transit visa|family visit|entry ban|blacklist|vfs|ika|appointment/i;
const OFF_TOPIC_RE = /recipe|cook|music|song|movie|film|weather|sports|cricket|football|game|programming|code|math|physics|history|politics|religion|relationship|joke|poem|story|novel|stock|invest|crypto|bitcoin|diet|workout|fitness/i;

function isOffTopicMessage(msg: string): boolean {
  if (VISA_RE.test(msg)) return false;
  if (msg.trim().split(/\s+/).length <= 5) return false; // short questions get through
  return OFF_TOPIC_RE.test(msg);
}

const OFF_TOPIC_REPLY = "I can only help with visa and immigration questions — things like document requirements, embassy rules, application timelines, and travel eligibility. What visa question can I help you with?";

const tabs = [
  { id: 'home',    label: 'Home',    icon: 'home'                as IoniconName, iconOff: 'home-outline'                as IoniconName },
  { id: 'apps',    label: 'Apps',    icon: 'document-text'       as IoniconName, iconOff: 'document-text-outline'       as IoniconName },
  { id: 'docs',    label: 'Docs',    icon: 'folder'              as IoniconName, iconOff: 'folder-outline'              as IoniconName },
  { id: 'chat',    label: 'Chat',    icon: 'chatbubble-ellipses' as IoniconName, iconOff: 'chatbubble-ellipses-outline' as IoniconName },
  { id: 'profile', label: 'Profile', icon: 'person'              as IoniconName, iconOff: 'person-outline'              as IoniconName },
] as const;

const onboardingSteps = [
  { key: 'nationality', title: 'Nationality', body: 'Your passport country changes visa rules, fees and document checks.', value: 'India' },
  { key: 'residence', title: 'Residence', body: 'VisaIQ uses your application jurisdiction to find the correct submission route.', value: 'United Arab Emirates' },
  { key: 'destination', title: 'Destination', body: 'Pick the country and travel dates for the next journey.', value: 'France, Jul 18-27' },
  { key: 'purpose', title: 'Visa type', body: 'Choose the category so requirements stay scoped and source-backed.', value: 'Schengen Tourist' }
] as const;

type TabId = (typeof tabs)[number]['id'];
type DetailTab = 'overview' | 'documents' | 'requirements' | 'chat';
type Route =
  | { name: 'splash' }
  | { name: 'welcome' }
  | { name: 'register' }
  | { name: 'verify'; email: string }
  | { name: 'forgotPassword' }
  | { name: 'camera'; docType: string }
  | { name: 'liveAnalysis'; docTitle: string }
  | { name: 'profileHub' }
  | { name: 'visaWaiver' }
  | { name: 'rejectionAnalyzer' }
  | { name: 'proTier' }
  | { name: 'pricing' }
  | { name: 'ecosystemPartners'; score: number }
  | { name: 'visaCalculator' }
  | { name: 'bankBalance' }
  | { name: 'embassyFinder' }
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
  | { name: 'consent'; consultantId: string; optionId: string }
  | { name: 'confirmation'; consultantId: string }
  | { name: 'notifications' }
  | { name: 'search' }
  | { name: 'settings' }
  | { name: 'consultantConsole' }
  | { name: 'hrPortal' }
  | { name: 'employeePortal' }
  | { name: 'adminOverview' };

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
    status: STATUS_LABEL[a.status] ?? a.status,
    statusColor: STATUS_COLOR[a.status] ?? '#64748B',
    intendedTo: a.intendedFrom,
    jurisdiction: 'Your residence country',
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
    verified: true,
    price: `$${c.rate}`,
    nextSlot: c.availableToday ? 'Available today' : c.responseTime,
    successRate: c.rating >= 4.9 ? '97%' : c.rating >= 4.8 ? '94%' : '91%',
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

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([]);

  // Real data state
  const [appList, setAppList] = useState<ReturnType<typeof normalizeApp>[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadAppsError, setLoadAppsError] = useState('');
  const [consultantList, setConsultantList] = useState<ReturnType<typeof normalizeConsultant>[]>([]);
  const [loadConsultantsError, setLoadConsultantsError] = useState('');
  const [sessionOpts, setSessionOpts] = useState<ReturnType<typeof normalizeSessionOption>[]>([]);
  const [lastBooking, setLastBooking] = useState<ApiBooking | null>(null);
  const [createAppError, setCreateAppError] = useState('');
  const [notificationList, setNotificationList] = useState<ApiNotification[]>([]);
  const [documentList, setDocumentList] = useState<ApiDocument[]>([]);
  const [auditData, setAuditData] = useState<Record<string, any>>({});
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 1, EUR: 0.924, GBP: 0.793, AED: 3.673, CAD: 1.364, AUD: 1.529, JPY: 157.2,
    SGD: 1.342, INR: 83.5, SAR: 3.751, QAR: 3.640, CHF: 0.899, NZD: 1.634,
  });

  // Onboarding collected values
  const [onboardingValues, setOnboardingValues] = useState({
    nationality: '', residence: '', destination: '', travelDates: '', visaType: ''
  });

  // New application form
  const [newAppVisaType, setNewAppVisaType] = useState('schengen-tourist');
  const [newAppNationality, setNewAppNationality] = useState('');
  const [newAppResidence, setNewAppResidence] = useState('');
  const [newAppDestination, setNewAppDestination] = useState('');
  const [newAppTravelFrom, setNewAppTravelFrom] = useState('');
  const [newAppCreating, setNewAppCreating] = useState(false);

  const activeTab = route.name === 'tabs' ? route.tab : route.name === 'application' ? 'apps' : route.name === 'newApp' ? 'apps' : route.name === 'upload' ? 'docs' : 'home';

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
    try {
      const { options } = await apiFetchSessionOptions();
      setSessionOpts(options.map(normalizeSessionOption));
    } catch { /* stay with empty list */ }
  };

  const loadNotifications = async () => {
    try {
      const { notifications } = await fetchNotifications();
      setNotificationList(notifications);
    } catch { /* keep empty */ }
  };

  const loadDocuments = async (applicationId?: string) => {
    try {
      const { documents } = await fetchDocuments(applicationId);
      setDocumentList(documents);
    } catch { /* keep empty */ }
  };

  const loadExchangeRates = async () => {
    try {
      const { rates } = await fetchExchangeRates();
      setExchangeRates(rates);
    } catch { /* use defaults */ }
  };

  const loadAuditResult = async (docId: string) => {
    try {
      const data = await fetchAuditResult(docId);
      setAuditData(prev => ({ ...prev, [docId]: data }));
    } catch { /* use empty */ }
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
      });
      const normalized = normalizeApp(application);
      setAppList(prev => [normalized, ...prev]);
      // Reset form fields for next application
      setNewAppNationality('');
      setNewAppResidence('');
      setNewAppDestination('');
      setNewAppTravelFrom('');
      openApplication(normalized.id);
    } catch (e: any) {
      setCreateAppError(e?.message ?? 'Could not create application. Please check your connection and try again.');
    } finally {
      setNewAppCreating(false);
    }
  };

  const handleConfirmBooking = async (consultantId: string, optionId: string) => {
    const appId = appList[0]?.id ?? `app-${Date.now()}`;
    try {
      const booking = await apiCreateBooking({ consultantId, applicationId: appId, sessionType: optionId });
      setLastBooking(booking);
    } catch {
      setLastBooking({ bookingId: `bk-${Date.now()}`, status: 'pending', calendlyUrl: 'https://calendly.com/visaiq', consultantId, applicationId: appId, sessionType: optionId });
    }
    setRoute({ name: 'confirmation', consultantId });
  };

  const handleLogin = async () => {
    if (loginLoading) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      const session = await apiLogin(authEmail, authPassword);
      setToken(session.token);
      setAuthUser(session.user);
      // Load real data immediately after login (fire-and-forget — errors shown in UI)
      void Promise.all([loadApplications(), loadConsultants(), loadSessionOpts(), loadNotifications(), loadExchangeRates()]);
      setRoute({ name: 'onboarding', step: 0 });
    } catch (e: any) {
      setLoginError(e?.message ?? 'Login failed. Check your connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async (persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin' = 'consumer') => {
    if (loginLoading) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      const session = await apiDemoLogin(persona);
      setToken(session.token);
      setAuthUser(session.user);
      void Promise.all([loadApplications(), loadConsultants(), loadSessionOpts(), loadNotifications(), loadExchangeRates()]);
      setRoute({ name: 'onboarding', step: 0 });
    } catch (e: any) {
      setLoginError(e?.message ?? 'Demo login failed. Is the backend running?');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loginLoading) return;
    setLoginError('');
    setLoginLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned from Google');
      const session = await apiGoogleLogin(idToken);
      setToken(session.token);
      setAuthUser(session.user);
      void Promise.all([loadApplications(), loadConsultants(), loadSessionOpts(), loadNotifications(), loadExchangeRates()]);
      setRoute({ name: 'onboarding', step: 0 });
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS) return;
      setLoginError(e?.message ?? 'Google sign-in failed. Try email & password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSendChat = async () => {
    const trimmed = message.trim();
    if (!trimmed || isTyping) return;
    setSessionMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    setMessage('');
    // Reject off-topic messages before making any API call — saves tokens
    if (isOffTopicMessage(trimmed)) {
      setSessionMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'ai', text: OFF_TOPIC_REPLY }]);
      return;
    }
    setIsTyping(true);
    try {
      const { reply } = await sendChatMessage(trimmed);
      setSessionMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'ai', text: reply }]);
    } catch {
      const match = CHAT_KB.find(([re]) => re.test(trimmed));
      const fallback = match ? match[1] : "I'm here to help with your visa application. What would you like to know?";
      setSessionMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'ai', text: fallback }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
  {/* Camera screen renders fullscreen outside ScrollView */}
      {route.name === 'camera' && (
        <CameraScreen
          docType={route.docType}
          back={() => setRoute({ name: 'upload', state: 'select' })}
          onCapture={() => setRoute({ name: 'liveAnalysis', docTitle: route.docType })}
        />
      )}
      {route.name === 'liveAnalysis' && (
        <LiveAnalysisScreen
          docTitle={route.docTitle}
          onDone={() => setRoute({ name: 'auditReport', docId: 'doc-passport' })}
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
      {!['camera','liveAnalysis'].includes(route.name) && (
      <ScrollView contentContainerStyle={[styles.content, !['welcome','onboarding','splash','register','verify','forgotPassword'].includes(route.name) && styles.withNav]}>
        {route.name === 'splash' && (
          <SplashScreen onDone={() => setRoute({ name: 'welcome' })} />
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
            onDemoLogin={handleDemoLogin}
            onForgot={() => setRoute({ name: 'forgotPassword' })}
            onRegister={() => setRoute({ name: 'register' })}
            loginError={loginError}
            loginLoading={loginLoading}
          />
        )}
        {route.name === 'forgotPassword' && (
          <ForgotPasswordScreen back={() => setRoute({ name: 'welcome' })} />
        )}
        {route.name === 'onboarding' && (
          <OnboardingScreen
            step={route.step}
            back={() => route.step === 0 ? setRoute({ name: 'welcome' }) : setRoute({ name: 'onboarding', step: route.step - 1 })}
            next={() => route.step === onboardingSteps.length - 1 ? goHome() : setRoute({ name: 'onboarding', step: route.step + 1 })}
          />
        )}
        {route.name === 'tabs' && route.tab === 'home' && (
          <DashboardScreen
            appList={appList}
            loadingApps={loadingApps}
            loadAppsError={loadAppsError}
            userName={authUser?.name}
            openApplication={openApplication}
            openUpload={() => setRoute({ name: 'upload', state: 'select' })}
            openAnalysis={() => setRoute({ name: 'analysis' })}
            openRequirements={() => setRoute({ name: 'requirements' })}
            openChat={goChat}
            openConsultants={() => setRoute({ name: 'consultants' })}
            openCalculator={() => setRoute({ name: 'visaCalculator' })}
            newApplication={() => setRoute({ name: 'newApp', step: 0 })}
            retryLoad={loadApplications}
          />
        )}
        {route.name === 'tabs' && route.tab === 'apps' && (
          <ApplicationsScreen
            appList={appList}
            loadingApps={loadingApps}
            openApplication={openApplication}
            newApplication={() => setRoute({ name: 'newApp', step: 0 })}
          />
        )}
        {route.name === 'tabs' && route.tab === 'docs' && (
          <DocumentsScreen
            openUpload={() => setRoute({ name: 'upload', state: 'select' })}
            openAudit={(docId) => setRoute({ name: 'auditReport', docId })}
            documents={documentList}
            onMount={() => loadDocuments(appList[0]?.id)}
          />
        )}
        {route.name === 'tabs' && route.tab === 'chat' && (
          <ChatScreen
            message={message}
            setMessage={setMessage}
            sessionMessages={sessionMessages}
            sendMessage={handleSendChat}
            isTyping={isTyping}
            appList={appList}
            openConsultants={() => setRoute({ name: 'consultants' })}
          />
        )}
        {route.name === 'tabs' && route.tab === 'profile' && (
          <ProfileScreen
            authUser={authUser}
            openSettings={() => setRoute({ name: 'settings' })}
            openConsultants={() => setRoute({ name: 'consultants' })}
            openConsole={() => setRoute({ name: 'consultantConsole' })}
            openHr={() => setRoute({ name: 'hrPortal' })}
            openEmployee={() => setRoute({ name: 'employeePortal' })}
            openAdmin={() => setRoute({ name: 'adminOverview' })}
            openCalculator={() => setRoute({ name: 'visaCalculator' })}
            openBankBalance={() => setRoute({ name: 'bankBalance' })}
            openEmbassy={() => setRoute({ name: 'embassyFinder' })}
            openTimeline={() => setRoute({ name: 'timelineTracker' })}
            openComparison={() => setRoute({ name: 'countryComparison' })}
            openVisaWaiver={() => setRoute({ name: 'visaWaiver' })}
            openRejectionAnalyzer={() => setRoute({ name: 'rejectionAnalyzer' })}
            openProfileHub={() => setRoute({ name: 'profileHub' })}
            openProTier={() => setRoute({ name: 'proTier' })}
            openPartners={() => setRoute({ name: 'ecosystemPartners', score: appList[0]?.readinessScore ?? 0 })}
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
            back={() => setRoute({ name: 'tabs', tab: 'docs' })}
            onCamera={() => setRoute({ name: 'camera', docType: 'Passport bio page' })}
            next={() => {
              const nextState = route.state === 'select' ? 'uploading' : route.state === 'uploading' ? 'auditing' : 'done';
              setRoute(nextState === 'done' ? { name: 'liveAnalysis', docTitle: 'Passport bio page' } : { name: 'upload', state: nextState });
            }}
          />
        )}
        {route.name === 'auditReport' && (
          <AuditReportScreen
            docId={route.docId}
            back={() => setRoute({ name: 'tabs', tab: 'docs' })}
            openRequirements={() => setRoute({ name: 'requirements' })}
            fetchedAudit={auditData[route.docId]}
            onMount={() => loadAuditResult(route.docId)}
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
        {route.name === 'requirements' && <RequirementsScreen back={goHome} openConsultants={() => setRoute({ name: 'consultants' })} />}
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
            back={() => setRoute({ name: 'booking', consultantId: route.consultantId, optionId: route.optionId })}
            confirm={() => setRoute({ name: 'consent', consultantId: route.consultantId, optionId: route.optionId })}
          />
        )}
        {route.name === 'consent' && (
          <ConsentScreen
            consultantId={route.consultantId}
            optionId={route.optionId}
            back={() => openBooking(route.consultantId, route.optionId)}
            confirm={handleConfirmBooking}
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
          />
        )}
        {route.name === 'ecosystemPartners' && <EcosystemPartnersScreen back={goHome} score={route.score} />}
        {route.name === 'notifications' && <NotificationsScreen back={goHome} notifications={notificationList} />}
        {route.name === 'search' && <SearchScreen back={goHome} openApplication={openApplication} openConsultant={(id) => setRoute({ name: 'consultant', id })} appList={appList} consultantList={consultantList} />}
        {route.name === 'settings' && (
          <SettingsScreen
            back={() => setRoute({ name: 'tabs', tab: 'profile' })}
            authUser={authUser}
            openProfileHub={() => setRoute({ name: 'profileHub' })}
            onSignOut={() => {
              setToken(null);
              setAuthUser(null);
              setRoute({ name: 'welcome' });
            }}
          />
        )}
        {route.name === 'consultantConsole' && <ConsultantConsoleScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'hrPortal' && <HrPortalScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'employeePortal' && <EmployeePortalScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} authUser={authUser} />}
        {route.name === 'adminOverview' && <AdminOverviewScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} />}
        {route.name === 'visaCalculator' && <VisaCalculatorScreen back={goHome} />}
        {route.name === 'bankBalance' && <BankBalanceScreen back={goHome} />}
        {route.name === 'embassyFinder' && <EmbassyFinderScreen back={goHome} />}
        {route.name === 'timelineTracker' && <TimelineTrackerScreen back={goHome} openUpload={() => setRoute({ name: 'upload', state: 'select' })} />}
        {route.name === 'countryComparison' && <CountryComparisonScreen back={goHome} />}
        {route.name === 'profileHub' && <ProfileHubScreen back={() => setRoute({ name: 'tabs', tab: 'profile' })} authUser={authUser} />}
        {route.name === 'visaWaiver' && <VisaWaiverScreen back={goHome} />}
        {route.name === 'rejectionAnalyzer' && <RejectionAnalyzerScreen back={goHome} openChat={goChat} />}
        {route.name === 'proTier' && <ProTierScreen back={goHome} appList={appList} />}
        {route.name === 'register' && (
          <RegisterScreen
            back={() => setRoute({ name: 'welcome' })}
            onSuccess={(session) => {
              setToken(session.token);
              setAuthUser(session.user);
              void Promise.all([loadApplications(), loadConsultants(), loadSessionOpts(), loadNotifications(), loadExchangeRates()]);
              setRoute({ name: 'onboarding', step: 0 });
            }}
          />
        )}
        {route.name === 'verify' && <VerifyEmailScreen email={route.email} onDone={() => setRoute({ name: 'onboarding', step: 0 })} />}
      </ScrollView>
      )}
      {!['camera','liveAnalysis','welcome','splash','register','verify','forgotPassword'].includes(route.name) && route.name !== 'onboarding' && (
        <BottomNav activeTab={activeTab} setTab={(tab) => setRoute({ name: 'tabs', tab })} unreadCount={notificationList.filter(n => !n.read && n.type === 'booking').length} />
      )}
    </SafeAreaView>
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
      <Text style={styles.logo}>VISA<Text style={styles.logoAccent}>IQ</Text></Text>
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
  accepted, email, password, setEmail, setPassword, toggleAccepted, start, onForgot, onRegister, onGoogleLogin, onDemoLogin, loginError, loginLoading,
}: {
  accepted: boolean; email: string; password: string;
  setEmail: (v: string) => void; setPassword: (v: string) => void;
  toggleAccepted: () => void; start: () => void; onForgot: () => void; onRegister: () => void;
  onGoogleLogin: () => void;
  onDemoLogin: (persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin') => void;
  loginError?: string; loginLoading?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const canStart = accepted && email.includes('@') && password.length >= 6;

  if (!showForm) {
    // ── Marketing / landing view ────────────────────────────────────────
    return (
      <View style={{ minHeight: 720, margin: -18 }}>
        {/* Gradient header with passport illustration */}
        <LinearGradient colors={['#0B1F4B', '#1A56DB']} style={{ height: 420, padding: 28, paddingTop: 56, position: 'relative', overflow: 'hidden' }}>
          {/* Passport card illustration */}
          <LinearGradient colors={['#F59E0B', '#D97706']} style={{ position: 'absolute', top: 32, right: -16, width: 136, height: 136, borderRadius: 18, transform: [{ rotate: '12deg' }] }}>
            <View style={{ position: 'absolute', inset: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 }}>PASSPORT</Text>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 10, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-outline" size={18} color="#fff" />
              </View>
            </View>
          </LinearGradient>
          {/* Plane icon accent */}
          <View style={{ position: 'absolute', top: 96, left: 36, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.teal500, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="airplane" size={16} color="#fff" />
          </View>
          {/* Headline */}
          <View style={{ marginTop: 200 }}>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 40 }}>Visa applications,{'\n'}simplified.</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 12, lineHeight: 22 }}>AI-powered guidance from checklist to approval — know exactly what you need, before you apply.</Text>
          </View>
        </LinearGradient>
        {/* Bottom sheet */}
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 24, flex: 1 }}>
          {/* Trust strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 22, paddingHorizontal: 8 }}>
            {[['shield-checkmark-outline','GDPR'],['sparkles','94% accuracy'],['headset-outline','Expert support']].map(([icon, label]) => (
              <View key={label} style={{ alignItems: 'center', gap: 6 }}>
                <Ionicons name={icon as IoniconName} size={22} color={colors.teal500} />
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.slate500 }}>{label}</Text>
              </View>
            ))}
          </View>
          {/* CTAs */}
          <Pressable style={[styles.secondaryButton, { flexDirection: 'row', gap: 10, marginBottom: 12 }]}
            onPress={onGoogleLogin} disabled={loginLoading}>
            <Ionicons name="logo-google" size={18} color={colors.slate700} />
            <Text style={[styles.secondaryButtonText, { fontWeight: '700' }]}>Continue with Google</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, { marginTop: 0 }]} onPress={() => setShowForm(true)}>
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Sign up with email</Text>
          </Pressable>
          <Pressable style={{ alignItems: 'center', marginTop: 18 }} onPress={() => setShowForm(true)}>
            <Text style={{ color: colors.royal600, fontWeight: '700', fontSize: 13 }}>I already have an account</Text>
          </Pressable>
          {/* Demo mode strip */}
          <View style={{ marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.slate100 }}>
            <Text style={{ color: colors.slate500, fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Try a demo account</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['consumer','Consumer','person-outline'],['consultant','Consultant','people-outline'],['hr_admin','HR Admin','briefcase-outline'],['platform_admin','Admin','shield-outline']] as const).map(([persona, label, icon]) => (
                <Pressable key={persona} onPress={() => onDemoLogin(persona)} disabled={loginLoading}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', gap: 4, opacity: loginLoading ? 0.5 : 1 }}>
                  <Ionicons name={icon as IoniconName} size={16} color={colors.slate600} />
                  <Text style={{ color: colors.slate600, fontSize: 9, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={{ color: colors.slate300, fontSize: 10, textAlign: 'center', marginTop: 14, lineHeight: 16 }}>
            By continuing you agree to our <Text style={{ color: colors.royal600 }}>Terms</Text> & <Text style={{ color: colors.royal600 }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    );
  }

  // ── Sign-in form view ─────────────────────────────────────────────────
  return (
    <View style={styles.welcome}>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 8 }} onPress={() => setShowForm(false)}>
        <Ionicons name="chevron-back" size={18} color={colors.royal600} />
        <Text style={{ color: colors.royal600, fontWeight: '700' }}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Sign in</Text>
      <View style={styles.stepCard}>
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Email address</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" style={styles.searchInput} />
        <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" style={styles.searchInput} />
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
        <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{loginError}</Text>
        </View>
      ) : null}
      <Pressable style={[styles.primaryButton, (!canStart || loginLoading) && styles.disabledButton]} onPress={canStart && !loginLoading ? start : undefined}>
        {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
      </Pressable>
      <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={onRegister}>
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

function OnboardingScreen({ step, back, next }: { step: number; back: () => void; next: () => void }) {
  const current = onboardingSteps[step];
  return (
    <View>
      <BackButton label="Welcome" onPress={back} />
      <Text style={styles.eyebrow}>Step {step + 1} of {onboardingSteps.length}</Text>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.bodyText}>{current.body}</Text>
      <View style={styles.selectorCard}>
        <Text style={styles.selectorValue}>{current.value}</Text>
      </View>
      <ProgressDots count={onboardingSteps.length} active={step} />
      <Pressable style={styles.primaryButton} onPress={next}>
        <Text style={styles.primaryButtonText}>{step === onboardingSteps.length - 1 ? 'Create dashboard' : 'Continue'}</Text>
      </Pressable>
    </View>
  );
}

function DashboardScreen({ appList, loadingApps, loadAppsError, userName, openApplication, openUpload, openAnalysis, openRequirements, openChat, openConsultants, openCalculator, newApplication, retryLoad }: {
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
  newApplication: () => void;
  retryLoad: () => void;
}) {
  const app = appList[0] ?? null;
  const countdown = app ? tripCountdown(app.intendedFrom) : '';
  const firstName = userName ? userName.split(' ')[0] : null;
  return (
    <View>
      <Text style={styles.eyebrow}>{firstName ? `Hello, ${firstName}` : 'Welcome'}</Text>
      <Text style={styles.title}>{app ? 'Your next visa journey' : 'Get started'}</Text>

      {loadingApps && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={colors.royal600} />
          <Text style={[styles.rowMeta, { marginTop: 12 }]}>Loading your applications…</Text>
        </View>
      )}

      {!loadingApps && loadAppsError ? (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 16, marginBottom: 12, alignItems: 'center', gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={{ color: '#991B1B', fontWeight: '700', textAlign: 'center' }}>{loadAppsError}</Text>
          <Pressable style={[styles.smallButton, { backgroundColor: '#DC2626' }]} onPress={retryLoad}>
            <Text style={[styles.smallButtonText, { color: '#fff' }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loadingApps && !app && (
        <View style={{ backgroundColor: colors.royal50, borderRadius: 20, borderWidth: 1.5, borderColor: '#93C5FD', borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Ionicons name="document-text-outline" size={48} color={colors.royal600} />
          <Text style={[styles.rowTitle, { textAlign: 'center' }]}>No applications yet</Text>
          <Text style={[styles.rowMeta, { textAlign: 'center' }]}>Create your first visa application to get AI-powered readiness scoring and document guidance.</Text>
          <Pressable style={styles.primaryButton} onPress={newApplication}>
            <Text style={styles.primaryButtonText}>+ Create application</Text>
          </Pressable>
        </View>
      )}

      {!loadingApps && app && (
        <Pressable onPress={() => openApplication(app.id)}>
          <LinearGradient colors={['#0B1F4B', '#1A56DB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.flex}>
                <Text style={styles.heroMeta}>NEXT TRIP · {countdown}</Text>
                <Text style={styles.heroTitle}>{app.destinationFlag} {app.destinationCountry}</Text>
                <Text style={styles.heroCopy}>{app.visaType}</Text>
              </View>
              <ScoreRing value={app.readinessScore} large subLabel={app.status} />
            </View>
            <View style={styles.heroPills}>
              <Badge tone="light" label={`${app.documentsUploaded}/${app.documentsRequired} docs`} />
              <Badge tone={app.issuesCount > 0 ? 'warn' : 'light'} label={`${app.issuesCount} issues`} />
            </View>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Complete checklist</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      <View style={styles.quickGrid}>
        <QuickAction icon="cloud-upload-outline"        label="Upload"      bg="#EFF6FF" iconColor={colors.royal600}  onPress={openUpload} />
        <QuickAction icon="analytics-outline"           label="Analyze"     bg="#EDE9FE" iconColor={colors.purple600} onPress={openAnalysis} />
        <QuickAction icon="chatbubble-ellipses-outline" label="Ask AI"      bg="#E0F2FE" iconColor={colors.teal500}   onPress={openChat} />
        <QuickAction icon="ribbon-outline"              label="Book expert" bg="#FEF3C7" iconColor={colors.gold500}   onPress={openConsultants} />
        <QuickAction icon="calculator-outline"          label="Calc score"  bg="#EDE9FE" iconColor={colors.purple600} onPress={openCalculator} />
        <QuickAction icon="add-circle-outline"          label="New app"     bg="#D1FAE5" iconColor={colors.green500}  onPress={newApplication} />
      </View>

      {!loadingApps && appList.length > 1 && (
        <Section title="All applications">
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {appList.map(a => (
              <Pressable key={a.id} onPress={() => openApplication(a.id)}
                style={{ width: '30%', backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.slate100, padding: 12, alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22 }}>{a.destinationFlag}</Text>
                <ScoreRing value={a.readinessScore} />
                <Text style={[styles.rowMeta, { fontSize: 11, textAlign: 'center' }]} numberOfLines={1}>{a.destinationCountry}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${a.statusColor}18` }]}>
                  <View style={[styles.statusDot, { backgroundColor: a.statusColor }]} />
                  <Text style={[styles.statusText, { color: a.statusColor, fontSize: 9 }]}>{a.status}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Section>
      )}
    </View>
  );
}

function ApplicationsScreen({ appList, loadingApps, openApplication, newApplication }: {
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
        </Pressable>
      ))}
    </View>
  );
}

function ApplicationDetailScreen({ id, appList, tab, setTab, back, upload, openAudit, openAnalysis, openBooking, documents }: {
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
      {tab === 'overview' && (
        <Section title="Readiness overview">
          <TaskRow title="Profile and passport checked" meta="Identity fields are consistent across documents." done />
          <TaskRow title="Two requirements missing" meta="Insurance and itinerary still need upload." />
          <Pressable style={styles.primaryButton} onPress={openAnalysis}><Text style={styles.primaryButtonText}>Open visa analysis</Text></Pressable>
          <Pressable style={styles.goldButton} onPress={openBooking}><Text style={styles.primaryButtonText}>Get expert help</Text></Pressable>
        </Section>
      )}
      {tab === 'documents' && <DocumentList upload={upload} openAudit={openAudit} grid documents={documents} />}
      {tab === 'requirements' && <RequirementList documents={documents} />}
      {tab === 'chat' && <MiniChat openBooking={openBooking} />}
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
  destination, setDestination, travelFrom, setTravelFrom, creating, createError, back, next,
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
}) {
  const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const travelFromValid = !travelFrom.trim() || ISO_DATE_RE.test(travelFrom.trim());
  const selectedVt = VISA_TYPES.find(v => v.id === visaTypeId) ?? VISA_TYPES[0];

  if (step === 0) {
    return (
      <View>
        <BackButton label="Applications" onPress={back} />
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
        <Pressable style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View>
        <BackButton label="Applications" onPress={back} />
        <Text style={styles.eyebrow}>New application · Step 2 of 4</Text>
        <Text style={styles.title}>Your nationality</Text>
        <Text style={styles.bodyText}>Enter the country that issued your primary passport.</Text>
        <View style={styles.stepCard}>
          <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Passport country</Text>
          <TextInput
            value={nationality}
            onChangeText={setNationality}
            placeholder="e.g. India, Philippines, Pakistan"
            style={styles.searchInput}
            autoCapitalize="words"
          />
          <Text style={[styles.rowMeta, { marginBottom: 6, marginTop: 12 }]}>Country of residence</Text>
          <TextInput
            value={residence}
            onChangeText={setResidence}
            placeholder="e.g. United Arab Emirates, UK"
            style={styles.searchInput}
            autoCapitalize="words"
          />
        </View>
        <ProgressDots count={4} active={step} />
        <Pressable style={[styles.primaryButton, (!nationality.trim() || !residence.trim()) && styles.disabledButton]}
          onPress={nationality.trim() && residence.trim() ? next : undefined}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 2) {
    const defaultDest = selectedVt.dest;
    return (
      <View>
        <BackButton label="Applications" onPress={back} />
        <Text style={styles.eyebrow}>New application · Step 3 of 4</Text>
        <Text style={styles.title}>Destination</Text>
        <Text style={styles.bodyText}>Confirm the destination country for your {selectedVt.label} visa.</Text>
        <View style={styles.stepCard}>
          <Text style={[styles.rowMeta, { marginBottom: 6 }]}>Destination country</Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder={defaultDest}
            style={styles.searchInput}
            autoCapitalize="words"
          />
        </View>
        <ProgressDots count={4} active={step} />
        <Pressable style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </Pressable>
      </View>
    );
  }

  // step === 3 — travel dates + confirm
  return (
    <View>
      <BackButton label="Applications" onPress={back} />
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
      <Pressable style={[styles.primaryButton, (creating || !travelFromValid) && styles.disabledButton]} onPress={(creating || !travelFromValid) ? undefined : next}>
        {creating
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryButtonText}>Create application</Text>
        }
      </Pressable>
    </View>
  );
}

function DocumentsScreen({ openUpload, openAudit, documents, onMount }: { openUpload: () => void; openAudit: (docId: string) => void; documents: ApiDocument[]; onMount?: () => void }) {
  useEffect(() => { onMount?.(); }, []);
  return (
    <View>
      <Text style={styles.eyebrow}>Documents</Text>
      <Text style={styles.title}>Audit-ready vault</Text>
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

function UploadScreen({ state, back, next, onCamera }: { state: 'select' | 'uploading' | 'auditing' | 'done'; back: () => void; next: () => void; onCamera?: () => void }) {
  const copy: Record<typeof state, [string, string]> = {
    select:    ['Select document',    'Choose how to add your document below.'],
    uploading: ['Uploading securely', 'Encrypting file and preparing OCR. Retention timer starts now.'],
    auditing:  ['AI audit in progress','Only validated findings are shown. Raw OCR is never exposed in UI.'],
    done:      ['Audit complete',     'Your report is ready to view.'],
  };
  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
      if (!result.canceled && result.assets?.[0]) next();
    } catch { next(); }
  };
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: false });
      if (!result.canceled && result.assets?.[0]) next();
    } catch { next(); }
  };
  const sources: [IoniconName, string, string, (() => void) | undefined][] = [
    ['camera-outline',   'Take photo',         'Capture with your camera',       onCamera],
    ['images-outline',   'Choose from gallery', 'Pick an existing image',         pickFromGallery],
    ['document-outline', 'Browse files',        'PDF, JPG, PNG, HEIC',            pickDocument],
    ['logo-google',      'Import from Drive',   'Select from Google Drive',       pickDocument],
  ];
  return (
    <View>
      <BackButton label="Documents" onPress={back} />
      <Text style={styles.eyebrow}>Document flow</Text>
      <Text style={styles.title}>{copy[state][0]}</Text>
      <Text style={styles.bodyText}>{copy[state][1]}</Text>
      {state === 'select' && (
        <Section title="Add from">
          {sources.map(([icon, label, sub, onPress]) => (
            <Pressable key={label} style={styles.taskRow} onPress={onPress ?? next}>
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
      {state !== 'select' && (
        <View style={styles.timelineCard}>
          {['File received and encrypted', 'OCR text extracted', 'Identity fields compared', 'Visa rules checked', 'Validated findings published'].map((item, index) => {
            const done = index < 2 || state === 'auditing' || state === 'done';
            return <TaskRow key={item} title={item} meta={done ? 'Complete' : 'Pending'} done={done} />;
          })}
        </View>
      )}
      {state !== 'select' && (
        <Pressable style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonText}>{state === 'uploading' ? 'Start audit' : 'View report'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const AUDIT_TIMELINE = ['File received and encrypted', 'OCR text extracted', 'Identity fields compared', 'Visa rules checked', 'Validated findings published'];

function AuditReportScreen({ docId, back, openRequirements, fetchedAudit, onMount }: { docId: string; back: () => void; openRequirements: () => void; fetchedAudit?: any; onMount?: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => { onMount?.(); }, []);

  const audit = fetchedAudit ?? {};
  const score: number = audit.score ?? 0;
  const status: string = audit.status ?? 'Pending';
  const title: string = audit.documentType ?? docId;
  const generatedAt: string = audit.generatedAt ? new Date(audit.generatedAt).toLocaleString() : 'Pending';
  const findings: any[] = audit.findings ?? [];
  const severityColor = { pass: colors.green500, info: colors.royal600, warn: colors.gold500, redflag: '#DC2626' } as Record<string, string>;
  const criticalCount = findings.filter(f => f.severity === 'redflag' || f.severity === 'warn').length;

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await unlockReport(docId);
      setUnlocked(true);
    } catch (err) {
      Alert.alert('Payment failed', 'Unable to process payment. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      const html = `<html><body style="font-family:sans-serif;padding:24px"><h1>VisaIQ Audit Report</h1><h2>${title}</h2><p><strong>Score:</strong> ${score}/100 — ${status}</p><p><em>Generated: ${generatedAt}</em></p><hr/>${findings.map(f => `<p><strong>[${f.severity}]</strong> ${f.title}<br/>${f.description}<br/><em>Confidence: ${f.confidence}%</em></p>`).join('')}</body></html>`;
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
        <View style={{ alignItems: 'center', padding: 40, gap: 14 }}>
          <ActivityIndicator size="large" color={colors.royal600} />
          <Text style={styles.rowMeta}>Loading audit report…</Text>
        </View>
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
        <Text style={styles.reportText}>Generated {generatedAt} · {AUDIT_TIMELINE.length} audit stages completed</Text>
      </LinearGradient>

      <Section title="AI audit stages">
        {AUDIT_TIMELINE.map((step) => (
          <View key={step} style={[styles.taskRow, { gap: 10 }]}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={13} color={colors.green500} />
            </View>
            <Text style={styles.rowTitle}>{step}</Text>
          </View>
        ))}
      </Section>

      {!unlocked ? (
        <View style={{ marginTop: 8 }}>
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', padding: 18, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Ionicons name="warning" size={22} color="#DC2626" />
              <View style={styles.flex}>
                <Text style={{ color: '#991B1B', fontWeight: '900', fontSize: 15 }}>{criticalCount > 0 ? `${criticalCount} issue${criticalCount !== 1 ? 's' : ''} detected` : 'Report ready'}</Text>
                <Text style={{ color: '#B91C1C', fontSize: 12, marginTop: 2 }}>Unlock to see full findings and fix instructions</Text>
              </View>
            </View>
            {findings.slice(0, 3).map((f: any, i: number) => (
              <View key={f.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#FECACA', opacity: i === 0 ? 1 : 0.4 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: i === 0 ? `${severityColor[f.severity] ?? '#DC2626'}20` : '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  {i === 0
                    ? <Ionicons name={f.severity === 'pass' ? 'checkmark-circle' : 'alert-circle'} size={16} color={severityColor[f.severity] ?? '#DC2626'} />
                    : <Ionicons name="lock-closed" size={14} color="#DC2626" />}
                </View>
                <View style={styles.flex}>
                  {i === 0 ? <Text style={styles.rowTitle}>{f.title}</Text> : <View style={{ height: 12, width: '75%', backgroundColor: '#FECACA', borderRadius: 4, marginBottom: 4 }} />}
                  {i === 0 ? <Text style={[styles.rowMeta, { color: '#B91C1C' }]}>{f.description}</Text> : <View style={{ height: 10, width: '50%', backgroundColor: '#FEE2E2', borderRadius: 4 }} />}
                </View>
              </View>
            ))}
          </View>
          <LinearGradient colors={['#0B1F4B', '#1A56DB']} style={{ borderRadius: 16, padding: 20, gap: 14, alignItems: 'center' }}>
            <Ionicons name="lock-open-outline" size={32} color="#FCD34D" />
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', textAlign: 'center' }}>Unlock Full Red-Flag Report</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>See all {findings.length} findings with exact page locations, field names, and step-by-step fix instructions.</Text>
            <Pressable style={{ width: '100%', backgroundColor: '#FCD34D', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={handleUnlock}>
              {unlocking ? <ActivityIndicator color={colors.navy900} /> : <Text style={{ color: colors.navy900, fontWeight: '900', fontSize: 16 }}>Unlock for $4.99</Text>}
            </Pressable>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textAlign: 'center' }}>One-time payment · No subscription · Secure via Stripe</Text>
          </LinearGradient>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.green100, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green500} />
            <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 13 }}>Report unlocked — full findings available</Text>
          </View>
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
        </View>
      )}
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

const FEE_RATES: Record<string, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: '$',   rate: 1.00,  label: 'US Dollar'      },
  AED: { symbol: 'AED ',rate: 3.67,  label: 'UAE Dirham'     },
  INR: { symbol: '₹',   rate: 83.5,  label: 'Indian Rupee'   },
  GBP: { symbol: '£',   rate: 0.79,  label: 'British Pound'  },
  EUR: { symbol: '€',   rate: 0.92,  label: 'Euro'           },
};
const FEE_EUR = 80; // France Schengen base fee

function RequirementsScreen({ back, openConsultants }: { back: () => void; openConsultants: () => void }) {
  const [currency, setCurrency] = useState<keyof typeof FEE_RATES>('AED');
  const [reqData, setReqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { symbol, rate } = FEE_RATES[currency];

  useEffect(() => {
    import('./src/api').then(({ fetchRequirements }) =>
      fetchRequirements().then(data => { setReqData(data); setLoading(false); }).catch(() => setLoading(false))
    );
  }, []);

  const fees: string = reqData?.fees ?? 'EUR 80 + VFS service fee';
  const processingTime: string = reqData?.processingTime ?? '10–15 business days';
  const freshness = reqData?.freshness;
  const feeEur = parseInt(fees.match(/\d+/)?.[0] ?? '80', 10);
  const localFee = Math.round(feeEur * (rate / FEE_RATES.EUR.rate));
  const reqList: any[] = reqData?.requirements ?? [];
  const sourceUrls: any[] = reqData?.sourceUrls ?? [];

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Official-source intelligence</Text>
      <Text style={styles.title}>Visa requirements</Text>
      {freshness && (
        <View style={[styles.notice, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
          <Ionicons name="time-outline" size={14} color="#92400E" />
          <Text style={[styles.noticeText, { flex: 1 }]}>Fetched {new Date(freshness.fetchedAt).toLocaleDateString()} · Expires {new Date(freshness.expiresAt).toLocaleDateString()} · {freshness.ageHours}h old</Text>
        </View>
      )}
      <Section title="Visa fee">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
          <View>
            <Text style={styles.rowTitle}>Visa fee</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.slate900 }}>€{feeEur}</Text>
            <Text style={styles.rowMeta}>≈ {symbol}{localFee} {currency} (approx)</Text>
          </View>
          <View style={{ gap: 6 }}>
            {(Object.keys(FEE_RATES) as Array<keyof typeof FEE_RATES>).filter(c => c !== 'EUR').map(c => (
              <Pressable key={c} onPress={() => setCurrency(c)}
                style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: currency === c ? colors.royal600 : colors.slate100 }}>
                <Text style={{ color: currency === c ? '#fff' : colors.slate700, fontWeight: '700', fontSize: 12 }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.rowMeta}>Processing: {processingTime} · Embassy fee is non-refundable.</Text>
      </Section>
      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>
      ) : (
        <Section title="Requirements checklist">
          {reqList.map((item: any) => (
            <TaskRow key={item.id} title={item.title} meta={item.description} done={item.satisfied} />
          ))}
          {reqList.length === 0 && <Text style={styles.rowMeta}>No requirements data available.</Text>}
        </Section>
      )}
      {sourceUrls.length > 0 && (
        <Section title="Sources">
          {sourceUrls.map((source: any) => (
            <Pressable key={source.id} style={styles.taskRow} onPress={() => Linking.openURL(source.url)}>
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
        <Text style={styles.disclaimerText}>Requirements sourced from official embassy sites and refreshed every 24h. Always verify before applying.</Text>
      </View>
      <Pressable style={styles.goldButton} onPress={openConsultants}><Text style={styles.primaryButtonText}>Ask a verified consultant</Text></Pressable>
    </View>
  );
}

function RequirementList({ documents }: { documents: ApiDocument[] }) {
  const docMap = new Map(documents.map(d => [d.type?.toLowerCase(), d]));
  const defaultReqs = [
    { id: 'passport', title: 'Valid passport', description: 'Issued within last 10 years, valid 3+ months after departure.', satisfied: !!docMap.get('passport') },
    { id: 'bank', title: 'Bank statements (3 months)', description: 'Recent statements showing sufficient daily funds.', satisfied: !!docMap.get('finance') },
    { id: 'insurance', title: 'Travel medical insurance', description: '€30,000+ coverage across destination country.', satisfied: !!docMap.get('insurance') },
    { id: 'itinerary', title: 'Flight & hotel reservation', description: 'Dates must match insurance and bank statement.', satisfied: !!docMap.get('itinerary') },
    { id: 'photo', title: 'Biometric photo', description: '35mm × 45mm, white background, taken within last 6 months.', satisfied: !!docMap.get('photo') },
    { id: 'employment', title: 'Employment or student proof', description: 'Letter from employer or university confirming status.', satisfied: !!docMap.get('employment') },
  ];
  return (
    <Section title="Checklist">
      {defaultReqs.map((item) => (
        <TaskRow key={item.id} title={item.title} meta={item.description} done={item.satisfied} />
      ))}
    </Section>
  );
}

function ChatScreen({ message, setMessage, sessionMessages, isTyping, sendMessage, openConsultants, appList }: {
  message: string;
  setMessage: (value: string) => void;
  sessionMessages: Array<{ id: string; role: 'user' | 'ai'; text: string }>;
  isTyping: boolean;
  sendMessage: () => void;
  openConsultants: () => void;
  appList: ReturnType<typeof normalizeApp>[];
}) {
  const activeApp = appList[0] ?? null;
  return (
    <View style={styles.chatScreen}>
      <Text style={styles.eyebrow}>VisaIQ Assistant</Text>
      <Text style={styles.title}>Visa-scoped chat</Text>
      {activeApp && (
        <View style={styles.contextRow}>
          <Badge tone="neutral" label={activeApp.destinationCountry} />
          <Badge tone="neutral" label={`${activeApp.documentsUploaded}/${activeApp.documentsRequired} docs`} />
          {activeApp.issuesCount > 0 && <Badge tone="warn" label={`${activeApp.issuesCount} issues`} />}
        </View>
      )}
      {sessionMessages.length === 0 && (
        <View style={styles.aiBubble}>
          <Text style={styles.bodyText}>{activeApp ? `I can see your ${activeApp.destinationCountry} ${activeApp.visaType} application (score ${activeApp.readinessScore}). How can I help?` : "Hello! I'm your VisaIQ assistant. Ask me anything about visa requirements, documents, or your application."}</Text>
        </View>
      )}
      {sessionMessages.map((item) => (
        <View key={item.id} style={item.role === 'user' ? styles.userBubble : styles.aiBubble}>
          <Text style={item.role === 'user' ? styles.userText : styles.bodyText}>{item.text}</Text>
        </View>
      ))}
      {isTyping && (
        <View style={[styles.aiBubble, { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 12 }]}>
          {[0,1,2].map(i => (
            <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.slate300 }} />
          ))}
        </View>
      )}
      <View style={styles.escalationCard}>
        <Text style={styles.rowTitle}>Complexity detected</Text>
        <Text style={styles.rowMeta}>Your missing insurance and itinerary affect submission risk. Share only selected context with a consultant.</Text>
        <Pressable style={styles.goldButton} onPress={openConsultants}><Text style={styles.primaryButtonText}>Find consultant</Text></Pressable>
      </View>
      {/* Non-dismissible disclaimer banner — always visible */}
      <View style={[styles.disclaimer, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#92400E" />
        <Text style={[styles.disclaimerText, { flex: 1, textAlign: 'left' }]}>AI guidance — not legal advice. Always verify with the official embassy or consulate before applying.</Text>
      </View>
      <View style={styles.composer}>
        <TextInput value={message} onChangeText={setMessage} placeholder="Ask about your application" style={styles.input} returnKeyType="send" onSubmitEditing={sendMessage} />
        <Pressable style={styles.send} onPress={sendMessage}>
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function MiniChat({ openBooking }: { openBooking: () => void }) {
  return (
    <Section title="Application chat">
      <Finding title="AI summary" meta="Insurance and itinerary are the two current blockers." />
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
            <Text style={{ fontSize: 10, color: colors.green500, fontWeight: '700' }}>{c.successRate} success</Text>
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
    ['shield-checkmark',   'Success rate', c.successRate],
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
    </View>
  );
}

function BookingScreen({ consultantId, consultantList, sessionOpts, onMount, selected, back, select, pickSlot, continueToConsent }: {
  consultantId: string;
  consultantList: ReturnType<typeof normalizeConsultant>[];
  sessionOpts: ReturnType<typeof normalizeSessionOption>[];
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
      {sessionOpts.length === 0 && (
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

function ConsentScreen({ consultantId, optionId, back, confirm }: {
  consultantId: string;
  optionId: string;
  back: () => void;
  confirm: (consultantId: string, optionId: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [consent, setConsent] = useState([true, true, true, false]);

  const handleConfirm = async () => {
    setConfirming(true);
    await confirm(consultantId, optionId);
    setConfirming(false);
  };

  return (
    <View>
      <BackButton label="Booking" onPress={back} />
      <Text style={styles.eyebrow}>Consent-controlled sharing</Text>
      <Text style={styles.title}>Choose what to share</Text>
      {['Contact details', 'Requirements snapshot', 'Audit summary', 'Selected chat messages'].map((item, index) => (
        <Pressable key={item} style={styles.consentRow} onPress={() => setConsent(prev => prev.map((v, i) => i === index ? !v : v))}>
          <View style={[styles.checkbox, consent[index] && styles.checkboxOn]}>
            {consent[index] && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{item}</Text>
            <Text style={styles.rowMeta}>{consent[index] ? 'Selected for this booking' : 'Off — tap to include'}</Text>
          </View>
        </Pressable>
      ))}
      <View style={styles.notice}><Text style={styles.noticeText}>No original documents are shared unless selected. Access can be revoked from Profile.</Text></View>
      <Pressable style={[styles.primaryButton, confirming && styles.disabledButton]} onPress={confirming ? undefined : handleConfirm}>
        {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirm booking</Text>}
      </Pressable>
    </View>
  );
}

function ConfirmationScreen({ consultantId, consultantList, booking, done, score, openPartners }: {
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
          <Pressable style={styles.taskRow} onPress={() => Linking.openURL(booking.calendlyUrl)}>
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
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Exclusive partner offers for VisaIQ members</Text>
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

      <Pressable style={styles.primaryButton} onPress={done}><Text style={styles.primaryButtonText}>Back to dashboard</Text></Pressable>
    </View>
  );
}

function ProfileScreen({
  authUser, openSettings, openConsultants, openConsole, openHr, openEmployee, openAdmin,
  openCalculator, openBankBalance, openEmbassy, openTimeline, openComparison,
  openVisaWaiver, openRejectionAnalyzer, openProfileHub, openProTier, openPartners,
}: {
  authUser: AuthUser | null;
  openSettings: () => void; openConsultants: () => void; openConsole: () => void;
  openHr: () => void; openEmployee: () => void; openAdmin: () => void;
  openCalculator: () => void; openBankBalance: () => void; openEmbassy: () => void;
  openTimeline: () => void; openComparison: () => void;
  openVisaWaiver: () => void; openRejectionAnalyzer: () => void; openProfileHub: () => void; openProTier: () => void;
  openPartners: () => void;
}) {
  const tools: [IoniconName, string, () => void, string][] = [
    ['calculator-outline',   'Visa Score Calculator',   openCalculator,  colors.royal600],
    ['wallet-outline',       'Bank Balance Estimator',  openBankBalance, colors.green500],
    ['business-outline',     'Embassy Finder',          openEmbassy,     colors.navy900],
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
        <TaskRow title="Consultant access grants" meta="View and revoke consultant access from your profile." />
        <TaskRow title="Fingerprint sign-in" meta="Enable in Settings → Security." />
      </Section>
      <OfflineCacheCard />
      <Pressable style={styles.primaryButton} onPress={openSettings}><Text style={styles.primaryButtonText}>Settings</Text></Pressable>
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
    </View>
  );
}

import { BASE_URL, getToken } from './src/api';

function useApiData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${BASE_URL}${path}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [path]);
  return { data, loading };
}

function ConsultantConsoleScreen({ back }: { back: () => void }) {
  const { data, loading } = useApiData<any>('/consultant-console');
  const crm = data?.crm ?? [];
  const queue = data?.queue ?? [];
  const conversations = data?.conversations ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Consultant console</Text>
      <Text style={styles.title}>Queue and CRM</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
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
      {queue.length > 0 && (
        <Section title="Today's queue">
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
      {conversations.length > 0 && (
        <Section title="Conversations">
          {conversations.map((item: any) => (
            <View key={item.id} style={styles.taskRow}>
              <View style={[styles.consultantAvatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.purple100 }]}>
                <Text style={[styles.consultantAvatarText, { fontSize: 13 }]}>{item.applicant.split(' ').map((n: string) => n[0]).join('')}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{item.applicant}</Text>
                <Text style={styles.rowMeta}>{item.lastMessage}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}
    </View>
  );
}

function HrPortalScreen({ back }: { back: () => void }) {
  const { data, loading } = useApiData<any>('/hr');
  const reports = data?.reports ?? [];
  const teams = data?.teams ?? [];
  const bulkUploads = data?.bulkUploads ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>B2B mobility</Text>
      <Text style={styles.title}>HR dashboard</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
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
  const { data, loading } = useApiData<any>('/employee');
  const profile = data?.profile ?? {};
  const tasks = data?.tasks ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Employee portal</Text>
      <Text style={styles.title}>{authUser?.name ?? profile.name ?? 'Employee'}</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
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
  const { data, loading } = useApiData<any>('/admin/overview');
  const metrics = data?.metrics ?? [];
  const aiMonitoring = data?.aiMonitoring ?? [];
  const requirementsDb = data?.requirementsDb ?? [];
  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Platform admin</Text>
      <Text style={styles.title}>Operations overview</Text>
      {loading && <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={colors.royal600} /></View>}
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

function NotificationsScreen({ back, notifications }: { back: () => void; notifications: ApiNotification[] }) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const filtered = activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter);

  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Notifications</Text>
      <Text style={styles.title}>Recent updates</Text>
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
            <View key={n.id} style={[styles.taskRow, { gap: 12, opacity: n.read ? 0.6 : 1 }]}>
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
            </View>
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
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>AI Answer</Text>
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
  const [changingPassword, setChangingPassword] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'code-sent'>('idle');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hasHw, isEnrolled]) => setBiometricAvailable(hasHw && isEnrolled))
      .catch(() => setBiometricAvailable(false));
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
    if (prefs.biometricEnabled) {
      updatePref('biometricEnabled', false);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm your identity to enable biometric unlock',
      fallbackLabel: 'Use passcode',
    });
    if (result.success) updatePref('biometricEnabled', true);
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

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
    ]);
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
          title="Biometric unlock"
          meta={biometricAvailable === false ? 'Not available on this device' : prefs.biometricEnabled ? 'Enabled' : 'Tap to enable'}
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
              {twoFactorBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify</Text>}
            </Pressable>
          </View>
        )}
      </Section>

      <Section title="Privacy">
        <TaskRow title="Delete my data" meta="Creates a compliance request for admin queue." />
        <TaskRow title="Export my data" meta="Creates a downloadable account package when backend export service is enabled." />
      </Section>

      <Section title="App">
        <LinkRow
          title="Clear offline cache"
          meta={clearingCache ? 'Clearing…' : 'Frees up space used for offline browsing.'}
          onPress={handleClearCache}
          disabled={clearingCache}
        />
        <Finding title="App version" meta="0.1.0" />
      </Section>

      <Section title="About">
        <LinkRow title="Contact support" meta="support@visaiq.app" onPress={() => Linking.openURL('mailto:support@visaiq.app')} />
        <Finding title="Terms & privacy" meta="visaiq.app/legal" />
      </Section>

      <OfflineCacheCard />

      <Pressable
        onPress={handleSignOut}
        style={{ marginTop: 16, minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#DC2626', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#DC2626', fontWeight: '900' }}>Sign out</Text>
      </Pressable>
    </View>
  );
}

function BottomNav({ activeTab, setTab, unreadCount = 0 }: { activeTab: TabId; setTab: (tab: TabId) => void; unreadCount?: number }) {
  const chatUnread = unreadCount;
  return (
    <View style={styles.bottomNav}>
      {tabs.map((item) => {
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
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
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

function ScoreRing({ value, large, subLabel }: { value: number; large?: boolean; subLabel?: string }) {
  const size = large ? 100 : 54;
  const strokeWidth = large ? 8 : 5;
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
          fontSize={large ? 24 : 13} fontWeight="900"
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
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>VisaIQ Pro</Text>
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
      <LinearGradient colors={['#F59E0B','#D97706']} style={[styles.primaryButton, { marginTop: 16 }]}>
        <Text style={styles.primaryButtonText}>Upgrade to Pro — $19/month</Text>
      </LinearGradient>
      <Text style={[styles.rowMeta, { textAlign: 'center', marginTop: 10 }]}>Cancel anytime · 7-day free trial</Text>
    </View>
  );
}

// ─── FEAT D: Ecosystem Partners ──────────────────────────────────────────────
const MOBILE_PARTNER_CATEGORIES = [
  {
    id: 'flights', label: 'Flights', icon: 'airplane-outline' as IoniconName, color: '#1A56DB',
    partners: [
      { name: 'Emirates',  tagline: 'World-class connectivity from Dubai', discount: '8% off bookings',          url: 'https://www.emirates.com' },
      { name: 'Air India', tagline: 'Direct routes India ↔ Schengen',     discount: '5% off + priority check-in',url: 'https://www.airindia.com' },
      { name: 'flydubai',  tagline: 'Budget-friendly regional routes',     discount: 'AED 50 off first booking',  url: 'https://www.flydubai.com' },
    ],
  },
  {
    id: 'housing', label: 'Housing', icon: 'home-outline' as IoniconName, color: '#7C3AED',
    partners: [
      { name: 'Airbnb',       tagline: 'Verified stays with host ratings',     discount: '10% off first stay',         url: 'https://www.airbnb.com' },
      { name: 'Booking.com',  tagline: 'Cancellation-friendly hotel bookings', discount: 'Genius Level 2 unlocked',     url: 'https://www.booking.com' },
    ],
  },
  {
    id: 'corporate', label: 'Corporate', icon: 'business-outline' as IoniconName, color: '#059669',
    partners: [
      { name: 'Deel',       tagline: 'International payroll and HR',   discount: '1 month free on annual plan', url: 'https://www.deel.com' },
      { name: 'Remote.com', tagline: 'Employer of record worldwide',   discount: 'Waived onboarding fee',       url: 'https://remote.com' },
    ],
  },
  {
    id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline' as IoniconName, color: '#DC2626',
    partners: [
      { name: 'AXA Travel',      tagline: 'Schengen-compliant medical coverage',        discount: 'AED 80 single-trip policy', url: 'https://www.axa-travel-insurance.com' },
      { name: 'RSA Insurance',   tagline: 'UAE-issued travel insurance certificates',   discount: '12% off annual plan',       url: 'https://www.rsauae.com' },
      { name: 'Oman Insurance',  tagline: 'Instant certificate for embassy submission', discount: 'Same-day issuance',         url: 'https://www.omaninsurance.ae' },
    ],
  },
];

function EcosystemPartnersScreen({ back, score }: { back: () => void; score?: number }) {
  const [activeCat, setActiveCat] = useState('flights');
  const category = MOBILE_PARTNER_CATEGORIES.find(c => c.id === activeCat) ?? MOBILE_PARTNER_CATEGORIES[0];

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
          {MOBILE_PARTNER_CATEGORIES.map(cat => {
            const active = cat.id === activeCat;
            return (
              <Pressable key={cat.id} onPress={() => setActiveCat(cat.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 2, borderColor: active ? cat.color : '#E2E8F0', backgroundColor: active ? `${cat.color}12` : '#fff' }}>
                <Ionicons name={cat.icon} size={15} color={active ? cat.color : '#94A3B8'} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? cat.color : '#64748B' }}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {/* Partner cards */}
      <Section title={`${category.label} partners`}>
        {category.partners.map(partner => (
          <View key={partner.name} style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 16, marginBottom: 10, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${category.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={category.icon} size={20} color={category.color} />
              </View>
              <View style={styles.flex}>
                <Text style={{ fontWeight: '900', fontSize: 15, color: '#0F172A' }}>{partner.name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{partner.tagline}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: `${category.color}12`, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="gift-outline" size={14} color={category.color} />
              <Text style={{ color: category.color, fontWeight: '700', fontSize: 13 }}>{partner.discount}</Text>
            </View>
            <Pressable style={{ borderRadius: 10, borderWidth: 2, borderColor: category.color, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={() => Linking.openURL(partner.url)}>
              <Ionicons name="open-outline" size={14} color={category.color} />
              <Text style={{ color: category.color, fontWeight: '700', fontSize: 13 }}>Visit {partner.name}</Text>
            </Pressable>
          </View>
        ))}
      </Section>
      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginTop: 4 }}>
        <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18 }}><Text style={{ color: '#0F172A', fontWeight: '700' }}>Transparency note: </Text>VisaIQ earns a referral commission (3–8%) when you use partner links. This funds the free tier and keeps the app ad-free.</Text>
      </View>
    </View>
  );
}

// ─── Calendar Picker ─────────────────────────────────────────────────────────
const SLOTS_AM = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM'];
const SLOTS_PM = ['2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
function CalendarPickerScreen({ consultantId, back, confirm }: { consultantId: string; back: () => void; confirm: () => void }) {
  const [selectedDay, setSelectedDay] = useState(8);
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const consultantLabel = consultantId || 'Consultant';
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const today = new Date().getDate();

  useEffect(() => {
    if (!consultantId) return;
    setLoadingSlots(true);
    fetchBookingSlots(consultantId)
      .then(d => setTakenSlots(d.takenSlots ?? []))
      .catch(() => setTakenSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [consultantId]);

  const Slot = ({ t }: { t: string }) => {
    const taken = takenSlots.includes(t);
    const sel = selectedSlot === t && !taken;
    return (
      <Pressable
        onPress={() => !taken && setSelectedSlot(t)}
        style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
          backgroundColor: sel ? colors.royal600 : taken ? colors.slate100 : colors.white,
          borderWidth: 1, borderColor: sel ? colors.royal600 : colors.slate200 }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: sel ? '#fff' : taken ? colors.slate300 : colors.slate900, textDecorationLine: taken ? 'line-through' : 'none' }}>{t}</Text>
      </Pressable>
    );
  };

  return (
    <View>
      <BackButton label="Booking" onPress={back} />
      <Text style={styles.eyebrow}>Schedule session</Text>
      <Text style={styles.title}>Pick a time slot</Text>
      <Text style={[styles.rowMeta, { marginBottom: 14 }]}>With {consultantLabel} · All times in GST (your local timezone)</Text>
      <Section title={new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
            <Text key={d} style={{ width: '13.5%', textAlign: 'center', color: colors.slate300, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>{d}</Text>
          ))}
          {days.map(d => {
            const past = d < today;
            const sel = d === selectedDay;
            const isToday = d === today;
            return (
              <Pressable key={d} onPress={() => !past && setSelectedDay(d)}
                style={{ width: '13.5%', aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: sel ? colors.royal600 : 'transparent' }}>
                <Text style={{ fontSize: 13, fontWeight: sel || isToday ? '900' : '500',
                  color: sel ? '#fff' : past ? colors.slate300 : isToday ? colors.royal600 : colors.slate800 }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>
      {loadingSlots ? (
        <ActivityIndicator style={{ marginVertical: 16 }} color={colors.royal600} />
      ) : (
        <>
          <Section title="Morning slots">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SLOTS_AM.map(t => <Slot key={t} t={t} />)}
            </View>
          </Section>
          <Section title="Afternoon slots">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SLOTS_PM.map(t => <Slot key={t} t={t} />)}
            </View>
          </Section>
        </>
      )}
      <View style={[styles.notice, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <Ionicons name="checkmark-circle" size={16} color={colors.gold500} />
        <Text style={[styles.noticeText, { flex: 1 }]}>Selected: Jul {selectedDay} · {selectedSlot} GST</Text>
      </View>
      <Pressable style={styles.primaryButton} onPress={confirm}>
        <Text style={styles.primaryButtonText}>Confirm slot → Consent</Text>
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

function VisaCalculatorScreen({ back }: { back: () => void }) {
  const [destination, setDestination] = useState(0);
  const [visaType, setVisaType] = useState(0);
  const [finance, setFinance] = useState(3);
  const [travel, setTravel] = useState(3);
  const [employment, setEmployment] = useState(3);
  const [ties, setTies] = useState(3);
  const score = Math.round((finance * 0.30 + travel * 0.25 + employment * 0.25 + ties * 0.20) * 20);

  const getReco = () => {
    if (finance < 3) return 'Strengthen bank statements with 3+ months of consistent income.';
    if (travel < 3) return 'Prior approved visas significantly boost approval odds.';
    if (employment < 3) return 'A strong employment letter with salary details helps credibility.';
    return 'Your profile looks solid. Upload all required documents for a full audit.';
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

  useEffect(() => {
    fetchExchangeRates()
      .then(d => { setRates(d.rates); })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  const data = BANK_DATA[BANK_COUNTRIES[country]];
  // data.daily is in the destination currency (EUR, GBP, etc.), not USD
  const totalLocal = data.daily * days * travelers;
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
            : <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4 }}>≈ ${totalUSD.toLocaleString()} USD</Text>
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

function EmbassyFinderScreen({ back }: { back: () => void }) {
  const [selected, setSelected] = useState(0);
  const emb = EMBASSIES[EMBASSY_COUNTRIES[selected]];
  const rows: [IoniconName, string, string, (() => void) | undefined][] = [
    ['location-outline', 'Address', emb.address, undefined],
    ['call-outline', 'Phone', emb.phone, () => Linking.openURL(`tel:${emb.phone}`)],
    ['time-outline', 'Consular hours', emb.hours, undefined],
    ['globe-outline', 'Website', emb.website, () => Linking.openURL(`https://${emb.website}`)],
  ];
  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Consulate directory</Text>
      <Text style={styles.title}>Embassy Finder</Text>
      <Section title="Select destination country">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {EMBASSY_COUNTRIES.map((c, i) => (
              <Pressable key={c} onPress={() => setSelected(i)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selected === i ? colors.navy900 : colors.slate100 }}>
                <Text style={{ color: selected === i ? '#fff' : colors.slate700, fontWeight: '700', fontSize: 13 }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Section>
      <LinearGradient colors={['#0B1F4B','#1547C0']} style={[styles.reportHero, { marginBottom: 16 }]}>
        <Ionicons name="business-outline" size={36} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>{emb.name}</Text>
      </LinearGradient>
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
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Verify hours and appointment requirements on the official embassy website before visiting.</Text>
      </View>
    </View>
  );
}

// ─── Timeline Tracker ─────────────────────────────────────────────────────────
const TIMELINE_STAGE_LABELS = [
  'Documents collected',
  'AI audit complete',
  'Requirements verified',
  'Insurance uploaded',
  'Appointment booked',
  'Application submitted',
  'Decision expected',
];

function buildTimelineStages(intendedFrom?: string) {
  const base = intendedFrom ? new Date(intendedFrom) : new Date();
  const offsets = [-42, -35, -28, -21, -14, -7, 0];
  return TIMELINE_STAGE_LABELS.map((label, i) => {
    const d = new Date(base.getTime() + offsets[i] * 24 * 60 * 60 * 1000);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const done = d < new Date();
    return { label, date, done };
  });
}

function TimelineTrackerScreen({ back, openUpload }: { back: () => void; openUpload: () => void }) {
  const stages = buildTimelineStages();
  const currentIdx = stages.findIndex(s => !s.done);
  return (
    <View>
      <BackButton label="Home" onPress={back} />
      <Text style={styles.eyebrow}>Application progress</Text>
      <Text style={styles.title}>Timeline Tracker</Text>
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
                <Text style={styles.rowMeta}>{stage.date}{isCurrent ? ' · Current step' : ''}</Text>
              </View>
            </View>
          );
        })}
      </Section>
      <Pressable style={styles.primaryButton} onPress={openUpload}>
        <Text style={styles.primaryButtonText}>Upload insurance to advance</Text>
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
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 2200, useNativeDriver: false }).start();
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ minHeight: 720, backgroundColor: colors.navy900, alignItems: 'center', justifyContent: 'center', margin: -18 }}>
      <StatusBar barStyle="light-content" />
      {/* Gradient IQ tile */}
      <LinearGradient colors={['#1A56DB', '#0EA5E9']} style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#0EA5E9', shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 }}>
        <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900' }}>IQ</Text>
      </LinearGradient>
      {/* Logo */}
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
        VISA<Text style={{ color: colors.teal500 }}>IQ</Text>
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 8, fontWeight: '500' }}>AI-Powered Visa Intelligence</Text>
      {/* Progress bar */}
      <View style={{ position: 'absolute', bottom: 48, left: 40, right: 40 }}>
        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', width: barWidth, backgroundColor: '#1A56DB', borderRadius: 2 }} />
        </View>
      </View>
    </View>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────────
function RegisterScreen({ back, onSuccess }: { back: () => void; onSuccess: (session: AuthSession) => void }) {
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
    <View style={styles.welcome}>
      <BackButton label="Sign in" onPress={back} />
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.bodyText}>Join VisaIQ to get AI-powered visa readiness, document audit and expert matching.</Text>
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
      <Pressable style={[styles.primaryButton, !canCreate && styles.disabledButton]} onPress={handleCreate}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create account</Text>}
      </Pressable>
    </View>
  );
}

// ─── Email Verification Screen ───────────────────────────────────────────────
function VerifyEmailScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(60);
  const [verified, setVerified] = useState(false);

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
          <View style={styles.stepCard}>
            <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="000000" style={[styles.searchInput, { textAlign: 'center', fontSize: 24, fontWeight: '900', letterSpacing: 8 }]} />
          </View>
          <Pressable style={[styles.primaryButton, code.length < 6 && styles.disabledButton]} onPress={code.length === 6 ? async () => {
            try {
              await verifyEmailOtp(email, code);
              setVerified(true);
            } catch {
              Alert.alert('Invalid code', 'The verification code is incorrect or expired. Please try again.');
            }
          } : undefined}>
            <Text style={styles.primaryButtonText}>Verify email</Text>
          </Pressable>
          <Pressable disabled={resendSeconds > 0} style={{ marginTop: 14 }}>
            <Text style={[styles.rowMeta, { textAlign: 'center', color: resendSeconds > 0 ? colors.slate300 : colors.royal600 }]}>
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─── Camera Scanner Screen ────────────────────────────────────────────────────
const SCAN_BOX = SCREEN_W - 64;

function CameraScreen({ docType, back, onCapture }: { docType: string; back: () => void; onCapture: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [facing] = useState<'front' | 'back'>('back');
  const [captured, setCaptured] = useState<string | null>(null);
  const [quality, setQuality] = useState<'checking' | 'good' | 'warn' | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      setCaptured(photo?.uri ?? null);
      setQuality('checking');
      setTimeout(() => setQuality('good'), 1200);
    } catch {
      setQuality('warn');
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fff" /></View>;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navy900, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.4)" />
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>Camera access needed</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22 }}>VisaIQ needs camera access to capture your documents. No images leave your device until you confirm upload.</Text>
        <Pressable style={[styles.primaryButton, { width: '100%' }]} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={back}><Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>Cancel</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      {/* Camera viewfinder */}
      {!captured ? (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash}>
          {/* Top bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: STATUSBAR_H + 16 }}>
            <Pressable onPress={back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Capture {docType}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>Align document within the frame</Text>
            </View>
            <Pressable onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={20} color={flash === 'on' ? '#F59E0B' : '#fff'} />
            </Pressable>
          </View>
          {/* Edge detection overlay */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: SCAN_BOX, height: SCAN_BOX * 0.7, position: 'relative' }}>
              {/* Corner guides */}
              {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([h,v], i) => (
                <View key={i} style={{ position: 'absolute', top: v < 0 ? 0 : undefined, bottom: v > 0 ? 0 : undefined, left: h < 0 ? 0 : undefined, right: h > 0 ? 0 : undefined, width: 24, height: 24, borderTopWidth: v < 0 ? 3 : 0, borderBottomWidth: v > 0 ? 3 : 0, borderLeftWidth: h < 0 ? 3 : 0, borderRightWidth: h > 0 ? 3 : 0, borderColor: '#0EA5E9' }} />
              ))}
              {/* Scan line animation hint */}
              <View style={{ position: 'absolute', left: 0, right: 0, top: '40%', height: 2, backgroundColor: 'rgba(14,165,233,0.7)' }} />
            </View>
          </View>
          {/* Capture button */}
          <View style={{ paddingBottom: 48, alignItems: 'center', gap: 16 }}>
            <Pressable onPress={capturePhoto} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' }} />
            </Pressable>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Tap to capture · Hold steady</Text>
          </View>
        </CameraView>
      ) : (
        // Preview captured image
        <View style={{ flex: 1 }}>
          <Image source={{ uri: captured }} style={{ flex: 1, resizeMode: 'contain', backgroundColor: '#000' }} />
          {/* Quality feedback */}
          <View style={{ position: 'absolute', top: 48, left: 0, right: 0, alignItems: 'center' }}>
            {quality === 'checking' && (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 20 }}>
                <ActivityIndicator size="small" color="#0EA5E9" />
                <Text style={{ color: '#fff', fontWeight: '700' }}>Checking quality…</Text>
              </View>
            )}
            {quality === 'good' && (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.9)', padding: 12, borderRadius: 20 }}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700' }}>Quality looks good!</Text>
              </View>
            )}
            {quality === 'warn' && (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.9)', padding: 12, borderRadius: 20 }}>
                <Ionicons name="warning-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700' }}>Retake — glare detected</Text>
              </View>
            )}
          </View>
          {/* Action buttons */}
          <View style={{ position: 'absolute', bottom: 40, left: 24, right: 24, flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => { setCaptured(null); setQuality(null); }} style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retake</Text>
            </Pressable>
            <Pressable onPress={onCapture} style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: quality === 'good' ? colors.green500 : colors.royal600, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Use this photo</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Live AI Analysis Screen ──────────────────────────────────────────────────
const AI_STAGES = [
  { label: 'Extracting text · OCR pass',         duration: '0.4s', done: true  },
  { label: 'Reading biographic fields',           duration: '0.6s', done: true  },
  { label: 'Validating passport format',          duration: '0.3s', done: true  },
  { label: 'Cross-checking with profile name',    duration: '…',    active: true },
  { label: 'Checking expiry against visa rules',  duration: '',     done: false  },
  { label: 'Generating validated findings report',duration: '',     done: false  },
];

function LiveAnalysisScreen({ docTitle, onDone }: { docTitle: string; onDone: () => void }) {
  const [score, setScore] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setScore(s => {
        const next = Math.min(s + 14, 85);
        if (next >= 85) { clearInterval(timer); setDone(true); setStageIdx(6); }
        return next;
      });
      setStageIdx(i => Math.min(i + 1, 5));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const stages = AI_STAGES.map((s, i) => ({
    ...s,
    done: i < stageIdx,
    active: i === stageIdx && !done,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy900 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: STATUSBAR_H + 12, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, color: '#fff', fontWeight: '900', fontSize: 16 }}>Live AI analysis</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(124,58,237,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED' }} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Real-time</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Document preview card */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 160, height: 210, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20 }}>
            <LinearGradient colors={['#1A56DB','#0EA5E9']} style={{ height: 48, padding: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 }}>REPUBLIC OF INDIA</Text>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 2 }}>PASSPORT</Text>
            </LinearGradient>
            <View style={{ flexDirection: 'row', gap: 8, padding: 10 }}>
              <View style={{ width: 36, height: 48, backgroundColor: colors.slate100, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-outline" size={20} color={colors.slate300} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {[60,80,50,70].map((w,i) => <View key={i} style={{ width: `${w}%`, height: 4, backgroundColor: colors.slate200, borderRadius: 2 }} />)}
              </View>
            </View>
            {/* Scan line */}
            <View style={{ position: 'absolute', left: 0, right: 0, top: '60%', height: 2, backgroundColor: 'rgba(14,165,233,0.8)', shadowColor: '#0EA5E9', shadowRadius: 8, shadowOpacity: 1 }} />
            {/* AI badge */}
            <View style={{ position: 'absolute', top: -10, right: -10, backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>AI</Text>
            </View>
          </View>
          {/* Live score */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Live readiness</Text>
            <Text style={{ color: done ? colors.green500 : colors.teal500, fontSize: 56, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{score}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/ 100</Text>
            {!done && <Text style={{ color: colors.teal500, fontSize: 11, fontWeight: '700', marginTop: 4 }}>↑ updating live · est 8s left</Text>}
          </View>
        </View>
        {/* Stage list */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, gap: 4 }}>
          {stages.map((stage, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: stage.done ? colors.green500 : stage.active ? 'transparent' : 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                {stage.done && <Ionicons name="checkmark" size={13} color="#fff" />}
                {stage.active && <ActivityIndicator size="small" color="#7C3AED" />}
              </View>
              <Text style={{ flex: 1, color: stage.done ? 'rgba(255,255,255,0.45)' : stage.active ? '#fff' : 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: stage.active ? '700' : '500' }}>
                {stage.label}{stage.active && '…'}
              </Text>
              {stage.duration && <Text style={{ color: stage.done ? colors.green500 : stage.active ? '#7C3AED' : 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{stage.duration}</Text>}
            </View>
          ))}
        </View>
        {done && (
          <>
            <View style={{ marginTop: 16, padding: 14, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
              <Text style={{ color: colors.green500, fontWeight: '900', marginBottom: 4 }}>Analysis complete</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 }}>Analysis complete. AI findings are ready in your audit report. Review each item and resolve any flagged issues to improve your readiness score.</Text>
            </View>
            <Pressable style={[styles.primaryButton, { marginTop: 14 }]} onPress={onDone}>
              <Text style={styles.primaryButtonText}>View full audit report</Text>
            </Pressable>
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

function ProfileHubScreen({ back, authUser }: { back: () => void; authUser: AuthUser | null }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile().then(r => setProfile(r.profile)).catch(() => {});
  }, []);

  function isDone(id: string): boolean {
    if (!profile) return false;
    switch (id) {
      case 'personal':   return !!(profile.personal?.firstName);
      case 'passport':   return !!(profile.passport?.passportNumber);
      case 'travel':     return !!(profile.travelHistory);
      case 'financials': return !!(profile.financials && profile.financials.statementsCount > 0);
      case 'employment': return !!(profile.employment?.employer);
      case 'contacts':   return !!(profile.contacts?.emergencyName);
      default: return false;
    }
  }

  async function handleSave(patch: Partial<Omit<UserProfile, 'uid' | 'updatedAt'>>) {
    try {
      const r = await updateProfile(patch);
      setProfile(r.profile);
    } catch { /* profile saved locally — backend unreachable */ }
    setActiveSection(null);
  }

  const completed = PROFILE_SECTIONS.filter(s => isDone(s.id)).length;
  const pct = Math.round((completed / PROFILE_SECTIONS.length) * 100);

  if (activeSection === 'personal')   return <ProfilePersonalScreen   back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ personal: d })} />;
  if (activeSection === 'passport')   return <ProfilePassportScreen   back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ passport: d })} />;
  if (activeSection === 'travel')     return <ProfileTravelScreen     back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ travelHistory: d })} />;
  if (activeSection === 'financials') return <ProfileFinancialsScreen back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ financials: d })} />;
  if (activeSection === 'employment') return <ProfileEmploymentScreen back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ employment: d })} />;
  if (activeSection === 'contacts')   return <ProfileContactsScreen   back={() => setActiveSection(null)} profile={profile} onSave={d => handleSave({ contacts: d })} />;

  return (
    <View>
      <BackButton label="Profile" onPress={back} />
      <Text style={styles.eyebrow}>Account completeness</Text>
      <Text style={styles.title}>Complete your profile</Text>
      <LinearGradient colors={['#0B1F4B','#1547C0']} style={{ borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', gap: 10 }}>
        <ScoreRing value={pct} large subLabel={`${completed}/${PROFILE_SECTIONS.length} complete`} />
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' }}>A complete profile enables auto-fill on new applications and improves AI score accuracy.</Text>
      </LinearGradient>
      <View style={[styles.notice, { marginBottom: 4 }]}>
        <Text style={styles.noticeText}>AI tip: Completing financial and employment sections can increase your visa readiness score by up to 18 points.</Text>
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
      <Pressable style={styles.primaryButton} onPress={() => onSave({ firstName, lastName, nationality, dateOfBirth: dob, phone, gender })}>
        <Text style={styles.primaryButtonText}>Save personal details</Text>
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
      <Pressable style={styles.primaryButton} onPress={() => onSave({ passportNumber, issueDate, expiryDate, issuingCountry })}>
        <Text style={styles.primaryButtonText}>Save passport details</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Travel History ──────────────────────────────────────────────────
function ProfileTravelScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['travelHistory']>) => void }) {
  const [hasRejection, setHasRejection] = useState(profile?.travelHistory?.hasRejection ?? false);
  const [trips, setTrips] = useState<{ country: string; years: string; status: string }[]>([]);
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
        {trips.map(t => (
          <View key={t.country} style={styles.taskRow}>
            <Text style={{ fontSize: 22, width: 36 }}>{t.country.split(' ')[0]}</Text>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{t.country.split(' ').slice(1).join(' ')}</Text>
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
            <Text style={styles.noticeText}>Disclosing rejections is mandatory on most visa forms. VisaIQ will help you address refusal reasons in your new application.</Text>
          </View>
        )}
      </Section>
      <Pressable style={styles.primaryButton} onPress={() => onSave({ tripsCount: trips.length, hasRejection })}>
        <Text style={styles.primaryButtonText}>Save travel history</Text>
      </Pressable>
    </View>
  );
}

// ─── Profile: Financials ──────────────────────────────────────────────────────
function ProfileFinancialsScreen({ back, profile, onSave }: { back: () => void; profile: UserProfile | null; onSave: (d: NonNullable<UserProfile['financials']>) => void }) {
  const [statements, setStatements] = useState<{ label: string; score: number }[]>([]);

  const uploadStatement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: false });
      if (!result.canceled && result.assets?.[0]) {
        const now = new Date();
        const label = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        setStatements(prev => [...prev, { label, score: 0 }]);
      }
    } catch { /* user cancelled */ }
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
            <View style={[styles.quickIconBox, { width: 36, height: 36, backgroundColor: colors.green100 }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.green500} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{m.label}</Text>
              <Text style={styles.rowMeta}>{m.score > 0 ? `Audited · Score ${m.score}` : 'Uploaded · Pending audit'}</Text>
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
          <Pressable key={a} style={styles.taskRow}>
            <Ionicons name="add-circle-outline" size={20} color={colors.slate300} />
            <Text style={[styles.rowMeta, { marginLeft: 8 }]}>{a}</Text>
          </Pressable>
        ))}
      </Section>
      <Pressable style={styles.primaryButton} onPress={() => onSave({ statementsCount: statements.length })}>
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
  const [resumeUploaded, setResumeUploaded] = useState(false);

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
      <Section title="Resume / CV">
        {!resumeUploaded ? (
          <Pressable style={[styles.uploadZone, { minHeight: 80 }]} onPress={async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false });
              if (!result.canceled && result.assets?.[0]) setResumeUploaded(true);
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
              <Text style={styles.rowTitle}>resume.pdf</Text>
              <Text style={styles.rowMeta}>Uploaded · Ready for visa package</Text>
            </View>
            <Pressable onPress={() => setResumeUploaded(false)}>
              <Ionicons name="trash-outline" size={18} color={colors.slate300} />
            </Pressable>
          </View>
        )}
      </Section>
      <Pressable style={styles.primaryButton} onPress={() => onSave({ employer, jobTitle: title, annualIncomeUsd: income })}>
        <Text style={styles.primaryButtonText}>Save employment details</Text>
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
      <Pressable style={styles.primaryButton} onPress={() => onSave({ emergencyName: name, emergencyPhone: phone, emergencyRelation: relation })}>
        <Text style={styles.primaryButtonText}>Save emergency contacts</Text>
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
  const result = WAIVER_RULES[nat]?.[dest];
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
      {cfg && result && (
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
      {!result && (
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
  'incomplete':          { cause: 'Missing required documents',          fix: 'Use the VisaIQ requirements checklist to identify all missing items before reapplying.', severity: 'medium' },
  'purpose unclear':     { cause: 'Travel purpose not established',      fix: 'Provide a detailed itinerary, hotel bookings, and a clear cover letter explaining your trip.', severity: 'medium' },
  'previous overstay':   { cause: 'Prior immigration violation',         fix: 'Disclose the overstay honestly. Provide evidence of changed circumstances. Consult a visa expert.', severity: 'high' },
};

function RejectionAnalyzerScreen({ back, openChat }: { back: () => void; openChat: () => void }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Array<{ key: string; cause: string; fix: string; severity: 'high' | 'medium' }>>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = () => {
    const found = Object.entries(REJECTION_REASONS)
      .filter(([key]) => text.toLowerCase().includes(key))
      .map(([key, val]) => ({ key, ...val }));
    setResults(found.length > 0 ? found : [{ key: 'general', cause: 'Rejection reason not identified', fix: 'Share your rejection letter with our AI assistant for a detailed analysis.', severity: 'medium' }]);
    setAnalyzed(true);
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
          <Pressable style={[styles.primaryButton, !text.trim() && styles.disabledButton]} onPress={text.trim() ? analyze : undefined}>
            <Text style={styles.primaryButtonText}>Analyze rejection</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Section title={`${results.length} issue${results.length !== 1 ? 's' : ''} identified`}>
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
          <Pressable style={styles.primaryButton} onPress={openChat}>
            <Text style={styles.primaryButtonText}>Ask AI for detailed guidance</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => { setText(''); setResults([]); setAnalyzed(false); }}>
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
  shell: { flex: 1, backgroundColor: colors.slate50, paddingTop: STATUSBAR_H },
  content: { padding: 18, paddingBottom: 28 },
  withNav: { paddingBottom: BOTTOM_NAV_H + 20 },
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
  input: { flex: 1, height: 46, borderRadius: 23, borderColor: colors.slate200, borderWidth: 1, backgroundColor: colors.white, paddingHorizontal: 14 },
  searchInput: { height: 50, borderRadius: 14, borderColor: colors.slate200, borderWidth: 1, backgroundColor: colors.white, paddingHorizontal: 14, marginBottom: 14 },
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
  selectorCard: { backgroundColor: colors.white, borderRadius: 18, borderColor: colors.slate100, borderWidth: 1, padding: 18, marginTop: 10, marginBottom: 16 },
  selectorValue: { color: colors.slate900, fontWeight: '900', fontSize: 22, marginBottom: 8 },
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
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: BOTTOM_NAV_H, flexDirection: 'row', backgroundColor: colors.white, borderTopColor: colors.slate100, borderTopWidth: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: NAV_BAR_H },
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
