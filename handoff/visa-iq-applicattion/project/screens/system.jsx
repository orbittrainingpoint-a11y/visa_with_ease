/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge */
// Design System artboards — Colors, Type, Spacing, Components

const DS_PAD = 32;

// ─── Color tokens ───────────────────────────────────────────────────────────
function DSColors() {
  const Swatch = ({ name, hex, fg = '#fff', sub }) => (
    <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,.06)', border: '1px solid #F1F5F9' }}>
      <div style={{ background: hex, height: 80, padding: 12, display: 'flex', alignItems: 'flex-end', color: fg, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600 }}>{hex.toUpperCase()}</div>
      <div style={{ padding: '10px 12px', background: '#fff' }}>
        <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>{name}</div>
        {sub && <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
  const Group = ({ title, children }) => (
    <div>
      <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>{children}</div>
    </div>
  );
  return (
    <div style={{ padding: DS_PAD, background: '#fff', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="viq-h-display-m" style={{ marginBottom: 4 }}>Color tokens</div>
        <div className="viq-body-l">Primitive palette + semantic mappings. WCAG AA on key combinations.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Group title="Brand · Navy">
          <Swatch name="navy-900" hex="#0B1F4B" sub="Primary brand"/>
          <Swatch name="navy-800" hex="#112858" sub="App bar hover"/>
          <Swatch name="navy-700" hex="#1A3373" sub="Drawer"/>
          <Swatch name="slate-900" hex="#0F172A" sub="Dark mode bg"/>
        </Group>
        <Group title="Action · Royal Blue">
          <Swatch name="royal-700" hex="#1547C0" sub="Pressed CTA"/>
          <Swatch name="royal-600" hex="#1A56DB" sub="Primary action"/>
          <Swatch name="royal-100" hex="#DBEAFE" fg="#1547C0" sub="Tonal bg"/>
          <Swatch name="royal-50"  hex="#EFF6FF" fg="#1A56DB" sub="Hover/active tile"/>
        </Group>
        <Group title="Accent · Teal + AI">
          <Swatch name="teal-500"   hex="#0EA5E9" sub="Secondary action"/>
          <Swatch name="teal-100"   hex="#E0F2FE" fg="#0284C7" sub="Info chip bg"/>
          <Swatch name="purple-600" hex="#7C3AED" sub="AI indicator"/>
          <Swatch name="purple-100" hex="#EDE9FE" fg="#6D28D9" sub="AI badge bg"/>
        </Group>
        <Group title="Status">
          <Swatch name="green-500"  hex="#10B981" sub="Approved / Pass"/>
          <Swatch name="gold-400"   hex="#F59E0B" sub="Premium / VIP"/>
          <Swatch name="orange-500" hex="#F97316" sub="Warning"/>
          <Swatch name="red-500"    hex="#EF4444" sub="Error / Rejected"/>
        </Group>
        <Group title="Neutrals">
          <Swatch name="slate-50"  hex="#F8FAFC" fg="#475569" sub="Page bg"/>
          <Swatch name="slate-200" hex="#E2E8F0" fg="#475569" sub="Borders"/>
          <Swatch name="slate-600" hex="#475569" sub="Body text"/>
          <Swatch name="slate-800" hex="#1E293B" sub="Primary text"/>
        </Group>
        <div>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Status semantic — chips in context</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip tone="success" icon="check_circle">Approved</Chip>
            <Chip tone="info" icon="hourglass_top">Under review</Chip>
            <Chip tone="warning" icon="warning_amber">Attention needed</Chip>
            <Chip tone="error" icon="cancel">Rejected</Chip>
            <Chip tone="neutral" icon="edit">Draft</Chip>
            <Chip tone="ai" icon="auto_awesome">AI processing</Chip>
            <Chip tone="gold" icon="workspace_premium">VIP</Chip>
            <Chip tone="error" icon="event_busy">Expired</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Typography ─────────────────────────────────────────────────────────────
function DSType() {
  const Row = ({ token, font, size, weight, sample }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 24, alignItems: 'baseline', padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div>
        <div style={{ font: '600 12px/1.3 JetBrains Mono', color: '#0F172A' }}>{token}</div>
        <div style={{ font: '400 11px/1.4 Inter', color: '#94A3B8', marginTop: 2 }}>{size} · {weight}</div>
      </div>
      <div style={{ fontFamily: font, fontSize: parseInt(size), fontWeight: parseInt(weight), color: '#0F172A', letterSpacing: parseInt(size) > 22 ? '-0.01em' : 0, lineHeight: 1.25 }}>{sample}</div>
      <div style={{ font: '500 11px/1.4 Inter', color: '#64748B' }}>{font.split(',')[0]}</div>
    </div>
  );
  return (
    <div style={{ padding: DS_PAD, background: '#fff', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="viq-h-display-m" style={{ marginBottom: 4 }}>Typography</div>
        <div className="viq-body-l">Plus Jakarta Sans (display), Inter (UI), JetBrains Mono (codes).</div>
      </div>
      <div>
        <Row token="display.large" font="Plus Jakarta Sans, sans-serif" size="36px" weight="700" sample="Visa applications, simplified"/>
        <Row token="display.medium" font="Plus Jakarta Sans, sans-serif" size="28px" weight="700" sample="Your France application is ready"/>
        <Row token="display.small" font="Plus Jakarta Sans, sans-serif" size="24px" weight="600" sample="Documents needed"/>
        <Row token="headline.large" font="Inter, sans-serif" size="22px" weight="600" sample="AI Audit · Passport scored 87"/>
        <Row token="headline.medium" font="Inter, sans-serif" size="18px" weight="600" sample="Bank Statement — Dec 2025"/>
        <Row token="body.large" font="Inter, sans-serif" size="16px" weight="400" sample="The Schengen visa allows stays up to 90 days within a 180-day period."/>
        <Row token="body.medium" font="Inter, sans-serif" size="14px" weight="400" sample="Updated 2 hours ago — verified against embassy source."/>
        <Row token="label.large" font="Inter, sans-serif" size="14px" weight="500" sample="Passport number"/>
        <Row token="label.small" font="Inter, sans-serif" size="11px" weight="500" sample="3 ISSUES FOUND"/>
        <Row token="code" font="JetBrains Mono, monospace" size="13px" weight="400" sample="REF-2026-FR-018472-Q"/>
      </div>
    </div>
  );
}

// ─── Spacing / Radius / Elevation ───────────────────────────────────────────
function DSSpacing() {
  const spacings = [
    { token: '1', v: 4 }, { token: '2', v: 8 }, { token: '3', v: 12 }, { token: '4', v: 16 },
    { token: '5', v: 20 }, { token: '6', v: 24 }, { token: '8', v: 32 }, { token: '10', v: 40 }, { token: '12', v: 48 },
  ];
  const radii = [
    { token: 'xs', v: 4 }, { token: 'sm', v: 8 }, { token: 'md', v: 12 },
    { token: 'lg', v: 16 }, { token: 'xl', v: 24 }, { token: '2xl', v: 32 },
  ];
  return (
    <div style={{ padding: DS_PAD, background: '#fff', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="viq-h-display-m" style={{ marginBottom: 4 }}>Spacing · Radius · Elevation</div>
        <div className="viq-body-l">8dp base grid, M3-aligned shape system.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Spacing scale</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {spacings.map(s => (
              <div key={s.token} style={{ display: 'grid', gridTemplateColumns: '80px 60px 1fr', alignItems: 'center', gap: 12, padding: '6px 0' }}>
                <div style={{ font: '600 12px/1.4 JetBrains Mono', color: '#0F172A' }}>spacing.{s.token}</div>
                <div style={{ font: '500 12px/1.4 Inter', color: '#64748B' }}>{s.v}dp</div>
                <div style={{ height: 16, background: '#1A56DB', width: s.v * 1.5, borderRadius: 2 }}/>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Radius scale</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {radii.map(r => (
              <div key={r.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 72, height: 72, background: '#EFF6FF', border: '1.5px solid #1A56DB', borderRadius: r.v }}/>
                <div style={{ font: '600 11px/1.4 JetBrains Mono', color: '#0F172A' }}>{r.token}</div>
                <div style={{ font: '400 10px/1 Inter', color: '#64748B' }}>{r.v}dp</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Elevation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, background: '#F8FAFC', padding: 24, borderRadius: 12 }}>
            {[
              { t: 'el.1', s: '0 1px 3px rgba(15,23,42,.06)' },
              { t: 'el.2', s: '0 1px 3px rgba(15,23,42,.06), 0 2px 6px rgba(15,23,42,.05)' },
              { t: 'el.3', s: '0 4px 12px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.05)' },
              { t: 'el.4', s: '0 8px 24px rgba(15,23,42,.10), 0 4px 12px rgba(15,23,42,.06)' },
              { t: 'el.5', s: '0 16px 40px rgba(15,23,42,.16), 0 8px 16px rgba(15,23,42,.08)' },
            ].map(e => (
              <div key={e.t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 88, height: 64, background: '#fff', borderRadius: 12, boxShadow: e.s }}/>
                <div style={{ font: '600 11px/1.4 JetBrains Mono', color: '#0F172A' }}>{e.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────
function DSButtons() {
  const Row = ({ label, children }) => (
    <div>
      <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
    </div>
  );
  return (
    <div style={{ padding: DS_PAD, background: '#fff', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="viq-h-display-m" style={{ marginBottom: 4 }}>Buttons</div>
        <div className="viq-body-l">Five hierarchical variants + sizes + states.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Row label="Hierarchy">
          <Btn variant="primary">Continue</Btn>
          <Btn variant="tonal">Save draft</Btn>
          <Btn variant="outlined">Cancel</Btn>
          <Btn variant="text">Learn more</Btn>
          <Btn variant="destruct" icon="delete">Delete</Btn>
        </Row>
        <Row label="With icons">
          <Btn variant="primary" icon="upload_file">Upload document</Btn>
          <Btn variant="primary" trailing="arrow_forward">Continue</Btn>
          <Btn variant="tonal" icon="auto_awesome">Re-run audit</Btn>
          <Btn variant="gold" icon="workspace_premium">Book a VIP expert</Btn>
        </Row>
        <Row label="Sizes">
          <Btn variant="primary" size="sm">Small</Btn>
          <Btn variant="primary" size="md">Medium</Btn>
          <Btn variant="primary" size="lg">Large</Btn>
        </Row>
        <Row label="States">
          <Btn variant="primary">Default</Btn>
          <Btn variant="primary" style={{ background: '#1547C0' }}>Hover</Btn>
          <Btn variant="primary" style={{ background: '#1039A0', transform: 'scale(0.97)' }}>Pressed</Btn>
          <Btn variant="primary" style={{ background: '#E2E8F0', color: '#94A3B8', cursor: 'not-allowed' }}>Disabled</Btn>
          <Btn variant="primary" icon="autorenew" style={{ background: '#1A56DB' }}>Loading…</Btn>
        </Row>
        <Row label="Icon buttons + FAB">
          <button style={{ width: 44, height: 44, borderRadius: 12, border: 0, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: 22, color: '#0F172A' }}>more_vert</span>
          </button>
          <button style={{ width: 44, height: 44, borderRadius: 12, border: 0, background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: 22 }}>send</span>
          </button>
          <button style={{ width: 56, height: 56, borderRadius: 28, border: 0, background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(26,86,219,.30)', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: 24 }}>add</span>
          </button>
          <button style={{ height: 52, padding: '0 22px', borderRadius: 26, border: 0, background: '#1A56DB', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, boxShadow: '0 6px 16px rgba(26,86,219,.30)', fontFamily: 'Inter', fontSize: 14, cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: 22 }}>add</span>
            New application
          </button>
        </Row>
      </div>
    </div>
  );
}

// ─── Inputs ─────────────────────────────────────────────────────────────────
function DSInputs() {
  return (
    <div style={{ padding: DS_PAD, background: '#fff', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="viq-h-display-m" style={{ marginBottom: 4 }}>Form components</div>
        <div className="viq-body-l">Text fields, selectors, uploads, validation states.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <Input label="Full name" placeholder="Enter your name"/>
        <Input label="Email address" icon="mail" value="sarah@email.com" state="focused"/>
        <Input label="Passport number" type="mono" value="P52819403" state="success" trailing="check_circle" helper="Format verified"/>
        <Input label="Password" type="password" value="secure123" trailing="visibility_off"/>
        <Input label="Phone number" placeholder="+1 (555) 000-0000" state="error" helper="Enter a valid phone number"/>
        <Input label="Date of birth" placeholder="DD / MM / YYYY" trailing="calendar_today"/>
        <Input label="Destination country" icon="public" value="🇫🇷  France" trailing="expand_more"/>
        <Input label="Travel budget" placeholder="0.00" icon="payments" helper="EUR · 2 decimals"/>
        <Input label="Disabled field" value="Auto-filled" state="default" trailing="lock" helper="Cannot be edited" />
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Filter chips</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[['All', true], ['Passport', false], ['Bank statements', false], ['Employment', true], ['Insurance', false], ['Photos', false]].map(([l, on], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px',
              borderRadius: 999, fontFamily: 'Inter', fontWeight: 500, fontSize: 13,
              background: on ? '#1A56DB' : '#fff', color: on ? '#fff' : '#475569',
              border: on ? 'none' : '1.5px solid #E2E8F0' }}>
              {on && <span className="mi" style={{ fontSize: 14 }}>check</span>}
              {l}
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Upload zone</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ height: 130, borderRadius: 14, border: '2px dashed #93C5FD', background: '#EFF6FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="mi" style={{ fontSize: 36, color: '#1A56DB' }}>cloud_upload</span>
            <div style={{ font: '600 13px/1.3 Inter', color: '#1547C0' }}>Drop file or tap to upload</div>
            <div style={{ font: '400 11px/1.3 Inter', color: '#64748B' }}>PDF, JPG, PNG · max 10MB</div>
          </div>
          <div style={{ height: 130, borderRadius: 14, border: '2px solid #7C3AED', background: '#FAF5FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, border: '3px solid #7C3AED', borderTopColor: 'transparent' }}/>
            <div style={{ font: '600 13px/1.3 Inter', color: '#6D28D9' }}>AI auditing…</div>
            <div style={{ font: '400 11px/1.3 Inter', color: '#64748B' }}>Checking validity</div>
          </div>
          <div style={{ height: 130, borderRadius: 14, border: '1.5px solid #10B981', background: '#fff', padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 48, height: 56, background: '#F0FDF4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 26, color: '#059669' }}>picture_as_pdf</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>passport-scan.pdf</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', margin: '4px 0' }}>1.2 MB · Uploaded</div>
              <Chip tone="success" size="sm" icon="check_circle">Audit complete · 87</Chip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cards & Misc ────────────────────────────────────────────────────────────
function DSCards() {
  return (
    <div style={{ padding: DS_PAD, background: '#fff', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="viq-h-display-m" style={{ marginBottom: 4 }}>Cards & Score Rings</div>
        <div className="viq-body-l">Feature cards, status cards, document cards, AI score visualization.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Score rings — 0-100 with semantic color</div>
          <div style={{ display: 'flex', gap: 28, padding: 16, background: '#F8FAFC', borderRadius: 12 }}>
            {[24, 58, 78, 92].map((v, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <ScoreRing value={v} size={80} stroke={8}/>
                <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>{['Invalid', 'Attention', 'Good', 'Excellent'][i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {/* Status card */}
          <Card elevation={2} accent="#1A56DB" padding={18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ font: '600 13px/1.3 Inter', color: '#64748B' }}>{flag('FR')} France · Schengen</div>
                <div style={{ font: '700 18px/1.3 Plus Jakarta Sans', color: '#0F172A', marginTop: 2 }}>Sarah's Holiday</div>
              </div>
              <Chip tone="info" size="sm" icon="hourglass_top">In progress</Chip>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <ScoreRing value={87} size={52} stroke={6}/>
              <div style={{ flex: 1 }}>
                <div style={{ font: '500 11px/1.3 Inter', color: '#64748B' }}>Readiness</div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: '67%', height: '100%', background: '#1A56DB' }}/>
                </div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8', marginTop: 6 }}>4 of 6 documents</div>
              </div>
            </div>
          </Card>
          {/* Metric card */}
          <Card elevation={2} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 20, color: '#7C3AED' }}>auto_awesome</span>
              </div>
              <div style={{ font: '500 11px/1.3 Inter', color: '#64748B' }}>AI Audits this week</div>
            </div>
            <div style={{ font: '800 36px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 14 }}>1,284</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <span className="mi" style={{ fontSize: 14, color: '#10B981' }}>trending_up</span>
              <span style={{ font: '600 12px/1 Inter', color: '#10B981' }}>+18.4%</span>
              <span style={{ font: '400 12px/1 Inter', color: '#94A3B8' }}>vs. last week</span>
            </div>
          </Card>
          {/* Premium card */}
          <Card elevation={3} padding={18} style={{ background: 'linear-gradient(135deg, #0B1F4B 0%, #1A56DB 100%)', color: '#fff', border: '1.5px solid #F59E0B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mi" style={{ fontSize: 22, color: '#F59E0B' }}>workspace_premium</span>
              <span style={{ font: '700 11px/1 Inter', color: '#F59E0B', letterSpacing: 1, textTransform: 'uppercase' }}>VIP Expert</span>
            </div>
            <div style={{ font: '700 18px/1.3 Plus Jakarta Sans', marginTop: 12 }}>Book a 1-on-1 with a visa expert</div>
            <div style={{ font: '400 12px/1.5 Inter', color: 'rgba(255,255,255,.7)', marginTop: 6 }}>30 min consultation · audit pre-share</div>
            <button style={{ marginTop: 14, height: 36, padding: '0 14px', borderRadius: 10, background: '#F59E0B', color: '#0B1F4B', border: 0, fontWeight: 700, fontFamily: 'Inter', fontSize: 13, cursor: 'pointer' }}>Book from $49</button>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DSColors, DSType, DSSpacing, DSButtons, DSInputs, DSCards });
