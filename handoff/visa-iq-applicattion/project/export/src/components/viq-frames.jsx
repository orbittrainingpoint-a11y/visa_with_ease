/* global React */
// VisaIQ device shells — custom-styled (not generic Material defaults)

// ─── Phone shell (Android-style, Pixel proportions) ─────────────────────────
function VPhone({ children, width = 380, height = 800, statusBar = 'light', bg = '#FFFFFF', label }) {
  const w = width, h = height;
  return (
    <div style={{ width: w, height: h, position: 'relative', borderRadius: 44, padding: 10, background: '#0F172A',
      boxShadow: '0 30px 60px -20px rgba(15,23,42,.35), 0 0 0 1.5px #1f2937, inset 0 0 0 2px #334155' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', background: bg, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <VStatusBar tone={statusBar} />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
        <VGestureBar tone={statusBar} />
      </div>
      {/* punch-hole camera */}
      <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: '#0a0a0a', boxShadow: 'inset 0 0 0 1px #1e293b' }} />
    </div>
  );
}

function VStatusBar({ tone = 'dark' }) {
  const c = tone === 'light' ? '#fff' : '#0B1F4B';
  return (
    <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px 0 22px', fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, color: c, letterSpacing: 0.2, flexShrink: 0 }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* signal */}
        <svg width="14" height="10" viewBox="0 0 14 10"><g fill={c}>
          <rect x="0" y="7" width="2" height="3" rx="0.5"/>
          <rect x="3" y="5" width="2" height="5" rx="0.5"/>
          <rect x="6" y="3" width="2" height="7" rx="0.5"/>
          <rect x="9" y="1" width="2" height="9" rx="0.5"/>
        </g></svg>
        {/* wifi */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M1 4c2-2 4-3 6-3s4 1 6 3" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M3.5 6c1-1 2.2-1.6 3.5-1.6s2.5.6 3.5 1.6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="7" cy="8.2" r="0.9" fill={c}/>
        </svg>
        {/* battery */}
        <div style={{ width: 22, height: 10, border: `1.2px solid ${c}`, borderRadius: 2, position: 'relative', padding: 1.2 }}>
          <div style={{ width: '72%', height: '100%', background: c, borderRadius: 1 }}/>
          <div style={{ position: 'absolute', right: -3, top: 2.5, width: 2, height: 4, background: c, borderRadius: 1 }}/>
        </div>
      </div>
    </div>
  );
}

function VGestureBar({ tone = 'dark' }) {
  const c = tone === 'light' ? 'rgba(255,255,255,.7)' : 'rgba(15,23,42,.4)';
  return (
    <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 130, height: 4, background: c, borderRadius: 4 }} />
    </div>
  );
}

// ─── Browser shell (Chrome-style) ──────────────────────────────────────────
function VBrowser({ children, width = 1200, height = 760, url = 'visaiq.app', tab = 'VisaIQ' }) {
  return (
    <div style={{ width, height, borderRadius: 14, overflow: 'hidden', background: '#F8FAFC',
      boxShadow: '0 30px 60px -20px rgba(15,23,42,.25), 0 0 0 1px #E2E8F0', display: 'flex', flexDirection: 'column' }}>
      {/* chrome */}
      <div style={{ height: 38, background: '#E2E8F0', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }}/>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }}/>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12, background: '#F8FAFC', height: 28, borderRadius: '8px 8px 0 0', padding: '0 12px', fontSize: 12, color: '#475569', fontWeight: 500, maxWidth: 220 }}>
          <span className="mi" style={{ fontSize: 13, color: '#1A56DB' }}>language</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab}</span>
          <span className="mi" style={{ fontSize: 14, color: '#94A3B8', marginLeft: 'auto' }}>close</span>
        </div>
      </div>
      <div style={{ height: 40, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flexShrink: 0 }}>
        <span className="mi" style={{ fontSize: 18, color: '#475569' }}>arrow_back</span>
        <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>arrow_forward</span>
        <span className="mi" style={{ fontSize: 18, color: '#475569' }}>refresh</span>
        <div style={{ flex: 1, height: 26, background: '#fff', borderRadius: 13, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', fontSize: 12, color: '#475569' }}>
          <span className="mi" style={{ fontSize: 13, color: '#10B981' }}>lock</span>
          <span>{url}</span>
        </div>
        <span className="mi" style={{ fontSize: 18, color: '#475569' }}>more_vert</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#F8FAFC' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { VPhone, VBrowser, VStatusBar, VGestureBar });
