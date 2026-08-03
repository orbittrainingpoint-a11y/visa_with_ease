/* global React */
// VisaIQ shared UI primitives

// ─── Status chip ────────────────────────────────────────────────────────────
function Chip({ tone = 'neutral', icon, children, size = 'md', style }) {
  const tones = {
    success: { bg: '#D1FAE5', fg: '#047857' },
    warning: { bg: '#FFEDD5', fg: '#9A3412' },
    error:   { bg: '#FEE2E2', fg: '#991B1B' },
    info:    { bg: '#EFF6FF', fg: '#1547C0' },
    neutral: { bg: '#F1F5F9', fg: '#475569' },
    ai:      { bg: '#EDE9FE', fg: '#6D28D9' },
    gold:    { bg: '#FEF3C7', fg: '#92400E' },
    royal:   { bg: '#1A56DB', fg: '#fff' },
  };
  const t = tones[tone] || tones.neutral;
  const sz = size === 'sm' ? { h: 18, fs: 10, px: 6, gap: 3, ic: 10 } : { h: 22, fs: 11, px: 8, gap: 4, ic: 12 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: sz.gap, height: sz.h, padding: `0 ${sz.px}px`,
      background: t.bg, color: t.fg, borderRadius: 999, fontFamily: 'Inter, sans-serif', fontWeight: 600,
      fontSize: sz.fs, letterSpacing: 0.2, whiteSpace: 'nowrap', ...style }}>
      {icon && <span className="mi" style={{ fontSize: sz.ic }}>{icon}</span>}
      {children}
    </span>
  );
}

// ─── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ value = 78, size = 80, stroke = 8, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * value / 100;
  const color = value >= 90 ? '#10B981' : value >= 75 ? '#EAB308' : value >= 50 ? '#F97316' : '#DC2626';
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#E2E8F0" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
        <div style={{ fontWeight: 700, fontSize: size * 0.28, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: size * 0.11, color: '#64748B', fontWeight: 500, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Logo ───────────────────────────────────────────────────────────────────
function Logo({ size = 16, onDark = false }) {
  return (
    <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: size, letterSpacing: -0.5, lineHeight: 1 }}>
      <span style={{ color: onDark ? '#fff' : '#0B1F4B' }}>VISA</span>
      <span style={{ color: '#0EA5E9' }}>IQ</span>
    </span>
  );
}

// ─── Btn ────────────────────────────────────────────────────────────────────
function Btn({ variant = 'primary', icon, trailing, children, full, size = 'md', style }) {
  const variants = {
    primary:   { bg: '#1A56DB', fg: '#fff', border: 'none' },
    tonal:     { bg: '#EFF6FF', fg: '#1547C0', border: 'none' },
    outlined:  { bg: 'transparent', fg: '#0F172A', border: '1.5px solid #E2E8F0' },
    text:      { bg: 'transparent', fg: '#1A56DB', border: 'none' },
    destruct:  { bg: '#DC2626', fg: '#fff', border: 'none' },
    dark:      { bg: '#0B1F4B', fg: '#fff', border: 'none' },
    gold:      { bg: 'linear-gradient(135deg,#F59E0B,#D97706)', fg: '#fff', border: 'none' },
  };
  const v = variants[variant] || variants.primary;
  const sz = { sm: { h: 32, fs: 12, px: 14 }, md: { h: 44, fs: 14, px: 20 }, lg: { h: 52, fs: 15, px: 24 } }[size];
  return (
    <button style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      height: sz.h, padding: `0 ${sz.px}px`, fontSize: sz.fs, fontWeight: 600,
      fontFamily: 'Inter, sans-serif', borderRadius: 12, cursor: 'pointer',
      background: v.bg, color: v.fg, border: v.border, width: full ? '100%' : undefined, ...style }}>
      {icon && <span className="mi" style={{ fontSize: sz.fs + 4 }}>{icon}</span>}
      {children}
      {trailing && <span className="mi" style={{ fontSize: sz.fs + 4 }}>{trailing}</span>}
    </button>
  );
}

// ─── Input ──────────────────────────────────────────────────────────────────
function Input({ label, value, placeholder, icon, trailing, state = 'default', helper, type = 'text' }) {
  const borders = { default: '#E2E8F0', focused: '#1A56DB', error: '#EF4444', success: '#10B981' };
  const bw = state === 'focused' ? 2 : 1.5;
  return (
    <label style={{ display: 'block' }}>
      {label && <div style={{ font: '500 12px/1.4 Inter', color: '#475569', marginBottom: 6 }}>{label}</div>}
      <div style={{ height: 52, borderRadius: 10, border: `${bw}px solid ${borders[state]}`,
        background: state === 'focused' ? '#F8FAFF' : '#fff', display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10 }}>
        {icon && <span className="mi" style={{ fontSize: 18, color: state === 'focused' ? '#1A56DB' : '#94A3B8' }}>{icon}</span>}
        <span style={{ flex: 1, fontSize: 14, color: value ? '#0F172A' : '#94A3B8',
          fontFamily: type === 'mono' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
          fontWeight: value ? 500 : 400, letterSpacing: type === 'mono' ? 0.5 : 0 }}>
          {type === 'password' && value ? '•'.repeat(value.length) : (value || placeholder)}
        </span>
        {trailing && <span className="mi" style={{ fontSize: 18, color: state === 'success' ? '#10B981' : state === 'error' ? '#EF4444' : '#94A3B8' }}>{trailing}</span>}
      </div>
      {helper && <div style={{ font: '400 11px/1.4 Inter', color: state === 'error' ? '#DC2626' : '#64748B', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        {state === 'error' && <span className="mi" style={{ fontSize: 12 }}>error_outline</span>}
        {helper}
      </div>}
    </label>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────
function Card({ children, elevation = 2, accent, padding = 16, style, hover }) {
  const shadows = {
    0: 'none',
    1: '0 1px 3px rgba(15,23,42,.06)',
    2: '0 1px 3px rgba(15,23,42,.06), 0 2px 6px rgba(15,23,42,.05)',
    3: '0 4px 12px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.05)',
    4: '0 8px 24px rgba(15,23,42,.10), 0 4px 12px rgba(15,23,42,.06)',
  };
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding,
      boxShadow: shadows[elevation], border: '1px solid #F1F5F9',
      borderLeft: accent ? `3px solid ${accent}` : undefined, ...style }}>
      {children}
    </div>
  );
}

// ─── AI Badge ───────────────────────────────────────────────────────────────
function AIBadge({ small, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 6px' : '3px 8px',
      background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff',
      borderRadius: 999, fontSize: small ? 9 : 10, fontWeight: 700, letterSpacing: 0.4, ...style }}>
      <span className="mi" style={{ fontSize: small ? 10 : 12 }}>auto_awesome</span>
      AI
    </span>
  );
}

// ─── App-level scaffolds ────────────────────────────────────────────────────
function PhoneAppBar({ title, leading = 'menu', trailing, sub, bg = '#fff', fg = '#0F172A' }) {
  return (
    <div style={{ height: 56, background: bg, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, borderBottom: '1px solid #F1F5F9' }}>
      {leading && <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mi" style={{ fontSize: 22, color: fg }}>{leading}</span>
      </button>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 16px/1.2 Inter', color: fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ font: '400 11px/1.2 Inter', color: 'rgba(15,23,42,.5)' }}>{sub}</div>}
      </div>
      {(trailing || []).map((t, i) => (
        <button key={i} style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span className="mi" style={{ fontSize: 22, color: fg }}>{t.icon}</span>
          {t.badge && <span style={{ position: 'absolute', top: 6, right: 6, width: 16, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

function BottomNav({ active = 0, items }) {
  const defaults = [
    { label: 'Home', icon: 'home', active: 'home' },
    { label: 'Apps', icon: 'folder_open', active: 'folder' },
    { label: 'Docs', icon: 'description', active: 'description' },
    { label: 'Chat', icon: 'chat_bubble_outline', active: 'chat_bubble', badge: 2 },
    { label: 'Profile', icon: 'person_outline', active: 'person' },
  ];
  const nav = items || defaults;
  return (
    <div style={{ height: 72, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex',
      paddingTop: 6, paddingBottom: 8, flexShrink: 0 }}>
      {nav.map((it, i) => {
        const isActive = i === active;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
            <div style={{ height: 28, minWidth: 56, borderRadius: 14,
              background: isActive ? '#EFF6FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span className="mi" style={{ fontSize: 22, color: isActive ? '#1A56DB' : '#64748B',
                fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}>{isActive ? (it.active || it.icon) : it.icon}</span>
              {it.badge && <span style={{ position: 'absolute', top: -2, right: 6, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 7, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.badge}</span>}
            </div>
            <div style={{ font: `${isActive ? 600 : 500} 10px/1 Inter`, color: isActive ? '#1A56DB' : '#64748B' }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Flag emoji helper ─────────────────────────────────────────────────────
function flag(cc) {
  if (!cc) return '🏳';
  return cc.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

Object.assign(window, { Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag });
