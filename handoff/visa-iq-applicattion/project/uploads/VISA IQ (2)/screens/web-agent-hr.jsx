/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, flag, WebShell */
// Web — Agent / Consultant + expanded HR

// extend WebShell to support 'agent' role by re-defining a helper that injects extra nav
function WebShellAgent({ active = 'queue', children }) {
  // We'll mimic the WebShell structure but with agent-specific nav
  const nav = [
    { id: 'queue', i: 'inbox', l: 'Queue', badge: '4' },
    { id: 'clients', i: 'group', l: 'My clients' },
    { id: 'chats', i: 'forum', l: 'Conversations', badge: '7' },
    { id: 'reviews', i: 'fact_check', l: 'Reviews' },
    { id: 'earnings', i: 'savings', l: 'Earnings' },
    { id: 'reports', i: 'bar_chart', l: 'Performance' },
    { id: 'settings', i: 'settings', l: 'Settings' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 248, background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ height: 64, padding: '0 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <Logo size={20} onDark/>
          <span style={{ marginLeft: 8, padding: '2px 7px', background: '#7C3AED', color: '#fff', font: '700 9px/1 Inter', borderRadius: 4, letterSpacing: 0.4 }}>AGENT</span>
        </div>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '700 12px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#10B981', border: '2px solid #0F172A' }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 13px/1.2 Inter', color: '#fff' }}>Priya Raghavan</div>
            <div style={{ font: '500 10px/1 Inter', color: '#10B981', marginTop: 4 }}>● Online · accepting</div>
          </div>
          <div style={{ width: 36, height: 22, borderRadius: 11, background: '#10B981', padding: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff' }}/>
          </div>
        </div>
        <div style={{ padding: 12, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: n.id === active ? 'rgba(124,58,237,.18)' : 'transparent', borderLeft: n.id === active ? '3px solid #A78BFA' : '3px solid transparent' }}>
              <span className="mi" style={{ fontSize: 19, color: n.id === active ? '#A78BFA' : 'rgba(255,255,255,.6)' }}>{n.i}</span>
              <span style={{ flex: 1, font: `${n.id === active ? 600 : 500} 13px/1 Inter`, color: n.id === active ? '#fff' : 'rgba(255,255,255,.7)' }}>{n.l}</span>
              {n.badge && <span style={{ padding: '2px 7px', background: n.id === active ? '#7C3AED' : 'rgba(255,255,255,.1)', color: '#fff', font: '700 10px/1 Inter', borderRadius: 999 }}>{n.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.5)' }}>This week</span>
            <span style={{ font: '700 13px/1 JetBrains Mono', color: '#10B981' }}>$1,842</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3 }}>
            <div style={{ width: '74%', height: '100%', background: 'linear-gradient(90deg,#7C3AED,#10B981)', borderRadius: 3 }}/>
          </div>
          <div style={{ font: '500 10px/1.3 Inter', color: 'rgba(255,255,255,.5)' }}>74% to your $2,500 goal</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: 64, background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 480, height: 38, background: '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
            <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
            <span style={{ flex: 1, font: '400 13px/1 Inter', color: '#94A3B8' }}>Search clients, applications, documents…</span>
          </div>
          <div style={{ flex: 1 }}/>
          <Chip tone="success" size="md" icon="check_circle">$184 today</Chip>
          <button style={{ width: 38, height: 38, borderRadius: 10, border: 0, background: '#F1F5F9', position: 'relative' }}>
            <span className="mi" style={{ fontSize: 20, color: '#475569' }}>notifications_outlined</span>
            <span style={{ position: 'absolute', top: 6, right: 8, minWidth: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', font: '700 9px/1 Inter', padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F1F5F9' }}>4</span>
          </button>
          <Btn variant="primary" icon="videocam">Go live</Btn>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Agent · Queue / Dashboard ─────────────────────────────────────────────
function WAgentQueue() {
  return (
    <WebShellAgent active="queue">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ font: '500 12px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase' }}>Welcome back</span>
            </div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 6, letterSpacing: '-0.02em' }}>Today's queue</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>4 incoming · 1 live call · 7 chats open · 12 reviews due</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Chip tone="success" size="md" icon="bolt">Auto-match on</Chip>
            <Btn variant="outlined" icon="event_busy">Set unavailable</Btn>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { l: 'Active sessions', v: '1', sub: '4:18 elapsed', c: '#7C3AED', i: 'videocam' },
            { l: 'Earned today', v: '$184.20', sub: '+$48 vs avg', c: '#10B981', i: 'savings' },
            { l: 'Avg response', v: '47s', sub: 'Top 8% on platform', c: '#1A56DB', i: 'speed' },
            { l: 'Approval rate', v: '94%', sub: 'After your reviews', c: '#F59E0B', i: 'verified' },
          ].map((k, i) => (
            <Card key={i} padding={20} elevation={1}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${k.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: k.c }}>{k.i}</span>
                </div>
                <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>more_horiz</span>
              </div>
              <div style={{ font: '800 28px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 16 }}>{k.v}</div>
              <div style={{ font: '500 12px/1.4 Inter', color: '#64748B', marginTop: 4 }}>{k.l}</div>
              <div style={{ font: '600 11px/1 Inter', color: k.c, marginTop: 6 }}>{k.sub}</div>
            </Card>
          ))}
        </div>

        {/* Two-column: Queue + Live call */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 20, marginTop: 24 }}>
          <Card padding={0} elevation={1}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>Incoming requests</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Matched to your specialties · sorted by urgency</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip tone="info" size="sm" icon="filter_list">All types</Chip>
                <Chip tone="error" size="sm">Hot · 1</Chip>
              </div>
            </div>
            {[
              { n: 'David Chen', cc: 'US', t: 'USA B1 · pre-submit chat', m: 96, p: '$1.20/min', urg: 'NEW', wait: '12s', k: 'chat' },
              { n: 'Maria Santos', cc: 'DE', t: 'Schengen · document review', m: 91, p: 'Per review · $32', urg: 'HOT', wait: '34s', k: 'review' },
              { n: 'Lin Wei', cc: 'CA', t: 'Canada TRV · checklist help', m: 84, p: '$1.20/min', urg: '', wait: '1m', k: 'chat' },
              { n: 'Rahul Singh', cc: 'GB', t: 'UK Visitor · audit override', m: 72, p: 'Per audit · $18', urg: '', wait: '3m', k: 'audit' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1.4fr 1fr 0.9fr 0.7fr 1fr', alignItems: 'center', padding: '16px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: ['#1A56DB','#10B981','#0EA5E9','#F59E0B'][i], color: '#fff', font: '700 13px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.n.split(' ').map(s=>s[0]).join('')}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{r.n}</div>
                    {r.urg && <Chip tone={r.urg === 'HOT' ? 'error' : 'info'} size="sm">{r.urg}</Chip>}
                  </div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 14 }}>{flag(r.cc)}</span>{r.t}
                  </div>
                </div>
                <div>
                  <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>Match</div>
                  <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: r.m >= 90 ? '#10B981' : '#1A56DB', marginTop: 4 }}>{r.m}%</div>
                </div>
                <div>
                  <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>Rate</div>
                  <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A', marginTop: 4 }}>{r.p}</div>
                </div>
                <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>{r.wait}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn variant="outlined" size="sm">Pass</Btn>
                  <Btn variant="primary" size="sm" icon={r.k === 'chat' ? 'chat' : r.k === 'review' ? 'fact_check' : 'auto_awesome'}>Accept</Btn>
                </div>
              </div>
            ))}
          </Card>

          {/* Live call panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card padding={20} elevation={3} style={{ background: 'linear-gradient(135deg,#0F172A,#7C3AED)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(124,58,237,.4)' }}/>
              <Chip tone="ai" size="sm" icon="videocam" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', position: 'relative' }}>LIVE · 4:18</Chip>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', font: '700 16px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,.3)' }}>SM</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '700 16px/1.2 Plus Jakarta Sans' }}>Sarah Mitchell</div>
                  <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{flag('FR')} France Schengen · $5.16 billed</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, position: 'relative' }}>
                <Btn variant="gold" size="sm" icon="open_in_new" style={{ flex: 1 }}>Resume call</Btn>
                <Btn variant="outlined" size="sm" icon="picture_as_pdf" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)' }}>Audit</Btn>
              </div>
            </Card>
            <Card padding={18} elevation={1}>
              <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Today's schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                {[
                  { t: 'Now', l: 'Sarah Mitchell · live call', c: '#7C3AED' },
                  { t: '3:30 PM', l: 'David Chen · pre-submit', c: '#1A56DB' },
                  { t: '4:15 PM', l: 'Doc reviews · 3 queued', c: '#10B981' },
                  { t: '5:00 PM', l: 'Marcus Köhler · team sync', c: '#94A3B8' },
                ].map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.c }}/>
                    <div style={{ font: '600 11px/1 JetBrains Mono', color: '#0F172A', width: 56 }}>{e.t}</div>
                    <div style={{ flex: 1, font: '500 12px/1.3 Inter', color: '#475569' }}>{e.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* My clients table */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>My clients</div>
            <Btn variant="text" size="sm" trailing="arrow_forward">View all</Btn>
          </div>
          <Card padding={0} elevation={1}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.7fr 0.7fr 0.9fr 100px', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', font: '600 10px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase', gap: 12 }}>
              <span>Client</span><span>Visa</span><span>Audit</span><span>Sessions</span><span>Last contact</span><span/>
            </div>
            {[
              { n: 'Sarah Mitchell', cc: 'FR', t: 'Schengen Tourist', sc: 87, ses: 3, last: 'Now · live' },
              { n: 'David Chen', cc: 'US', t: 'B1 Business', sc: 92, ses: 1, last: 'Yesterday' },
              { n: 'Maria Santos', cc: 'DE', t: 'Schengen', sc: 74, ses: 2, last: '2d ago' },
              { n: 'Lin Wei', cc: 'CA', t: 'TRV', sc: 88, ses: 1, last: '5d ago' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 0.7fr 0.7fr 0.9fr 100px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#1A56DB','#10B981','#F97316','#0EA5E9'][i], color: '#fff', font: '700 12px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.n.split(' ').map(s=>s[0]).join('')}</div>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{r.n}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1.3 Inter', color: '#475569' }}><span style={{ fontSize: 16 }}>{flag(r.cc)}</span>{r.t}</div>
                <span style={{ font: '700 13px/1 Plus Jakarta Sans', color: r.sc >= 90 ? '#10B981' : r.sc >= 75 ? '#EAB308' : '#F97316' }}>{r.sc}</span>
                <span style={{ font: '500 12px/1 Inter', color: '#475569' }}>{r.ses}</span>
                <span style={{ font: '500 12px/1 Inter', color: i === 0 ? '#7C3AED' : '#475569' }}>{r.last}</span>
                <Btn variant="tonal" size="sm">Open</Btn>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </WebShellAgent>
  );
}

// ─── Agent · Application Review (full screen detail) ───────────────────────
function WAgentReview() {
  return (
    <WebShellAgent active="reviews">
      <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 Inter', color: '#64748B' }}>
        <span>Reviews</span><span className="mi" style={{ fontSize: 14 }}>chevron_right</span>
        <span>Maria Santos</span><span className="mi" style={{ fontSize: 14 }}>chevron_right</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>Schengen Application · DE-2026-Q</span>
      </div>
      <div style={{ padding: '16px 32px 32px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        <div>
          {/* Client banner */}
          <Card padding={20} elevation={2}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10B981', color: '#fff', font: '700 18px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MS</div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Maria Santos</div>
                <div style={{ font: '400 12px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Acme Corp · Sales · {flag('IN')} Indian → {flag('DE')} Germany Schengen · deadline Mar 22</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <Chip tone="warning" size="sm">Needs review</Chip>
                  <Chip tone="ai" size="sm" icon="auto_awesome">AI score 74</Chip>
                  <Chip tone="info" size="sm">Paid review · $32</Chip>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="outlined" icon="videocam">Call</Btn>
                <Btn variant="tonal" icon="chat_bubble_outline">Chat</Btn>
              </div>
            </div>
          </Card>

          {/* AI summary */}
          <Card padding={18} elevation={1} style={{ marginTop: 16, background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AIBadge small/>
              <div style={{ font: '600 13px/1 Inter', color: '#6D28D9' }}>AI pre-review summary · Claude 3.5 Sonnet</div>
            </div>
            <div style={{ font: '400 13px/1.6 Inter', color: '#475569' }}>
              <strong style={{ color: '#0F172A' }}>2 blockers identified.</strong> Hotel booking is held but not paid — Germany's Schengen requires confirmed reservations. Bank average balance over 3 months is €4,120, below recommended €5,000 for a 10-day stay. Suggest: client uploads paid hotel confirmation + a balance top-up letter. All other documents cleared.
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14, font: '500 11px/1 Inter', color: '#6D28D9' }}>
              <span><span className="mi" style={{ fontSize: 14, verticalAlign: -2 }}>schedule</span> Generated 2m ago</span>
              <span><span className="mi" style={{ fontSize: 14, verticalAlign: -2 }}>verified</span> 87% confidence</span>
            </div>
          </Card>

          {/* Docs table */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Documents · 6</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip tone="success" size="sm">4 cleared</Chip>
                <Chip tone="warning" size="sm">2 flagged</Chip>
              </div>
            </div>
            <Card padding={0} elevation={1}>
              {[
                { i: 'badge', n: 'Passport.pdf', sc: 92, st: 'pass', notes: 'Name matches profile · expires 2029' },
                { i: 'photo_camera_front', n: 'Photo.jpg', sc: 95, st: 'pass', notes: 'Schengen-compliant biometrics' },
                { i: 'account_balance', n: 'Bank-Oct-Nov-Dec.pdf', sc: 62, st: 'warn', notes: 'AI flag: avg €4,120 below €5,000 threshold' },
                { i: 'work', n: 'Employment-Letter.pdf', sc: 88, st: 'pass', notes: 'Acme Corp letterhead · leave approved' },
                { i: 'hotel', n: 'Hotel-Booking.pdf', sc: 48, st: 'fail', notes: 'AI flag: reservation held, not paid' },
                { i: 'local_hospital', n: 'Insurance.pdf', sc: 91, st: 'pass', notes: '€50,000 coverage · valid full trip' },
              ].map((d, i, arr) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 1.4fr 1.4fr 50px 1fr', alignItems: 'center', padding: '14px 18px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 14 }}>
                  <div style={{ width: 40, height: 48, borderRadius: 8, background: d.st === 'fail' ? '#FEE2E2' : d.st === 'warn' ? '#FEF3C7' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mi" style={{ fontSize: 22, color: d.st === 'fail' ? '#DC2626' : d.st === 'warn' ? '#D97706' : '#059669' }}>{d.i}</span>
                  </div>
                  <div>
                    <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{d.n}</div>
                    <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>2.1 MB · uploaded yesterday</div>
                  </div>
                  <div style={{ font: '500 12px/1.4 Inter', color: d.st === 'fail' ? '#B91C1C' : d.st === 'warn' ? '#9A3412' : '#475569' }}>{d.notes}</div>
                  <ScoreRing value={d.sc} size={40} stroke={4}/>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Btn variant="text" size="sm" icon="open_in_new">Open</Btn>
                    <Btn variant="tonal" size="sm">Comment</Btn>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={20} elevation={2}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Your review</div>
            <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Override AI verdict or send recommendations to the client.</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase' }}>Verdict</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[ ['Approve', '#10B981', 'thumb_up'], ['Needs fixes', '#F59E0B', 'edit_note'], ['Reject', '#EF4444', 'thumb_down'] ].map(([l, c, ic], i) => (
                  <div key={i} style={{ padding: '12px 8px', borderRadius: 10, border: i === 1 ? `2px solid ${c}` : '1.5px solid #E2E8F0', background: i === 1 ? `${c}10` : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span className="mi" style={{ fontSize: 22, color: c }}>{ic}</span>
                    <span style={{ font: '600 11px/1 Inter', color: i === 1 ? c : '#475569' }}>{l}</span>
                  </div>
                ))}
              </div>
              <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 8 }}>Notes to client</div>
              <div style={{ minHeight: 100, border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 12, font: '400 13px/1.5 Inter', color: '#475569', background: '#fff' }}>
                Hi Maria — your file is in good shape overall. Please re-upload a <strong style={{ color: '#0F172A' }}>paid</strong> hotel confirmation (Booking.com refundable rates are accepted). Bank balance is a bit lean — add a short top-up letter from your employer if possible…
              </div>
              <Btn variant="primary" full size="md" icon="send">Send review</Btn>
            </div>
          </Card>
          <Card padding={18} elevation={1}>
            <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Cross-document checks</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { t: 'Name matches across all 6 documents', ok: true },
                { t: 'Date of birth consistent', ok: true },
                { t: 'Travel dates align with hotel + flight', ok: true },
                { t: 'Bank account holder = applicant', ok: true },
                { t: 'Insurance covers full travel window', ok: true },
                { t: 'Hotel city matches itinerary', ok: false },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 12px/1.4 Inter', color: c.ok ? '#047857' : '#B91C1C' }}>
                  <span className="mi" style={{ fontSize: 16 }}>{c.ok ? 'check_circle' : 'cancel'}</span>
                  {c.t}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </WebShellAgent>
  );
}

// ─── Expanded HR — Employee Detail ─────────────────────────────────────────
function WB2BEmployee() {
  return (
    <WebShell role="b2b" active="team">
      <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 Inter', color: '#64748B' }}>
        <span>Team</span><span className="mi" style={{ fontSize: 14 }}>chevron_right</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>Maria Santos</span>
      </div>
      <div style={{ padding: '16px 32px 32px' }}>
        {/* hero */}
        <Card padding={24} elevation={2} style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', color: '#fff', font: '800 26px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MS</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '800 24px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Maria Santos</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Senior Account Manager · Sales · joined Mar 2022 · maria.s@acme.com</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <Chip tone="warning" size="sm" icon="warning_amber">2 attention items</Chip>
              <Chip tone="info" size="sm">2 active applications</Chip>
              <Chip tone="neutral" size="sm">Manager: A. Verma</Chip>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outlined" icon="mail">Email</Btn>
            <Btn variant="tonal" icon="bolt">Send reminder</Btn>
            <Btn variant="primary" icon="add">Assign visa</Btn>
          </div>
        </Card>

        {/* Two cols */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 20 }}>
          {/* Applications */}
          <Card padding={0} elevation={1}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Active applications</div>
              <Btn variant="text" size="sm" icon="add">Assign</Btn>
            </div>
            {[
              { cc: 'DE', t: 'Germany · Schengen', sc: 74, dt: 'Mar 22 · 5d', st: 'warning', stL: 'Attention' },
              { cc: 'US', t: 'USA · B1 Business', sc: 88, dt: 'Apr 14 · 27d', st: 'info', stL: 'In progress' },
            ].map((a, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <span style={{ fontSize: 24 }}>{flag(a.cc)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{a.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Deadline {a.dt}</div>
                </div>
                <ScoreRing value={a.sc} size={40} stroke={4}/>
                <Chip tone={a.st} size="sm">{a.stL}</Chip>
                <Btn variant="text" size="sm" trailing="arrow_forward">Open</Btn>
              </div>
            ))}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>History · 3 completed</div>
              <Btn variant="text" size="sm" trailing="arrow_forward">View all</Btn>
            </div>
          </Card>

          {/* Profile snapshot */}
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Profile snapshot</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
              {[
                ['Passport', 'IN · K8472913 · 22 Aug 2031'],
                ['Date of birth', '04 Aug 1989'],
                ['Travel history', '7 prior visas · 0 rejections'],
                ['Phone', '+91 98 1234 5678'],
                ['Resume', 'Uploaded · 246 KB'],
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                  <span style={{ font: '500 12px/1 Inter', color: '#64748B' }}>{r[0]}</span>
                  <span style={{ font: '600 12px/1 Inter', color: '#0F172A', textAlign: 'right', maxWidth: '60%' }}>{r[1]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Documents library */}
          <Card padding={0} elevation={1} style={{ gridColumn: 'span 2' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Document library</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Re-used across all applications · auto-shared with assigned agents</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip tone="info" size="sm">All · 11</Chip>
                <Chip tone="success" size="sm">Cleared · 7</Chip>
                <Chip tone="warning" size="sm">Flagged · 3</Chip>
                <Chip tone="neutral" size="sm">Expired · 1</Chip>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 16 }}>
              {[
                { i: 'badge', n: 'Passport', s: 'Audit 92 · valid', tone: 'success' },
                { i: 'account_balance', n: 'Bank Oct-Dec', s: 'Audit 62 · flagged', tone: 'warning' },
                { i: 'work', n: 'Employment letter', s: 'Audit 88 · cleared', tone: 'success' },
                { i: 'hotel', n: 'Hotel Berlin', s: 'Audit 48 · 2 issues', tone: 'error' },
                { i: 'local_hospital', n: 'Insurance', s: 'Audit 91 · cleared', tone: 'success' },
                { i: 'description', n: 'Resume', s: '246 KB · current', tone: 'success' },
                { i: 'photo_camera_front', n: 'Bio photo', s: 'Audit 95 · cleared', tone: 'success' },
                { i: 'event_busy', n: 'Old insurance', s: 'Expired Feb', tone: 'neutral' },
              ].map((d, i) => (
                <div key={i} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                  <div style={{ width: 36, height: 44, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>{d.i}</span>
                  </div>
                  <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A', marginTop: 10 }}>{d.n}</div>
                  <div style={{ font: '400 10px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{d.s}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </WebShell>
  );
}

// ─── HR Compliance reports page ────────────────────────────────────────────
function WB2BReports() {
  return (
    <WebShell role="b2b" active="reports">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Reports & Compliance</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Export ready-to-share PDFs · audit-grade data trail · GDPR safe</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="schedule">Schedule</Btn>
            <Btn variant="primary" icon="add">New report</Btn>
          </div>
        </div>

        {/* Report templates */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { t: 'Team Compliance', s: 'Visa status + doc completeness for every employee.', i: 'verified', c: '#10B981' },
            { t: 'Audit Summary', s: 'AI audit scores, blockers, recommendations across team.', i: 'auto_awesome', c: '#7C3AED' },
            { t: 'Quarterly Travel', s: 'Submission rates, approval timelines, processing days.', i: 'flight_takeoff', c: '#1A56DB' },
          ].map((r, i) => (
            <Card key={i} padding={20} elevation={1}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${r.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 24, color: r.c }}>{r.i}</span>
              </div>
              <div style={{ font: '700 15px/1.3 Plus Jakarta Sans', color: '#0F172A', marginTop: 12 }}>{r.t}</div>
              <div style={{ font: '400 12px/1.5 Inter', color: '#64748B', marginTop: 6 }}>{r.s}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Btn variant="tonal" size="sm" icon="picture_as_pdf">PDF</Btn>
                <Btn variant="tonal" size="sm" icon="table_chart">CSV</Btn>
                <Btn variant="text" size="sm" trailing="arrow_forward">Customize</Btn>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent reports */}
        <Card padding={0} elevation={1}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Recent exports</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Retention: 90 days · contains personal data</div>
            </div>
            <Btn variant="text" size="sm" icon="download">Export all</Btn>
          </div>
          {[
            { t: 'Team Compliance · Feb 2026', by: 'Anita Verma', d: '4 days ago', sz: '1.4 MB', f: 'PDF' },
            { t: 'Audit Summary · Q1 2026', by: 'Auto · Quarterly', d: '6 days ago', sz: '720 KB', f: 'PDF' },
            { t: 'Schengen Apps · Jan-Feb', by: 'Anita Verma', d: '11 days ago', sz: '3.1 MB', f: 'CSV' },
            { t: 'GDPR data request · u_2bcc', by: 'Anita Verma', d: '2 weeks ago', sz: '142 KB', f: 'JSON' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1.6fr 1fr 0.8fr 0.6fr 80px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 16 }}>
              <div style={{ width: 32, height: 40, borderRadius: 6, background: r.f === 'PDF' ? '#FEE2E2' : r.f === 'CSV' ? '#D1FAE5' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 18, color: r.f === 'PDF' ? '#DC2626' : r.f === 'CSV' ? '#059669' : '#6D28D9' }}>picture_as_pdf</span>
              </div>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
              <div style={{ font: '500 12px/1.3 Inter', color: '#64748B' }}>{r.by}</div>
              <div style={{ font: '500 12px/1 Inter', color: '#64748B' }}>{r.d}</div>
              <div style={{ font: '500 11px/1 JetBrains Mono', color: '#475569' }}>{r.sz}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn variant="text" size="sm" icon="download" style={{ padding: 0 }}/>
                <Btn variant="text" size="sm" icon="share" style={{ padding: 0 }}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </WebShell>
  );
}

Object.assign(window, { WAgentQueue, WAgentReview, WB2BEmployee, WB2BReports, WebShellAgent });
