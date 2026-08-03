/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// VisaIQ — Professional tier (mobile + web)
// Pro = power-user consumer: many concurrent apps, deep AI features, advanced docs

// ─── Pro Bottom Nav ────────────────────────────────────────────────────────
const ProNav = ({ active = 0 }) => (
  <BottomNav active={active} items={[
    { label: 'Hub', icon: 'dashboard', active: 'dashboard' },
    { label: 'Apps', icon: 'folder_open', active: 'folder', badge: 7 },
    { label: 'Docs', icon: 'description', active: 'description' },
    { label: 'AI Pro', icon: 'auto_awesome', active: 'auto_awesome' },
    { label: 'Profile', icon: 'person_outline', active: 'person' },
  ]}/>
);

// ─── 01 Professional Dashboard ─────────────────────────────────────────────
function MProDash() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: 'linear-gradient(155deg,#0B1F4B 0%,#1547C0 70%,#7C3AED 100%)', padding: '0 0 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.25), transparent 65%)' }}/>
        <div style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>menu</span></button>
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ font: '500 10px/1 Inter', color: '#FCD34D', letterSpacing: 1, textTransform: 'uppercase' }}>★ Pro plan</div>
            <div style={{ font: '600 13px/1 Inter', marginTop: 4 }}>Jamie Park</div>
          </div>
          <span className="mi" style={{ fontSize: 22, padding: 10 }}>notifications_outlined</span>
          <span className="mi" style={{ fontSize: 22, padding: 10 }}>workspace_premium</span>
        </div>
        <div style={{ padding: '4px 20px 0', position: 'relative' }}>
          <div style={{ font: '800 24px/1.2 Plus Jakarta Sans', letterSpacing: '-0.02em' }}>7 visas, 1 dashboard</div>
          <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Avg readiness <b style={{ color: '#34D399' }}>89</b> · 2 apps ready · €1,240 saved on consultants</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 8px', marginTop: -14 }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Apps', v: '7', sub: '2 ready', c: '#1A56DB' },
            { l: 'Docs', v: '34', sub: 'across all', c: '#10B981' },
            { l: 'AI runs', v: '218', sub: 'this month', c: '#7C3AED' },
          ].map((k, i) => (
            <Card key={i} padding={12} elevation={2}>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 0.3, textTransform: 'uppercase' }}>{k.l}</div>
              <div style={{ font: '800 24px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 6 }}>{k.v}</div>
              <div style={{ font: '600 10px/1 Inter', color: k.c, marginTop: 4 }}>{k.sub}</div>
            </Card>
          ))}
        </div>

        {/* Pro features banner */}
        <Card padding={14} elevation={3} style={{ marginTop: 14, background: 'linear-gradient(135deg,#FAF5FF,#EFF6FF)', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 22, color: '#fff' }}>auto_awesome</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 11px/1 Inter', color: '#6D28D9', letterSpacing: 0.4, textTransform: 'uppercase' }}>Pro insight</div>
              <div style={{ font: '600 13px/1.4 Inter', color: '#0F172A', marginTop: 4 }}>Your UK + US + DE apps share 6 docs. Add Schengen — covers 4 more trips this year.</div>
            </div>
            <span className="mi" style={{ fontSize: 22, color: '#7C3AED' }}>chevron_right</span>
          </div>
        </Card>

        {/* Multi-app grid */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Your applications</div>
          <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>Sort · readiness</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { cc: 'GB', t: 'UK Visitor', sc: 96, dt: 'Apr 02', st: 'success' },
            { cc: 'US', t: 'B1/B2', sc: 92, dt: 'May 14', st: 'success' },
            { cc: 'DE', t: 'Schengen', sc: 84, dt: 'May 28', st: 'info' },
            { cc: 'JP', t: 'Tourist', sc: 78, dt: 'Jul 12', st: 'info' },
            { cc: 'CA', t: 'TRV', sc: 62, dt: 'Aug 20', st: 'warning' },
            { cc: 'AU', t: 'eVisitor', sc: 100, dt: 'Done', st: 'success' },
          ].map((a, i) => (
            <Card key={i} padding={12} elevation={1}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{flag(a.cc)}</span>
                <ScoreRing value={a.sc} size={32} stroke={3}/>
              </div>
              <div style={{ font: '700 12px/1.3 Inter', color: '#0F172A', marginTop: 8 }}>{a.t}</div>
              <div style={{ font: '400 10px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Travel {a.dt}</div>
              <Chip tone={a.st} size="sm" style={{ marginTop: 6 }}>{a.st === 'success' && a.sc < 100 ? 'Ready' : a.st === 'success' ? 'Approved' : a.st === 'warning' ? 'Attention' : 'In progress'}</Chip>
            </Card>
          ))}
        </div>

        {/* Travel calendar mini */}
        <div style={{ marginTop: 18, font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Travel timeline · 2026</div>
        <Card padding={14} elevation={1}>
          {[
            { m: 'Apr', n: 'UK', cc: 'GB', dur: '2 weeks', c: '#10B981' },
            { m: 'May', n: 'USA + DE', cc: 'US', dur: '3 weeks', c: '#1A56DB' },
            { m: 'Jul', n: 'Japan', cc: 'JP', dur: '10 days', c: '#0EA5E9' },
            { m: 'Aug', n: 'Canada', cc: 'CA', dur: '1 week', c: '#F59E0B' },
          ].map((t, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < arr.length-1 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ font: '700 12px/1 JetBrains Mono', color: t.c, width: 38 }}>{t.m}</div>
              <span style={{ fontSize: 18 }}>{flag(t.cc)}</span>
              <div style={{ flex: 1, font: '600 12px/1.2 Inter', color: '#0F172A' }}>{t.n}</div>
              <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{t.dur}</div>
            </div>
          ))}
        </Card>
      </div>
      <ProNav active={0}/>
    </PhoneBody>
  );
}

// ─── 02 Pro · Multi-Application Manager (timeline view) ───────────────────
function MProAppsManager() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Applications" sub="7 active · 2 ready · 1 needs you" trailing={[{ icon: 'filter_list' }, { icon: 'view_module' }]}/>
      {/* Filter strip */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', overflowX: 'auto', flexShrink: 0 }}>
        {[['All · 7', true], ['Ready · 2', false], ['In progress · 4', false], ['Attention · 1', false], ['Done · 1', false]].map(([l, on], i) => (
          <Chip key={i} tone={on ? 'royal' : 'neutral'} size="sm">{l}</Chip>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        {/* Timeline rail */}
        {[
          { m: 'April 2026', items: [
            { cc: 'GB', t: 'UK Standard Visitor', sub: '6 docs · all cleared', sc: 96, dt: 'Travel Apr 02 · 12d', st: 'success', stL: 'Ready · submit anytime', pct: 100 },
          ]},
          { m: 'May 2026', items: [
            { cc: 'US', t: 'USA B1/B2 Visitor', sub: '8 docs · all cleared', sc: 92, dt: 'Travel May 14 · 54d', st: 'success', stL: 'Ready', pct: 100 },
            { cc: 'DE', t: 'Germany Schengen', sub: '5 of 6 docs · 1 auditing', sc: 84, dt: 'Travel May 28 · 68d', st: 'info', stL: 'In progress', pct: 83 },
          ]},
          { m: 'July 2026', items: [
            { cc: 'JP', t: 'Japan Single-entry Tourist', sub: '4 of 7 docs', sc: 78, dt: 'Travel Jul 12 · 113d', st: 'info', stL: 'On track', pct: 57 },
          ]},
          { m: 'August 2026', items: [
            { cc: 'CA', t: 'Canada TRV', sub: 'AI flagged 2 issues', sc: 62, dt: 'Travel Aug 20 · 152d', st: 'warning', stL: 'Attention', pct: 45 },
          ]},
        ].map((grp, gi) => (
          <div key={gi} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FAF5FF', color: '#6D28D9', font: '700 11px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{grp.m.slice(0,3)}</div>
              <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>{grp.m}</div>
              <div style={{ flex: 1, height: 1, background: '#F1F5F9' }}/>
            </div>
            {grp.items.map((a, i) => (
              <Card key={i} padding={14} elevation={1} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 30 }}>{flag(a.cc)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{a.t}</div>
                    <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{a.sub} · {a.dt.split('·')[1].trim()}</div>
                  </div>
                  <ScoreRing value={a.sc} size={40} stroke={4}/>
                </div>
                <div style={{ marginTop: 10, height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: a.st === 'success' ? '#10B981' : a.st === 'warning' ? '#F97316' : '#1A56DB', borderRadius: 3 }}/>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Chip tone={a.st} size="sm">{a.stL}</Chip>
                  <span style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{a.pct}% ready</span>
                </div>
              </Card>
            ))}
          </div>
        ))}

        <Card padding={14} elevation={1} style={{ background: '#FAF5FF', border: '1px dashed #DDD6FE', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mi" style={{ fontSize: 22, color: '#6D28D9' }}>add_circle</span>
          <div style={{ flex: 1, font: '600 13px/1.3 Inter', color: '#0F172A' }}>Plan another trip</div>
          <Btn variant="tonal" size="sm">New</Btn>
        </Card>
      </div>
      <ProNav active={1}/>
    </PhoneBody>
  );
}

// ─── 03 Pro · Advanced Documents (cross-app library) ──────────────────────
function MProDocs() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Document library" sub="34 docs · used across 7 apps" trailing={[{ icon: 'search' }, { icon: 'sort' }]}/>
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', overflowX: 'auto', flexShrink: 0 }}>
        {[['All', true], ['Identity', false], ['Financial', false], ['Employment', false], ['Bookings', false]].map(([l, on], i) => (
          <Chip key={i} tone={on ? 'royal' : 'neutral'} size="sm">{l}</Chip>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        {/* AI re-use callout */}
        <Card padding={14} elevation={2} style={{ background: 'linear-gradient(135deg,#FAF5FF,#EFF6FF)', border: '1px solid #DDD6FE', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AIBadge small/>
            <div style={{ flex: 1, font: '600 12px/1.4 Inter', color: '#0F172A' }}>Re-using 24 documents across 7 apps · saving ~6h of repeat work</div>
          </div>
        </Card>

        {/* Smart groups */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Identity · core 4</div>
        <Card padding={0} elevation={1} style={{ marginBottom: 14 }}>
          {[
            { i: 'badge', n: 'Passport · bio page', sub: 'Used in 7 apps', sc: 98, c: '#10B981', tag: 'CORE' },
            { i: 'photo_camera_front', n: 'Bio photo', sub: 'Used in 5 apps · Schengen valid', sc: 95, c: '#10B981', tag: 'CORE' },
            { i: 'home', n: 'Address proof', sub: 'Used in 3 apps · refresh soon', sc: 82, c: '#F59E0B', tag: 'STALE' },
            { i: 'cake', n: 'Birth certificate', sub: 'Used in 2 apps · CA only', sc: 100, c: '#10B981' },
          ].map((d, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 36, height: 44, borderRadius: 6, background: `${d.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 20, color: d.c }}>{d.i}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{d.n}</div>
                  {d.tag && <Chip tone={d.tag === 'STALE' ? 'warning' : 'ai'} size="sm">{d.tag}</Chip>}
                </div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{d.sub}</div>
              </div>
              <Chip tone="success" size="sm">{d.sc}</Chip>
            </div>
          ))}
        </Card>

        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Financial · 6</div>
        <Card padding={0} elevation={1} style={{ marginBottom: 14 }}>
          {[
            { i: 'account_balance', n: 'Bank · Jan – Mar 2026', sub: 'HDFC · 3 mo · used in 4 apps', sc: 91 },
            { i: 'savings', n: 'Fixed deposit certificate', sub: '€12,000 · used in 3 apps', sc: 94 },
            { i: 'request_quote', n: 'Tax returns 2024-25', sub: 'Used in 2 apps · US-required', sc: 88 },
          ].map((d, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 36, height: 44, borderRadius: 6, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 20, color: '#10B981' }}>{d.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{d.n}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{d.sub}</div>
              </div>
              <Chip tone="success" size="sm">{d.sc}</Chip>
            </div>
          ))}
        </Card>

        {/* Smart actions */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Smart actions</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'bolt', t: 'Refresh stale documents', sub: '3 docs need new dates', c: '#F59E0B' },
            { i: 'auto_awesome', t: 'AI-cluster similar files', sub: 'Detect duplicates · save 4 docs', c: '#7C3AED' },
            { i: 'cloud_download', t: 'Export all as ZIP', sub: 'For lawyer / embassy walk-in', c: '#1A56DB' },
          ].map((a, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 18, color: a.c }}>{a.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>{a.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8' }}>{a.sub}</div>
              </div>
              <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>
            </div>
          ))}
        </Card>
      </div>
      <ProNav active={2}/>
    </PhoneBody>
  );
}

// ─── 04 Pro · AI Chat Advanced (with sources panel) ───────────────────────
function MProChat() {
  const Bubble = ({ ai, t, time, sources, model, conf }) => (
    <div style={{ display: 'flex', justifyContent: ai ? 'flex-start' : 'flex-end', marginBottom: 12 }}>
      {ai && <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}><span className="mi" style={{ fontSize: 18, color: '#fff' }}>auto_awesome</span></div>}
      <div style={{ maxWidth: '78%' }}>
        <div style={{ background: ai ? '#fff' : '#1A56DB', color: ai ? '#0F172A' : '#fff', padding: '10px 14px', borderRadius: ai ? '4px 14px 14px 14px' : '14px 4px 14px 14px', font: '400 13px/1.5 Inter', border: ai ? '1px solid #F1F5F9' : 'none' }}>
          {t}
          {sources && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#FAF5FF', borderRadius: 8, border: '1px solid #DDD6FE' }}>
              <div style={{ font: '600 10px/1 Inter', color: '#6D28D9', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>{sources.length} sources cited</div>
              {sources.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                  <span className="mi" style={{ fontSize: 12, color: '#7C3AED' }}>link</span>
                  <span style={{ font: '500 11px/1.4 Inter', color: '#475569', flex: 1 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', justifyContent: ai ? 'flex-start' : 'flex-end' }}>
          {ai && model && <Chip tone="ai" size="sm" style={{ height: 14, padding: '0 6px', fontSize: 9 }}>{model}</Chip>}
          {ai && conf && <span>· {conf}% conf</span>}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ height: 60, background: 'linear-gradient(155deg,#0F172A,#1A56DB)', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>arrow_back</span></button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 20, color: '#fff' }}>auto_awesome</span>
        </div>
        <div style={{ flex: 1, padding: '0 10px' }}>
          <div style={{ font: '700 14px/1.2 Plus Jakarta Sans' }}>AI Pro · Advanced mode</div>
          <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.65)', marginTop: 2 }}>Cross-app context · 7 applications loaded</div>
        </div>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>tune</span></button>
      </div>

      {/* Context chips */}
      <div style={{ padding: '10px 12px', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
        <Chip tone="info" size="sm" icon="auto_awesome">All 7 apps</Chip>
        <Chip tone="neutral" size="sm">UK only</Chip>
        <Chip tone="neutral" size="sm">USA only</Chip>
        <Chip tone="neutral" size="sm">Schengen</Chip>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 8px' }}>
        <div style={{ textAlign: 'center', font: '500 11px/1 Inter', color: '#94A3B8', margin: '4px 0 12px' }}>Today · 11:24 AM</div>
        <Bubble t="I'm planning trips to UK, USA, Germany and Japan this year. Which application should I work on first?" time="11:24 AM"/>
        <Bubble ai model="Claude 3.5" conf={94} t="Looking at your 7 active applications, here's the priority order:" sources={['UK Standard Visitor processing times (gov.uk)','Schengen 90/180 rule', 'Your travel timeline']} time="11:25 AM"/>
        <Bubble ai model="Claude 3.5" conf={94} t={
          <span>
            <b>1. UK — Apr 02 trip</b>: 96% ready, submit this week. Standard processing is 3 weeks but visit visa lottery slows.<br/>
            <b>2. USA B1/B2 — May 14</b>: 92% ready, but visa interview slots in Mumbai are 8 wks out. Book interview NOW.<br/>
            <b>3. Schengen DE — May 28</b>: 84%, can wait 2 weeks.<br/>
            <b>4. Canada Aug 20</b>: 62% with flags — fix issues now, not before deadline.
          </span>
        } time="11:25 AM"/>

        {/* Tool-use indicator */}
        <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', font: '500 11px/1 Inter', color: '#64748B', margin: '4px auto 12px', width: 'fit-content' }}>
          <span className="mi" style={{ fontSize: 14, color: '#7C3AED' }}>build</span>
          Used tool: <code style={{ color: '#7C3AED', fontFamily: 'JetBrains Mono' }}>check_embassy_slot_availability</code>
        </div>

        <Bubble t="Book US interview for me and snooze Canada for 2 weeks" time="11:27 AM"/>
        <Bubble ai model="Claude 3.5" conf={87} t={<span>Booking US interview · Mumbai Apr 14 at 10:00 AM (earliest available). Snoozing Canada until <b>Apr 12</b>.<br/><br/>Want me to also pre-fill your DS-160 from your stored data?</span>} time="11:28 AM"/>
      </div>

      {/* Capabilities preview */}
      <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
        {['Book US interview', 'Pre-fill DS-160 ✨', 'Compare visa types', 'Refusal probability'].map((s, i) => (
          <div key={i} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 999, background: '#FAF5FF', color: '#6D28D9', font: '600 11px/1 Inter', border: '1px solid #DDD6FE' }}>{s}</div>
        ))}
      </div>

      {/* Composer */}
      <div style={{ padding: '8px 12px 10px', background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: '#F1F5F9' }}>
          <span className="mi" style={{ fontSize: 20, color: '#475569' }}>add</span>
        </button>
        <div style={{ flex: 1, padding: '0 14px', height: 38, background: '#F1F5F9', borderRadius: 19, display: 'flex', alignItems: 'center', font: '400 13px/1 Inter', color: '#94A3B8' }}>Ask anything across your 7 apps…</div>
        <button style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: '#1A56DB' }}>
          <span className="mi" style={{ fontSize: 18, color: '#fff' }}>send</span>
        </button>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MProDash, MProAppsManager, MProDocs, MProChat });
