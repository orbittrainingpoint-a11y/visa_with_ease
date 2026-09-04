import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Bot, BarChart3, CalendarClock, Globe2, FileText, Gift,
  Apple, PlayCircle, Play, Sparkles, User, Users, Building2, ShieldCheck,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
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

const STORY_PANELS = [
  { screen: '/screenshots/welcome.png',      tag: '01 — Onboard', title: 'Sign up in 30 seconds.',      body: 'No paperwork upfront. Just email and destination — Visa With Ease handles everything from here.' },
  { screen: '/screenshots/new-app.png',      tag: '02 — Upload',  title: 'Drop your document.',          body: 'Photo, PDF, or live camera. OCR extracts every field in seconds, automatically.' },
  { screen: '/screenshots/audit-report.png', tag: '03 — AI Audit',title: 'AI checks every clause.',      body: 'Our AI cross-references your document against live, scraped embassy requirements.' },
  { screen: '/screenshots/booking.png',      tag: '04 — Expert',  title: 'Book a certified consultant.', body: 'Real-time calendar matching. Consultants filtered by visa type, language, and time zone.' },
  { screen: '/screenshots/decision.png',     tag: '05 — Decision',title: "Approved. What's next?",      body: 'Decision decoded with step-by-step guidance for every visa milestone that follows.' },
];

const N_SLIDES = SLIDES.length;
const N_PANELS = STORY_PANELS.length;

// ── Sticky Carousel — "The full journey" ──────────────────────────────────────
function StickyCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        setActive(Math.min(Math.floor(self.progress * (N_SLIDES + 1)), N_SLIDES - 1));
      },
    });
  }, { scope: containerRef });

  return (
    <>
      {/* Desktop: sticky split */}
      <div ref={containerRef} className="sc-wrap" style={{ height: `calc(${(N_SLIDES + 1) * 100}vh)` }}>
        <div className="sc-sticky">
          <div className="sc-left">
            <h2 className="lp-h2">
              The full journey,<br />
              <span className="c-gold">in one app.</span>
            </h2>
            <div className="sc-slide-box">
              {SLIDES.map((s, i) => (
                <div key={i} className={`sc-slide ${i === active ? 'is-active' : ''}`}>
                  <p className="sc-step">{s.step} — {s.label}</p>
                  <p className="sc-caption">{s.caption}</p>
                </div>
              ))}
            </div>
            <div className="pips">
              {SLIDES.map((_, i) => (
                <span key={i} className={`pip ${i === active ? 'pip-on' : i < active ? 'pip-done' : ''}`} />
              ))}
            </div>
          </div>
          <div className="sc-right">
            <div className="phone-frame phone-xl">
              <div className="phone-notch" />
              {SLIDES.map((s, i) => (
                <img key={s.src} src={s.src} alt={s.label}
                  className={`slide-img ${i === active ? 'is-active' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: grid of cards */}
      <div className="sc-mobile">
        <h2 className="lp-h2 tc">The full journey,<br /><span className="c-gold">in one app.</span></h2>
        <div className="sc-mobile-grid">
          {SLIDES.map((s, i) => (
            <div key={i} className="sc-mobile-card">
              <div className="phone-frame phone-sm">
                <div className="phone-notch" />
                <img src={s.src} alt={s.label} />
              </div>
              <p className="sc-step">{s.step} — {s.label}</p>
              <p className="sc-caption">{s.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Sticky Story — "Stage of your journey" ────────────────────────────────────
function StickyStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        setActive(Math.min(Math.floor(self.progress * (N_PANELS + 1)), N_PANELS - 1));
      },
    });
  }, { scope: containerRef });

  return (
    <>
      {/* Desktop */}
      <div ref={containerRef} className="ss-wrap" style={{ height: `calc(${(N_PANELS + 1) * 100}vh)` }}>
        <div className="ss-sticky">
          <div className="ss-left">
            <div className="phone-frame phone-xl">
              <div className="phone-notch" />
              {STORY_PANELS.map((p, i) => (
                <img key={p.screen} src={p.screen} alt={p.tag}
                  className={`slide-img ${i === active ? 'is-active' : ''}`} />
              ))}
            </div>
          </div>
          <div className="ss-right">
            <h2 className="lp-h2">
              Built for every<br />
              <span className="c-gold">stage of your journey.</span>
            </h2>
            <div className="sc-slide-box ss-slide-box">
              {STORY_PANELS.map((p, i) => (
                <div key={i} className={`sc-slide ${i === active ? 'is-active' : ''}`}>
                  <p className="sc-step">{p.tag}</p>
                  <h3 className="ss-panel-title">{p.title}</h3>
                  <p className="sc-caption">{p.body}</p>
                </div>
              ))}
            </div>
            <div className="pips">
              {STORY_PANELS.map((_, i) => (
                <span key={i} className={`pip ${i === active ? 'pip-on' : i < active ? 'pip-done' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="sc-mobile ss-mobile">
        <h2 className="lp-h2 tc">Built for every<br /><span className="c-gold">stage of your journey.</span></h2>
        <div className="sc-mobile-grid">
          {STORY_PANELS.map((p, i) => (
            <div key={i} className="sc-mobile-card">
              <div className="phone-frame phone-sm">
                <div className="phone-notch" />
                <img src={p.screen} alt={p.tag} />
              </div>
              <p className="sc-step">{p.tag}</p>
              <h3 className="ss-panel-title" style={{ fontSize: '1rem' }}>{p.title}</h3>
              <p className="sc-caption">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

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

// ── Partner ticker ────────────────────────────────────────────────────────────
function PartnerStrip() {
  const chips = ['Emirates', 'Airbnb', 'AXA Insurance', 'WeWork', 'Booking.com',
                 'Allianz', 'IHG Hotels', 'Flydubai', 'Cigna', 'Regus'];
  return (
    <div className="partner-strip">
      <p className="partner-lbl">Ecosystem partners</p>
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...chips, ...chips].map((c, i) => <span key={i} className="partner-chip">{c}</span>)}
        </div>
      </div>
    </div>
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
        <p className="sec-sub tc">Free on iOS and Android. Pro features available inside.</p>
        <div className="store-row">
          <button className="store-btn" onClick={onStart}>
            <Apple size={26} /><span><small>Download on the</small><strong>App Store</strong></span>
          </button>
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
  useEffect(() => {
    const h = () => ref.current?.classList.toggle('nav-solid', window.scrollY > 56);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav className="top-nav" ref={ref}>
      <button className="logo nav-logo" onClick={() => nav('/app')}>
        <img src="/logo-icon.png" alt="" /><span className="logo-word"><b>Visa</b> With <b className="logo-ease">Ease</b></span>
      </button>
      <div className="nav-links">
        {[['Blog', '/blog'], ['Pricing', '/pricing'], ['Compliance', '/compliance-db'],
          ['Partners', '/partners'], ['API', '/api-portal'], ['Investors', '/investor']
        ].map(([l, p]) => (
          <button key={p} className="nav-lnk" onClick={() => nav(p)}>{l}</button>
        ))}
      </div>
      <div className="nav-actions">
        <button className="btn-ghost nav-sign" onClick={() => nav('/app')}>Sign in</button>
        <button className="btn-primary nav-cta"  onClick={() => nav('/app')}>Start free</button>
      </div>
    </nav>
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
      <StickyCarousel />
      <StickyStory />
      <FeatureGrid />
      <PricingStrip nav={onNavigate} />
      <Testimonials onNavigate={onNavigate} />
      <PartnerStrip />
      <DownloadCTA onStart={() => onNavigate('/app')} />
      <Footer nav={onNavigate} />
    </div>
  );
}
