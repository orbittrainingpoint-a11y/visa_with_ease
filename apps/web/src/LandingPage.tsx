import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Bot, BarChart3, CalendarClock, Globe2, FileText, Gift,
  PlayCircle, Play, Sparkles, User, Users, Building2, ShieldCheck, Lock, ShieldAlert, KeyRound, CreditCard,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { POSTS } from './Blog';
import './landing.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ── Data ─────────────────────────────────────────────────────────────────────
const SLIDES = [
  { src: '/screenshots/welcome.png',        step: '01', label: 'Onboard',      caption: 'Sign up in 30 seconds. Email and destination — that\'s it. Visa With Ease takes it from here.' },
  { src: '/screenshots/dashboard.png',      step: '02', label: 'Dashboard',    caption: 'Your visa health score pulled from every document you\'ve uploaded, live.' },
  { src: '/screenshots/audit-report.png',   step: '03', label: 'AI Audit',     caption: 'AI reads every clause and flags every error — automatically.' },
  { src: '/screenshots/realtime.png',       step: '04', label: 'Live Scan',    caption: 'Watch the AI parse your document in real-time, field by field.' },
  { src: '/screenshots/booking.png',        step: '05', label: 'Book Expert',  caption: 'Certified consultants matched by visa type, language, and availability.' },
  { src: '/screenshots/decision.png',       step: '06', label: 'Decision',     caption: 'Visa decision decoded. Clear next steps. No ambiguity.' },
];

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onStart }: { onStart: () => void }) {
  const heroRef   = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLHeadingElement>(null);
  const subRef    = useRef<HTMLParagraphElement>(null);
  const ctaRef    = useRef<HTMLDivElement>(null);
  const phoneRef  = useRef<HTMLDivElement>(null);
  const badgeRef  = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(titleRef.current,  { opacity: 0, y: 64 }, { opacity: 1, y: 0, duration: 1.05 })
      .fromTo(subRef.current,    { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.85 }, '-=0.65')
      .fromTo(ctaRef.current,    { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7  }, '-=0.55')
      .fromTo(phoneRef.current,  { opacity: 0, scale: 0.88, y: 60 },
                                  { opacity: 1, scale: 1,    y: 0,  duration: 1.15, ease: 'back.out(1.5)' }, '-=0.75')
      .fromTo(badgeRef.current,  { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');

    gsap.to(phoneRef.current, {
      y: -90, ease: 'none',
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1.8 },
    });
  }, { scope: heroRef });

  const handlePointerMove = (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <section className="hero" ref={heroRef} onMouseMove={handlePointerMove}>
      <div className="hero-grid" aria-hidden />
      <div className="hero-spotlight" aria-hidden />
      <div className="hero-blob hero-blob-1" aria-hidden />
      <div className="hero-blob hero-blob-2" aria-hidden />

      <div className="hero-body">
        <div className="hero-text">
          <div className="hero-eyebrow">
            <span className="live-dot" />
            AI-powered · UAE &amp; Global visas
          </div>

          <h1 className="hero-title" ref={titleRef}>
            Your visa.<br />
            Audited by AI.<br />
            <span className="c-gold">Approved faster.</span>
          </h1>

          <p className="hero-sub" ref={subRef}>
            Visa With Ease scans every document, scores your application,
            and connects you with certified consultants — in under&nbsp;5&nbsp;minutes.
          </p>

          <div className="hero-cta" ref={ctaRef}>
            <button className="btn-primary" onClick={onStart}>Start free audit</button>
            <button className="btn-ghost"  onClick={onStart}>Watch demo <Play size={14} style={{ display: 'inline', verticalAlign: '-2px' }} fill="currentColor" /></button>
          </div>

          <div className="hero-tags" ref={badgeRef}>
            {['AI-powered audit', 'GDPR safe', 'UAE PDPL', '24+ countries'].map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="hero-phones" ref={phoneRef}>
          <div className="phone-cluster">
            <div className="phone-frame phone-back">
              <div className="phone-notch" />
              <img src="/screenshots/audit-report.png" alt="" />
              <div className="scan-line" aria-hidden />
              <div className="verify-badge">
                <span className="dot">✓</span>
                <span>Document verified</span>
              </div>
            </div>
            <div className="phone-frame phone-front">
              <div className="phone-notch" />
              <img src="/screenshots/dashboard.png" alt="" />
              <div className="score-bubble">
                <span className="score-num">87</span>
                <span className="score-lbl">Visa Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-cue">
        <span>Scroll</span>
        <span className="scroll-line" />
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.stat'),
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.65, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 82%' } });
  }, { scope: ref });

  return (
    <div className="stats-bar" ref={ref}>
      {[
        ['AI',     'Powered document audit'],
        ['< 5 min','Avg audit time'],
        ['24+',    'Countries supported'],
        ['GDPR',   'Privacy compliant'],
      ].map(([n, l]) => (
        <div className="stat" key={l}>
          <span className="stat-n">{n}</span>
          <span className="stat-l">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── Feature Grid ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Bot,          t: 'AI Document Audit',       b: 'Automated compliance checks against live embassy rules. Every error flagged with a fix suggestion.', s: '/screenshots/audit-report.png',     c: '#3B82F6' },
  { icon: BarChart3,    t: 'Visa Health Score',        b: 'A single 0–100 score from document quality, completeness, and embassy history patterns.',    s: '/screenshots/dashboard.png',        c: '#10B981' },
  { icon: CalendarClock,t: 'Consultant Booking',       b: 'Real-time calendar slots. Certified consultants matched by visa type and language.',         s: '/screenshots/booking-calendar.png', c: '#8B5CF6' },
  { icon: Globe2,       t: '24+ Country Compliance DB',b: 'Embassy data scraped daily. Requirement changes flagged the moment they go live.',           s: '/screenshots/realtime.png',         c: '#EF4444' },
  { icon: FileText,     t: 'PDF Audit Report',         b: 'Shareable, branded PDF with per-field status, risk rating, and recommended fixes.',         s: '/screenshots/audit-pdf.png',        c: '#F59E0B' },
  { icon: Gift,         t: 'Referral & Partners',      b: 'Earn credits for referrals. 40+ partners — flights, housing, insurance.',                   s: '/screenshots/referral.png',         c: '#06B6D4' },
];

// Subtle 3D tilt that follows the cursor — shared by feature and blog-style cards.
function handleCardTilt(e: ReactMouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -9;
  const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 9;
  el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
}
function resetCardTilt(e: ReactMouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = '';
}

function FeatureGrid() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.feat-card'),
      { opacity: 0, y: 48, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.09, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 78%' } });
  }, { scope: ref });

  return (
    <section className="features" ref={ref}>
      <div className="sec-head">
        <h2 className="lp-h2 tc bb-reveal">Everything you need.<br /><span className="c-gold">Nothing you don't.</span></h2>
        <p className="sec-sub tc bb-reveal">Six AI tools that cover every stage of your visa application.</p>
      </div>
      <div className="feat-grid">
        {FEATURES.map(f => (
          <div className="feat-card" key={f.t} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
            <div className="feat-top">
              <span className="feat-icon" style={{ background: f.c + '1a', color: f.c }}><f.icon size={22} strokeWidth={2.25} /></span>
              <h3 className="feat-title">{f.t}</h3>
              <p className="feat-body">{f.b}</p>
            </div>
            <div className="feat-screen">
              <img src={f.s} alt={f.t} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function PricingStrip({ nav }: { nav: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.price-card'),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.14, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
  }, { scope: ref });

  const PLANS = [
    { name: 'Free',     price: '$0',  per: '',    hot: false, features: ['3 audits / month', 'Basic score', 'Email support'],                               cta: 'Get started' },
    { name: 'Pro',      price: '$19', per: '/ mo',hot: true,  features: ['Unlimited audits', 'PDF reports', 'Consultant booking', 'Priority support'],       cta: 'Start Pro' },
    { name: 'Business', price: '$149',per: '/ mo',hot: false, features: ['Team seats (50)', 'HR portal', 'API access', 'White-label reports'],               cta: 'Contact sales' },
  ];

  return (
    <section className="pricing" ref={ref}>
      <div className="sec-head">
        <h2 className="lp-h2 tc bb-reveal">Simple, honest pricing.</h2>
        <p className="sec-sub tc bb-reveal">No hidden fees. Cancel anytime.</p>
      </div>
      <div className="price-row">
        {PLANS.map(p => (
          <div key={p.name} className={`price-card ${p.hot ? 'price-hot' : ''}`}>
            {p.hot && <span className="hot-badge">Most Popular</span>}
            <div className="price-name">{p.name}</div>
            <div className="price-amt">
              <span className="price-big">{p.price}</span>
              <span className="price-per">{p.per}</span>
            </div>
            <ul className="price-feats">
              {p.features.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
            <button className={`price-cta ${p.hot ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => nav('/pricing')}>{p.cta}</button>
          </div>
        ))}
      </div>
      <p className="pricing-more">
        See all plans →{' '}
        <button className="lnk" onClick={() => nav('/pricing')}>Enterprise &amp; API pricing</button>
      </p>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials({ onNavigate }: { onNavigate: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.sec-head'),
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
  }, { scope: ref });

  return (
    <section className="testimonials" ref={ref}>
      <div className="sec-head">
        <h2 className="lp-h2 tc bb-reveal">Built for applicants<br /><span className="c-gold">across 24+ countries.</span></h2>
        <p className="sec-sub tc bb-reveal" style={{ maxWidth: '520px', margin: '0 auto' }}>
          Visa With Ease is in early access. We're onboarding applicants and consultants — join to be among the first.
        </p>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn-primary btn-lg" onClick={() => onNavigate('/app')}>Request early access</button>
        </div>
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Try a demo account</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { persona: 'consumer',       label: 'Consumer',    desc: 'Apply for a visa',        icon: User },
              { persona: 'consultant',     label: 'Consultant',  desc: 'Review client cases',      icon: Users },
              { persona: 'hr_admin',       label: 'HR Admin',    desc: 'Manage team relocation',   icon: Building2 },
              { persona: 'platform_admin', label: 'Platform',    desc: 'System overview',          icon: ShieldCheck },
            ].map(({ persona, label, desc, icon: Icon }) => (
              <button key={persona} className="btn-outline demo-persona-btn"
                onClick={() => onNavigate(`/app?demo=${persona}`)}>
                <Icon size={18} />
                <span>
                  <b>{label}</b>
                  <small>{desc}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Compliance badges (replaces a placeholder "partner" ticker that named
// real companies with no actual partnership in place) ─────────────────────────
function ComplianceBadges() {
  const badges: [typeof Lock, string][] = [
    [Lock, 'GDPR compliant'],
    [ShieldCheck, 'UAE PDPL'],
    [ShieldAlert, 'SOC 2 in progress'],
    [KeyRound, 'TLS everywhere'],
    [CreditCard, 'No card data collected'],
  ];
  return (
    <section className="compliance-badges">
      <div className="sec-head" style={{ marginBottom: '2rem' }}>
        <h2 className="lp-h2 tc" style={{ fontSize: '1.4rem' }}>Built to the standard your data deserves.</h2>
      </div>
      <div className="badge-row">
        {badges.map(([Icon, label]) => (
          <div className="badge-pill" key={label}><span className="badge-ic"><Icon size={16} /></span>{label}</div>
        ))}
      </div>
    </section>
  );
}

// ── Download CTA ──────────────────────────────────────────────────────────────
function DownloadCTA({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.phone-frame'),
      { opacity: 0, y: 56 },
      { opacity: 1, y: 0, stagger: 0.14, duration: 0.9, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
    gsap.fromTo(ref.current!.querySelector('.dl-text'),
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 75%' } });
  }, { scope: ref });

  return (
    <section className="dl-cta" ref={ref}>
      <div className="dl-phones">
        <div className="phone-frame phone-sm phone-tilt-l"><div className="phone-notch" /><img src="/screenshots/booking-confirm.png" alt="" /></div>
        <div className="phone-frame phone-sm">                <div className="phone-notch" /><img src="/screenshots/decision.png"      alt="" /></div>
        <div className="phone-frame phone-sm phone-tilt-r"><div className="phone-notch" /><img src="/screenshots/referral.png"        alt="" /></div>
      </div>
      <div className="dl-text">
        <h2 className="lp-h2 tc">Your visa journey<br /><span className="c-gold">starts in the app.</span></h2>
        <p className="sec-sub tc">Free on web and Android. iOS is on the roadmap.</p>
        <div className="store-row">
          <button className="store-btn" onClick={onStart}>
            <PlayCircle size={26} /><span><small>Get it on</small><strong>Google Play</strong></span>
          </button>
        </div>
        <button className="btn-primary btn-lg" style={{ marginTop: '1.75rem' }} onClick={onStart}>
          Start free web audit →
        </button>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ nav }: { nav: (p: string) => void }) {
  const cols: [string, string, string][] = [
    ['Product',  '/app',             'Dashboard'],
    ['Product',  '/visa-calculator', 'Visa Calculator'],
    ['Product',  '/bank-balance',    'Bank Balance'],
    ['Product',  '/analysis',        'AI Analysis'],
    ['Platform', '/pricing',         'Pricing'],
    ['Platform', '/api-portal',      'API Portal'],
    ['Platform', '/compliance-db',   'Compliance DB'],
    ['Platform', '/partners',        'Partners'],
    ['Tools',    '/embassy-finder',  'Embassy Finder'],
    ['Tools',    '/country-comparison','Country Compare'],
    ['Tools',    '/visa-waiver',     'Visa Waiver'],
    ['Tools',    '/rejection-analyzer','Rejection Analyzer'],
    ['Company',  '/blog',            'Blog'],
    ['Company',  '/investor',        'Investors'],
    ['Company',  '/referrals',       'Referrals'],
    ['Company',  '/help',            'Help Centre'],
    ['Company',  '/settings',        'Settings'],
    ['Legal',    '/privacy',         'Privacy Policy'],
    ['Legal',    '/terms',           'Terms of Service'],
  ];
  const groups: Record<string, typeof cols> = {};
  cols.forEach(c => { (groups[c[0]] ??= []).push(c); });

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo"><img src="/logo-icon.png" alt="" /><span className="logo-word"><b>Visa</b> With <b className="logo-ease">Ease</b></span></div>
          <p className="footer-tag">AI-powered visa auditing for the modern traveller.</p>
          <p className="footer-legal">© 2026 Visa With Ease Inc. · GDPR · UAE PDPL · SOC 2</p>
        </div>
        {Object.entries(groups).map(([cat, links]) => (
          <div key={cat} className="footer-col">
            <h4 className="footer-head">{cat}</h4>
            <ul>
              {links.map(([, path, label]) => (
                <li key={path}><button className="footer-lnk" onClick={() => nav(path)}>{label}</button></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function TopNav({ nav }: { nav: (p: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => ref.current?.classList.toggle('nav-solid', window.scrollY > 56);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links: [string, string][] = [
    ['Blog', '/blog'], ['Pricing', '/pricing'], ['Compliance', '/compliance-db'],
    ['Partners', '/partners'], ['API', '/api-portal'], ['Investors', '/investor'],
  ];
  const go = (p: string) => { setMenuOpen(false); nav(p); };

  return (
    <>
      <nav className="top-nav" ref={ref}>
        <button className="logo nav-logo" onClick={() => go('/app')}>
          <img src="/logo-icon.png" alt="" /><span className="logo-word"><b>Visa</b> With <b className="logo-ease">Ease</b></span>
        </button>
        <div className="nav-links">
          {links.map(([l, p]) => (
            <button key={p} className="nav-lnk" onClick={() => nav(p)}>{l}</button>
          ))}
        </div>
        <div className="nav-actions">
          <button className="btn-ghost nav-sign" onClick={() => go('/app')}>Sign in</button>
          <button className="btn-primary nav-cta" onClick={() => go('/app')}>Start free</button>
          <button
            className={`nav-burger${menuOpen ? ' open' : ''}`}
            aria-label="Menu" aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          ><span /></button>
        </div>
      </nav>
      <div className={`mobile-nav-panel${menuOpen ? ' open' : ''}`}>
        {links.map(([l, p]) => (
          <button key={p} className="mnp-link" onClick={() => go(p)}>{l}</button>
        ))}
        <div className="mnp-actions">
          <button className="btn-ghost" onClick={() => go('/app')}>Sign in</button>
          <button className="btn-primary" onClick={() => go('/app')}>Start free</button>
        </div>
      </div>
    </>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.step3'),
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
  }, { scope: ref });

  const steps = [
    { t: 'Upload your document', b: 'Photo, PDF, or live camera — OCR extracts every field in seconds.' },
    { t: 'Get your AI audit & score', b: 'Every clause checked against live, scraped embassy requirements.' },
    { t: 'Book an expert & submit', b: 'Match with a certified consultant and submit with confidence.' },
  ];
  return (
    <section className="how-steps" ref={ref}>
      <div className="sec-head"><h2 className="lp-h2 tc">From upload to approval — three steps.</h2></div>
      <div className="steps3-row">
        {steps.map((s, i) => (
          <div className="step3" key={s.t}>
            <div className="step3-n">{i + 1}</div>
            <h3>{s.t}</h3>
            <p>{s.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Showcase carousel — real screens, click/arrows/keyboard ────────────────────
function ShowcaseCarousel() {
  const [idx, setIdx] = useState(0);
  const n = SLIDES.length;
  const go = (i: number) => setIdx(((i % n) + n) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <section className="showcase2">
      <div className="sec-head" style={{ marginBottom: '1.25rem' }}>
        <h2 className="lp-h2 tc">The full journey,<br /><span className="c-gold">in one app.</span></h2>
      </div>
      <div className="showcase2-body">
        <div className="showcase2-list">
          <p className="kbd-hint-lbl">Click a step, use the arrows, or press the arrow keys.</p>
          <div className="kbd-hint"><span className="kbd">&larr;</span><span className="kbd">&rarr;</span> to move between screens</div>
          {SLIDES.map((s, i) => (
            <div key={s.src} className={`sc-cap-item${i === idx ? ' active' : ''}`} onClick={() => go(i)}>
              <span className="sc-cap-n">{s.step}</span>
              <div><h4>{s.label}</h4>{i === idx && <p>{s.caption}</p>}</div>
            </div>
          ))}
        </div>
        <div className="showcase2-viewport">
          <button className="carousel-arrow prev" onClick={() => go(idx - 1)} aria-label="Previous screen">&#8249;</button>
          <div className="phone-frame phone-xl">
            <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
              {SLIDES.map(s => (
                <div className="carousel-slide" key={s.src}><img src={s.src} alt={s.label} /></div>
              ))}
            </div>
          </div>
          <button className="carousel-arrow next" onClick={() => go(idx + 1)} aria-label="Next screen">&#8250;</button>
        </div>
      </div>
      <div className="carousel-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={`c-dot${i === idx ? ' on' : ''}`} onClick={() => go(i)} aria-label={`Go to screen ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}

// ── Mobile app promo ─────────────────────────────────────────────────────────
function MobileAppPromo() {
  return (
    <section className="app-promo-section">
      <div className="app-promo">
        <div>
          <div className="eyebrow"><span className="dot" />Mobile app</div>
          <h2 className="lp-h2">Take your audit<br /><span className="c-gold">with you.</span></h2>
          <p className="sec-sub" style={{ margin: '0.75rem 0 1.5rem', textAlign: 'left', maxWidth: '420px' }}>
            Scan a document with your camera, get a push notification the moment your score updates, and check your checklist offline — the full product, in your pocket.
          </p>
          <div className="app-promo-list">
            <div className="app-promo-item"><span className="app-promo-ic">📷</span><div><b>Camera OCR scan</b><span>Point, shoot, and every field is extracted automatically.</span></div></div>
            <div className="app-promo-item"><span className="app-promo-ic">🔔</span><div><b>Push notifications</b><span>Know the moment your audit finishes or a consultant replies.</span></div></div>
            <div className="app-promo-item"><span className="app-promo-ic">📋</span><div><b>Offline checklist</b><span>Review what's left even without a connection.</span></div></div>
          </div>
        </div>
        <div className="app-promo-visual">
          <div className="phone-frame phone-sm"><img src="/screenshots/dashboard.png" alt="Dashboard on mobile" /></div>
        </div>
      </div>
    </section>
  );
}

// ── Destinations sample ──────────────────────────────────────────────────────
function DestinationsGrid() {
  const dests: [string, string, string][] = [
    ['🇫🇷', 'France', 'Schengen'], ['🇩🇪', 'Germany', 'Schengen'], ['🇦🇪', 'UAE', 'Golden Visa'],
    ['🇬🇧', 'UK', 'Standard Visitor'], ['🇨🇦', 'Canada', 'Visitor'], ['🇺🇸', 'USA', 'B1/B2'],
  ];
  return (
    <section className="dest-section">
      <div className="sec-head">
        <h2 className="lp-h2 tc">24+ countries, live compliance data.</h2>
        <p className="sec-sub tc">A sample of destinations covered — full list inside the app.</p>
      </div>
      <div className="dest-grid">
        {dests.map(([flag, name, type]) => (
          <div className="dest-chip" key={name}><span className="flag">{flag}</span><div><b>{name}</b><span>{type}</span></div></div>
        ))}
      </div>
      <p className="dest-more">+ 18 more destinations, updated as embassy requirements change</p>
    </section>
  );
}

// ── Comparison table ─────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows: [string, string, string, string][] = [
    ['Cost', 'Free, but risk of resubmission fees', '$150–$500+ per application', 'Free audit, from $19/mo'],
    ['Time to first review', 'Hours of manual research', '1–3 business days', 'Under 5 minutes'],
    ['Checked against live embassy rules', 'Manual, easy to miss updates', "Depends on agent's knowledge", 'Automatically'],
    ['Available 24/7', 'Yes', 'Business hours only', 'Yes'],
    ['Human consultant on request', '—', 'Yes', 'Book anytime'],
  ];
  return (
    <section className="compare-section">
      <div className="sec-head">
        <h2 className="lp-h2 tc">Why not just use an agent?</h2>
        <p className="sec-sub tc">Same outcome you're after — approval — compared honestly.</p>
      </div>
      <div className="compare-wrap">
        <table className="compare-table">
          <thead><tr><th /><th>Doing it yourself</th><th>Traditional agent</th><th className="col-hot">Visa With Ease</th></tr></thead>
          <tbody>
            {rows.map(([label, diy, agent, us]) => (
              <tr key={label}><td>{label}</td><td>{diy}</td><td>{agent}</td><td className="col-hot">{us}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Teams / Enterprise banner ────────────────────────────────────────────────
function TeamsBanner({ nav }: { nav: (p: string) => void }) {
  return (
    <section className="teams-section">
      <div className="teams-banner">
        <div>
          <h2>Relocating a team, not just yourself?</h2>
          <p>The Business plan adds an HR portal, bulk applications for dependents, API access, and white-label reports — built for mobility teams handling 10+ moves a year.</p>
        </div>
        <div className="teams-actions">
          <button className="btn-white" onClick={() => nav('/pricing')}>See Business plan</button>
          <button className="btn-ghost-dark" onClick={() => nav('/pricing')}>Talk to sales</button>
        </div>
      </div>
    </section>
  );
}

// ── Blog preview — real posts, not placeholders ──────────────────────────────
function BlogPreview({ nav }: { nav: (p: string) => void }) {
  const picks = POSTS.slice(0, 3);
  return (
    <section className="blog-preview">
      <div className="sec-head">
        <h2 className="lp-h2 tc">From the blog.</h2>
        <p className="sec-sub tc">Real, embassy-informed guidance — written by the team building the audit engine.</p>
      </div>
      <div className="blog-grid3">
        {picks.map(p => (
          <button className="blog-card3" key={p.slug} onClick={() => nav(`/blog/${p.slug}`)}>
            <span className="blog-tag3" style={{ background: p.color + '18', color: p.color }}>{p.category}</span>
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
            <div className="blog-meta3"><span>{p.readTime}</span></div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQSection() {
  const items = [
    { q: 'Are my uploaded documents stored permanently?', a: "No. Original files are processed only to generate your audit results — we don't keep a searchable copy of the raw document. Only your score and findings are saved to your account." },
    { q: 'Do you store my card or payment details?', a: "No. Visa With Ease doesn't process payments today. No card numbers are collected anywhere on the site or app." },
    { q: 'Which countries do you support?', a: '24+ destination countries today, with embassy requirement data refreshed continuously.' },
    { q: 'Is Visa With Ease available on mobile?', a: 'Yes — the full product is on the web and as a native Android app. iOS is on the roadmap.' },
    { q: 'How is my data protected?', a: 'All traffic runs over HTTPS/TLS, passwords are one-way hashed, and access to production data is limited to engineers who need it to operate the service.' },
  ];
  return (
    <section className="faq-section">
      <div className="sec-head"><h2 className="lp-h2 tc">Frequently asked.</h2></div>
      <div className="faq-list2">
        {items.map((it, i) => (
          <details className="faq-item2" key={it.q} open={i === 0}>
            <summary>{it.q}</summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LandingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('bb-in')),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.bb-reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp">
      <TopNav nav={onNavigate} />
      <Hero onStart={() => onNavigate('/app')} />
      <StatsBar />
      <FeatureGrid />
      <HowItWorks />
      <ShowcaseCarousel />
      <MobileAppPromo />
      <DestinationsGrid />
      <ComparisonTable />
      <Testimonials onNavigate={onNavigate} />
      <PricingStrip nav={onNavigate} />
      <TeamsBanner nav={onNavigate} />
      <ComplianceBadges />
      <BlogPreview nav={onNavigate} />
      <FAQSection />
      <DownloadCTA onStart={() => onNavigate('/app')} />
      <Footer nav={onNavigate} />
    </div>
  );
}
