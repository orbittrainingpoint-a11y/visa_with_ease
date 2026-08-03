// VisaIQ shared atoms — Phone frame, Browser frame, score ring, status chip, logo

const VIQ_NAVY = '#0B1F4B';
const VIQ_ROYAL = '#1A56DB';
const VIQ_TEAL = '#0EA5E9';
const VIQ_GOLD = '#F59E0B';
const VIQ_PURPLE = '#7C3AED';
const VIQ_GREEN = '#10B981';
const VIQ_ORANGE = '#F97316';
const VIQ_RED = '#EF4444';

// ─── PHONE FRAME (Android-style 412×892 logical, scaled) ─────────────────
function Phone({ children, width = 380, height = 800, dark = false, statusDark = false, surface = '#FFFFFF', noBar = false }) {
  const sbColor = statusDark || dark ? '#FFFFFF' : '#0F172A';
  return (
    <div style={{
      width, height, borderRadius: 32, overflow: 'hidden', position: 'relative',
      background: surface, border: '6px solid #1B1B1F',
      boxShadow: '0 30px 80px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column',
    }}>
      {!noBar && (
        <div style={{ height: 28, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', position:'relative', flexShrink:0, zIndex:5, background:'transparent' }}>
          <div style={{ font: '600 12px var(--f-body)', color: sbColor, letterSpacing: 0.2 }}>9:30</div>
          <div style={{ position:'absolute', left:'50%', top:7, transform:'translateX(-50%)', width:14, height:14, borderRadius:'50%', background:'#1B1B1F' }} />
          <div style={{ display:'flex', alignItems:'center', gap:5, color: sbColor }}>
            <svg width="13" height="11" viewBox="0 0 14 11"><path d="M7 11L0 4a10 10 0 0114 0L7 11z" fill="currentColor"/></svg>
            <svg width="13" height="11" viewBox="0 0 14 11"><path d="M13 10V1L1 10h12z" fill="currentColor"/></svg>
            <svg width="20" height="11" viewBox="0 0 24 12"><rect x="1" y="1" width="20" height="10" rx="2" stroke="currentColor" fill="none"/><rect x="22" y="4" width="2" height="4" rx="0.5" fill="currentColor"/><rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor"/></svg>
          </div>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
      <div style={{ height: 18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'transparent', position:'relative', zIndex:5 }}>
        <div style={{ width: 110, height: 4, borderRadius: 2, background: dark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.4)' }} />
      </div>
    </div>
  );
}

// ─── BROWSER WINDOW CHROME ───────────────────────────────────────────────
function Browser({ children, width = 1280, height = 800, url = 'visaiq.app', dark = false }) {
  return (
    <div style={{ width, height, borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,.18)', display:'flex', flexDirection:'column', border:'1px solid #E2E8F0' }}>
      <div style={{ height: 40, background: '#E8ECF2', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, borderBottom: '1px solid #D1D9E6' }}>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#FF5F57' }}/>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#FEBC2E' }}/>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#28C840' }}/>
        </div>
        <div style={{ flex: 1, display:'flex', justifyContent:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#FFFFFF', border:'1px solid #D1D9E6', height:26, padding:'0 14px', borderRadius: 8, minWidth: 320, fontSize:12, color:'#64748B' }}>
            <span className="mi" style={{ fontSize:13 }}>lock</span>
            <span>{url}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, color:'#64748B' }}>
          <span className="mi" style={{ fontSize:16 }}>share</span>
          <span className="mi" style={{ fontSize:16 }}>add</span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow:'hidden' }}>{children}</div>
    </div>
  );
}

// ─── SCORE RING (audit readiness) ────────────────────────────────────────
function ScoreRing({ score = 87, size = 64, stroke = 6, showLabel = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c * (1 - pct / 100);
  const color = pct >= 90 ? VIQ_GREEN : pct >= 75 ? '#EAB308' : pct >= 50 ? VIQ_ORANGE : VIQ_RED;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#E2E8F0" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} fill="none" />
      </svg>
      {showLabel && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ font: `700 ${Math.round(size*0.32)}px var(--f-display)`, color: '#1E293B', letterSpacing:'-0.02em' }}>{pct}</div>
        </div>
      )}
    </div>
  );
}

// ─── STATUS CHIP ─────────────────────────────────────────────────────────
const STATUS = {
  approved:   { bg:'#D1FAE5', fg:'#047857', icon:'check_circle', label:'Approved' },
  review:     { bg:'#DBEAFE', fg:'#1547C0', icon:'hourglass_top', label:'Under Review' },
  attention:  { bg:'#FFEDD5', fg:'#9A3412', icon:'warning', label:'Attention' },
  rejected:   { bg:'#FEE2E2', fg:'#991B1B', icon:'cancel', label:'Rejected' },
  draft:      { bg:'#F1F5F9', fg:'#475569', icon:'edit', label:'Draft' },
  ai:         { bg:'#EDE9FE', fg:'#6D28D9', icon:'auto_awesome', label:'AI Processing' },
  expired:    { bg:'#FEE2E2', fg:'#991B1B', icon:'event_busy', label:'Expired' },
  vip:        { bg:'#FEF3C7', fg:'#92400E', icon:'workspace_premium', label:'VIP' },
};
function StatusChip({ kind = 'review', label, size = 'sm' }) {
  const s = STATUS[kind] || STATUS.review;
  const h = size === 'lg' ? 24 : 20;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:`0 ${h===24?10:8}px`, height:h, borderRadius: 999, background: s.bg, color: s.fg, font:'600 11px/1 var(--f-body)' }}>
      <span className="mi" style={{ fontSize: 13 }}>{s.icon}</span>
      {label || s.label}
    </span>
  );
}

// ─── LOGO ────────────────────────────────────────────────────────────────
function Logo({ size = 18, dark = false, mark = false }) {
  if (mark) {
    return (
      <div style={{ width: size, height: size, borderRadius: size*0.28, background: VIQ_NAVY, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#fff', font:`800 ${size*0.45}px var(--f-display)`, letterSpacing:'-0.04em' }}>IQ</div>
    );
  }
  return (
    <div style={{ display:'inline-flex', alignItems:'baseline', font:`800 ${size}px var(--f-display)`, letterSpacing:'-0.03em' }}>
      <span style={{ color: dark ? '#fff' : VIQ_NAVY }}>Visa</span>
      <span style={{ color: VIQ_TEAL }}>IQ</span>
    </div>
  );
}

// ─── FLAG (emoji-based for cross-country usage) ──────────────────────────
function Flag({ code = 'fr', size = 20 }) {
  const flags = { fr:'🇫🇷', de:'🇩🇪', us:'🇺🇸', gb:'🇬🇧', jp:'🇯🇵', ae:'🇦🇪', sg:'🇸🇬', in:'🇮🇳', ca:'🇨🇦', au:'🇦🇺', es:'🇪🇸', it:'🇮🇹', tr:'🇹🇷' };
  return <span style={{ fontSize: size, lineHeight: 1, display:'inline-block' }}>{flags[code] || '🌐'}</span>;
}

// ─── ICON helper ─────────────────────────────────────────────────────────
function Icon({ name, size = 20, color }) {
  return <span className="mi" style={{ fontSize: size, color, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{name}</span>;
}

// ─── ARTBOARD HEADER (used inside DCArtboard) ─────────────────────────────
function Caption({ children, sub }) {
  return (
    <div style={{ marginTop: 8, font: '500 11px/1.3 var(--f-body)', color: '#475569', textAlign:'left' }}>
      {children}
      {sub && <div style={{ color:'#94A3B8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { Phone, Browser, ScoreRing, StatusChip, Logo, Flag, Icon, Caption, VIQ_NAVY, VIQ_ROYAL, VIQ_TEAL, VIQ_GOLD, VIQ_PURPLE, VIQ_GREEN, VIQ_ORANGE, VIQ_RED });
