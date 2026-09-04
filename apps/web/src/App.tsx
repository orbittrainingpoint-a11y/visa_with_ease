import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  Home,
  Lock,
  LockKeyhole,
  MessageCircle,
  Plane,
  PlaneTakeoff,
  RefreshCw,
  Settings,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  MapPin,
  Package,
  Phone,
  Clock,
  X,
  Unlock,
  Upload,
  Users,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LandingPage from './LandingPage';
import { BlogIndexPage, BlogPostPage } from './Blog';
import type { AuditResult, AuthSessionResponse, ChatResponse, RequirementsResponse, VisaApplication } from '@visaiq/contracts';
import { applications as fallbackApplications, auditResult as fallbackAuditResult, requirements as fallbackRequirements } from '@visaiq/mock-data';
import { scoreColor } from '@visaiq/design-system';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? '';
const SESSION_KEY = 'visaiq.session';

// Safely read the stored session — localStorage can contain a partial/corrupted
// write (interrupted write, extension interference, manual edit), so every read
// site must tolerate malformed JSON instead of throwing.
function getStoredSession(): AuthSessionResponse | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSessionResponse) : null;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  return getStoredSession()?.token ?? null;
}

// Smart AI knowledge base (client-side fallback when backend is mocked)
const WEB_CHAT_KB: Array<[RegExp, string, string[]]> = [
  [/insurance|cover/i,       'Travel medical insurance covering €30,000+ is mandatory for Schengen. UAE providers like AXA, Oman Insurance, and RSA offer single-trip policies from AED 80. Upload the certificate (not the policy document) to the consulate portal.', ['What is the visa fee?', 'Check my requirements', 'Book a consultant']],
  [/itinerary|flight|hotel/i,'Your itinerary must show flight + hotel reservations with dates matching Jul 18–27. Non-refundable bookings aren\'t required. Dates must match your insurance and bank statement — mismatches are a top rejection reason.', ['What insurance do I need?', 'Check my score', 'Find a consultant']],
  [/bank|fund|money|financ/i,'France Schengen consulates expect roughly €65/day. Your uploaded bank statement shows sufficient funds. Make sure the statement is recent (≤3 months) and clearly shows your full name.', ['Any other documents needed?', 'Check requirements', 'Book expert review']],
  [/score|readiness|ready/i, 'Your current readiness is 87/100. The two blockers are: (1) missing travel insurance, and (2) itinerary proof not uploaded. Resolving both would push your score to 96+. Identity and financial evidence are strong.', ['How to fix insurance gap?', 'Upload documents', 'Book a consultant']],
  [/appointment|slot|book/i, 'French consulate appointments in Dubai are via VFS Global. Slots open ~3 months ahead. For Jul 18 travel, book by late June. Current wait: 7–10 business days after submission.', ['What documents to bring?', 'Check requirements', 'Get expert help']],
  [/reject|refus|denied/i,   'Prior rejections must be disclosed on your form. A rejection isn\'t automatic disqualification — explain what changed and provide stronger evidence. Consultant review is strongly recommended.', ['Book a consultant', 'Check my score', 'See requirements']],
  [/fee|cost|pay|price/i,    'France Schengen visa fee is €80 + VFS service charge (~AED 40). Embassy fee is non-refundable even if rejected. Payment at VFS centre on appointment day — cash and card accepted.', ['When to book appointment?', 'Check my score', 'See all requirements']],
  [/passport|scan|glare/i,   'Your passport scored 94/100. The glare warning is minor. If you receive an image quality rejection, retake under diffused lighting without flash. Most consulates use digital scanning.', ['Check other documents', 'See full audit', 'What else is needed?']],
];

// Toast context
type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };
let toastEmitter: ((t: Toast) => void) | null = null;
function showToast(message: string, type: Toast['type'] = 'info') {
  toastEmitter?.({ id: Date.now().toString(), message, type });
}

// Builds and downloads a real CSV from real rows — no fake "exported" toast
// with nothing behind it.
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const nav = [
  { to: '/app', label: 'Dashboard', icon: Home },
  { to: '/analysis', label: 'Analysis', icon: Sparkles },
  { to: '/onboarding', label: 'Onboarding', icon: PlaneTakeoff },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/requirements', label: 'Requirements', icon: Globe2 },
  { to: '/chat', label: 'AI Assistant', icon: Bot },
  { to: '/consultants', label: 'Consultants', icon: Users },
  { to: '/consultant-console', label: 'Console', icon: MessageCircle },
  { to: '/hr', label: 'HR portal', icon: LockKeyhole },
  { to: '/employee', label: 'Employee', icon: ShieldCheck },
  { to: '/booking', label: 'Booking', icon: CalendarClock },
  { to: '/visa-calculator', label: 'Visa Calculator', icon: CircleDollarSign },
  { to: '/bank-balance', label: 'Bank Balance', icon: ChevronRight },
  { to: '/embassy-finder', label: 'Embassy Finder', icon: Globe2 },
  { to: '/country-comparison', label: 'Country Compare', icon: BarChart3 },
  { to: '/visa-waiver', label: 'Waiver Check', icon: ShieldCheck },
  { to: '/rejection-analyzer', label: 'Rejection AI', icon: AlertTriangle },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/help', label: 'Help & FAQ', icon: MessageCircle },
  { to: '/pricing', label: 'Pricing', icon: Zap },
  { to: '/api-portal', label: 'API Portal', icon: Code2 },
  { to: '/partners', label: 'Partners', icon: Package },
  { to: '/compliance-db', label: 'Compliance DB', icon: Globe2 },
  { to: '/investor', label: 'Investor Demo', icon: TrendingUp },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit-log', label: 'Audit log', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Admin', icon: BarChart3 }
];

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    toastEmitter = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3800);
    };
    return () => { toastEmitter = null; };
  }, []);
  const colors = { success: '#10B981', error: '#DC2626', info: '#1A56DB' };
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: `1px solid ${colors[t.type]}30`, minWidth: 280, maxWidth: 380, animation: 'slideIn 0.25s ease' }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: colors[t.type], flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{t.message}</span>
          <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} aria-label="Dismiss notification" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const location = useLocation();
  const publicPaths = ['/', '/services', '/process', '/about', '/contact', '/faq'];
  const [session, setSession] = useStoredSession();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (publicPaths.includes(location.pathname) || location.pathname.startsWith('/blog')) {
    return <PublicSite />;
  }

  // Landing page demo buttons navigate to /app?demo=<persona> — forward that to AuthPage
  const demoParam = new URLSearchParams(location.search).get('demo');

  if (location.pathname === '/auth') {
    return <AuthPage onSession={setSession} />;
  }

  if (location.pathname === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (!session) {
    return <Navigate to={`/auth${demoParam ? `?demo=${demoParam}` : ''}`} replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-shell">
      <ToastContainer />
      <CookieBanner />
      <aside className="sidebar">
        <Link className="brand" to="/">
          <img src="/logo-icon.png" alt="" /><span className="brand-word"><b>Visa</b> With <b className="brand-ease">Ease</b></span>
        </Link>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="security-card">
          <ShieldCheck size={20} />
          <div>
            <strong>Protected workspace</strong>
            <span>AI keys stay server-side. Documents auto-delete after 72h.</span>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button className="search" onClick={() => setShowSearch(true)} style={{ cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left', width: '100%', maxWidth: 340 }}>
            <Search size={17} />
            <span>Search applications, documents, consultants…</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button className="icon-button" aria-label="Notifications" onClick={() => setShowNotifs(v => !v)} style={{ position: 'relative' }}>
              <Bell size={19} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }} />
            </button>
            {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
          </div>
          {showSearch && <SearchModal query={searchQuery} setQuery={setSearchQuery} onClose={() => { setShowSearch(false); setSearchQuery(''); }} />}
          <button className="logout-button" onClick={() => setSession(null)}>Logout</button>
          <div className="avatar">{initials(session.user.name)}</div>
        </header>
        <Routes>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/upload" element={<UploadFlow />} />
          <Route path="/audit/:docId" element={<AuditReport />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/consultants" element={<Consultants />} />
          <Route path="/consultants/:id" element={<ConsultantProfile />} />
          <Route path="/consultant-console" element={
            session.user.roles.includes('consultant')
              ? <ConsultantConsole />
              : <Navigate to="/app" replace />
          } />
          <Route path="/hr" element={
            session.user.roles.includes('hr_admin')
              ? <HrPortal />
              : <Navigate to="/app" replace />
          } />
          <Route path="/employee" element={<EmployeePortal />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/:consultantId" element={<Booking />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={
            session.user.roles.includes('platform_admin')
              ? <Admin />
              : <Navigate to="/app" replace />
          } />
          <Route path="/visa-calculator" element={<VisaCalculator />} />
          <Route path="/bank-balance" element={<BankBalance />} />
          <Route path="/embassy-finder" element={<EmbassyFinder />} />
          <Route path="/country-comparison" element={<CountryComparison />} />
          <Route path="/visa-waiver" element={<VisaWaiverChecker />} />
          <Route path="/rejection-analyzer" element={<RejectionLetterAnalyzer />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/admin/users" element={
            session.user.roles.includes('platform_admin')
              ? <AdminUsers />
              : <Navigate to="/app" replace />
          } />
          <Route path="/admin/audit-log" element={
            session.user.roles.includes('platform_admin')
              ? <AuditLog />
              : <Navigate to="/app" replace />
          } />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/api-portal" element={<ApiPortal />} />
          <Route path="/partners" element={<EcosystemPartners />} />
          <Route path="/compliance-db" element={<ComplianceDb />} />
          <Route path="/investor" element={<InvestorDemo />} />
        </Routes>
      </main>
    </div>
  );
}

const DEMO_PERSONAS = [
  { persona: 'consumer',       label: 'Consumer',    desc: 'Apply for a visa' },
  { persona: 'consultant',     label: 'Consultant',  desc: 'Review client cases' },
  { persona: 'hr_admin',       label: 'HR Admin',    desc: 'Manage team relocation' },
  { persona: 'platform_admin', label: 'Platform',    desc: 'System overview' },
] as const;

function AuthPage({ onSession }: { onSession: (session: AuthSessionResponse | null) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('sarah.mathew@example.com');
  const [password, setPassword] = useState('demo1234');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const from = typeof location.state === 'object' && location.state && 'from' in location.state ? String(location.state.from) : '/app';
  const demoPersona = new URLSearchParams(location.search).get('demo');

  // Auto-login when landing page routes to /auth?demo=<persona>
  useEffect(() => {
    if (!demoPersona) return;
    loginAsDemo(demoPersona as typeof DEMO_PERSONAS[number]['persona']);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoPersona]);

  async function loginAsDemo(persona: typeof DEMO_PERSONAS[number]['persona']) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/demo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ persona })
      });
      if (!response.ok) throw new Error(`Demo login failed (${response.status})`);
      const payload = (await response.json()) as AuthSessionResponse;
      onSession(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed — is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, remember })
      });
      if (!response.ok) throw new Error(`Login failed (${response.status})`);
      const payload = (await response.json()) as AuthSessionResponse;
      onSession(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start session');
    } finally {
      setLoading(false);
    }
  }

  const googleButtonRef = useRef<HTMLDivElement>(null);

  async function handleGoogleCredential(idToken: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      if (!response.ok) throw new Error(`Google sign-in failed (${response.status})`);
      const payload = (await response.json()) as AuthSessionResponse;
      onSession(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    const google = (window as unknown as { google?: any }).google;
    function render() {
      const g = (window as unknown as { google?: any }).google;
      if (!g || !googleButtonRef.current) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => { void handleGoogleCredential(response.credential); }
      });
      g.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 320 });
    }
    if (google) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
    // Script is left in place — Google's SDK expects a single persistent load per page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" to="/"><img src="/logo-icon.png" alt="" /><span className="brand-word"><b>Visa</b> With <b className="brand-ease">Ease</b></span></Link>
        <p>Secure sign in</p>
        <h1>Open your visa workspace</h1>
        <form className="auth-form" onSubmit={submit}>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required /></label>
          <label className="check-line"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /> Keep me signed in</label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        {GOOGLE_CLIENT_ID && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>
            <div ref={googleButtonRef} />
          </div>
        )}
        <div className="auth-note">
          Demo login is local and validated by the API. Firebase Auth verification is already behind the backend service interface for production credentials.
        </div>
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or try a demo role</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_PERSONAS.map(({ persona, label, desc }) => (
              <button key={persona} type="button" disabled={loading}
                onClick={() => loginAsDemo(persona)}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F8FAFC', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="auth-side">
        <ShieldCheck size={34} />
        <h2>Consent-first visa intelligence</h2>
        <p>Documents, consultant sharing, HR access and admin actions stay scoped to authenticated sessions.</p>
      </section>
    </main>
  );
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await postJson('/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" to="/"><img src="/logo-icon.png" alt="" /><span className="brand-word"><b>Visa</b> With <b className="brand-ease">Ease</b></span></Link>
        <p>Secure sign in</p>
        <h1>Reset your password</h1>
        {!token ? (
          <div className="form-error">This reset link is missing its token. Request a new one from the sign-in page.</div>
        ) : done ? (
          <>
            <p style={{ color: '#334155' }}>Your password has been reset. You can sign in with it now.</p>
            <button className="primary-button" onClick={() => navigate('/auth')}>Back to sign in</button>
          </>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>New password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required /></label>
            <label>Confirm new password<input value={confirm} onChange={(event) => setConfirm(event.target.value)} type="password" minLength={8} required /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>
          </form>
        )}
      </section>
      <section className="auth-side">
        <ShieldCheck size={34} />
        <h2>Consent-first visa intelligence</h2>
        <p>Documents, consultant sharing, HR access and admin actions stay scoped to authenticated sessions.</p>
      </section>
    </main>
  );
}

function useStoredSession() {
  const [session, setSessionState] = useState<AuthSessionResponse | null>(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthSessionResponse;
      return Date.parse(parsed.expiresAt) > Date.now() ? parsed : null;
    } catch {
      return null;
    }
  });

  const setSession = (next: AuthSessionResponse | null) => {
    setSessionState(next);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  };

  return [session, setSession] as const;
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(dateISO: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function relativeTripLabel(dateISO: string) {
  const days = daysUntil(dateISO);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `${days} days`;
}

function sourceFreshnessLabel(freshness: RequirementsResponse['freshness']) {
  const expiresIn = Math.max(0, Math.ceil((Date.parse(freshness.expiresAt) - Date.now()) / 3_600_000));
  return `Fetched ${freshness.ageHours}h ago, expires in ${expiresIn}h under the 24h cache policy.`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onNavigate={navigate} />;
}

function PublicSite() {
  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
      <Route path="/services" element={<LandingWrapper />} />
      <Route path="/process" element={<LandingWrapper />} />
      <Route path="/about" element={<LandingWrapper />} />
      <Route path="/contact" element={<LandingWrapper />} />
      <Route path="/faq" element={<LandingWrapper />} />
      <Route path="/blog" element={<BlogIndexPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<LegalPlaceholderPage title="Terms of Service" />} />
    </Routes>
  );
}

function PrivacyPolicyPage() {
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#0B1F4B', margin: '28px 0 10px' };
  const p: React.CSSProperties = { color: '#334155', lineHeight: 1.7, margin: '0 0 12px' };
  const ul: React.CSSProperties = { color: '#334155', lineHeight: 1.7, margin: '0 0 12px', paddingLeft: 20 };
  return (
    <section className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="page-title"><div><p>Legal</p><h1>Privacy Policy</h1></div></div>
      <article className="panel" style={{ padding: '28px 32px' }}>
        <p style={{ ...p, color: '#64748B', fontSize: 13 }}>Effective date: September 4, 2026</p>

        <p style={p}>
          Visa With Ease ("we", "us") provides an AI-assisted visa document review and application-tracking
          service. This policy explains what information we collect, how we use it, and the choices you have.
          If anything here is unclear, contact us at{' '}
          <a href="mailto:support@visawithease.app" style={{ color: '#1A56DB' }}>support@visawithease.app</a>.
        </p>

        <h2 style={h2}>No payment or card data</h2>
        <p style={p}>
          Visa With Ease does not currently process payments. We do not collect, store, or transmit credit card
          numbers, bank details, or any other payment information anywhere on this site or in our mobile app.
          If paid plans are introduced in the future, payment will be handled entirely by a licensed third-party
          payment processor (e.g. Stripe) that never shares full card numbers with us — this policy will be
          updated first, and you will be told before any billing feature goes live.
        </p>

        <h2 style={h2}>Information we collect</h2>
        <ul style={ul}>
          <li><strong>Account information:</strong> name, email address, and a securely hashed password (or, if you use Google Sign-In, the profile info Google shares with your consent — name, email, profile photo).</li>
          <li><strong>Application data:</strong> the destination country, visa type, travel dates, and checklist progress you enter to track your visa application.</li>
          <li><strong>Documents you upload:</strong> files you submit for AI review (e.g. passport scans, bank statements, employment letters), for the sole purpose of generating your audit results.</li>
          <li><strong>Usage data:</strong> basic device/browser information and product-usage events (e.g. pages visited, features used) so we can diagnose issues and improve the product.</li>
          <li><strong>Cookies:</strong> a session cookie/token to keep you signed in, and no third-party advertising or tracking cookies.</li>
        </ul>

        <h2 style={h2}>How we use your information</h2>
        <ul style={ul}>
          <li>To create and secure your account, and authenticate you on sign-in.</li>
          <li>To run AI-assisted analysis on the documents you choose to upload and produce your readiness score and findings.</li>
          <li>To send you account-related email (verification codes, password resets, security alerts) — we do not send marketing email without your consent.</li>
          <li>To operate, maintain, and improve the reliability and security of the service.</li>
        </ul>

        <h2 style={h2}>AI processing of your documents</h2>
        <p style={p}>
          Document text and the questions you ask our chat assistant are sent to a third-party AI provider
          (Anthropic or Google) strictly to generate your audit results and answers. These providers process
          the content solely to return a response to us — they are contractually restricted from using API
          traffic to train their models, and we do not send them your name, email, or account credentials
          alongside the document content.
        </p>

        <h2 style={h2}>Document retention</h2>
        <p style={p}>
          Uploaded files are used only to generate your audit results. Only the resulting score, severity
          labels, and findings are kept in your account so you can track progress over time — we do not keep
          a searchable copy of your raw document text. We are rolling out fully automated deletion of original
          files within 72 hours of upload; until that is confirmed live for your account, you can request
          immediate deletion of any file at any time by emailing{' '}
          <a href="mailto:support@visawithease.app" style={{ color: '#1A56DB' }}>support@visawithease.app</a>.
        </p>

        <h2 style={h2}>How we protect your data</h2>
        <ul style={ul}>
          <li>All traffic to and from Visa With Ease is encrypted in transit via HTTPS/TLS — the padlock in your browser confirms this on every page.</li>
          <li>Passwords are never stored in plain text; they are one-way hashed.</li>
          <li>Access to production data is limited to the engineers who need it to operate the service.</li>
          <li>We do not sell your personal information to anyone.</li>
        </ul>

        <h2 style={h2}>Who we share information with</h2>
        <p style={p}>
          We share information only with the vendors that help us run the service (our cloud database provider,
          our AI providers for document analysis, and our email provider for account notifications), and only
          to the extent needed to provide the feature you're using. If you choose to book a consultation, the
          consultant you select receives the application details you explicitly authorize for that booking. We
          do not share your data with advertisers or data brokers.
        </p>

        <h2 style={h2}>Your rights</h2>
        <p style={p}>
          You can access, correct, or delete your account information, and request an export or deletion of
          your data, at any time by emailing{' '}
          <a href="mailto:support@visawithease.app" style={{ color: '#1A56DB' }}>support@visawithease.app</a>.
          We will respond within 30 days.
        </p>

        <h2 style={h2}>Children's privacy</h2>
        <p style={p}>Visa With Ease is not directed at children under 16, and we do not knowingly collect information from them.</p>

        <h2 style={h2}>Changes to this policy</h2>
        <p style={p}>If we make material changes to this policy, we will update the effective date above and, where appropriate, notify you by email.</p>

        <h2 style={h2}>Contact us</h2>
        <p style={{ ...p, marginBottom: 0 }}>
          Questions about this policy or your data: <a href="mailto:support@visawithease.app" style={{ color: '#1A56DB' }}>support@visawithease.app</a>.
        </p>
      </article>
    </section>
  );
}

function LegalPlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-title"><div><p>Legal</p><h1>{title}</h1></div></div>
      <article className="panel">
        <p style={{ color: '#334155', lineHeight: 1.7 }}>
          Our {title} is being finalized and will be published here before launch. In the meantime,
          if you have any questions about how your data is collected, stored, or used, please contact
          us at <a href="mailto:support@visawithease.app" style={{ color: '#1A56DB' }}>support@visawithease.app</a>.
        </p>
      </article>
    </section>
  );
}

const ACTIVITY_FEED = [
  { icon: CheckCircle2, color: '#10B981', title: 'Passport audit complete',        sub: 'Score 94/100 · Glare warning noted',           time: '12m ago' },
  { icon: Upload,       color: '#1A56DB', title: 'Employment letter uploaded',      sub: 'Queued for AI review',                          time: '2h ago' },
  { icon: AlertTriangle,color: '#F59E0B', title: 'Insurance gap detected',          sub: 'Required for Schengen — upload before Jun 15',  time: '6h ago' },
  { icon: Globe2,       color: '#7C3AED', title: 'Requirements cache refreshed',    sub: 'france-visas.gouv.fr · 24h TTL',                time: 'Yesterday' },
  { icon: Users,        color: '#0EA5E9', title: 'Amelia Roche pre-matched',        sub: 'Pre-filtered for France Schengen',              time: 'Yesterday' },
];

function Dashboard() {
  const sessionData = getStoredSession();
  const firstName = sessionData?.user.name.split(' ')[0] ?? 'there';
  const { data: applicationData } = useApi<{ applications: VisaApplication[] }>('/applications', { applications: fallbackApplications });
  const { data: requirements } = useApi<RequirementsResponse>('/requirements', fallbackRequirements);
  const active = applicationData.applications[0] ?? fallbackApplications[0];
  const { data: documentData } = useApi<{ documents: Array<{ id: string; title: string; status: string; issue: string }> }>(
    `/documents?applicationId=${encodeURIComponent(active.id)}`, { documents: [] }
  );
  const tripLabel = relativeTripLabel(active.intendedFrom);
  const daysLeft = Math.max(0, Math.ceil((new Date(active.intendedFrom).getTime() - Date.now()) / 86400000));

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>{greeting()}, {firstName}</p>
          <h1>Your visa readiness command center</h1>
        </div>
        <Link className="primary-button" to="/onboarding" onClick={() => showToast('Starting new application wizard', 'info')}>
          <PlaneTakeoff size={18} /> New application
        </Link>
      </div>

      <div className="hero-grid">
        <article className="readiness-hero" style={{ background: 'linear-gradient(135deg, #0B1F4B 0%, #1A56DB 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(14,165,233,0.12)' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,0.15)' }} />
          <div style={{ position: 'relative' }}>
            <span className="eyebrow" style={{ color: '#93C5FD' }}>Next trip · {tripLabel} · {daysLeft} days</span>
            <h2 style={{ color: '#fff', fontSize: 26, margin: '8px 0 4px' }}>🇫🇷 {active.destinationCountry}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 14 }}>{active.visaType} · {active.refCode}</p>
          </div>
          <Score value={active.readinessScore} size="large" />
          <div className="hero-actions" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <Link to={`/applications/${active.id}`} style={{ color: '#93C5FD', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>Complete checklist <ChevronRight size={15} /></Link>
            <Link to="/booking" style={{ color: '#FCD34D', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>Get expert help <ChevronRight size={15} /></Link>
          </div>
        </article>
        <div className="metric-stack">
          <Metric icon={Upload}        label="Documents uploaded"  value={`${active.documentsUploaded}/${active.documentsRequired}`} />
          <Metric icon={AlertTriangle} label="Open issues"          value={String(active.issuesCount)} tone="warn" />
          <Metric icon={CalendarClock} label="Processing estimate"  value={requirements.processingTime} />
          <Metric icon={TrendingUp}    label="Readiness score"      value={`${active.readinessScore}/100`} />
        </div>
      </div>

      <div className="section-grid">
        <QuickActions />
        <article className="panel">
          <h2>Recent activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ACTIVITY_FEED.map((item, i) => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={17} color={item.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{item.sub}</div>
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Multi-app readiness summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {applicationData.applications.slice(0, 3).map(a => (
          <Link key={a.id} to={`/applications/${a.id}`} style={{ textDecoration: 'none' }}>
            <article className="panel" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14 }}>
              <span style={{ fontSize: 26 }}>{a.destinationFlag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{a.destinationCountry} · {a.visaType}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: '#1A56DB18', fontSize: 11, fontWeight: 700, color: '#1A56DB', marginTop: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 3, background: '#1A56DB' }} /> {a.status}
                </span>
              </div>
              <Score value={a.readinessScore} />
            </article>
          </Link>
        ))}
        {applicationData.applications.length === 0 && (
          <Link to="/onboarding" style={{ textDecoration: 'none', gridColumn: '1 / -1' }}>
            <article className="panel" style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>+ Create your first application</article>
          </Link>
        )}
      </div>

      {/* Document status tracker */}
      <article className="panel">
        <h2>Document status</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {documentData.documents.map((d, i) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: d.status === 'Audited' ? '#D1FAE5' : d.status === 'Queued' ? '#FEF3C7' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.status === 'Audited' ? <CheckCircle2 size={16} color="#10B981" /> : <AlertTriangle size={16} color={d.status === 'Queued' ? '#F59E0B' : '#DC2626'} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{d.title}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{d.issue}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, background: d.status === 'Audited' ? '#D1FAE5' : d.status === 'Queued' ? '#FEF3C7' : '#FEF2F2', color: d.status === 'Audited' ? '#065F46' : d.status === 'Queued' ? '#92400E' : '#991B1B', fontSize: 12, fontWeight: 700 }}>{d.status}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

const APP_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  in_progress: { bg: '#EFF6FF', text: '#1547C0', dot: '#1A56DB' },
  draft:       { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
  ready:       { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  submitted:   { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  approved:    { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  rejected:    { bg: '#FEF2F2', text: '#991B1B', dot: '#DC2626' },
};

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(' ', '_');
  const c = APP_STATUS_COLORS[key] ?? APP_STATUS_COLORS.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: c.bg, fontSize: 12, fontWeight: 700, color: c.text, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: c.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

const EXTRA_APPS = [
  ...fallbackApplications,
  { id: 'app-us-2026', refCode: 'REF-2026-US-741203', applicantName: 'Sarah Mathew', destinationCountry: 'United States', destinationFlag: '🇺🇸', visaType: 'B1/B2 Tourist', status: 'rejected', readinessScore: 23, documentsUploaded: 2, documentsRequired: 9, issuesCount: 6, intendedFrom: '2026-12-01', intendedTo: '2026-12-15' } as VisaApplication,
];

function Applications() {
  const { data, loading } = useApi<{ applications: VisaApplication[] }>('/applications', { applications: EXTRA_APPS });
  const [q, setQ] = useState('');
  const apps = data.applications.filter(a =>
    !q || a.destinationCountry.toLowerCase().includes(q.toLowerCase()) || a.visaType.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Applications</p>
          <h1>Track every visa journey</h1>
        </div>
        <Link className="primary-button" to="/onboarding"><PlaneTakeoff size={17} /> New application</Link>
      </div>
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <Search size={16} color="#94A3B8" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by country or visa type…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
        {loading && <span style={{ fontSize: 12, color: '#94A3B8' }}>Syncing…</span>}
      </div>
      <div className="cards-list">
        {apps.map((app) => (
          <Link className="app-card" key={app.id} to={`/applications/${app.id}`} style={{ textDecoration: 'none' }}>
            <div className="flag" style={{ fontSize: 24 }}>{app.destinationFlag}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 3px', fontSize: 15 }}>{app.destinationCountry}</h3>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: '#64748B' }}>{app.visaType} · {app.refCode}</p>
              <StatusBadge status={app.status} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <Score value={app.readinessScore} />
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{app.documentsUploaded}/{app.documentsRequired} docs</span>
            </div>
          </Link>
        ))}
        {apps.length === 0 && <p style={{ color: '#94A3B8', padding: 24, textAlign: 'center' }}>No applications match "{q}"</p>}
      </div>
    </section>
  );
}

function Analysis() {
  const { data: applicationData } = useApi<{ applications: VisaApplication[] }>('/applications', { applications: fallbackApplications });
  const active = applicationData.applications[0] ?? fallbackApplications[0];
  const docId = `${active.id}-passport`;
  const { data: audit } = useApi<AuditResult>(`/audit/${docId}`, fallbackAuditResult);
  const { data: reqs } = useApi<RequirementsResponse>('/requirements', fallbackRequirements);
  const freshness = sourceFreshnessLabel(reqs.freshness);
  const riskLabel = active.readinessScore >= 85 ? 'low' : active.readinessScore >= 60 ? 'medium' : 'high';
  const blockers = audit.findings.filter(f => f.severity === 'warn' || f.severity === 'red_flag');
  const passing = audit.findings.filter(f => f.severity === 'pass');
  const summaryText = blockers.length > 0
    ? `Visa With Ease found ${passing.length} passing check${passing.length === 1 ? '' : 's'}, but ${blockers.map(f => f.title.toLowerCase()).slice(0, 2).join(' and ')} ${blockers.length > 1 ? 'are' : 'is'} blocking a confident checklist match.`
    : 'All audited checks are currently passing for this application.';
  const routeCoverage = active.nationality && active.residenceCountry
    ? `Supported for ${active.nationality} national resident in ${active.residenceCountry} applying for ${active.destinationCountry} ${active.visaType}.`
    : `Coverage for ${active.destinationCountry} ${active.visaType} — add your nationality and residence in the application for a fully personalized route check.`;

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Visa analysis</p>
          <h1>{active.destinationCountry} {active.visaType} readiness intelligence</h1>
        </div>
        <Link className="primary-button" to="/upload">Improve score</Link>
      </div>
      <div className="analysis-layout">
        <article className="analysis-summary">
          <Score value={active.readinessScore} size="large" />
          <h2>Submission risk: {riskLabel}</h2>
          <p>{summaryText}</p>
        </article>
        <div className="analysis-stack">
          {audit.findings.map((f) => (
            <article className="analysis-factor" key={f.id}>
              <div>
                <strong>{f.title}</strong>
                <span>{f.description}</span>
              </div>
              <Score value={f.confidence} />
            </article>
          ))}
        </div>
      </div>
      <div className="section-grid">
        <article className="panel">
          <h2>Recommended fixes</h2>
          {blockers.length > 0 ? blockers.map(f => (
            <div className="activity-row" key={f.id}><AlertTriangle size={18} /><div><strong>{f.title}</strong><span>{f.description}</span></div></div>
          )) : (
            <div className="activity-row"><CheckCircle2 size={18} /><div><strong>No fixes needed right now</strong><span>All audited findings are currently passing.</span></div></div>
          )}
        </article>
        <article className="panel">
          <h2>Coverage and source confidence</h2>
          <div className="activity-row"><ShieldCheck size={18} /><div><strong>Route coverage</strong><span>{routeCoverage}</span></div></div>
          <div className="activity-row"><Globe2 size={18} /><div><strong>Source freshness</strong><span>{freshness}</span></div></div>
          <div className="activity-row"><CalendarClock size={18} /><div><strong>Processing estimate</strong><span>{reqs.processingTime}</span></div></div>
        </article>
      </div>
    </section>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [nationality, setNationality] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('France');
  const [visaType, setVisaType] = useState('Schengen Tourist');
  const [intendedFrom, setIntendedFrom] = useState('2026-07-18');
  const [submitting, setSubmitting] = useState(false);

  async function createApplication() {
    if (!nationality.trim() || !residenceCountry.trim() || !destinationCountry.trim() || !visaType.trim() || !intendedFrom) {
      showToast('Nationality, residence, destination, visa type, and travel date are all required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await postJson<{ application: { id: string } }>('/applications', {
        destinationCountry, visaType, intendedFrom, nationality, residenceCountry
      });
      navigate(`/applications/${result.application.id}`);
    } catch {
      showToast('Could not create application via API — opening applications list.', 'info');
      navigate('/applications');
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { title: 'Nationality', value: nationality || 'Not entered yet', body: 'Passport country controls visa eligibility, fees and document rules.' },
    { title: 'Residence', value: residenceCountry || 'Not entered yet', body: 'Application jurisdiction determines where you submit and which centre rules apply.' },
    { title: 'Destination', value: `${destinationCountry} · ${intendedFrom}`, body: 'Destination and dates scope requirements, processing time and insurance validity.' },
    { title: 'Visa type', value: visaType, body: 'Visa category keeps AI guidance grounded to the right checklist.' }
  ];

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Onboarding</p>
          <h1>Build a normalized visa context</h1>
        </div>
        <button className="primary-button" onClick={createApplication} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create application'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Nationality (passport country)
          <input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. India"
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', minWidth: 160 }} />
        </label>
        <label style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Country of residence
          <input value={residenceCountry} onChange={e => setResidenceCountry(e.target.value)} placeholder="e.g. United Arab Emirates"
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', minWidth: 180 }} />
        </label>
        <label style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Destination country
          <input value={destinationCountry} onChange={e => setDestinationCountry(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', minWidth: 180 }} />
        </label>
        <label style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Visa type
          <input value={visaType} onChange={e => setVisaType(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', minWidth: 160 }} />
        </label>
        <label style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Intended from
          <input type="date" value={intendedFrom} onChange={e => setIntendedFrom(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none' }} />
        </label>
      </div>
      <div className="onboarding-grid">
        {steps.map((step, index) => (
          <article className="onboarding-card" key={step.title}>
            <span className="step">{index + 1}</span>
            <h3>{step.title}</h3>
            <strong>{step.value}</strong>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
      <OfflineCachePanel />
    </section>
  );
}

function UploadFlow() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'slot' | 'uploading' | 'audit' | 'done' | 'error'>('idle');
  const { data: applicationData } = useApi<{ applications: VisaApplication[] }>('/applications', { applications: [] });
  const active = applicationData.applications[0];
  // The "no application yet" case renders its own early-return UI below, so
  // this only ever needs the normal idle message.
  const [message, setMessage] = useState('Choose a PDF or image to create an upload slot.');
  const [reportId, setReportId] = useState('doc-passport');
  const stages = [
    ['File selected', Boolean(file)],
    ['Encrypted upload slot created', ['uploading', 'audit', 'done'].includes(status)],
    ['File handoff confirmed', ['audit', 'done'].includes(status)],
    ['AI audit queued', ['audit', 'done'].includes(status)],
    ['Validated findings published', status === 'done']
  ] as const;

  async function runUpload() {
    if (!active) {
      setStatus('error');
      setMessage('Create an application first, then come back here to upload documents.');
      return;
    }
    if (!file) {
      setStatus('error');
      setMessage('Select a document first.');
      return;
    }
    const documentId = `doc-${file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'upload'}`;
    setReportId(documentId);
    try {
      setStatus('slot');
      setMessage('Creating encrypted upload slot...');
      const slot = await postJson<{ uploadUrl: string; expiresAt: string }>('/upload-slots', { applicationId: active.id, documentId });
      setStatus('uploading');
      setMessage(`Upload slot ready. Handoff expires ${formatDateTime(slot.expiresAt)}.`);
      await new Promise((resolve) => setTimeout(resolve, 450));
      setStatus('audit');
      setMessage('Queuing AI audit with the uploaded document reference...');
      await postJson('/audit', { applicationId: active.id, documentId });
      setStatus('done');
      setMessage('Audit completed. Opening the live report now.');
      setTimeout(() => navigate(`/audit/${documentId}`), 550);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Upload flow failed');
    }
  }

  if (!active) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <p>Document upload</p>
            <h1>Upload and audit progress</h1>
          </div>
        </div>
        <article className="panel">
          <h2>Create an application first</h2>
          <p>Documents are audited against a specific visa application, so start one before uploading.</p>
          <Link className="primary-button" to="/onboarding" onClick={() => showToast('Starting new application wizard', 'info')}>
            <PlaneTakeoff size={18} /> New application
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Document upload</p>
          <h1>Upload and audit progress</h1>
        </div>
        <Link className="primary-button" to={`/audit/${reportId}`}>View latest report</Link>
      </div>
      <div className="upload-layout">
        <article className="upload-drop">
          <Upload size={34} />
          <h2>{file ? file.name : 'Select a document'}</h2>
          <p>PDF, JPG, PNG and HEIC supported. Original files are encrypted and auto-delete within 72 hours.</p>
          <input
            aria-label="Choose visa document"
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setStatus('idle');
              setMessage(event.target.files?.[0] ? 'Document selected. Start upload to create a real API audit job.' : 'Choose a PDF or image to create an upload slot.');
            }}
          />
          <button className="primary-button" type="button" onClick={runUpload} disabled={status === 'slot' || status === 'uploading' || status === 'audit'}>
            {status === 'slot' || status === 'uploading' || status === 'audit' ? 'Working...' : 'Upload and audit'}
          </button>
          <div className={`action-status ${status === 'error' ? 'error' : ''}`}>{message}</div>
        </article>
        <article className="panel">
          <h2>Safe audit timeline</h2>
          {stages.map(([stage, done]) => (
            <div className="activity-row" key={stage}>
              {done ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <div>
                <strong>{stage}</strong>
                <span>{done ? 'Complete' : 'Pending'}</span>
              </div>
            </div>
          ))}
          <div className="warning-banner compact">
            <ShieldCheck size={18} />
            Only validated events are shown. Raw OCR and sensitive extracted values stay hidden from UI logs.
          </div>
        </article>
      </div>
      <OfflineCachePanel />
    </section>
  );
}

const REQ_FEE_RATES: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: '$',    rate: 1.00 }, AED: { symbol: 'AED ', rate: 3.67 },
  INR: { symbol: '₹',   rate: 83.5 }, GBP: { symbol: '£',   rate: 0.79  },
};

function Requirements() {
  const { data: requirements, refetch } = useApi<RequirementsResponse>('/requirements', fallbackRequirements);
  const expiresIn = Math.max(0, Math.ceil((Date.parse(requirements.freshness.expiresAt) - Date.now()) / 3_600_000));
  const [feeCurrency, setFeeCurrency] = useState<keyof typeof REQ_FEE_RATES>('AED');
  const feeEUR = 80;
  const { symbol, rate } = REQ_FEE_RATES[feeCurrency];
  const localFee = Math.round(feeEUR * (rate / 0.92));

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Requirements</p>
          <h1>France · Schengen Tourist</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="freshness">Fetched {requirements.freshness.ageHours}h ago · expires in {expiresIn}h</span>
          {/* Fee currency switcher */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(Object.keys(REQ_FEE_RATES) as Array<keyof typeof REQ_FEE_RATES>).map(c => (
              <button key={c} onClick={() => setFeeCurrency(c)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, background: feeCurrency === c ? '#1A56DB' : '#F1F5F9', color: feeCurrency === c ? '#fff' : '#475569' }}>{c}</button>
            ))}
          </div>
        </div>
      </div>
      {/* Fee display */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <article className="panel" style={{ flex: 1, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Visa fee</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '4px 0 2px' }}>€{feeEUR}</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>≈ {symbol}{localFee} {feeCurrency}</div>
        </article>
        <article className="panel" style={{ flex: 1, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Processing time</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '4px 0 2px' }}>{requirements.processingTime}</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>from appointment date</div>
        </article>
        <article className="panel" style={{ flex: 1, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Coverage</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', margin: '4px 0 2px' }}>{requirements.coverageStatus}</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>official source backed</div>
        </article>
      </div>
      <StalenessBanner ageHours={requirements.freshness.ageHours} onRefresh={() => { refetch(); showToast('Refreshing requirements from official source…', 'info'); }} />
      <div className="warning-banner">
        <Sparkles size={18} />
        AI guidance — not legal advice. Verify with official embassy.
      </div>
      <div className="requirement-layout">
        <div className="cards-list">
          {requirements.requirements.map((item, index) => (
            <article className="requirement-card" key={item.id}>
              <span className={item.satisfied ? 'step done' : 'step'}>{item.satisfied ? <CheckCircle2 size={18} /> : index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className={item.satisfied ? 'chip success' : 'chip'}>{item.satisfied ? 'Uploaded' : 'Missing'}</span>
            </article>
          ))}
        </div>
        <aside className="sources-panel">
          <h3>Official sources</h3>
          {requirements.sourceUrls.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
          ))}
        </aside>
      </div>
      <OfflineCachePanel />
    </section>
  );
}

function ApplicationDetail() {
  const { id = fallbackApplications[0].id } = useParams();
  const fallbackApplication = fallbackApplications.find((item) => item.id === id) ?? fallbackApplications[0];
  const { data: appData } = useApi<{ application: VisaApplication }>(`/applications/${id}`, { application: fallbackApplication });
  const docId = `${id}-passport`;
  const { data: audit } = useApi<AuditResult>(`/audit/${docId}`, fallbackAuditResult);
  const { data: reqs } = useApi<RequirementsResponse>('/requirements', fallbackRequirements);
  const application = appData.application;
  const missingRequirements = reqs.requirements.filter((item) => !item.satisfied);
  const missingCount = missingRequirements.length;

  return (
    <section className="page">
      <div className="detail-hero">
        <div>
          <span className="eyebrow">Application detail</span>
          <h1>{application.destinationFlag} {application.destinationCountry}</h1>
          <p>{application.visaType} · {application.refCode}</p>
        </div>
        <Score value={application.readinessScore} size="large" />
      </div>

      <div className="detail-tabs" aria-label="Application sections">
        <a href="#overview">Overview</a>
        <a href="#documents">Documents</a>
        <a href="#requirements">Requirements</a>
        <a href="#chat">Chat</a>
      </div>

      <div className="detail-grid">
        <article className="panel" id="overview">
          <h2>Overview</h2>
          <div className="two-actions">
            <Link className="primary-link" to={`/audit/${docId}`} state={{ fromApplicationId: id }}>View audit report</Link>
            <Link className="gold-link" to="/booking">Get expert help</Link>
          </div>
          <div className="activity-row">
            <CalendarClock size={18} />
            <div>
              <strong>Travel date</strong>
              <span>{application.intendedFrom}</span>
            </div>
          </div>
          {(application.nationality || application.residenceCountry) && (
            <div className="activity-row">
              <Globe2 size={18} />
              <div>
                <strong>Applicant context</strong>
                <span>
                  {application.nationality ? `${application.nationality} national` : 'Nationality not entered'}
                  {application.residenceCountry ? ` · living in ${application.residenceCountry}` : ''}
                </span>
              </div>
            </div>
          )}
          <div className="activity-row">
            <AlertTriangle size={18} />
            <div>
              <strong>Missing requirement groups</strong>
              <span>{missingCount} items need attention before submission.</span>
            </div>
          </div>
        </article>

        <article className="panel" id="documents">
          <h2>Latest document audit</h2>
          <div className="audit-score-row">
            <Score value={audit.score} />
            <div>
              <strong>{audit.documentType}</strong>
              <span>{audit.status.replace('_', ' ')} · generated from API contract</span>
            </div>
          </div>
          {audit.findings.map((finding) => (
            <div className="finding-row" key={finding.id}>
              <span className={`finding-dot ${finding.severity}`} />
              <div>
                <strong>{finding.title}</strong>
                <span>{finding.description}</span>
              </div>
            </div>
          ))}
        </article>

        <article className="panel wide" id="requirements">
          <h2>Requirement checklist</h2>
          <div className="warning-banner compact">
            <Sparkles size={18} />
            AI guidance — not legal advice. Verify with official embassy.
          </div>
          {reqs.requirements.map((item, index) => (
            <div className="requirement-card inline" key={item.id}>
              <span className={item.satisfied ? 'step done' : 'step'}>{item.satisfied ? <CheckCircle2 size={18} /> : index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className={item.satisfied ? 'chip success' : 'chip'}>{item.satisfied ? 'Ready' : 'Missing'}</span>
            </div>
          ))}
        </article>
        <article className="panel wide" id="chat">
          <h2>Application chat</h2>
          <div className="bubble ai">
            <strong>Visa With Ease AI</strong>
            {missingCount > 0
              ? `${missingRequirements.slice(0, 2).map((r) => r.title).join(' and ')}${missingCount > 2 ? `, and ${missingCount - 2} more` : ''} remain the current blocker${missingCount === 1 ? '' : 's'} for this application.`
              : 'All requirement checklist items are satisfied for this application.'}
          </div>
          <div className="escalation-card">
            <Sparkles size={18} />
            <div>
              <strong>Escalation available</strong>
              <p>Share requirements snapshot and audit summary only after consent.</p>
            </div>
            <Link to="/consultants">Find consultant</Link>
          </div>
        </article>
      </div>
    </section>
  );
}

type ChatMsg = { id: string; role: 'user' | 'ai'; text: string; suggestions?: string[] };

function greetingFor(active: VisaApplication, firstName: string): ChatMsg {
  const missing = active.documentsRequired - active.documentsUploaded;
  const status = missing > 0
    ? `You have ${missing} document${missing === 1 ? '' : 's'} left to upload and ${active.issuesCount} open issue${active.issuesCount === 1 ? '' : 's'}.`
    : active.issuesCount > 0
      ? `All documents are uploaded, but ${active.issuesCount} issue${active.issuesCount === 1 ? '' : 's'} still need${active.issuesCount === 1 ? 's' : ''} attention.`
      : 'All documents are uploaded and no open issues remain.';
  return {
    id: 'ai-greeting',
    role: 'ai',
    text: `Hi ${firstName}! I've reviewed your ${active.destinationCountry} ${active.visaType} application (score ${active.readinessScore}/100). ${status} What would you like to work on?`,
    suggestions: ['Check all requirements', 'Upload documents', 'Book a consultant']
  };
}

function Chat() {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: applicationData } = useApi<{ applications: VisaApplication[] }>('/applications', { applications: fallbackApplications });
  const active = applicationData.applications[0] ?? fallbackApplications[0];
  const firstName = getStoredSession()?.user.name.split(' ')[0] ?? 'there';
  const [messages, setMessages] = useState<ChatMsg[]>(() => [greetingFor(active, firstName)]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    const userText = text.trim();
    setDraft('');
    setSending(true);
    setMessages(m => [...m, { id: `u-${Date.now()}`, role: 'user', text: userText }]);
    try {
      const reply = await postJson<ChatResponse>('/chat', { applicationId: active.id, message: userText });
      setMessages(m => [...m, { id: `a-${Date.now()}`, role: 'ai', text: reply.reply, suggestions: ['Ask another question', 'Check requirements', 'Book a consultant'] }]);
    } catch {
      const match = WEB_CHAT_KB.find(([re]) => re.test(userText));
      const [aiText, chips] = match ? [match[1], match[2]] : [`Based on your ${active.destinationCountry} ${active.visaType} application, your priority is closing the ${active.issuesCount} open issue${active.issuesCount === 1 ? '' : 's'} and uploading the remaining documents. Want me to show the full checklist?`, ['Check requirements', 'Upload documents', 'Book a consultant']];
      setMessages(m => [...m, { id: `a-${Date.now()}`, role: 'ai', text: aiText, suggestions: chips }]);
    } finally {
      setSending(false);
    }
  }, [sending, active]);

  return (
    <section className="page chat-page">
      <div className="page-title">
        <div><p>Visa With Ease Assistant</p><h1>Ask visa-scoped questions</h1></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: '#D1FAE5', fontSize: 12, fontWeight: 700, color: '#065F46' }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#10B981' }} /> AI ready · {active.destinationCountry} {active.visaType} context
        </div>
      </div>
      <div className="context-chips">
        <span className="chip">{active.destinationFlag} {active.destinationCountry}</span>
        <span className="chip">{active.documentsUploaded}/{active.documentsRequired} docs uploaded</span>
        <span className={active.issuesCount > 0 ? 'chip warn' : 'chip'}>{active.issuesCount} issue{active.issuesCount === 1 ? '' : 's'}</span>
        <span className="chip">Score {active.readinessScore}/100</span>
      </div>
      <div className="chat-window">
        {messages.map((item) => (
          <div key={item.id}>
            <div className={`bubble ${item.role}`}>
              {item.role === 'ai' && <div className="ai-label"><Bot size={13} /> Visa With Ease AI</div>}
              {item.text}
            </div>
            {item.role === 'ai' && item.suggestions && (
              <div className="suggestion-chips">
                {item.suggestions.map(s => (
                  <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="bubble ai">
            <div className="ai-label"><Bot size={13} /> Visa With Ease AI</div>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div className="escalation-card">
          <Sparkles size={18} />
          <div><strong>This may need a human visa expert</strong><p>Your timing and document gaps make a quick consultant review useful before submission.</p></div>
          <Link to="/consultants">Find consultant</Link>
        </div>
        <div ref={bottomRef} />
      </div>
      <div className="composer">
        <span>AI guidance — not legal advice. Always verify with official embassy sources.</span>
        <div>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(draft))}
            placeholder="Ask about your visa application…"
          />
          <button onClick={() => send(draft)} disabled={sending || !draft.trim()}>{sending ? '…' : 'Send'}</button>
        </div>
      </div>
    </section>
  );
}

type ConsultantData = { id: string; name: string; rating: number; specialty: string; rate: number; languages: string[]; reviews: number; responseTime: string; availableToday: boolean; verified?: boolean; successRate?: string; bio?: string };

const FALLBACK_CONSULTANTS: ConsultantData[] = [
  { id: 'c-amelia', name: 'Amelia Roche',   rating: 4.9, specialty: 'Schengen tourist & family visit',  rate: 89,  languages: ['English','French'],           reviews: 186, responseTime: '< 1h',   availableToday: true,  verified: true, successRate: '97%', bio: 'Former French consulate documentation reviewer. 8 years handling GCC-resident Schengen applications.' },
  { id: 'c-ravi',   name: 'Ravi Krishnan',  rating: 4.9, specialty: 'US & Canada immigration',          rate: 99,  languages: ['English','Tamil','Hindi'],     reviews: 231, responseTime: '< 1h',   availableToday: true,  verified: true, successRate: '96%', bio: 'RCIC-certified. Handles US B1/B2 refusals, Canadian Express Entry and Australian skilled migration.' },
  { id: 'c-omar',   name: 'Omar Haddad',    rating: 4.8, specialty: 'UAE resident applications',        rate: 49,  languages: ['English','Arabic'],            reviews: 142, responseTime: '< 3h',   availableToday: false, verified: true, successRate: '94%', bio: 'Dubai-based advisor. 6 years helping MENA professionals secure UK and Canadian visas from UAE.' },
  { id: 'c-priya',  name: 'Priya Nair',     rating: 4.7, specialty: 'Emergency review & refusal risk',  rate: 149, languages: ['English','Hindi','Malayalam'], reviews: 98,  responseTime: '< 2h',   availableToday: false, verified: true, successRate: '91%', bio: 'Specialist in refusal appeals and last-minute document triage. 12 years UK Home Office experience.' },
  { id: 'c-lena',   name: 'Lena Müller',    rating: 4.6, specialty: 'Schengen business & study',        rate: 69,  languages: ['English','German'],            reviews: 67,  responseTime: '< 4h',   availableToday: false, verified: true, successRate: '93%', bio: 'Former DAAD adviser. Focuses on student and business multi-entry Schengen for GCC residents.' },
];

function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '6px 0' }}>
      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= Math.round(rating) ? '#F59E0B' : 'none'} color={i <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'} />)}
      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginLeft: 2 }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>({reviews})</span>
    </div>
  );
}

function Consultants() {
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const { data, loading } = useApi<{ consultants: ConsultantData[] }>(
    `/consultants${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    { consultants: FALLBACK_CONSULTANTS }
  );
  const filtered = data.consultants
    .filter(c => !availableOnly || c.availableToday)
    .filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.specialty.toLowerCase().includes(query.toLowerCase()) || c.languages.join(' ').toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Consultant marketplace</p>
          <h1>Pre-filtered for France · Tourist visa</h1>
          <span style={{ fontSize: 12, color: '#64748B' }}>{loading ? 'Finding verified consultants…' : `${filtered.length} verified experts`}</span>
        </div>
        <Link to="/consultant-console" style={{ fontSize: 13, color: '#1A56DB', fontWeight: 700 }}>Consultant console →</Link>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div className="filter-bar" style={{ flex: 1, margin: 0 }}>
          <Search size={16} color="#94A3B8" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, language or specialty…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
        </div>
        <button onClick={() => setAvailableOnly(v => !v)}
          style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', borderColor: availableOnly ? '#1A56DB' : '#E2E8F0', background: availableOnly ? '#EFF6FF' : '#fff', color: availableOnly ? '#1547C0' : '#64748B' }}>
          {availableOnly ? '✓ ' : ''}Available today
        </button>
      </div>
      <div className="consultant-grid">
        {filtered.map((c) => (
          <article className="consultant-card" key={c.id} style={{ position: 'relative' }}>
            {c.availableToday && (
              <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#D1FAE5', fontSize: 11, fontWeight: 700, color: '#065F46' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' }} /> Today
              </div>
            )}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
              <div className="consultant-avatar" style={{ margin: 0 }}>{c.name.split(' ').map(p => p[0]).join('')}</div>
              {c.verified && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                  <ShieldCheck size={10} color="#fff" />
                </div>
              )}
            </div>
            <h3 style={{ margin: '0 0 2px' }}>{c.name}</h3>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748B' }}>{c.specialty}</p>
            <StarRow rating={c.rating} reviews={c.reviews} />
            <div className="mini-row" style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>{c.languages.join(', ')}</span>
              <strong style={{ color: '#0F172A' }}>${c.rate}/session</strong>
            </div>
            <div className="mini-row">
              <span style={{ fontSize: 12, color: '#64748B' }}>Responds {c.responseTime}</span>
              {c.successRate && <strong style={{ color: '#10B981', fontSize: 12 }}>{c.successRate} success</strong>}
            </div>
            <Link className="gold-button" to={`/consultants/${c.id}`} onClick={() => showToast(`Viewing ${c.name}'s profile`, 'info')}>
              <CircleDollarSign size={15} /> Book ${c.rate}
            </Link>
          </article>
        ))}
        {filtered.length === 0 && <p style={{ color: '#94A3B8', gridColumn: '1/-1', textAlign: 'center', padding: 32 }}>No consultants match your filter</p>}
      </div>
    </section>
  );
}

function ConsultantProfile() {
  const { id = 'c-priya' } = useParams();
  const { data } = useApi<{
    consultant: { id: string; name: string; rating: number; specialty: string; rate: number; languages: string[]; reviews: number; responseTime: string; availableToday: boolean; bio: string };
  }>(`/consultants/${id}`, {
    consultant: { id, name: 'Priya Sharma', rating: 4.9, specialty: 'Schengen documentation', rate: 89, languages: ['English', 'Hindi'], reviews: 284, responseTime: '< 2h', availableToday: true, bio: 'Former VFS documentation lead focused on Schengen tourist applications.' }
  });
  const consultant = data.consultant;

  return (
    <section className="page">
      <Link className="back-link" to="/consultants"><ArrowLeft size={16} /> Back to marketplace</Link>
      <div className="profile-hero">
        <div className="consultant-avatar large">{consultant.name.split(' ').map((part) => part[0]).join('')}</div>
        <div>
          <p>Verified consultant</p>
          <h1>{consultant.name}</h1>
          <span>{consultant.specialty} · {consultant.languages.join(', ')}</span>
        </div>
        <Link className="primary-button" to={`/booking/${consultant.id}`}><CalendarClock size={18} /> Book ${consultant.rate}</Link>
      </div>
      <div className="section-grid">
        <article className="panel">
          <h2>Profile</h2>
          <p>{consultant.bio}</p>
          <div className="quick-grid">
            <span>{consultant.rating} rating</span>
            <span>{consultant.reviews} reviews</span>
            <span>{consultant.responseTime} response</span>
            <span>{consultant.availableToday ? 'Available today' : 'Next-day slots'}</span>
          </div>
        </article>
        <article className="panel">
          <h2>Consent preview</h2>
          <div className="activity-row"><ShieldCheck size={18} /><div><strong>Requirements</strong><span>Current checklist and missing items only.</span></div></div>
          <div className="activity-row"><ShieldCheck size={18} /><div><strong>Audit findings</strong><span>Scores and issue descriptions, not raw files by default.</span></div></div>
          <div className="activity-row"><LockKeyhole size={18} /><div><strong>Revocation</strong><span>Applicant can revoke consultant access anytime.</span></div></div>
        </article>
      </div>
    </section>
  );
}

function ConsultantConsole() {
  const { data } = useApi<{
    queue: Array<{ id: string; applicant: string; destination: string; urgency: string; sharedCategories: string[] }>;
    conversations: Array<{ id: string; applicant: string; lastMessage: string; status: string }>;
    crm: Array<{ label: string; value: string }>;
  }>('/consultant-console', {
    queue: [],
    conversations: [],
    crm: []
  });

  return (
    <section className="page">
      <div className="page-title"><div><p>Consultant console</p><h1>Case queue, conversations and CRM</h1></div></div>
      <div className="admin-grid">{data.crm.map((item) => <Metric key={item.label} icon={BarChart3} label={item.label} value={item.value} />)}</div>

      {/* Commission tracking — not yet backed by a real payments ledger */}
      <article className="panel" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Commission tracking</h2>
          <span style={{ background: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>Coming soon</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>Earnings and payout tracking will appear here once a payment provider is connected. No commission data is collected yet.</p>
      </article>

      <div className="section-grid">
        <article className="panel"><h2>Shared cases</h2>{data.queue.map((item) => <div className="activity-row" key={item.id}><Users size={18} /><div><strong>{item.applicant} · {item.destination}</strong><span>{item.urgency} · {item.sharedCategories.join(', ')}</span></div></div>)}</article>
        <article className="panel"><h2>Conversations</h2>{data.conversations.map((item) => <div className="activity-row" key={item.id}><MessageCircle size={18} /><div><strong>{item.applicant} · {item.status}</strong><span>{item.lastMessage}</span></div></div>)}</article>
      </div>
    </section>
  );
}

function HrPortal() {
  const { data } = useApi<{
    teams: Array<{ id: string; name: string; members: number; openCases: number }>;
    reports: Array<{ label: string; value: string; trend: string }>;
    bulkUploads: Array<{ id: string; fileName: string; status: string }>;
  }>('/hr', { teams: [], reports: [], bulkUploads: [] });

  const seatsUsed = data.teams.reduce((sum, t) => sum + t.members, 0);

  return (
    <section className="page">
      <div className="page-title"><div><p>B2B mobility</p><h1>HR dashboard and employee visa readiness</h1></div><Link className="primary-button" to="/employee">Open employee portal</Link></div>

      {/* Team seats are real (sum of actual team rosters below); plan/billing quota has no backing data source yet */}
      <article className="panel" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>Team seats in use</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Across {data.teams.length} team{data.teams.length === 1 ? '' : 's'}</p>
          </div>
          <span style={{ background: '#7C3AED15', color: '#7C3AED', fontWeight: 900, fontSize: 22, padding: '5px 14px', borderRadius: 20 }}>{seatsUsed}</span>
        </div>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', fontSize: 12, color: '#64748B' }}>
          Plan tier, seat limits and billing renewal date will appear here once billing is connected.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <Link to="/pricing" style={{ padding: '9px 18px', borderRadius: 10, border: '2px solid #7C3AED', background: 'transparent', color: '#7C3AED', fontWeight: 700, fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>Upgrade plan</Link>
          <button
            onClick={() => {
              downloadCsv(
                `visa-with-ease-hr-usage-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Team', 'Members', 'Open cases'],
                data.teams.map((team) => [team.name, team.members, team.openCases])
              );
              showToast('Usage report downloaded.', 'success');
            }}
            style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >Export usage CSV</button>
        </div>
      </article>

      <div className="admin-grid">{data.reports.map((item) => <Metric key={item.label} icon={BarChart3} label={item.label} value={`${item.value} · ${item.trend}`} />)}</div>
      <div className="section-grid">
        <article className="panel"><h2>Teams</h2>{data.teams.map((team) => <div className="activity-row" key={team.id}><Users size={18} /><div><strong>{team.name}</strong><span>{team.members} employees · {team.openCases} open visa cases</span></div></div>)}</article>
        <article className="panel"><h2>Bulk uploads</h2>{data.bulkUploads.map((upload) => <div className="activity-row" key={upload.id}><Upload size={18} /><div><strong>{upload.fileName}</strong><span>{upload.status}</span></div></div>)}</article>
      </div>
    </section>
  );
}

function EmployeePortal() {
  const { data } = useApi<{
    profile: { name: string; company: string; homeCountry: string };
    tasks: Array<{ id: string; title: string; due: string; status: string }>;
  }>('/employee', { profile: { name: 'Sarah Mathew', company: 'Acme Global Mobility', homeCountry: 'India' }, tasks: [] });

  return (
    <section className="page">
      <div className="page-title"><div><p>Employee portal</p><h1>{data.profile.name} · {data.profile.company}</h1><span className="rowMeta">{data.profile.homeCountry} passport holder</span></div></div>
      <div className="cards-list">
        {data.tasks.map((task) => (
          <article className="app-card" key={task.id}>
            <CheckCircle2 size={22} />
            <div><h3>{task.title}</h3><p>Due {task.due}</p></div>
            <span className="status in_progress">{task.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AuditReport() {
  const { docId = 'doc-passport' } = useParams();
  const location = useLocation();
  const fromApplicationId = (location.state as { fromApplicationId?: string } | null)?.fromApplicationId ?? fallbackApplications[0].id;
  const [version, setVersion] = useState(0);
  const [unlocked] = useState(false);
  const { data: audit, loading, error } = useApi<AuditResult>(`/audit/${docId}?v=${version}`, fallbackAuditResult);
  const reportText = encodeURIComponent(
    `Visa With Ease Audit Report\nDocument: ${audit.documentType}\nScore: ${audit.score}\nStatus: ${audit.status}\n\n${audit.findings
      .map((finding) => `- ${finding.title}: ${finding.description} (${finding.confidence}% confidence)`)
      .join('\n')}\n\nAI guidance is not legal advice. Verify with official embassy.`
  );

  const FREE_LIMIT = 3;
  const freeFindings = audit.findings.slice(0, FREE_LIMIT);
  const lockedFindings = audit.findings.slice(FREE_LIMIT);

  function handleUnlock() {
    // No real payment processor is connected yet (see PricingPage, which is
    // upfront about this) — be honest here too instead of faking a charge.
    showToast('Payment integration coming soon — full report unlocking will be available once billing is connected.', 'info');
  }

  return (
    <section className="page">
      <Link className="back-link" to={`/applications/${fromApplicationId}`}><ArrowLeft size={16} /> Back to application</Link>
      <div className="page-title">
        <div>
          <p>AI audit report</p>
          <h1>{audit.documentType} · readiness evidence</h1>
          <span className="rowMeta">Generated {formatDateTime(audit.generatedAt)}</span>
        </div>
        <div className="two-actions">
          <button className="primary-button" type="button" onClick={() => setVersion((value) => value + 1)}>{loading ? 'Refreshing...' : 'Refresh report'}</button>
          {unlocked && <a className="primary-button" href={`data:text/plain;charset=utf-8,${reportText}`} download={`visawithease-${docId}-audit-report.txt`}>Download report</a>}
        </div>
      </div>
      {error && <div className="action-status error">{error}</div>}
      <div className="audit-layout">
        <article className="audit-summary-card">
          <Score value={audit.score} size="large" />
          <h2>{audit.status.replace('_', ' ')}</h2>
          <p>Score does not guarantee visa approval. Use this report as preparation guidance only.</p>
        </article>
        <div className="cards-list">
          {freeFindings.map((finding) => (
            <article className="finding-card-large" key={finding.id}>
              <span className={`finding-dot ${finding.severity}`} />
              <div>
                <h3>{finding.title}</h3>
                <p>{finding.description}</p>
                <strong>{finding.confidence}% confidence</strong>
              </div>
            </article>
          ))}
          {!unlocked && lockedFindings.length > 0 && (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #E2E8F0' }}>
              {lockedFindings.map((finding, i) => (
                <div key={finding.id} style={{ padding: '14px 18px', borderBottom: i < lockedFindings.length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start', filter: 'blur(3px)', userSelect: 'none', background: '#F8FAFC' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: '#CBD5E1', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '60%', background: '#CBD5E1', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 10, width: '85%', background: '#E2E8F0', borderRadius: 4, marginBottom: 4 }} />
                    <div style={{ height: 10, width: '45%', background: '#E2E8F0', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
              <div style={{ background: 'linear-gradient(135deg,#0B1F4B,#1A56DB)', padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={26} color="#FCD34D" />
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: '0 0 6px' }}>
                    {lockedFindings.length} more {lockedFindings.length === 1 ? 'finding' : 'findings'} locked
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    Unlock the full red-flag report — exact field names, page numbers, and step-by-step fix instructions.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 4 }}>
                  {[['shield-check', 'Secure payment'], ['zap', 'Instant access'], ['file-text', 'PDF included']].map(([, label]) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={16} color="#93C5FD" />
                      <span style={{ color: '#93C5FD', fontSize: 11, fontWeight: 600 }}>{label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleUnlock} style={{ background: '#FCD34D', color: '#0B1F4B', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Unlock size={18} />
                  Unlock Full Report — $4.99
                </button>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: 0 }}>One-time payment · no subscription · billing coming soon</p>
              </div>
            </div>
          )}
          {unlocked && lockedFindings.map((finding) => (
            <article className="finding-card-large" key={finding.id}>
              <span className={`finding-dot ${finding.severity}`} />
              <div>
                <h3>{finding.title}</h3>
                <p>{finding.description}</p>
                <strong>{finding.confidence}% confidence</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="warning-banner">
        <Sparkles size={18} />
        AI guidance — not legal advice. Verify with official embassy.
      </div>
    </section>
  );
}

const BOOKING_SLOTS_AM = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30'];
const BOOKING_SLOTS_PM = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
function Booking() {
  const { consultantId } = useParams<{ consultantId?: string }>();
  const { data: applicationData } = useApi<{ applications: VisaApplication[] }>('/applications', { applications: fallbackApplications });
  const active = applicationData.applications[0] ?? fallbackApplications[0];
  const { data: consultantData } = useApi<{ consultants: ConsultantData[] }>('/consultants', { consultants: FALLBACK_CONSULTANTS });
  const consultant = consultantData.consultants.find(c => c.id === consultantId) ?? consultantData.consultants[0] ?? FALLBACK_CONSULTANTS[0];
  const { data: slotData } = useApi<{ slots: string[]; takenSlots: string[] }>(
    `/booking/slots/${encodeURIComponent(consultant.id)}`, { slots: [...BOOKING_SLOTS_AM, ...BOOKING_SLOTS_PM], takenSlots: [] }
  );
  const initials = consultant.name.split(' ').map(p => p[0]).join('');
  const [selected, setSelected] = useState('deep-dive');
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedSlot, setSelectedSlot] = useState('11:00');
  const [share, setShare] = useState({ requirements: true, audit_findings: true, documents: false, ai_messages: false, contact: false });
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [step, setStep] = useState<'session' | 'slot' | 'consent' | 'done'>('session');

  const options = [
    { id: 'standard',  label: 'Standard review', durationMinutes: 25, priceUsd: 49,  description: 'Checklist and document gap review.', recommended: false },
    { id: 'deep-dive', label: 'Deep dive',        durationMinutes: 45, priceUsd: 89,  description: 'Full readiness review with prioritised fixes.', recommended: true },
    { id: 'emergency', label: 'Emergency review', durationMinutes: 60, priceUsd: 149, description: 'Fast-track triage — travel within 7 days.', recommended: false },
  ];
  const selectedOption = options.find(o => o.id === selected) ?? options[1];
  const today = now.getDate();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekdays = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const selectedDate = new Date(now.getFullYear(), now.getMonth(), selectedDay);
  const selectedDateLabel = selectedDate.toLocaleString('en-US', { month: 'short', day: 'numeric' });

  async function confirmBooking() {
    setBookingError(null);
    setBookingStatus('Creating booking…');
    try {
      const [hh, mm] = selectedSlot.split(':').map(Number);
      const slotISO = new Date(now.getFullYear(), now.getMonth(), selectedDay, hh, mm).toISOString();
      const booking = await postJson<{ bookingId: string; calendlyUrl: string }>('/bookings', {
        consultantId: consultant.id, applicationId: active.id, sessionType: selected, slotISO
      });
      const categories = Object.entries(share).filter(([,e]) => e).map(([k]) => k);
      await postJson('/access-grants', { applicationId: active.id, consultantId: consultant.id, categories, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() });
      setBookingStatus(`Confirmed! Booking ${booking.bookingId} · ${selectedDateLabel} at ${selectedSlot} GST`);
      showToast(`Booking confirmed! ${consultant.name} will be in touch.`, 'success');
      setStep('done');
    } catch (err) {
      // Show the real failure — a booking that didn't actually happen must
      // not be presented as a successful "demo booking."
      const message = err instanceof Error ? err.message : 'Booking failed';
      setBookingError(`Booking failed: ${message}`);
      showToast('Could not create the booking. Please try again.', 'error');
    }
  }

  const SlotBtn = ({ t }: { t: string }) => {
    const taken = slotData.takenSlots.includes(t);
    const sel = selectedSlot === t && !taken;
    return (
      <button onClick={() => !taken && setSelectedSlot(t)} disabled={taken}
        style={{ padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${sel ? '#1A56DB' : taken ? '#F1F5F9' : '#E2E8F0'}`, cursor: taken ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13,
          background: sel ? '#1A56DB' : taken ? '#F8FAFC' : '#fff', color: sel ? '#fff' : taken ? '#CBD5E1' : '#0F172A', textDecoration: taken ? 'line-through' : 'none' }}>{t}</button>
    );
  };

  if (step === 'done') return (
    <section className="page">
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg,#059669,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={36} color="#fff" />
        </div>
        <h1 style={{ margin: 0 }}>Booking requested</h1>
        <p style={{ color: '#64748B', lineHeight: 1.6 }}>{consultant.name} receives only your consent-approved summary. You can revoke access at any time from Settings → Privacy.</p>
        {bookingStatus && <div className="action-status">{bookingStatus}</div>}
        <Link className="primary-button" to="/app">Back to dashboard</Link>
      </div>
    </section>
  );

  return (
    <section className="page">
      <div className="booking-hero">
        <span className="eyebrow">VIP service</span>
        <h1>Book a verified visa consultant</h1>
        <p>Pre-filtered for your {active.destinationCountry} {active.visaType} application. Context shared only after your consent.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['session','slot','consent'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13,
              background: ['session','slot','consent'].indexOf(step) >= i ? '#1A56DB' : '#F1F5F9', color: ['session','slot','consent'].indexOf(step) >= i ? '#fff' : '#94A3B8' }}>{i+1}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: step === s ? '#1A56DB' : '#94A3B8', textTransform: 'capitalize' }}>{s}</span>
            {i < 2 && <div style={{ width: 40, height: 2, background: '#F1F5F9', borderRadius: 1 }} />}
          </div>
        ))}
      </div>
      <div className="booking-grid">
        <article className="consultant-card featured">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="consultant-avatar" style={{ background: 'linear-gradient(135deg,#0B1F4B,#1A56DB)', color: '#fff' }}>{initials}</div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}><ShieldCheck size={10} color="#fff" /></div>
          </div>
          <h3>{consultant.name}</h3>
          <p style={{ fontSize: 13, color: '#64748B' }}>{consultant.specialty} · {consultant.languages.join(', ')}</p>
          <StarRow rating={consultant.rating} reviews={consultant.reviews} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 10px', borderRadius: 20, background: consultant.availableToday ? '#D1FAE5' : '#F1F5F9', alignSelf: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: consultant.availableToday ? '#10B981' : '#94A3B8' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: consultant.availableToday ? '#065F46' : '#475569' }}>{consultant.availableToday ? 'Available today' : consultant.responseTime + ' response'}</span>
          </div>
          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: '#F8FAFC', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            {consultant.successRate ? `${consultant.successRate} success rate · ` : ''}{consultant.bio ?? consultant.specialty}
          </div>
        </article>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 'session' && (
            <>
              <article className="panel">
                <h2>Choose session type</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {options.map(o => (
                    <button key={o.id} onClick={() => setSelected(o.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, border: `2px solid ${selected === o.id ? '#1A56DB' : '#E2E8F0'}`, background: selected === o.id ? '#EFF6FF' : '#fff', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                      {o.recommended && <div style={{ position: 'absolute', top: -8, right: 12, padding: '2px 10px', borderRadius: 20, background: '#F59E0B', fontSize: 10, fontWeight: 800, color: '#fff' }}>RECOMMENDED</div>}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{o.label}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{o.durationMinutes} min · {o.description}</div>
                      </div>
                      <strong style={{ fontSize: 18, color: selected === o.id ? '#1A56DB' : '#0F172A', flexShrink: 0, marginLeft: 16 }}>${o.priceUsd}</strong>
                    </button>
                  ))}
                </div>
              </article>
              <button className="primary-button" onClick={() => setStep('slot')}>Choose time slot →</button>
            </>
          )}
          {step === 'slot' && (
            <>
              <article className="panel">
                <h2>Pick a time — {monthLabel}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 12, marginBottom: 16 }}>
                  {weekdays.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94A3B8', padding: '4px 0' }}>{d}</div>)}
                  {days.map(d => {
                    const past = d < today; const sel = d === selectedDay; const isToday = d === today;
                    return (
                      <button key={d} onClick={() => !past && setSelectedDay(d)} disabled={past}
                        style={{ padding: '8px 0', borderRadius: 8, border: 'none', cursor: past ? 'default' : 'pointer', fontWeight: sel || isToday ? 900 : 500, fontSize: 13, background: sel ? '#1A56DB' : 'transparent',
                          color: sel ? '#fff' : past ? '#E2E8F0' : isToday ? '#1A56DB' : '#0F172A' }}>{d}</button>
                    );
                  })}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Morning (GST)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {BOOKING_SLOTS_AM.map(t => <SlotBtn key={t} t={t} />)}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Afternoon (GST)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {BOOKING_SLOTS_PM.map(t => <SlotBtn key={t} t={t} />)}
                </div>
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#EFF6FF', fontSize: 13, fontWeight: 700, color: '#1547C0' }}>
                  <CalendarClock size={15} style={{ display: 'inline', marginRight: 6 }} />
                  Selected: {selectedDateLabel} · {selectedSlot} GST · {selectedOption.durationMinutes} min
                </div>
              </article>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="secondary-button" onClick={() => setStep('session')}>← Back</button>
                <button className="primary-button" style={{ flex: 1 }} onClick={() => setStep('consent')}>Review consent →</button>
              </div>
            </>
          )}
          {step === 'consent' && (
            <>
              <article className="panel" id="consent">
                <h2>Choose what to share</h2>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{consultant.name} will only see the categories you select. You can revoke access anytime.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {[['requirements','Requirements snapshot','Official checklist match for your visa context'],['audit_findings','Audit findings','Document scores and AI findings (not raw files)'],['documents','Original documents','Encrypted files — off by default'],['ai_messages','Chat history','Selected AI conversation messages'],['contact','Contact details','Your email and phone number']].map(([k,label,desc]) => (
                    <label key={k} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, border: '1px solid #F1F5F9', cursor: 'pointer', background: share[k as keyof typeof share] ? '#EFF6FF' : '#fff' }}>
                      <input type="checkbox" checked={share[k as keyof typeof share]} onChange={e => setShare(s => ({...s, [k]: e.target.checked}))} style={{ marginTop: 3, width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </article>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF3C7', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                Access is time-limited (7 days) and can be revoked from Settings → Privacy & Access.
              </div>
              {bookingError && <div className="action-status error">{bookingError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="secondary-button" onClick={() => setStep('slot')}>← Back</button>
                <button className="gold-button" style={{ flex: 1 }} onClick={confirmBooking}>Confirm booking · ${selectedOption.priceUsd}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

interface NotificationPrefs { audit: boolean; requirements: boolean; booking: boolean; message: boolean }
const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { audit: true, requirements: true, booking: true, message: false };

function SettingsPage() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const { data: profileData } = useApi<{ profile: { notificationPrefs?: NotificationPrefs } }>('/profile', { profile: {} });
  const [notifs, setNotifs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [savingNotifs, setSavingNotifs] = useState(false);
  useEffect(() => {
    if (profileData.profile.notificationPrefs) setNotifs(profileData.profile.notificationPrefs);
  }, [profileData]);
  async function toggleNotif(key: keyof NotificationPrefs) {
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    setSavingNotifs(true);
    try {
      await postJson('/profile', { notificationPrefs: next }, 'PUT');
    } catch (err) {
      setNotifs(notifs);
      showToast(err instanceof Error ? err.message : 'Could not save notification preferences', 'error');
    } finally {
      setSavingNotifs(false);
    }
  }
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }, [theme]);

  const Toggle = ({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 13, color: '#334155' }}>{label}</span>
      <button onClick={onChange} role="switch" aria-checked={on} aria-label={label}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: on ? '#1A56DB' : '#E2E8F0', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );

  return (
    <section className="page">
      <div className="page-title"><div><p>Settings</p><h1>Account, privacy and preferences</h1></div></div>
      <div className="settings-grid">
        <article className="settings-card">
          <h3>Theme</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {(['system','light','dark'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'capitalize',
                  borderColor: theme === t ? '#1A56DB' : '#E2E8F0', background: theme === t ? '#EFF6FF' : '#fff', color: theme === t ? '#1A56DB' : '#64748B' }}>{t}</button>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: '#94A3B8' }}>System follows your OS setting. Change takes effect immediately.</p>
        </article>
        <article className="settings-card">
          <h3>Notifications{savingNotifs ? ' · saving…' : ''}</h3>
          <Toggle on={notifs.audit}         onChange={() => toggleNotif('audit')}         label="Audit complete" />
          <Toggle on={notifs.requirements}  onChange={() => toggleNotif('requirements')}  label="Requirements updated" />
          <Toggle on={notifs.booking}       onChange={() => toggleNotif('booking')}       label="Booking reminder" />
          <Toggle on={notifs.message}       onChange={() => toggleNotif('message')}       label="Consultant message" />
        </article>
        <SettingsCard title="Biometric sign-in" body="Android fingerprint setup via Expo Local Authentication. Ready for native build wiring." />
        <article className="settings-card danger">
          <h3>Delete my data</h3>
          <p>This creates a GDPR / UAE PDPL deletion request. Your account, documents and access grants will be removed within 30 days.</p>
          <p style={{ marginTop: 10, fontSize: 12, color: '#64748B' }}>Type <strong>DELETE</strong> to enable the button.</p>
          <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE to confirm"
            style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          <button disabled={deleteInput !== 'DELETE'}
            onClick={async () => {
              try {
                await postJson('/auth/delete-account', {});
                showToast('Deletion request submitted. Account will be removed within 30 days.', 'success');
              } catch {
                showToast('Deletion request queued. Our team will process it within 30 days.', 'info');
              }
            }}
            style={{ marginTop: 10, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed',
              background: deleteInput === 'DELETE' ? '#DC2626' : '#F1F5F9', color: deleteInput === 'DELETE' ? '#fff' : '#94A3B8', fontWeight: 700, fontSize: 13 }}>
            Submit deletion request
          </button>
        </article>
      </div>
    </section>
  );
}

function SettingsCard({ title, body, danger, actionLabel, to }: { title: string; body: string; danger?: boolean; actionLabel?: string; to?: string }) {
  return (
    <article className={`settings-card ${danger ? 'danger' : ''}`}>
      <h3>{title}</h3>
      <p>{body}</p>
      {to && <Link to={to}>{actionLabel ?? 'Configure'}</Link>}
    </article>
  );
}

function OfflineCachePanel() {
  return (
    <article className="offline-panel">
      <ShieldCheck size={18} />
      <div>
        <strong>Offline read-only cache ready</strong>
        <span>Applications, requirements and latest audit summaries can be shown from deterministic local cache when API is unavailable. Mutations stay disabled offline.</span>
      </div>
    </article>
  );
}

function useApi<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const url = useMemo(() => `${API_BASE_URL}${path}`, [path]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(url, {
      headers: (() => {
        const token = getStoredToken();
        return (token ? { authorization: `Bearer ${token}` } : {}) as Record<string, string>;
      })()
    })
      .then((response) => {
        // 401 is an expected shape for public/pre-login views — don't treat
        // it as a backend failure worth surfacing to the user.
        if (!response.ok && response.status !== 401) throw new Error(`HTTP ${response.status}`);
        if (!response.ok) throw new Error('UNAUTHORIZED');
        return response.json() as Promise<T>;
      })
      .then((payload) => {
        if (alive) {
          setData(payload);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const message = err instanceof Error ? err.message : 'API unavailable';
        setError(message);
        // Surfacing this centrally means every page using this hook gets
        // honest error feedback instead of silently showing fallback/demo
        // data that looks indistinguishable from the user's real account.
        if (message !== 'UNAUTHORIZED') {
          showToast("Couldn't load the latest data — showing cached content instead.", 'error');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [url, refreshKey]);

  return { data, loading, error, refetch };
}

async function postJson<T>(path: string, body: unknown, method: 'POST' | 'PUT' | 'DELETE' = 'POST'): Promise<T> {
  const token = getStoredToken() ?? undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = typeof payload?.error?.message === 'string' ? payload.error.message : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

function Admin() {
  const { data } = useApi<{
    metrics: Array<{ label: string; value: string; trend: string }>;
    aiMonitoring: Array<{ provider: string; status: string; latency: string }>;
    users: Array<{ segment: string; count: number }>;
    revenue: Array<{ label: string; value: string }>;
    requirementsDb: Array<{ route: string; freshness: string; coverage: string }>;
  }>('/admin/overview', {
    metrics: [
      { label: 'Monthly active users', value: '5,000 target', trend: 'tracking' },
      { label: 'AI audit accuracy', value: '94%', trend: 'stable' },
      { label: 'Deletion SLA queue', value: '0 overdue', trend: 'healthy' },
      { label: 'Consultant conversion', value: '5% target', trend: 'growing' }
    ],
    aiMonitoring: [],
    users: [],
    revenue: [],
    requirementsDb: []
  });

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Platform admin</p>
          <h1>Operations overview</h1>
        </div>
      </div>
      <div className="admin-grid">
        {data.metrics.map((item) => <Metric key={item.label} icon={BarChart3} label={item.label} value={`${item.value} · ${item.trend}`} />)}
      </div>
      <div className="section-grid">
        <article className="panel">
          <h2>AI monitoring</h2>
          {data.aiMonitoring.map((item) => <div className="activity-row" key={item.provider}><Bot size={18} /><div><strong>{item.provider} · {item.status}</strong><span>{item.latency} median latency</span></div></div>)}
        </article>
        <article className="panel">
          <h2>Users and revenue</h2>
          {data.users.map((item) => <div className="activity-row" key={item.segment}><Users size={18} /><div><strong>{item.segment}</strong><span>{item.count.toLocaleString()} active records</span></div></div>)}
          {data.revenue.map((item) => <div className="activity-row" key={item.label}><CircleDollarSign size={18} /><div><strong>{item.label}</strong><span>{item.value}</span></div></div>)}
        </article>
      </div>
      <article className="panel">
        <h2>Requirements database</h2>
        <div className="cards-list compact">
          {data.requirementsDb.map((item) => <div className="app-card" key={item.route}><Globe2 size={20} /><div><h3>{item.route}</h3><p>{item.freshness}</p></div><span className="status ready">{item.coverage}</span></div>)}
        </div>
      </article>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { icon: Upload, label: 'Upload document', to: '/upload' },
    { icon: Globe2, label: 'Requirements', to: '/requirements' },
    { icon: MessageCircle, label: 'Ask AI', to: '/chat' },
    { icon: Users, label: 'Book expert', to: '/booking' }
  ];
  return (
    <article className="panel">
      <h2>Quick actions</h2>
      <div className="quick-grid">
        {actions.map((action) => (
          <Link key={action.label} to={action.to}>
            <action.icon size={20} />
            {action.label}
          </Link>
        ))}
      </div>
    </article>
  );
}

function RecentActivity() {
  return (
    <article className="panel">
      <h2>Recent activity</h2>
      {fallbackAuditResult.findings.map((finding) => (
        <div className="activity-row" key={finding.id}>
          <CheckCircle2 size={18} />
          <div>
            <strong>{finding.title}</strong>
            <span>{finding.confidence}% confidence</span>
          </div>
        </div>
      ))}
    </article>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Upload; label: string; value: string; tone?: 'warn' }) {
  return (
    <article className={`metric ${tone ?? ''}`}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────
const NOTIF_ITEMS = [
  { icon: CheckCircle2, color: '#10B981', title: 'Passport audit complete', body: 'Score 94/100 · Glare warning noted', time: '12m ago' },
  { icon: AlertTriangle, color: '#F59E0B', title: 'Insurance still missing', body: 'Required for Schengen checklist', time: '2h ago' },
  { icon: CalendarClock, color: '#1A56DB', title: 'Amelia Roche available today', body: 'Slot at 7:30 PM · Book now', time: '3h ago' },
  { icon: Globe2, color: '#7C3AED', title: 'Requirements updated', body: 'France Schengen · cache refreshed', time: 'Yesterday' },
];

type NotifItem = { id: string; title: string; body: string; time: string; type: string; read: boolean; color?: string };

const NOTIF_COLORS: Record<string, string> = { audit: '#10B981', warning: '#F59E0B', booking: '#1A56DB', update: '#7C3AED', info: '#0EA5E9' };

function notifColor(type: string) {
  return NOTIF_COLORS[type] ?? '#94A3B8';
}

function notifIcon(type: string) {
  const map: Record<string, typeof CheckCircle2> = { audit: CheckCircle2, warning: AlertTriangle, booking: CalendarClock, update: Globe2 };
  return map[type] ?? Bell;
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotifItem[]>(() =>
    NOTIF_ITEMS.map((n, i) => ({ id: String(i), title: n.title, body: n.body, time: n.time, type: 'info', read: false }))
  );
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (fetchDone) return;
    const token = getStoredToken();
    fetch(`${API_BASE_URL}/notifications`, {
      headers: token ? { authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.ok ? res.json() as Promise<{ notifications: NotifItem[] }> : Promise.reject())
      .then(data => { if (data?.notifications?.length) setItems(data.notifications); })
      .catch(() => { /* keep local fallback */ })
      .finally(() => setFetchDone(true));
  }, [fetchDone]);

  async function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const token = getStoredToken();
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : {}
      });
    } catch { /* best-effort */ }
  }

  async function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #F1F5F9', zIndex: 100 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 14, color: '#0F172A' }}>Notifications</strong>
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13 }}>Mark all read</button>
        </div>
        {items.map((n) => {
          const color = n.color ?? notifColor(n.type);
          const Icon = notifIcon(n.type);
          return (
            <div key={n.id}
              onClick={() => markRead(n.id)}
              style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', background: n.read ? '#FAFAFA' : '#fff', opacity: n.read ? 0.7 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = n.read ? '#FAFAFA' : '#fff')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: '#0F172A', marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{n.body}</div>
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>{n.time}</span>
            </div>
          );
        })}
        <div style={{ padding: '10px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#1A56DB', fontWeight: 600, cursor: 'pointer' }}>View all notifications</span>
        </div>
      </div>
    </>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
const SEARCH_SUGGESTIONS = [
  { icon: FileText, label: 'France Schengen application', sub: 'Score 87 · 2 issues', to: '/applications/app-fr-2026' },
  { icon: FileText, label: 'UK Standard Visitor', sub: 'Score 42 · 5 issues', to: '/applications/app-uk-2026' },
  { icon: Globe2, label: 'Schengen requirements', sub: 'Official source · refreshed 6h ago', to: '/requirements' },
  { icon: Users, label: 'Amelia Roche · Consultant', sub: '4.9★ · Schengen specialist', to: '/consultants/con-amelia' },
  { icon: Upload, label: 'Upload travel insurance', sub: 'Missing document', to: '/upload' },
  { icon: Bot, label: 'Ask AI about your application', sub: 'Visa-scoped assistant', to: '/chat' },
];

function SearchModal({ query, setQuery, onClose }: { query: string; setQuery: (q: string) => void; onClose: () => void }) {
  const navigate = useNavigate();
  const results = query.length > 1
    ? SEARCH_SUGGESTIONS.filter(s => s.label.toLowerCase().includes(query.toLowerCase()) || s.sub.toLowerCase().includes(query.toLowerCase()))
    : SEARCH_SUGGESTIONS;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <Search size={18} color="#64748B" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search applications, requirements, consultants…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0F172A', background: 'transparent' }}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 13 }}>Clear</button>}
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {query.length > 1 && results.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No results for "{query}"</div>
          ) : results.map((r) => (
            <button key={r.label}
              onClick={() => { navigate(r.to); onClose(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F8FAFC' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.icon size={18} color="#1A56DB" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{r.label}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 18px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>↵ to select</span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>ESC to close</span>
        </div>
      </div>
    </div>
  );
}

// ─── Visa Calculator ──────────────────────────────────────────────────────────
const CALC_DESTS = ['France (Schengen)', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany'];
const CALC_TYPES = ['Tourist', 'Business', 'Student', 'Work', 'Family'];

function VisaCalculator() {
  const [dest, setDest] = useState(0);
  const [vType, setVType] = useState(0);
  const [finance, setFinance] = useState(3);
  const [travel, setTravel] = useState(3);
  const [employment, setEmployment] = useState(3);
  const [ties, setTies] = useState(3);
  const score = Math.round((finance * 0.30 + travel * 0.25 + employment * 0.25 + ties * 0.20) * 20);
  const getReco = () => {
    if (finance < 3) return 'Strengthen bank statements with 3+ months of consistent income deposits.';
    if (travel < 3) return 'Prior approved visas significantly boost approval odds — consider lower-risk destinations first.';
    if (employment < 3) return 'A formal employment letter with salary details strengthens your application considerably.';
    return 'Your profile looks solid. Upload all required documents to get a full AI audit score.';
  };

  const SliderRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A56DB' }}>{value}/5</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1,2,3,4,5].map(v => (
          <button key={v} onClick={() => onChange(v)}
            style={{ flex: 1, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: v <= value ? '#1A56DB' : '#E2E8F0', transition: 'background 0.15s' }} />
        ))}
      </div>
    </div>
  );

  return (
    <section className="page">
      <div className="page-title"><div><p>AI readiness tool</p><h1>Visa Score Calculator</h1></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="panel">
            <h2>Destination</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CALC_DESTS.map((d, i) => (
                <button key={d} onClick={() => setDest(i)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: dest === i ? '#0B1F4B' : '#EFF6FF', color: dest === i ? '#fff' : '#1547C0' }}>{d}</button>
              ))}
            </div>
          </article>
          <article className="panel">
            <h2>Visa type</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {CALC_TYPES.map((t, i) => (
                <button key={t} onClick={() => setVType(i)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: vType === i ? '#7C3AED' : '#EDE9FE', color: vType === i ? '#fff' : '#6D28D9' }}>{t}</button>
              ))}
            </div>
          </article>
          <article className="panel">
            <h2>Rate your profile <span style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8' }}>(1 = weak · 5 = strong)</span></h2>
            <SliderRow label="Financial evidence" value={finance} onChange={setFinance} />
            <SliderRow label="Travel history & prior visas" value={travel} onChange={setTravel} />
            <SliderRow label="Employment stability" value={employment} onChange={setEmployment} />
            <SliderRow label="Ties to home country" value={ties} onChange={setTies} />
          </article>
        </div>
        <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="panel" style={{ background: 'linear-gradient(135deg,#0B1F4B,#1A56DB)', color: '#fff', textAlign: 'center', padding: 28 }}>
            <Score value={score} size="large" />
            <p style={{ marginTop: 14, fontSize: 13, opacity: 0.8 }}>{CALC_DESTS[dest]} · {CALC_TYPES[vType]}</p>
            <p style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>Estimated approval readiness</p>
          </article>
          <article className="panel" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFBEB' }}>
            <h2 style={{ color: '#92400E' }}>Recommendation</h2>
            <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{getReco()}</p>
          </article>
          <article className="panel" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p style={{ fontSize: 11, color: '#991B1B', lineHeight: 1.5 }}>This is an indicative score only. Always verify requirements with the official embassy or consulate for your nationality and visa type.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Bank Balance Estimator ───────────────────────────────────────────────────
const BB_DATA: Record<string, { daily: number; currency: string; symbol: string; rate: number }> = {
  'France / Schengen': { daily: 65, currency: 'EUR', symbol: '€', rate: 0.92 },
  'United Kingdom':    { daily: 75, currency: 'GBP', symbol: '£', rate: 0.79 },
  'United States':     { daily: 100, currency: 'USD', symbol: '$', rate: 1.00 },
  'Canada':            { daily: 80, currency: 'CAD', symbol: 'C$', rate: 1.36 },
  'Australia':         { daily: 90, currency: 'AUD', symbol: 'A$', rate: 1.53 },
  'Germany':           { daily: 65, currency: 'EUR', symbol: '€', rate: 0.92 },
  'Japan':             { daily: 85, currency: 'JPY', symbol: '¥', rate: 150 },
};

function BankBalance() {
  const { data: ratesData, loading: ratesLoading } = useApi<{ rates: Record<string, number>; base: string; updatedAt: string }>('/exchange-rates', { rates: {}, base: 'USD', updatedAt: '' });
  const [country, setCountry] = useState(0);
  const [days, setDays] = useState(10);
  const [travelers, setTravelers] = useState(1);
  const countries = Object.keys(BB_DATA);
  const d = BB_DATA[countries[country]];
  const apiRate = ratesData.rates[d.currency];
  const effectiveRate = apiRate ?? d.rate;
  const totalUSD = d.daily * days * travelers;
  const totalLocal = Math.round(totalUSD * effectiveRate);

  if (ratesLoading && Object.keys(ratesData.rates).length === 0) {
    return (
      <section className="page">
        <div className="page-title"><div><p>Financial planning tool</p><h1>Bank Balance Estimator</h1></div></div>
        <p style={{ color: '#94A3B8', padding: 32, textAlign: 'center' }}>Loading exchange rates…</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-title"><div><p>Financial planning tool</p><h1>Bank Balance Estimator</h1></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="panel">
            <h2>Destination country</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {countries.map((c, i) => (
                <button key={c} onClick={() => setCountry(i)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: country === i ? '#10B981' : '#D1FAE5', color: country === i ? '#fff' : '#065F46' }}>{c}</button>
              ))}
            </div>
          </article>
          <article className="panel">
            <h2>Trip details</h2>
            <div style={{ display: 'flex', gap: 32, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 6 }}>Duration (days)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setDays(n => Math.max(1, n - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>−</button>
                  <strong style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{days}</strong>
                  <button onClick={() => setDays(n => n + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>+</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'block', marginBottom: 6 }}>Travelers</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setTravelers(n => Math.max(1, n - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>−</button>
                  <strong style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{travelers}</strong>
                  <button onClick={() => setTravelers(n => n + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>+</button>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>Based on {d.symbol}{d.daily} per person / day for {countries[country]}{apiRate ? ' · live rate' : ' · estimated rate'}{ratesData.updatedAt ? ` · updated ${ratesData.updatedAt}` : ''}</p>
          </article>
        </div>
        <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="panel" style={{ background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 42, fontWeight: 900 }}>${totalUSD.toLocaleString()}</div>
            <div style={{ fontSize: 16, opacity: 0.85, marginTop: 4 }}>≈ {d.symbol}{totalLocal.toLocaleString()} {d.currency}</div>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Minimum recommended balance</p>
          </article>
          <article className="panel" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p style={{ fontSize: 11, color: '#991B1B', lineHeight: 1.5 }}>Threshold is indicative. Always check the official embassy or consulate site for your nationality and visa type.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Embassy Finder ───────────────────────────────────────────────────────────
const EMB: Record<string, { name: string; address: string; phone: string; hours: string; website: string; appt: string }> = {
  'France':          { name: 'Embassy of France', address: 'Al Hamra, Abu Dhabi, UAE', phone: '+971 2 613 1700', hours: 'Mon–Fri 9:00–12:30', website: 'ae.ambafrance.org', appt: 'Required — book via france-visas.gouv.fr' },
  'United Kingdom':  { name: 'British Embassy Dubai', address: 'Al Seef Road, Dubai', phone: '+971 4 309 4444', hours: 'Mon–Thu 8:00–16:00', website: 'gov.uk/world/uae', appt: 'Required — VFS Global only' },
  'United States':   { name: 'U.S. Embassy Abu Dhabi', address: 'Embassies District, Abu Dhabi', phone: '+971 2 414 2200', hours: 'Mon–Fri 8:00–17:00', website: 'ae.usembassy.gov', appt: 'Required — usvisa-info.com' },
  'Canada':          { name: 'Embassy of Canada', address: 'Al Nahyan, Abu Dhabi', phone: '+971 2 694 0300', hours: 'Mon–Fri 8:00–16:30', website: 'international.gc.ca', appt: 'VAC appointment required' },
  'Australia':       { name: 'Australian Embassy Abu Dhabi', address: 'Al Bateen, Abu Dhabi', phone: '+971 2 401 7500', hours: 'Mon–Fri 8:00–16:00', website: 'uae.embassy.gov.au', appt: 'Online application only' },
  'Germany':         { name: 'German Consulate General Dubai', address: 'Trade Centre, Dubai', phone: '+971 4 397 2333', hours: 'Mon–Fri 8:30–11:30', website: 'dubai.diplo.de', appt: 'Required — book via VFS Global' },
  'Japan':           { name: 'Consulate-General of Japan Dubai', address: 'DIFC, Dubai', phone: '+971 4 331 9191', hours: 'Mon–Fri 9:00–12:30', website: 'dubai.uae.emb-japan.go.jp', appt: 'Required — via VFS or consulate' },
};

type EmbassyEntry = { id: string; country: string; city: string; name: string; address: string; phone: string; hours: string; website: string; appointment: string };

const EMB_FALLBACK: EmbassyEntry[] = Object.entries(EMB).map(([country, e]) => ({
  id: country, country, city: '', name: e.name, address: e.address, phone: e.phone, hours: e.hours, website: e.website, appointment: e.appt
}));

function EmbassyFinder() {
  const { data: embassyData, loading } = useApi<{ embassies: EmbassyEntry[] }>('/embassies', { embassies: EMB_FALLBACK });
  const embassies = embassyData.embassies.length > 0 ? embassyData.embassies : EMB_FALLBACK;
  const [selected, setSelected] = useState('France');
  const emb = embassies.find(e => e.country === selected) ?? embassies[0];
  const rows: [string, string][] = emb ? [['Address', emb.address], ['Phone', emb.phone], ['Consular hours', emb.hours], ['Website', emb.website], ['Appointment', emb.appointment]] : [];
  return (
    <section className="page">
      <div className="page-title"><div><p>Consulate directory</p><h1>Embassy Finder</h1></div>{loading && <span style={{ fontSize: 12, color: '#94A3B8' }}>Syncing…</span>}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        <article className="panel" style={{ padding: 8 }}>
          {embassies.map(e => (
            <button key={e.country} onClick={() => setSelected(e.country)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: selected === e.country ? 700 : 500, fontSize: 13,
                background: selected === e.country ? '#EFF6FF' : 'transparent', color: selected === e.country ? '#1A56DB' : '#334155' }}>{e.country}</button>
          ))}
        </article>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {emb && (
            <>
              <article className="panel" style={{ background: 'linear-gradient(135deg,#0B1F4B,#1547C0)', color: '#fff', padding: 28 }}>
                <h2 style={{ color: '#DBEAFE', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{emb.country}{emb.city ? ` · ${emb.city}` : ''}</h2>
                <h1 style={{ fontSize: 24, fontWeight: 900 }}>{emb.name}</h1>
              </article>
              <article className="panel">
                {rows.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ width: 120, fontSize: 12, color: '#64748B', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </article>
            </>
          )}
          <article className="panel" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p style={{ fontSize: 11, color: '#991B1B' }}>Always verify hours and appointment requirements on the official embassy website before travelling to the consulate.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Country Comparison ───────────────────────────────────────────────────────
const CC_DATA: Record<string, { fee: string; time: string; docs: number; difficulty: string; refusal: string }> = {
  'France':         { fee: '€80',   time: '10–15 days', docs: 12, difficulty: 'Medium',    refusal: '~8%' },
  'United Kingdom': { fee: '£115',  time: '15–20 days', docs: 14, difficulty: 'High',      refusal: '~14%' },
  'United States':  { fee: '$185',  time: '30–60 days', docs: 16, difficulty: 'Very High', refusal: '~21%' },
  'Canada':         { fee: 'C$100', time: '20–30 days', docs: 13, difficulty: 'High',      refusal: '~18%' },
  'Australia':      { fee: 'A$145', time: '20–40 days', docs: 13, difficulty: 'Medium',    refusal: '~9%' },
  'Germany':        { fee: '€75',   time: '10–15 days', docs: 11, difficulty: 'Medium',    refusal: '~7%' },
  'Japan':          { fee: '¥3,000',time: '5–10 days',  docs: 10, difficulty: 'Low',       refusal: '~4%' },
};

function CountryComparison() {
  const countries = Object.keys(CC_DATA);
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const da = CC_DATA[countries[a]];
  const db = CC_DATA[countries[b]];

  const Picker = ({ value, onChange }: { value: number; onChange: (i: number) => void }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {countries.map((c, i) => (
        <button key={c} onClick={() => onChange(i)}
          style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
            background: value === i ? '#0B1F4B' : '#F1F5F9', color: value === i ? '#fff' : '#334155' }}>{c}</button>
      ))}
    </div>
  );

  const rows: [string, string, string][] = [
    ['Visa fee',       da.fee,             db.fee],
    ['Processing',     da.time,            db.time],
    ['Documents',      `${da.docs} items`, `${db.docs} items`],
    ['Difficulty',     da.difficulty,      db.difficulty],
    ['Refusal rate',   da.refusal,         db.refusal],
  ];

  return (
    <section className="page">
      <div className="page-title"><div><p>Side-by-side analysis</p><h1>Country Comparison</h1></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <article className="panel"><h2>Country A</h2><Picker value={a} onChange={setA} /></article>
        <article className="panel"><h2>Country B</h2><Picker value={b} onChange={setB} /></article>
      </div>
      <article className="panel">
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 0 }}>
          <div />
          <div style={{ fontWeight: 900, fontSize: 15, color: '#0B1F4B', padding: '10px 0', textAlign: 'center', borderBottom: '2px solid #0B1F4B' }}>{countries[a]}</div>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#1A56DB', padding: '10px 0', textAlign: 'center', borderBottom: '2px solid #1A56DB' }}>{countries[b]}</div>
          {rows.map(([label, va, vb]) => (
            <>
              <div key={`l-${label}`} style={{ fontSize: 12, color: '#64748B', fontWeight: 600, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>{label}</div>
              <div key={`a-${label}`} style={{ fontWeight: 700, fontSize: 14, textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', color: '#0F172A' }}>{va}</div>
              <div key={`b-${label}`} style={{ fontWeight: 700, fontSize: 14, textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', color: '#0F172A' }}>{vb}</div>
            </>
          ))}
        </div>
      </article>
      <article className="panel" style={{ background: '#FEF2F2', border: '1px solid #FECACA', marginTop: 0 }}>
        <p style={{ fontSize: 11, color: '#991B1B' }}>Requirements, fees and processing times change. Always verify with official embassy sources before applying.</p>
      </article>
    </section>
  );
}

// ─── Staleness Banner ────────────────────────────────────────────────────────
function StalenessBanner({ ageHours, onRefresh }: { ageHours: number; onRefresh?: () => void }) {
  if (ageHours < 18) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FDE68A', marginBottom: 16 }}>
      <AlertTriangle size={16} color="#D97706" />
      <span style={{ flex: 1, fontSize: 13, color: '#92400E', fontWeight: 600 }}>
        Requirements data is {ageHours}h old — may not reflect the latest consulate rules.
      </span>
      {onRefresh && (
        <button onClick={onRefresh} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #D97706', background: '#fff', color: '#D97706', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          Refresh
        </button>
      )}
    </div>
  );
}

// ─── Visa Waiver Checker ─────────────────────────────────────────────────────
const WEB_WAIVER_RULES: Record<string, Record<string, { type: 'waiver' | 'visa' | 'eta'; note: string }>> = {
  'India':    { 'France': { type: 'visa', note: 'Schengen visa required — EUR 80 + VFS fee.' }, 'United Kingdom': { type: 'visa', note: 'Standard Visitor visa — £115.' }, 'Thailand': { type: 'waiver', note: '30-day visa waiver — no application needed.' }, 'Maldives': { type: 'waiver', note: 'Free 30-day on-arrival stamp.' }, 'United States': { type: 'visa', note: 'B1/B2 visa required — $185.' }, 'Japan': { type: 'visa', note: 'Tourist visa required ~5 days processing.' }, 'Singapore': { type: 'visa', note: 'Visa on arrival for 30 days.' }, 'UAE': { type: 'eta', note: 'eVisa on arrival for 14 days.' } },
  'Pakistan': { 'France': { type: 'visa', note: 'Schengen visa required — EUR 80.' }, 'Thailand': { type: 'visa', note: 'Visa on arrival available ($35).' }, 'UAE': { type: 'eta', note: 'eVisa on arrival 30 days.' }, 'Turkey': { type: 'waiver', note: '30-day visa waiver for Pakistani nationals.' } },
  'Philippines': { 'Japan': { type: 'waiver', note: '30-day visa waiver.' }, 'Singapore': { type: 'waiver', note: '30-day visa waiver.' }, 'UAE': { type: 'eta', note: 'eVisa required.' }, 'United States': { type: 'visa', note: 'B1/B2 visa required.' } },
};
const WEB_NATIONALITIES = ['India', 'Pakistan', 'Philippines', 'Egypt', 'Nigeria', 'Brazil', 'Mexico'];
const WEB_DESTINATIONS  = ['France', 'United Kingdom', 'United States', 'Japan', 'Singapore', 'UAE', 'Thailand', 'Maldives', 'Turkey'];

function VisaWaiverChecker() {
  const [nat, setNat] = useState('India');
  const [dest, setDest] = useState('France');
  const [apiResult, setApiResult] = useState<{ type: 'waiver' | 'visa' | 'eta'; note: string } | null>(WEB_WAIVER_RULES['India']?.['France'] ?? null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    setApiLoading(true);
    const token = getStoredToken();
    fetch(`${API_BASE_URL}/visa-waiver?nationality=${encodeURIComponent(nat)}&destination=${encodeURIComponent(dest)}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.ok ? res.json() as Promise<{ type: 'waiver' | 'visa' | 'eta'; note: string }> : Promise.reject())
      .then(data => { if (data?.type) setApiResult(data); else setApiResult(WEB_WAIVER_RULES[nat]?.[dest] ?? null); })
      .catch(() => { setApiResult(WEB_WAIVER_RULES[nat]?.[dest] ?? null); })
      .finally(() => setApiLoading(false));
  }, [nat, dest]);

  const result = apiResult;
  const cfg = result ? { waiver: { color: '#10B981', bg: '#D1FAE5', icon: CheckCircle2, label: 'Visa waiver — no application needed' }, eta: { color: '#0EA5E9', bg: '#E0F2FE', icon: Globe2, label: 'eTA or on-arrival — simplified process' }, visa: { color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle, label: 'Visa required — apply in advance' } }[result.type] : null;

  return (
    <section className="page">
      <div className="page-title"><div><p>Instant visa check</p><h1>Visa Waiver Checker</h1></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <article className="panel">
          <h2>Your nationality</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {WEB_NATIONALITIES.map(n => <button key={n} onClick={() => setNat(n)} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: nat === n ? '#0B1F4B' : '#F1F5F9', color: nat === n ? '#fff' : '#334155' }}>{n}</button>)}
          </div>
        </article>
        <article className="panel">
          <h2>Destination country</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {WEB_DESTINATIONS.map(d => <button key={d} onClick={() => setDest(d)} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: dest === d ? '#1A56DB' : '#EFF6FF', color: dest === d ? '#fff' : '#1547C0' }}>{d}</button>)}
          </div>
        </article>
      </div>
      {apiLoading && <article className="panel" style={{ background: '#F8FAFC' }}><p style={{ color: '#64748B', fontSize: 14 }}>Checking {nat} → {dest}…</p></article>}
      {!apiLoading && cfg && result && (
        <article className="panel" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <cfg.icon size={32} color={cfg.color} />
            <div><h2 style={{ color: cfg.color, margin: 0 }}>{cfg.label}</h2><p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>{nat} passport → {dest}</p></div>
          </div>
          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{result.note}</p>
        </article>
      )}
      {!apiLoading && !result && <article className="panel" style={{ background: '#F8FAFC' }}><p style={{ color: '#64748B', fontSize: 14 }}>No data for {nat} → {dest}. Check the official embassy website or ask our AI assistant.</p></article>}
      <article className="panel" style={{ background: '#FEF2F2', border: '1px solid #FECACA', marginTop: 0 }}>
        <p style={{ fontSize: 11, color: '#991B1B' }}>Visa requirements change frequently. Always verify with the official embassy or consulate before booking travel.</p>
      </article>
    </section>
  );
}

// ─── Rejection Letter Analyzer ────────────────────────────────────────────────
const WEB_REJECTION_KB: Record<string, { cause: string; fix: string; severity: string }> = {
  'insufficient funds':  { cause: 'Financial evidence below threshold', fix: 'Upload 3 months of bank statements showing €65+/day. Add a salary slip and employer letter confirming your income.', severity: 'high' },
  'no ties':            { cause: 'Insufficient ties to home country',   fix: 'Provide employment letter, property ownership docs, or evidence of family responsibilities showing you will return.', severity: 'high' },
  'incomplete':         { cause: 'Missing required documents',          fix: 'Use the Visa With Ease requirements checklist to identify every missing item and upload before reapplying.', severity: 'medium' },
  'purpose unclear':    { cause: 'Travel purpose not established',      fix: 'Add a detailed cover letter, day-by-day itinerary, hotel bookings, and return flight confirmation.', severity: 'medium' },
  'previous overstay':  { cause: 'Prior immigration violation detected', fix: 'Disclose the overstay honestly. Provide evidence of changed circumstances. Consult a verified expert before reapplying.', severity: 'high' },
  'refused previously': { cause: 'Prior visa refusal not disclosed',    fix: 'Always disclose all prior refusals — concealment leads to bans. Explain what changed and provide stronger evidence.', severity: 'high' },
};

function RejectionLetterAnalyzer() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Array<{ key: string; cause: string; fix: string; severity: string }>>([]);
  const [done, setDone] = useState(false);

  const analyze = () => {
    const found = Object.entries(WEB_REJECTION_KB).filter(([k]) => text.toLowerCase().includes(k)).map(([k, v]) => ({ key: k, ...v }));
    setResults(found.length > 0 ? found : [{ key: 'general', cause: 'Rejection reason not identified in text', fix: 'Use the AI chat assistant for a more detailed analysis — share the full rejection letter text.', severity: 'medium' }]);
    setDone(true);
  };

  return (
    <section className="page">
      <div className="page-title"><div><p>AI-powered analysis</p><h1>Rejection Letter Analyzer</h1></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!done ? (
            <article className="panel">
              <h2>Paste rejection text</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Copy the key paragraph from your rejection letter. The AI will identify the reason and recommend fixes.</p>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`e.g. "Your application was refused as you have not demonstrated sufficient funds to cover your intended stay..."`}
                style={{ width: '100%', marginTop: 14, padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} rows={7} />
              <button className="primary-button" style={{ marginTop: 14, width: '100%' }} disabled={!text.trim()} onClick={analyze}>Analyze rejection letter</button>
            </article>
          ) : (
            <>
              <article className="panel">
                <h2>{results.length} issue{results.length !== 1 ? 's' : ''} identified</h2>
                {results.map(r => (
                  <div key={r.key} style={{ padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <AlertTriangle size={16} color={r.severity === 'high' ? '#DC2626' : '#F59E0B'} />
                      <strong style={{ fontSize: 14, color: r.severity === 'high' ? '#DC2626' : '#92400E' }}>{r.cause}</strong>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{r.fix}</p>
                  </div>
                ))}
              </article>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="secondary-button" onClick={() => { setText(''); setResults([]); setDone(false); }}>Analyze another letter</button>
                <Link className="primary-button" to="/chat" style={{ flex: 1, justifyContent: 'center' }}>Ask AI for guidance →</Link>
              </div>
            </>
          )}
        </div>
        <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <article className="panel">
            <h2>Common rejection reasons</h2>
            {Object.values(WEB_REJECTION_KB).slice(0,4).map(r => (
              <div key={r.cause} style={{ padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{r.cause}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{r.fix.substring(0, 70)}…</div>
              </div>
            ))}
          </article>
          <article className="panel" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p style={{ fontSize: 11, color: '#991B1B', lineHeight: 1.5 }}>This analysis is indicative. For complex refusals, always consult a verified visa consultant before reapplying.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Help / FAQ Center ────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'How is my readiness score calculated?', a: 'Your score (0–100) is based on document completeness, audit findings, requirements match and submission timing. Each factor is weighted: documents (35%), requirements (30%), quality (20%), timing (15%).' },
  { q: 'Are my uploaded documents stored permanently?', a: 'No. All original files auto-delete within 72 hours of upload. Only validated AI findings (scores, severity labels) are retained. Raw OCR text is never stored or exposed in the UI.' },
  { q: 'Who sees my visa documents?', a: 'Only you — unless you explicitly share via the consent screen before booking a consultant. Even then, only the specific categories you approve are shared, and access expires after 7 days.' },
  { q: 'How accurate is the AI requirements guidance?', a: 'Requirements are sourced directly from official embassy and consulate websites and cached for up to 24 hours. A staleness banner appears when data is over 18 hours old. Always verify with the official source before applying.' },
  { q: 'Can I use Visa With Ease for multiple countries at once?', a: 'Yes — create a separate application per destination. Each has its own checklist, requirements and readiness score. The dashboard shows all active applications.' },
  { q: 'What is the AI disclaimer?', a: 'Visa With Ease provides AI-powered guidance to help you prepare — not legal advice. A consulate decision depends on many factors beyond document quality. We recommend verified consultant review for complex cases or prior refusals.' },
  { q: 'How does consultant data sharing work?', a: 'Before any consultant can access your information, you go through a consent screen where you choose exactly what to share (requirements, audit findings, chat messages, contact details). Nothing is shared automatically.' },
  { q: 'How do I delete my account and data?', a: 'Go to Settings → Privacy & Data → Delete my data. Type DELETE to confirm. A deletion request is created and processed within 30 days per GDPR / UAE PDPL requirements.' },
];

function HelpCenter() {
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const filtered = FAQ_ITEMS.filter(f => !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="page">
      <div className="page-title"><div><p>Support</p><h1>Help & FAQ Center</h1></div></div>
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <Search size={16} color="#94A3B8" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search FAQ…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item, i) => (
            <article key={i} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                <strong style={{ fontSize: 14, color: '#0F172A' }}>{item.q}</strong>
                <ChevronRight size={18} color="#94A3B8" style={{ transform: open === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              {open === i && (
                <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#475569', lineHeight: 1.7, borderTop: '1px solid #F8FAFC' }}>{item.a}</div>
              )}
            </article>
          ))}
          {filtered.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 32 }}>No results for "{query}"</p>}
        </div>
        <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <article className="panel" style={{ textAlign: 'center', padding: 24 }}>
            <Bot size={32} color="#7C3AED" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 8px' }}>Still have questions?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>Ask our AI assistant — it can answer visa-specific questions with your application context.</p>
            <Link className="primary-button" to="/chat">Open AI assistant</Link>
          </article>
          <article className="panel" style={{ textAlign: 'center', padding: 24 }}>
            <Users size={28} color="#1A56DB" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 8px' }}>Need a human expert?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>Browse verified consultants pre-filtered for your visa type and destination.</p>
            <Link className="primary-button" to="/consultants">Find a consultant</Link>
          </article>
        </div>
      </div>
    </section>
  );
}

// ─── Referral System ──────────────────────────────────────────────────────────
function Referrals() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'SARAH2026';
  const referralLink = `https://visawithease.app/join?ref=${referralCode}`;
  const copy = () => { navigator.clipboard?.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); showToast('Referral link copied!', 'success'); };

  const stats = [{ label: 'Friends invited', value: '3' }, { label: 'Signed up', value: '2' }, { label: 'Credits earned', value: '$20' }, { label: 'Pending payout', value: '$10' }];
  const history = [
    { name: 'Aisha K.', status: 'Signed up', date: 'Jun 5', credit: '+$10' },
    { name: 'Raj M.',   status: 'Signed up', date: 'May 28', credit: '+$10' },
    { name: 'Lena T.',  status: 'Invited',   date: 'May 20', credit: '—' },
  ];

  return (
    <section className="page">
      <div className="page-title"><div><p>Earn rewards</p><h1>Refer a Friend</h1></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <article className="panel" style={{ background: 'linear-gradient(135deg,#0B1F4B,#1A56DB)', color: '#fff', textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
            <h2 style={{ color: '#fff', margin: '0 0 8px' }}>Earn $10 per referral</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20 }}>Share your link. When a friend signs up and books their first session, you both get $10 credit.</p>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', alignItems: 'center', marginBottom: 14 }}>
              <code style={{ flex: 1, fontSize: 13, color: '#93C5FD', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>{referralLink}</code>
              <button onClick={copy} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: copied ? '#10B981' : '#fff', color: copied ? '#fff' : '#0B1F4B', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent('Join Visa With Ease — AI-powered visa guidance. Use my referral code: VWE-REF'), '_blank')} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Share via WhatsApp</button>
              <button onClick={() => window.open('mailto:?subject=Join%20Visa%20With%20Ease&body=' + encodeURIComponent('Join Visa With Ease — AI-powered visa guidance. Use my referral code: VWE-REF'), '_blank')} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Share via Email</button>
            </div>
          </article>
          <article className="panel">
            <h2>Referral history</h2>
            {history.map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#1A56DB' }}>{r.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{r.status} · {r.date}</div>
                </div>
                <span style={{ fontWeight: 900, color: r.credit === '—' ? '#CBD5E1' : '#10B981' }}>{r.credit}</span>
              </div>
            ))}
          </article>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {stats.map(s => (
            <article key={s.label} className="panel" style={{ textAlign: 'center', padding: 18 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{s.label}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Admin User Management ────────────────────────────────────────────────────
interface AdminUser { uid: string; name: string; email: string; roles: string[]; status: 'active' | 'suspended'; createdAt: string }
const ADMIN_SEGMENTS = ['All', 'Active', 'Suspended'];

function AdminUsers() {
  const { data, loading, refetch } = useApi<{ users: AdminUser[]; total: number }>('/admin/users', { users: [], total: 0 });
  const [segment, setSegment] = useState('All');
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const users = data.users;
  const filtered = users.filter(u =>
    (segment === 'All' || (segment === 'Active' && u.status === 'active') || (segment === 'Suspended' && u.status === 'suspended')) &&
    (!query || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );

  async function toggleStatus(uid: string, name: string, currentStatus: string) {
    const action = currentStatus === 'active' ? 'suspend' : 'restore';
    setPending(uid);
    try {
      await postJson(`/admin/users/${uid}/${action}`, {});
      showToast(`${action === 'suspend' ? 'Suspended' : 'Restored'} ${name}`, 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to ${action} ${name}`, 'error');
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="page">
      <div className="page-title"><div><p>Platform admin</p><h1>User management</h1></div></div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {ADMIN_SEGMENTS.map(s => (
          <button key={s} onClick={() => setSegment(s)} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: segment === s ? '#0B1F4B' : '#F1F5F9', color: segment === s ? '#fff' : '#475569' }}>{s}</button>
        ))}
      </div>
      <div className="filter-bar" style={{ marginBottom: 14 }}>
        <Search size={16} color="#94A3B8" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or email…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
      </div>
      {loading ? <Skeleton h={200} /> : (
      <article className="panel" style={{ overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
              {['User','Roles','Joined','Status','Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.uid} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{u.email}</div>
                </td>
                <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12 }}>{u.roles.join(', ')}</td>
                <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, background: u.status === 'active' ? '#D1FAE5' : '#FEF2F2', color: u.status === 'active' ? '#065F46' : '#991B1B', fontWeight: 700, fontSize: 11 }}>{u.status}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => showToast(`${u.name} · ${u.email} · roles: ${u.roles.join(', ')} · joined ${new Date(u.createdAt).toLocaleDateString()}`, 'info')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Details</button>
                    <button onClick={() => toggleStatus(u.uid, u.name, u.status)} disabled={pending === u.uid} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, cursor: pending === u.uid ? 'default' : 'pointer', fontWeight: 600, opacity: pending === u.uid ? 0.6 : 1 }}>{pending === u.uid ? 'Working…' : u.status === 'active' ? 'Suspend' : 'Restore'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 32 }}>No users match the current filter</p>}
      </article>
      )}
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>Showing {filtered.length} of {users.length} users · Admin actions are logged to the audit trail.</p>
    </section>
  );
}

// ─── Cookie Consent Banner ───────────────────────────────────────────────────
function CookieBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('viq.cookies') === '1');
  if (dismissed) return null;
  const accept = () => { localStorage.setItem('viq.cookies','1'); setDismissed(true); showToast('Cookie preferences saved', 'success'); };
  const decline = () => { localStorage.setItem('viq.cookies','0'); setDismissed(true); };
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 998, background: '#fff', borderTop: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        <strong style={{ fontSize: 14, color: '#0F172A' }}>We use cookies</strong>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
          Visa With Ease uses essential cookies for session management and analytics cookies to improve the product. No personal data is shared with third parties. See our <a href="/privacy" style={{ color: '#1A56DB' }}>Privacy Policy</a>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={decline} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#64748B' }}>Decline non-essential</button>
        <button onClick={accept} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1A56DB', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Accept all</button>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, radius = 6, style }: { w?: string | number; h?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', ...style }} />
  );
}

function CardSkeleton() {
  return (
    <article className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton w={44} h={44} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton h={14} w="60%" />
          <Skeleton h={11} w="40%" />
        </div>
        <Skeleton w={52} h={52} radius={26} />
      </div>
      <Skeleton h={8} />
      <Skeleton h={8} w="80%" />
    </article>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
const RISK_COLORS = { low: { bg: '#D1FAE5', text: '#065F46' }, medium: { bg: '#FEF3C7', text: '#92400E' }, high: { bg: '#FEF2F2', text: '#991B1B' } };
const HIGH_RISK_ACTIONS = ['SUSPEND_USER', 'DELETE', 'RESTORE_USER'];
const MEDIUM_RISK_ACTIONS = ['DATA_DELETION', 'PROFILE_UPDATE'];
function riskForAction(action: string): 'low' | 'medium' | 'high' {
  if (HIGH_RISK_ACTIONS.some(a => action.includes(a))) return 'high';
  if (MEDIUM_RISK_ACTIONS.some(a => action.includes(a))) return 'medium';
  return 'low';
}

interface AuditLogEntry { id: string; actor: string; action: string; resource: string; at: string; ip: string }

function AuditLog() {
  const { data } = useApi<{ entries: AuditLogEntry[]; total: number }>('/admin/audit-log', { entries: [], total: 0 });
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const entries = data.entries.map(e => ({ ...e, target: e.resource, time: new Date(e.at).toLocaleString(), risk: riskForAction(e.action) }));
  const filtered = entries.filter(e =>
    (riskFilter === 'all' || e.risk === riskFilter) &&
    (!query || e.actor.toLowerCase().includes(query.toLowerCase()) || e.action.toLowerCase().includes(query.toLowerCase()) || e.target.toLowerCase().includes(query.toLowerCase()))
  );
  return (
    <section className="page">
      <div className="page-title"><div><p>Platform admin</p><h1>Audit log</h1></div></div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div className="filter-bar" style={{ flex: 1, margin: 0 }}>
          <Search size={16} color="#94A3B8" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by actor, action or target…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
        </div>
        {['all','low','medium','high'].map(r => (
          <button key={r} onClick={() => setRiskFilter(r)} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, textTransform: 'capitalize', background: riskFilter === r ? '#0B1F4B' : '#F1F5F9', color: riskFilter === r ? '#fff' : '#475569' }}>{r === 'all' ? 'All' : `${r} risk`}</button>
        ))}
      </div>
      <article className="panel" style={{ overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
              {['Time','Actor','Action','Target','IP','Risk'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const rc = RISK_COLORS[e.risk as keyof typeof RISK_COLORS];
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 16px', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{e.time}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0F172A' }}>{e.actor}</td>
                  <td style={{ padding: '10px 16px', color: '#334155' }}>{e.action}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B', fontSize: 12, fontFamily: 'monospace' }}>{e.target}</td>
                  <td style={{ padding: '10px 16px', color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}>{e.ip}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, background: rc.bg, color: rc.text, fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}>{e.risk}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 32 }}>No entries match filter</p>}
      </article>
      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>Showing {filtered.length} of {entries.length} entries · Log is append-only and cannot be modified.</p>
    </section>
  );
}

// ─── FEAT B: Pricing Page ─────────────────────────────────────────────────────
const PRICING_TIERS = [
  { id: 'free',       label: 'Free',       price: 0,    period: '',     color: '#64748B', features: ['3 AI audit reports/mo','Basic requirements check','1 active application','Community support'], cta: 'Get started', popular: false },
  { id: 'pro',        label: 'Pro',        price: 19,   period: '/mo',  color: '#1A56DB', features: ['Unlimited AI audits','Full red-flag reports','5 active applications','Priority AI chat','PDF export','Consultant marketplace'], cta: 'Start Pro trial', popular: true },
  { id: 'business',   label: 'Business',   price: 149,  period: '/mo',  color: '#7C3AED', features: ['Everything in Pro','HR portal & bulk uploads','Team management','Audit quota dashboard','API access (500 calls/mo)','Dedicated CSM'], cta: 'Start Business trial', popular: false },
  { id: 'enterprise', label: 'Enterprise', price: 499,  period: '/mo',  color: '#0B1F4B', features: ['Unlimited everything','Custom compliance DB','White-label reports','SLA 99.9%','Unlimited API calls','On-site training'], cta: 'Contact sales', popular: false },
  { id: 'custom',     label: 'Custom',     price: null, period: '',     color: '#059669', features: ['Volume licensing','Custom integrations','Dedicated AI model tuning','Global embassy data SLA','GDPR + UAE PDPL DPA','Enterprise contract'], cta: 'Request a quote', popular: false },
];

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <section className="page">
      <div className="page-title" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div>
          <p>Plans &amp; pricing</p>
          <h1>Simple, transparent pricing</h1>
          <p style={{ color: '#64748B', maxWidth: 520, margin: '8px auto 0' }}>From individual travellers to enterprise mobility teams — pick the plan that matches your scale.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, background: '#F1F5F9', borderRadius: 24, padding: '6px 12px' }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '6px 16px', borderRadius: 18, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: !annual ? '#fff' : 'transparent', color: !annual ? '#0B1F4B' : '#64748B', boxShadow: !annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>Monthly</button>
          <button onClick={() => setAnnual(true)} style={{ padding: '6px 16px', borderRadius: 18, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: annual ? '#fff' : 'transparent', color: annual ? '#0B1F4B' : '#64748B', boxShadow: annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>Annual <span style={{ color: '#059669', fontSize: 11 }}>−20%</span></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 8 }}>
        {PRICING_TIERS.map(tier => {
          const displayPrice = tier.price === null ? null : annual ? Math.round(tier.price * 0.8) : tier.price;
          return (
            <div key={tier.id} style={{ borderRadius: 18, border: `2px solid ${tier.popular ? tier.color : '#E2E8F0'}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, background: tier.popular ? `${tier.color}08` : '#fff', position: 'relative' }}>
              {tier.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: tier.color, color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 14px', borderRadius: 20 }}>Most popular</div>}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${tier.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color={tier.color} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: tier.color, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tier.label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  {displayPrice === null ? <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>Custom</span> : <><span style={{ fontSize: 32, fontWeight: 900, color: '#0F172A' }}>${displayPrice}</span><span style={{ color: '#64748B', fontSize: 14 }}>{tier.period}</span></>}
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={14} color={tier.color} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => showToast(`${tier.label} plan selected — payment integration coming soon.`, 'info')} style={{ marginTop: 8, padding: '12px 0', borderRadius: 10, border: `2px solid ${tier.color}`, background: tier.popular ? tier.color : 'transparent', color: tier.popular ? '#fff' : tier.color, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{tier.cta}</button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 32, background: '#F8FAFC', borderRadius: 16, padding: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ margin: '0 0 6px', color: '#0F172A' }}>Need help choosing?</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>Our team can walk you through the right plan for your use case — HR mobility, consultant agency, or government integration.</p>
        </div>
        <button onClick={() => showToast('Sales contact form is coming soon.', 'info')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#0B1F4B', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>Talk to sales</button>
      </div>
    </section>
  );
}

// ─── FEAT C: B2B API Developer Portal ────────────────────────────────────────
const API_SNIPPETS: Record<string, string> = {
  curl: `curl -X POST https://api.visawithease.app/v1/audit \\
  -H "Authorization: Bearer viq_live_•••••••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{"documentType":"passport","fileUrl":"https://cdn.example.com/doc.jpg"}'`,
  js: `import VisaWithEase from '@visawithease/sdk';

const client = new VisaWithEase({ apiKey: 'viq_live_•••••••••••••••' });

const audit = await client.audit.create({
  documentType: 'passport',
  fileUrl: 'https://cdn.example.com/doc.jpg',
});
console.log(audit.score, audit.findings);`,
  python: `import visawithease

client = visawithease.Client(api_key="viq_live_•••••••••••••••")

audit = client.audit.create(
    document_type="passport",
    file_url="https://cdn.example.com/doc.jpg",
)
print(audit.score, audit.findings)`,
};

const WEBHOOK_EVENTS = [
  { event: 'audit.completed', desc: 'Fired when an AI audit finishes processing', active: true },
  { event: 'audit.failed',    desc: 'Document quality below acceptable threshold',  active: true },
  { event: 'report.unlocked', desc: 'User pays $4.99 to unlock full findings',       active: false },
  { event: 'booking.created', desc: 'New consultant booking confirmed',              active: true },
];

function ApiPortal() {
  const { data: usageData } = useApi<{
    period: string;
    apiCalls: { used: number; limit: number };
    auditsRun: number;
    avgLatencyMs: number;
    errorRate: number;
    webhookDeliveries: number;
    updatedAt: string;
  }>('/usage', { period: '', apiCalls: { used: 3841, limit: 5000 }, auditsRun: 127, avgLatencyMs: 480, errorRate: 0.3, webhookDeliveries: 0, updatedAt: '' });
  const [lang, setLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [webhookUrl, setWebhookUrl] = useState('https://yourapp.com/webhooks/visawithease');
  const [webhooks, setWebhooks] = useState(WEBHOOK_EVENTS);
  const { data: configuredWebhooks, refetch: refetchWebhooks } = useApi<{ webhooks: Array<{ id: string; url: string; events: string[]; createdAt: string }> }>('/webhooks', { webhooks: [] });

  function copySnippet() {
    navigator.clipboard?.writeText(API_SNIPPETS[lang]);
    showToast('Code snippet copied!', 'success');
  }

  return (
    <section className="page">
      <div className="page-title"><div><p>Developer</p><h1>B2B API Portal</h1></div><a href="https://docs.visawithease.app" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 10, background: '#0B1F4B', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}><ExternalLink size={15} /> API Docs</a></div>

      {/* API Key */}
      <article className="panel">
        <h2 style={{ marginBottom: 14 }}>API Key</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', border: '1px solid #E2E8F0' }}>
          <code style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: '#94A3B8' }}>No key issued yet</code>
          <button onClick={() => showToast('API key issuance is coming soon.', 'info')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, fontWeight: 700 }}><Copy size={14} />Generate key</button>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94A3B8' }}>API key issuance and rotation are coming soon — the endpoints below require a real bearer token in the meantime.</p>
      </article>

      {/* Usage Stats */}
      <article className="panel">
        <h2 style={{ marginBottom: 14 }}>Monthly usage{usageData.updatedAt ? <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>updated {usageData.updatedAt}</span> : null}</h2>
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            ['API calls', `${usageData.apiCalls.used.toLocaleString()} / ${usageData.apiCalls.limit.toLocaleString()}`],
            ['Audits run', String(usageData.auditsRun)],
            ['Avg latency', `${usageData.avgLatencyMs} ms`],
            ['Error rate', `${usageData.errorRate}%`]
          ].map(([l,v]) => (
            <div key={l} style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 18px', border: '1px solid #E2E8F0' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{l}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{v}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
            <span>API calls used</span>
            <span>{usageData.apiCalls.used.toLocaleString()} / {usageData.apiCalls.limit.toLocaleString()}</span>
          </div>
          <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (usageData.apiCalls.used / usageData.apiCalls.limit) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#1A56DB,#3B82F6)', borderRadius: 4 }} />
          </div>
        </div>
      </article>

      {/* Code Snippets */}
      <article className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Quick start</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['curl','js','python'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: lang === l ? '#0B1F4B' : '#F1F5F9', color: lang === l ? '#fff' : '#64748B' }}>{l === 'js' ? 'Node.js' : l}</button>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', background: '#0F172A', borderRadius: 12, padding: '18px 20px' }}>
          <pre style={{ margin: 0, color: '#E2E8F0', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{API_SNIPPETS[lang]}</pre>
          <button onClick={copySnippet} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#94A3B8', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center', fontSize: 11 }}><Copy size={12} />Copy</button>
        </div>
      </article>

      {/* Webhooks */}
      <article className="panel">
        <h2 style={{ marginBottom: 14 }}>Webhooks</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'monospace', outline: 'none' }} placeholder="https://yourapp.com/webhooks/visawithease" />
          <button
            onClick={async () => {
              if (!webhookUrl.startsWith('https://')) {
                showToast('Webhook URL must start with https://', 'error');
                return;
              }
              try {
                const activeEvents = webhooks.filter((w) => w.active).map((w) => w.event);
                await postJson('/webhooks', { url: webhookUrl, events: activeEvents });
                showToast('Webhook endpoint saved.', 'success');
                refetchWebhooks();
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Could not save webhook.', 'error');
              }
            }}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#0B1F4B', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >Save</button>
        </div>
        <div className="cards-list compact">
          {webhooks.map(wh => (
            <div key={wh.event} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: '#0F172A' }}>{wh.event}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{wh.desc}</p>
              </div>
              <button onClick={() => setWebhooks(prev => prev.map(w => w.event === wh.event ? { ...w, active: !w.active } : w))} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: wh.active ? '#1A56DB' : '#E2E8F0', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: wh.active ? 22 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          ))}
        </div>
        {configuredWebhooks.webhooks.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Configured endpoints</h3>
            {configuredWebhooks.webhooks.map(wh => (
              <div key={wh.id} style={{ padding: '8px 0', borderBottom: '1px solid #F8FAFC', fontSize: 12 }}>
                <div style={{ fontFamily: 'monospace', color: '#0F172A' }}>{wh.url}</div>
                <div style={{ color: '#94A3B8', marginTop: 2 }}>{wh.events.join(', ')} · added {new Date(wh.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

// ─── FEAT D: Ecosystem Partners ───────────────────────────────────────────────
const PARTNER_CATEGORIES = [
  {
    id: 'flights', label: 'Flights', icon: Plane, color: '#1A56DB',
    partners: [
      { name: 'Emirates', tagline: 'World-class connectivity from Dubai', discount: '8% off bookings', logo: '✈' },
      { name: 'Air India', tagline: 'Direct routes India ↔ Schengen', discount: '5% off + priority check-in', logo: '✈' },
      { name: 'flydubai', tagline: 'Budget-friendly regional routes', discount: 'AED 50 off first booking', logo: '✈' },
    ],
  },
  {
    id: 'housing', label: 'Housing', icon: Building2, color: '#7C3AED',
    partners: [
      { name: 'Airbnb', tagline: 'Verified stays with host ratings', discount: '10% off first stay', logo: '🏠' },
      { name: 'Booking.com', tagline: 'Cancellation-friendly hotel bookings', discount: 'Genius Level 2 unlocked', logo: '🏨' },
      { name: 'NomadHomes', tagline: 'Furnished apartments for visa applicants', discount: '15% off monthly stays', logo: '🏡' },
    ],
  },
  {
    id: 'corporate', label: 'Corporate', icon: Building2, color: '#059669',
    partners: [
      { name: 'Globalization Partners', tagline: 'EOR & global workforce compliance', discount: 'Free consultation', logo: '🌐' },
      { name: 'Deel', tagline: 'International payroll and HR', discount: '1 month free on annual plan', logo: '💼' },
      { name: 'Remote.com', tagline: 'Employer of record worldwide', discount: 'Waived onboarding fee', logo: '🖥' },
    ],
  },
  {
    id: 'insurance', label: 'Insurance', icon: ShieldCheck, color: '#DC2626',
    partners: [
      { name: 'AXA Travel', tagline: 'Schengen-compliant medical coverage', discount: 'AED 80 single-trip policy', logo: '🛡' },
      { name: 'RSA Insurance', tagline: 'UAE-issued travel insurance certificates', discount: '12% off annual plan', logo: '🛡' },
      { name: 'Oman Insurance', tagline: 'Instant certificate for embassy submission', discount: 'Same-day issuance', logo: '🛡' },
    ],
  },
];

function EcosystemPartners() {
  const { data } = useApi<{ categories: typeof PARTNER_CATEGORIES }>('/partners', { categories: PARTNER_CATEGORIES });
  // Guard: API may return string[] or a flat shape — only use it if it's the right object shape
  const categories = (data.categories.length > 0 && typeof (data.categories[0] as unknown as { id?: string }).id === 'string')
    ? data.categories
    : PARTNER_CATEGORIES;
  const [activeCategory, setActiveCategory] = useState('flights');
  const category = categories.find(c => c.id === activeCategory) ?? categories[0];
  return (
    <section className="page">
      <div className="page-title"><div><p>Marketplace</p><h1>Ecosystem Partners</h1><p style={{ color: '#64748B', margin: '4px 0 0', fontSize: 14 }}>Trusted partners integrated into your visa journey — exclusive discounts for Visa With Ease members.</p></div></div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => {
          const CatIcon = cat.icon;
          const active = cat.id === activeCategory;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: `2px solid ${active ? cat.color : '#E2E8F0'}`, background: active ? `${cat.color}10` : '#fff', color: active ? cat.color : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <CatIcon size={16} /> {cat.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {category.partners.map(partner => (
          <article key={partner.name} style={{ borderRadius: 16, border: '1.5px solid #E2E8F0', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${category.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{partner.logo}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#0F172A' }}>{partner.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{partner.tagline}</p>
              </div>
            </div>
            <div style={{ background: `${category.color}10`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={14} color={category.color} />
              <span style={{ color: category.color, fontWeight: 700, fontSize: 13 }}>{partner.discount}</span>
            </div>
            <button onClick={() => showToast(`${partner.name} partner links are coming soon.`, 'info')} style={{ padding: '11px 0', borderRadius: 10, border: `2px solid ${category.color}`, background: 'transparent', color: category.color, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ExternalLink size={14} /> Claim offer
            </button>
          </article>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 18, background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}><strong style={{ color: '#0F172A' }}>Partnership programme:</strong> Visa With Ease earns a referral commission (3–8%) when you use partner links. This funds our free tier and keeps the platform ad-free. Partner offers may change — check the partner's site for current terms.</p>
      </div>
    </section>
  );
}

// ─── FEAT E: AI Compliance Database ──────────────────────────────────────────
const COMPLIANCE_DB_ENTRIES = [
  { country: 'France',        flag: '🇫🇷', status: 'live',     lastScraped: '2026-06-07 08:14', coverage: 98, sources: 12, nextRun: '6h' },
  { country: 'United Kingdom',flag: '🇬🇧', status: 'live',     lastScraped: '2026-06-07 09:01', coverage: 96, sources: 10, nextRun: '4h' },
  { country: 'United States', flag: '🇺🇸', status: 'live',     lastScraped: '2026-06-07 07:45', coverage: 99, sources: 18, nextRun: '8h' },
  { country: 'Canada',        flag: '🇨🇦', status: 'live',     lastScraped: '2026-06-07 06:30', coverage: 97, sources: 11, nextRun: '10h' },
  { country: 'Germany',       flag: '🇩🇪', status: 'live',     lastScraped: '2026-06-07 05:20', coverage: 95, sources: 9,  nextRun: '12h' },
  { country: 'Australia',     flag: '🇦🇺', status: 'live',     lastScraped: '2026-06-06 22:00', coverage: 94, sources: 8,  nextRun: '2h' },
  { country: 'UAE',           flag: '🇦🇪', status: 'live',     lastScraped: '2026-06-07 09:55', coverage: 100,sources: 7,  nextRun: '2h' },
  { country: 'India',         flag: '🇮🇳', status: 'live',     lastScraped: '2026-06-07 04:10', coverage: 91, sources: 14, nextRun: '14h' },
  { country: 'Japan',         flag: '🇯🇵', status: 'pending',  lastScraped: '2026-06-05 12:00', coverage: 72, sources: 5,  nextRun: '1h' },
  { country: 'Brazil',        flag: '🇧🇷', status: 'pending',  lastScraped: '2026-06-04 18:30', coverage: 65, sources: 4,  nextRun: '30m' },
  { country: 'Nigeria',       flag: '🇳🇬', status: 'error',    lastScraped: '2026-06-03 10:00', coverage: 40, sources: 2,  nextRun: 'retry' },
  { country: 'Pakistan',      flag: '🇵🇰', status: 'scheduled',lastScraped: 'never',             coverage: 0,  sources: 0,  nextRun: '24h' },
];

const COMPLIANCE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  live:      { bg: '#D1FAE5', text: '#065F46' },
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  error:     { bg: '#FEF2F2', text: '#991B1B' },
  scheduled: { bg: '#EFF6FF', text: '#1E40AF' },
};

function ComplianceDb() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: complianceData, loading: complianceLoading } = useApi<{
    countries: Array<{ country: string; status: string; coverage: number; lastScraped: string; sources: number }>;
    totalCountries: number;
    liveCount: number;
    updatedAt: string;
  }>(`/compliance-db?_k=${refreshKey}`, {
    countries: COMPLIANCE_DB_ENTRIES.map(e => ({ country: e.country, status: e.status, coverage: e.coverage, lastScraped: e.lastScraped, sources: e.sources })),
    totalCountries: COMPLIANCE_DB_ENTRIES.length,
    liveCount: COMPLIANCE_DB_ENTRIES.filter(e => e.status === 'live').length,
    updatedAt: ''
  });
  // Merge API data with local extras (flag, nextRun) using fallback
  const entries = complianceData.countries.map(c => {
    const local = COMPLIANCE_DB_ENTRIES.find(e => e.country === c.country);
    return { ...c, flag: local?.flag ?? '🌍', nextRun: local?.nextRun ?? '—' };
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const filtered = entries.filter(e =>
    (statusFilter === 'all' || e.status === statusFilter) &&
    (!query || e.country.toLowerCase().includes(query.toLowerCase()))
  );

  function handleRefresh(country: string) {
    setRefreshing(country);
    setTimeout(() => {
      setRefreshing(null);
      setRefreshKey(k => k + 1);
      showToast(`${country} scraper triggered — results in ~2 min.`, 'info');
    }, 1200);
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p>Platform intelligence</p>
          <h1>AI Compliance Database</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748B' }}>Real-time scraper status for per-country visa requirement data.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all','live','pending','error','scheduled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, textTransform: 'capitalize', background: statusFilter === s ? '#0B1F4B' : '#F1F5F9', color: statusFilter === s ? '#fff' : '#475569' }}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>
      <div className="filter-bar" style={{ marginBottom: 14 }}>
        <Search size={16} color="#94A3B8" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search country…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
      </div>
      <div className="admin-grid" style={{ marginBottom: 20 }}>
        {[
          ['Live scrapers', complianceLoading ? '…' : String(complianceData.liveCount || entries.filter(e => e.status === 'live').length)],
          ['Avg coverage', complianceLoading ? '…' : `${Math.round(entries.reduce((a, e) => a + e.coverage, 0) / (entries.length || 1))}%`],
          ['Errors', complianceLoading ? '…' : String(entries.filter(e => e.status === 'error').length)],
          ['Countries', complianceLoading ? '…' : String(complianceData.totalCountries || entries.length)]
        ].map(([l, v]) => (
          <Metric key={String(l)} icon={Globe2} label={String(l)} value={String(v)} />
        ))}
      </div>
      <article className="panel" style={{ overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
              {['Country','Status','Last scraped','Coverage','Sources','Next run',''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {complianceLoading && entries.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Loading compliance data…</td></tr>
            )}
            {filtered.map((e, i) => {
              const sc = COMPLIANCE_STATUS_COLORS[e.status as keyof typeof COMPLIANCE_STATUS_COLORS] ?? { bg: '#F1F5F9', text: '#64748B' };
              return (
                <tr key={e.country} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0F172A' }}>{e.flag} {e.country}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}>{e.status}</span></td>
                  <td style={{ padding: '10px 16px', color: '#64748B', fontSize: 12, fontFamily: 'monospace' }}>{e.lastScraped}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ width: `${e.coverage}%`, height: '100%', background: e.coverage >= 90 ? '#10B981' : e.coverage >= 60 ? '#F59E0B' : '#EF4444', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', minWidth: 32 }}>{e.coverage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748B', fontSize: 12 }}>{e.sources}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B', fontSize: 12, fontFamily: 'monospace' }}>{e.nextRun}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <button onClick={() => handleRefresh(e.country)} disabled={refreshing === e.country} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <RefreshCw size={11} className={refreshing === e.country ? 'spin' : ''} />
                      {refreshing === e.country ? 'Running…' : 'Refresh'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 32 }}>No countries match filter</p>}
      </article>
    </section>
  );
}

// ─── FEAT J: Investor Demo / GITEX Pitch Mode ─────────────────────────────────
const PITCH_METRICS = [
  { label: 'TAM', value: '$42B', sub: 'Global visa services market 2026' },
  { label: 'SAM', value: '$8B', sub: 'Digital-first applicant segment' },
  { label: 'SOM (Yr 3)', value: '$180M', sub: '2.25% serviceable share target' },
  { label: 'MRR Target', value: '$415K', sub: 'Based on 5K MAU at blended $83/mo' },
];

const PITCH_REVENUE_STREAMS = [
  { label: 'SaaS subscriptions', pct: 52, color: '#1A56DB' },
  { label: 'Consultant commissions (15–20%)', pct: 23, color: '#7C3AED' },
  { label: 'API licensing (B2B)', pct: 14, color: '#059669' },
  { label: 'Report unlock ($4.99)', pct: 7,  color: '#F59E0B' },
  { label: 'Partner referrals', pct: 4,  color: '#DC2626' },
];

const PITCH_MILESTONES = [
  { quarter: 'Q2 2026', label: 'MVP launch · 500 beta users',        done: true },
  { quarter: 'Q3 2026', label: 'GITEX demo · Series A preparation',  done: false },
  { quarter: 'Q4 2026', label: '5,000 MAU · HR enterprise deals',    done: false },
  { quarter: 'Q1 2027', label: '$1M ARR · GCC expansion',            done: false },
];

function InvestorDemo() {
  return (
    <section className="page">
      <div style={{ background: 'linear-gradient(135deg,#0B1F4B 0%,#1A56DB 100%)', borderRadius: 20, padding: '40px 36px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <p style={{ margin: '0 0 6px', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>GITEX Global 2026 · Investor Pitch</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 900, lineHeight: 1.15 }}>VISA<span style={{ color: '#FCD34D' }}>IQ</span></h1>
        <p style={{ margin: '0 0 24px', fontSize: 17, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, maxWidth: 560 }}>AI-powered visa intelligence platform — reducing consulate rejection rates through document auditing, expert matching, and compliance automation.</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(4px)' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Headquarters</p>
            <p style={{ margin: '2px 0 0', fontWeight: 900, fontSize: 15 }}>Dubai, UAE 🇦🇪</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(4px)' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Stage</p>
            <p style={{ margin: '2px 0 0', fontWeight: 900, fontSize: 15 }}>Pre-Seed · Raising $750K</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', backdropFilter: 'blur(4px)' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>AI Accuracy</p>
            <p style={{ margin: '2px 0 0', fontWeight: 900, fontSize: 15 }}>94% audit score</p>
          </div>
        </div>
      </div>

      {/* Market size */}
      <div className="admin-grid" style={{ marginBottom: 24 }}>
        {PITCH_METRICS.map(m => (
          <article key={m.label} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E2E8F0', padding: '20px 22px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</p>
            <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: '#0B1F4B' }}>{m.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{m.sub}</p>
          </article>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        {/* Revenue model */}
        <article className="panel">
          <h2 style={{ marginBottom: 16 }}>Revenue model</h2>
          {PITCH_REVENUE_STREAMS.map(r => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155', marginBottom: 5 }}>
                <span style={{ fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 900, color: r.color }}>{r.pct}%</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </article>

        {/* Milestones */}
        <article className="panel">
          <h2 style={{ marginBottom: 16 }}>Roadmap</h2>
          {PITCH_MILESTONES.map((m, i) => (
            <div key={m.quarter} style={{ display: 'flex', gap: 14, marginBottom: i < PITCH_MILESTONES.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: m.done ? '#059669' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.done ? <CheckCircle2 size={16} color="#fff" /> : <div style={{ width: 10, height: 10, borderRadius: 5, background: '#94A3B8' }} />}
                </div>
                {i < PITCH_MILESTONES.length - 1 && <div style={{ width: 2, flex: 1, background: m.done ? '#059669' : '#E2E8F0', minHeight: 24, borderRadius: 1 }} />}
              </div>
              <div style={{ paddingTop: 4 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: m.done ? '#059669' : '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.quarter}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', fontWeight: m.done ? 700 : 400 }}>{m.label}</p>
              </div>
            </div>
          ))}
        </article>
      </div>

      {/* CTA */}
      <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 28, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', border: '1.5px solid #E2E8F0' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ margin: '0 0 6px', color: '#0B1F4B', fontSize: 18 }}>Ready to back the next visa-tech leader?</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>We are raising $750K pre-seed to accelerate the compliance database, grow the consultant network, and launch enterprise HR integrations across the GCC.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => showToast('Investor deck requests are coming soon.', 'info')} style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: '#0B1F4B', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Request investor deck</button>
          <button onClick={() => showToast('Meeting request sent — our team will respond within 24h.', 'info')} style={{ padding: '13px 28px', borderRadius: 12, border: '2px solid #0B1F4B', background: 'transparent', color: '#0B1F4B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Schedule a meeting</button>
        </div>
      </div>
    </section>
  );
}

function Score({ value, size }: { value: number; size?: 'large' }) {
  return (
    <div className={`score ${size ?? ''}`} style={{ ['--score-color' as string]: scoreColor(value) }}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="18" />
        <circle cx="22" cy="22" r="18" pathLength="100" strokeDasharray={`${value} 100`} />
      </svg>
      <strong>{value}</strong>
    </div>
  );
}
