import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft, ArrowRight, Calendar, Clock, FileCheck2, ShieldAlert,
  Plane, Bot, Wallet, Globe2,
} from 'lucide-react';
import './landing.css';
import './blog.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ── Content ──────────────────────────────────────────────────────────────────
type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] };

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  icon: typeof FileCheck2;
  color: string;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: 'schengen-visa-document-checklist-2026',
    title: 'The complete Schengen visa document checklist for 2026',
    excerpt: 'Every document embassies actually check, in the order they check it — plus the two most common gaps that trigger a request for more evidence.',
    category: 'Checklists',
    date: '2026-06-02',
    readTime: '7 min read',
    icon: FileCheck2,
    color: '#1a56db',
    body: [
      { type: 'p', text: "Schengen applications are rejected far more often for incomplete evidence than for anything to do with the traveller themselves. Consulates process thousands of files a week, and an officer who can't confirm your return-trip intent or financial coverage in under two minutes will default to a refusal rather than chase you for clarification. The fix isn't a thicker folder — it's the right documents, in the right order, each one answering a specific question the officer is trained to ask." },
      { type: 'h2', text: 'The core set every applicant needs' },
      { type: 'ul', items: [
        'Passport valid for at least 3 months past your planned departure date, with two blank pages',
        'Completed and signed application form matching your passport details exactly',
        'One recent biometric photo (35×45mm, plain background, taken within the last 6 months)',
        'Round-trip flight reservation — a hold, not a paid ticket, is accepted by most consulates',
        'Proof of accommodation for every night of the stay (hotel confirmation or signed invitation letter)',
        'Travel insurance covering at least €30,000 in medical expenses, valid across the whole Schengen area',
        'Bank statements from the last 3 months showing stable, sufficient funds',
      ] },
      { type: 'h2', text: 'Where most applications actually fail' },
      { type: 'p', text: "Two gaps account for the majority of the refusals we see flagged in document audits. The first is itinerary mismatch: a flight that lands in Paris on the 4th but a hotel booking that only starts on the 6th, with no explanation for the gap. Officers read this as evidence the trip isn't real. The second is financial evidence that's technically present but not legible — a screenshot instead of a stamped statement, or a balance that doesn't cover the length of stay at a reasonable daily rate. Neither is a big fix, but both are invisible until someone (or something) actually cross-checks every date and figure against every other document in the file." },
      { type: 'h2', text: 'A faster way to check your own file' },
      { type: 'p', text: "Before you submit, lay every document side by side and manually verify: names spelled identically everywhere, dates that don't contradict each other, and a balance that clears the per-day minimum your destination publishes. This is exactly the cross-referencing an AI document audit automates — Visa With Ease reads every upload the way an officer does, flags the specific line that doesn't match, and tells you which document to fix before you book an appointment you can't get back." },
    ],
  },
  {
    slug: 'why-visa-applications-get-rejected',
    title: '7 reasons visa applications get rejected — and how to avoid them',
    excerpt: "Refusal letters rarely explain the real reason. Here's what's actually behind the most common rejection codes, from insufficient funds to unexplained travel history gaps.",
    category: 'Guides',
    date: '2026-05-18',
    readTime: '6 min read',
    icon: ShieldAlert,
    color: '#dc2626',
    body: [
      { type: 'p', text: "Refusal letters are deliberately vague — most just cite a regulation number. Having audited thousands of applications, the same seven root causes explain almost every rejection we see, and every one of them is preventable if you catch it before submission rather than after a refusal letter arrives." },
      { type: 'ul', items: [
        'Insufficient or unclear proof of funds — the balance exists, but the statement doesn\'t clearly show it\'s yours or that it\'s been there long enough',
        'Weak ties to your home country — no evidence of a job, lease, or family obligations pulling you back',
        'Inconsistent trip details — flight dates, hotel dates, and stated purpose that don\'t line up',
        'Previous visa refusals or overstays not disclosed, discovered during the background check',
        'Invitation letters that don\'t match the applicant\'s stated relationship or itinerary',
        'Missing or expired travel insurance, or coverage below the required minimum',
        'Photos or documents that don\'t meet the exact format the consulate specifies',
      ] },
      { type: 'h2', text: 'The "ties to home" problem is the hardest to see yourself' },
      { type: 'p', text: "Most applicants focus entirely on proving they can afford the trip and forget the second, unwritten question every officer is answering: why will you come back? A stack of payslips doesn't answer that on its own. Evidence like a signed employment letter confirming your leave was approved, a lease in your name, or enrolment proof for a course starting after your return date does far more to establish intent than a bigger bank balance." },
      { type: 'h2', text: 'If you\'ve been refused before' },
      { type: 'p', text: 'A prior refusal isn\'t disqualifying, but it must be disclosed — omitting it is treated far more seriously than the original refusal itself. Address the specific reason cited last time directly in your new application; reapplying with an unchanged file is the single most common reason for a second refusal.' },
    ],
  },
  {
    slug: 'uae-to-europe-visa-timeline',
    title: 'UAE to Europe: a realistic visa application timeline',
    excerpt: 'How many weeks to actually budget from first appointment slot to passport back in hand — and the two points in the process most likely to cause delays.',
    category: 'Planning',
    date: '2026-05-04',
    readTime: '5 min read',
    icon: Plane,
    color: '#0ea5e9',
    body: [
      { type: 'p', text: 'Consulates advertise a 15-day processing window, but that clock only starts once your application is formally lodged — and getting to that point from the UAE, where appointment slots at popular consulates book out weeks in advance, is usually the longer half of the timeline. Budget realistically and you avoid the single most stressful failure mode: a confirmed non-refundable trip with no visa to match it.' },
      { type: 'h2', text: 'A realistic week-by-week budget' },
      { type: 'ul', items: [
        'Weeks 1–3: Secure a visa appointment slot — this is the least predictable step and the one to start earliest',
        'Week 4: Assemble and cross-check every document; this is where an AI audit saves the most time',
        'Week 5: Attend the appointment, submit biometrics and the full file',
        'Weeks 5–7: Processing (embassies quote 15 calendar days, but 10 business days is a safer floor)',
        'Week 7–8: Passport return, either by courier or in-person collection',
      ] },
      { type: 'h2', text: 'The two delay points to plan around' },
      { type: 'p', text: 'First, appointment availability — during UAE summer and around major holidays, popular consulates can be fully booked six to eight weeks out. Check availability before you commit to travel dates, not after. Second, requests for additional documents: if an officer flags a gap in your file, the clock effectively restarts while you supply it by courier or in person. Every day spent catching an inconsistency before submission is a day you don\'t lose waiting for a follow-up request mid-process.' },
    ],
  },
  {
    slug: 'how-ai-document-audits-work',
    title: "How AI document audits catch errors humans miss",
    excerpt: "The failure mode isn't stupidity — it's fatigue and pattern-blindness. Here's what a document audit actually checks, field by field, and why it works better than a second read-through.",
    category: 'Product',
    date: '2026-04-21',
    readTime: '5 min read',
    icon: Bot,
    color: '#7c3aed',
    body: [
      { type: 'p', text: "Reading your own application for the fifth time doesn't catch new errors — it catches fewer of them, because you already know what each document is supposed to say and your eyes skip past the mismatch. This is exactly the failure mode document-audit AI is built to avoid: it doesn't know what you meant to write, only what's actually on the page, cross-referenced against every other page in the file." },
      { type: 'h2', text: "What actually gets checked" },
      { type: 'ul', items: [
        'Every name, date of birth, and passport number is compared for exact matches across all uploaded documents',
        'Travel dates on flights, hotel bookings, and insurance are checked for overlap and continuity',
        'Financial statements are parsed for balance, currency, and statement date freshness against the destination\'s published minimum',
        'Document formatting — photo dimensions, scan resolution, page completeness — against the specific consulate\'s stated requirements',
        'Expiry dates on the passport, insurance, and any supporting IDs against the travel window',
      ] },
      { type: 'h2', text: "Why this catches more than a second read" },
      { type: 'p', text: 'A human reviewer, even a careful one, holds maybe five or six data points in working memory while scanning a document. A real application file has fifty or more that need to agree with each other simultaneously — a birthdate on page 2 that must match the one on page 11, a hotel check-in date that must fall inside the insurance coverage window that must in turn cover the return flight date. An audit engine checks all of these as a graph, not a list, which is why the errors it surfaces are so often ones the applicant genuinely didn\'t know were there.' },
    ],
  },
  {
    slug: 'financial-proof-what-embassies-want',
    title: 'Financial proof for visa applications: what embassies actually want to see',
    excerpt: 'A bank balance alone rarely satisfies an officer. The real test is whether the money is provably yours, stable, and sized correctly for your specific trip.',
    category: 'Guides',
    date: '2026-04-09',
    readTime: '6 min read',
    icon: Wallet,
    color: '#16a34a',
    body: [
      { type: 'p', text: "Officers aren't looking for a big number — they're looking for evidence that the money is genuinely available, has been there long enough to be real, and is sized to the actual cost of your specific trip rather than a generic minimum. A last-minute deposit the week before your appointment is one of the fastest ways to trigger a request for clarification, even if the final balance looks fine." },
      { type: 'h2', text: 'What "stable" means to an officer' },
      { type: 'p', text: "Most consulates want three months of statements, not a single snapshot balance, specifically so they can see the pattern behind the number. A steady balance built from regular salary deposits reads very differently to a reviewer than an account that jumped from near-zero to well-funded two weeks before you applied. If a relative or sponsor is covering your trip, their statements need to be included alongside a signed sponsorship letter — sponsorship claimed but not documented is treated the same as funds not being shown at all." },
      { type: 'h2', text: 'Sizing it to the trip, not a generic rule' },
      { type: 'p', text: "Published minimums (often quoted as a flat daily rate) are a floor, not a target. An officer sizing your file against a five-star hotel booking and a two-week stay will expect funds well above the minimum; the same balance against a budget hostel and a five-day trip may need no adjustment at all. Matching your financial evidence to what your itinerary actually costs is a stronger signal than clearing the minimum by a wide margin with an itinerary that doesn't need it." },
    ],
  },
  {
    slug: 'visa-waiver-vs-visa-required',
    title: 'Visa waiver vs visa required: how to check in 30 seconds',
    excerpt: 'Passport nationality alone doesn\'t answer it — purpose of travel, trip length, and even your layover country can change what you actually need.',
    category: 'Tools',
    date: '2026-03-27',
    readTime: '4 min read',
    icon: Globe2,
    color: '#f59e0b',
    body: [
      { type: 'p', text: "\"Do I need a visa for this trip\" sounds like a lookup you can answer with your passport's nationality alone. It usually isn't. The same passport can be visa-free for a two-week holiday, require an eVisa for business travel, and need a full consulate application for a stay over 90 days — all to the same destination." },
      { type: 'h2', text: 'The four factors that actually determine the answer' },
      { type: 'ul', items: [
        'Passport nationality — the starting point, but rarely the full answer',
        'Purpose of travel — tourism, business, transit, and study frequently have different rules even for the same passport and destination',
        'Length of stay — many "visa-free" arrangements only apply below a specific day threshold, often 90 days',
        'Transit and layover countries — some countries require a transit visa even if you never leave the airport',
      ] },
      { type: 'h2', text: 'Why this is worth checking every time, not just once' },
      { type: 'p', text: 'Waiver programmes and reciprocal agreements change more often than most travellers expect — a country that was visa-free last year can add a pre-registration requirement (like an ETA or eVisa) without much notice. Checking fresh for each trip, against your specific nationality, destination, purpose, and length of stay, catches these changes before they become a problem at the check-in counter rather than after.' },
    ],
  },
];

function handleCardTilt(e: ReactMouseEvent<HTMLButtonElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
  const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
  el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
}
function resetCardTilt(e: ReactMouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.transform = '';
}

export function getPost(slug: string) {
  return POSTS.find(p => p.slug === slug);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Nav + Footer (reuse landing page chrome for consistency) ──────────────────
function BlogNav({ nav }: { nav: (p: string) => void }) {
  return (
    <nav className="top-nav nav-solid">
      <button className="logo nav-logo" onClick={() => nav('/')}>
        <img src="/logo-icon.png" alt="" /><span className="logo-word"><b>Visa</b> With <b className="logo-ease">Ease</b></span>
      </button>
      <div className="nav-links">
        {[['Blog', '/blog'], ['Pricing', '/pricing'], ['Compliance', '/compliance-db'], ['Partners', '/partners'], ['API', '/api-portal']].map(([l, p]) => (
          <button key={p} className="nav-lnk" onClick={() => nav(p)}>{l}</button>
        ))}
      </div>
      <div className="nav-actions">
        <button className="btn-ghost nav-sign" onClick={() => nav('/app')}>Sign in</button>
        <button className="btn-primary nav-cta" onClick={() => nav('/app')}>Start free</button>
      </div>
    </nav>
  );
}

function BlogFootCta({ nav }: { nav: (p: string) => void }) {
  return (
    <section className="blog-cta">
      <h2 className="lp-h2">Ready to audit your own application?</h2>
      <p className="sec-sub">Free to start. Takes under five minutes.</p>
      <button className="btn-primary btn-lg" onClick={() => nav('/app')}>Start free audit →</button>
    </section>
  );
}

// ── Blog index ───────────────────────────────────────────────────────────────
export function BlogIndexPage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [featured, ...rest] = POSTS;

  useGSAP(() => {
    gsap.fromTo(ref.current!.querySelectorAll('.blog-card'),
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%' } });
  }, { scope: ref });

  return (
    <div className="lp blog-page">
      <BlogNav nav={navigate} />
      <header className="blog-hero">
        <span className="blog-eyebrow">Visa With Ease Blog</span>
        <h1 className="lp-h2">Guides, checklists and product notes<br /><span className="c-gold">for a smoother visa journey.</span></h1>
        <p className="sec-sub">Real, embassy-informed guidance — written by the same team building the audit engine.</p>
      </header>

      <button className="blog-featured" onClick={() => navigate(`/blog/${featured.slug}`)}>
        <div className="blog-featured-icon" style={{ background: featured.color }}>
          <featured.icon size={32} color="#fff" />
        </div>
        <div className="blog-featured-body">
          <span className="blog-tag" style={{ color: featured.color, background: featured.color + '18' }}>{featured.category}</span>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <div className="blog-meta">
            <span><Calendar size={13} /> {fmtDate(featured.date)}</span>
            <span><Clock size={13} /> {featured.readTime}</span>
          </div>
        </div>
        <ArrowRight className="blog-featured-arrow" size={22} />
      </button>

      <div className="blog-grid" ref={ref}>
        {rest.map(p => (
          <button key={p.slug} className="blog-card" onClick={() => navigate(`/blog/${p.slug}`)} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
            <div className="blog-card-icon" style={{ background: p.color + '18', color: p.color }}>
              <p.icon size={22} strokeWidth={2.25} />
            </div>
            <span className="blog-tag" style={{ color: p.color, background: p.color + '18' }}>{p.category}</span>
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
            <div className="blog-meta">
              <span><Calendar size={13} /> {fmtDate(p.date)}</span>
              <span><Clock size={13} /> {p.readTime}</span>
            </div>
          </button>
        ))}
      </div>

      <BlogFootCta nav={navigate} />
      <BlogSimpleFooter nav={navigate} />
    </div>
  );
}

// ── Blog post ────────────────────────────────────────────────────────────────
export function BlogPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!post) {
    return (
      <div className="lp blog-page">
        <BlogNav nav={navigate} />
        <div className="blog-article" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 className="lp-h2">Post not found</h1>
          <button className="lnk" onClick={() => navigate('/blog')}>← Back to the blog</button>
        </div>
      </div>
    );
  }

  const related = POSTS.filter(p => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const relatedFallback = related.length ? related : POSTS.filter(p => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="lp blog-page">
      <BlogNav nav={navigate} />
      <article className="blog-article">
        <Link to="/blog" className="blog-back"><ArrowLeft size={15} /> All articles</Link>
        <span className="blog-tag" style={{ color: post.color, background: post.color + '18' }}>{post.category}</span>
        <h1>{post.title}</h1>
        <div className="blog-meta blog-meta-lg">
          <span><Calendar size={14} /> {fmtDate(post.date)}</span>
          <span><Clock size={14} /> {post.readTime}</span>
        </div>
        <div className="blog-article-icon" style={{ background: post.color }}>
          <post.icon size={40} color="#fff" />
        </div>
        <div className="blog-body">
          {post.body.map((b, i) => {
            if (b.type === 'h2') return <h2 key={i}>{b.text}</h2>;
            if (b.type === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>;
            return <p key={i}>{b.text}</p>;
          })}
        </div>
      </article>

      {relatedFallback.length > 0 && (
        <div className="blog-related">
          <h3>Keep reading</h3>
          <div className="blog-grid blog-grid-related">
            {relatedFallback.map(p => (
              <button key={p.slug} className="blog-card" onClick={() => navigate(`/blog/${p.slug}`)} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
                <div className="blog-card-icon" style={{ background: p.color + '18', color: p.color }}>
                  <p.icon size={22} strokeWidth={2.25} />
                </div>
                <span className="blog-tag" style={{ color: p.color, background: p.color + '18' }}>{p.category}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <BlogFootCta nav={navigate} />
      <BlogSimpleFooter nav={navigate} />
    </div>
  );
}

function BlogSimpleFooter({ nav }: { nav: (p: string) => void }) {
  return (
    <footer className="footer">
      <div className="footer-inner" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <div className="footer-brand">
          <div className="logo"><img src="/logo-icon.png" alt="" /><span className="logo-word"><b>Visa</b> With <b className="logo-ease">Ease</b></span></div>
          <p className="footer-tag">AI-powered visa auditing for the modern traveller.</p>
          <p className="footer-legal">© 2026 Visa With Ease Inc. · GDPR · UAE PDPL · SOC 2</p>
        </div>
        <div className="footer-col">
          <h4 className="footer-head">Explore</h4>
          <ul>
            <li><button className="footer-lnk" onClick={() => nav('/blog')}>Blog</button></li>
            <li><button className="footer-lnk" onClick={() => nav('/pricing')}>Pricing</button></li>
            <li><button className="footer-lnk" onClick={() => nav('/help')}>Help Centre</button></li>
            <li><button className="footer-lnk" onClick={() => nav('/app')}>Dashboard</button></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-head">Legal</h4>
          <ul>
            <li><button className="footer-lnk" onClick={() => nav('/privacy')}>Privacy Policy</button></li>
            <li><button className="footer-lnk" onClick={() => nav('/terms')}>Terms of Service</button></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
