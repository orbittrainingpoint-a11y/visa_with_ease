/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Mobile extras: new app wizard, notifications, search, empty/error states, camera, payment, push, dark mode

// ─── New Application wizard (full mobile multi-step) ───────────────────────
function MNewAppWizard() {
  const VisaCard = ({ flag: f, n, t, fee, dur, popular }) => (
    <div style={{ position: 'relative', padding: 14, borderRadius: 14, background: '#fff', border: '1.5px solid #E2E8F0' }}>
      {popular && <div style={{ position: 'absolute', top: -7, right: 12, padding: '2px 10px', background: '#F59E0B', color: '#fff', borderRadius: 999, font: '700 9px/1 Inter', letterSpacing: 0.4 }}>POPULAR</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>{f}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{n}</div>
          <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{t}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '8px 0 0', borderTop: '1px solid #F1F5F9' }}>
        <div>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>Fee</div>
          <div style={{ font: '600 12px/1 Inter', color: '#0F172A', marginTop: 4 }}>{fee}</div>
        </div>
        <div>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>Processing</div>
          <div style={{ font: '600 12px/1 Inter', color: '#0F172A', marginTop: 4 }}>{dur}</div>
        </div>
      </div>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="New application" leading="close" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,1,0,0,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
        </div>
        <div style={{ font: '500 11px/1 Inter', color: '#1A56DB', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14 }}>Step 2 of 5</div>
        <div style={{ font: '700 24px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 6, letterSpacing: '-0.01em' }}>Pick your visa type</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Based on your nationality and Spain destination, here's what's available.</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <VisaCard f={`${flag('ES')}`} n="Schengen Tourist (Type C)" t="Up to 90 days · leisure, family" fee="€80" dur="10–15 days" popular/>
          <VisaCard f={`${flag('ES')}`} n="Schengen Business" t="Meetings, events, exhibitions" fee="€80" dur="10–15 days"/>
          <VisaCard f={`${flag('ES')}`} n="National Long-Stay (Type D)" t="Over 90 days · work/study" fee="€140" dur="60–90 days"/>
        </div>
        <Card padding={14} elevation={1} style={{ marginTop: 16, background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AIBadge small/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 12px/1.4 Inter', color: '#6D28D9' }}>Not sure? Let AI recommend</div>
              <div style={{ font: '400 11px/1.5 Inter', color: '#475569', marginTop: 2 }}>Answer 3 quick questions and we'll match the right visa type.</div>
            </div>
            <Btn variant="tonal" size="sm" trailing="arrow_forward">Help me</Btn>
          </div>
        </Card>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
        <Btn variant="outlined" size="lg" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" size="lg" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Notifications center ───────────────────────────────────────────────────
function MNotifications() {
  const N = ({ i, c, t, s, ts, unread, action }) => (
    <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #F8FAFC', background: unread ? '#EFF6FF' : '#fff', position: 'relative' }}>
      {unread && <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#1A56DB' }}/>}
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="mi" style={{ fontSize: 22, color: c }}>{i}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ font: `${unread ? 700 : 600} 13px/1.3 Inter`, color: '#0F172A' }}>{t}</div>
          <span style={{ font: '500 10px/1 Inter', color: '#94A3B8', flexShrink: 0 }}>{ts}</span>
        </div>
        <div style={{ font: '400 12px/1.5 Inter', color: '#64748B', marginTop: 4 }}>{s}</div>
        {action && <Btn variant="tonal" size="sm" style={{ marginTop: 10 }}>{action}</Btn>}
      </div>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Notifications" trailing={[{ icon: 'done_all' }, { icon: 'tune' }]}/>
      <div style={{ padding: '8px 16px 4px', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[['All', 12, true], ['Audits', 4], ['Apps', 3], ['Agents', 2], ['Tips', 3]].map(([l, n, on], i) => (
          <div key={i} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 999, background: on ? '#1A56DB' : '#F1F5F9', color: on ? '#fff' : '#475569', font: '500 12px/1 Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
            {l}<span style={{ padding: '0 5px', borderRadius: 8, background: on ? 'rgba(255,255,255,.25)' : '#fff', color: on ? '#fff' : '#1A56DB', font: '700 9px/1.6 Inter' }}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '14px 16px 6px', font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', background: '#F8FAFC' }}>Today</div>
        <N i="auto_awesome" c="#7C3AED" t="Passport audit complete · score 87" s="Excellent — ready to submit. View 3 findings." ts="2m ago" unread action="View report"/>
        <N i="trending_up" c="#10B981" t="Readiness jumped to 87 (+5)" s="Your Bank-Nov statement was added and trends improved." ts="12m ago" unread/>
        <N i="forum" c="#1A56DB" t="Priya Raghavan replied" s='"Send me the paid hotel confirmation when ready."' ts="34m ago" unread action="Open chat"/>
        <N i="schedule" c="#F59E0B" t="Submission window opens in 3 days" s="Optimal range: Mar 1 – Mar 5 (8-12 days before travel)." ts="1h ago"/>
        <div style={{ padding: '14px 16px 6px', font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', background: '#F8FAFC' }}>Yesterday</div>
        <N i="update" c="#0EA5E9" t="France requirements updated" s="VFS Global posted new biometric appointment rules." ts="Yesterday" action="See changes"/>
        <N i="workspace_premium" c="#D97706" t="VIP slot available · 30% off" s="Priya has a 3:30 PM slot today. Limited offer." ts="Yesterday"/>
        <N i="warning_amber" c="#F97316" t="Hotel booking still unpaid" s="This is your last blocker to reach 95+." ts="Yesterday"/>
      </div>
    </PhoneBody>
  );
}

// ─── Global search ──────────────────────────────────────────────────────────
function MSearch() {
  return (
    <PhoneBody bg="#fff">
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <span className="mi" style={{ fontSize: 22, color: '#0F172A', padding: 10 }}>arrow_back</span>
        <div style={{ flex: 1, height: 40, background: '#F1F5F9', borderRadius: 20, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mi" style={{ fontSize: 18, color: '#1A56DB' }}>search</span>
          <span style={{ font: '500 14px/1 Inter', color: '#0F172A', flex: 1 }}>schengen requirements</span>
          <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>close</span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* AI suggestion banner */}
        <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#FAF5FF,#EFF6FF)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AIBadge small/>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12px/1.4 Inter', color: '#6D28D9' }}>AI answer</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#0F172A', marginTop: 4 }}>For Indian citizens, France's Schengen Tourist visa needs <strong>6 core documents</strong>: passport, photo, bank statements, employment letter, insurance, and confirmed hotel + flight.</div>
            <Btn variant="text" size="sm" trailing="arrow_forward" style={{ marginTop: 6, padding: 0 }}>See full requirements</Btn>
          </div>
        </div>
        {/* Results */}
        <div style={{ padding: '14px 16px 0', font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>In your applications · 2</div>
        {[
          { i: 'folder_open', c: '#1A56DB', t: 'France · Schengen Tourist', s: 'Active · 87 readiness · Mar 15–24', tag: 'Application' },
          { i: 'folder_open', c: '#1A56DB', t: 'Germany · Schengen Tourist', s: 'Draft · 32 readiness', tag: 'Application' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${r.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 20, color: r.c }}>{r.i}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.s}</div>
            </div>
            <Chip tone="neutral" size="sm">{r.tag}</Chip>
          </div>
        ))}
        <div style={{ padding: '14px 16px 0', font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>Help articles · 5</div>
        {[
          'What does "Schengen" cover?',
          'Bank balance thresholds by country',
          'Travel insurance for Schengen — minimum coverage',
          'Why my Schengen visa got rejected — common reasons',
          'Schengen processing time map',
        ].map((q, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F8FAFC' }}>
            <span className="mi" style={{ fontSize: 22, color: '#94A3B8' }}>help_outline</span>
            <div style={{ flex: 1, font: '500 13px/1.3 Inter', color: '#0F172A' }}>{q}</div>
            <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>
          </div>
        ))}
        <div style={{ padding: '14px 16px 0', font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>Consultants matching · 3</div>
        {[
          { n: 'Priya Raghavan', s: 'Schengen specialist · 4.9★ · live', cc: ['IN','FR','DE'] },
          { n: 'Marcus Köhler', s: 'Berlin · Schengen Code expert · 4.7★', cc: ['DE','AT','CH'] },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '700 13px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.n.split(' ').map(s=>s[0]).join('')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{p.n}</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{p.s}</div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>{p.cc.map(f => <span key={f} style={{ fontSize: 14 }}>{flag(f)}</span>)}</div>
          </div>
        ))}
      </div>
    </PhoneBody>
  );
}

// ─── Empty state — no applications ──────────────────────────────────────────
function MEmptyApps() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Applications"/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px', textAlign: 'center' }}>
        {/* illustration */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, #DBEAFE 0%, transparent 70%)', position: 'absolute', inset: 0 }}/>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
            <div style={{ width: 90, height: 120, borderRadius: 8, background: 'linear-gradient(135deg,#1A56DB,#0EA5E9)', transform: 'rotate(-8deg)', boxShadow: '0 20px 40px rgba(26,86,219,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 40, color: '#fff', opacity: 0.5 }}>flight_takeoff</span>
            </div>
            <div style={{ position: 'absolute', top: -10, right: 30, width: 40, height: 40, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 22, color: '#fff' }}>add</span>
            </div>
          </div>
        </div>
        <div style={{ font: '700 22px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Start your first application</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 10, maxWidth: 260 }}>Tell us where you're going and we'll build your personalized AI checklist in seconds.</div>
        <Btn variant="primary" size="lg" icon="add" full style={{ marginTop: 24, maxWidth: 280 }}>Start a new application</Btn>
        <Btn variant="text" size="md" style={{ marginTop: 8 }}>Or learn how it works</Btn>
        {/* Suggested trip cards */}
        <div style={{ marginTop: 32, width: '100%' }}>
          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left', marginBottom: 10 }}>Or pick a popular destination</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['FR','France'],['JP','Japan'],['US','USA']].map(([c, n]) => (
              <div key={c} style={{ padding: 14, background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', textAlign: 'center' }}>
                <div style={{ fontSize: 28 }}>{flag(c)}</div>
                <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A', marginTop: 6 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active={1}/>
    </PhoneBody>
  );
}

// ─── Error / offline ────────────────────────────────────────────────────────
function MOffline() {
  return (
    <PhoneBody bg="#fff">
      <PhoneAppBar title="VisaIQ" trailing={[{ icon: 'refresh' }]}/>
      {/* Persistent offline banner */}
      <div style={{ padding: '10px 16px', background: '#0F172A', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="mi" style={{ fontSize: 20, color: '#F59E0B' }}>wifi_off</span>
        <div style={{ flex: 1, font: '500 12px/1.4 Inter' }}>Offline · showing your cached data</div>
        <span className="mi" style={{ fontSize: 18, color: '#fff' }}>refresh</span>
      </div>
      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        <div style={{ padding: 14, background: '#FEF3C7', borderRadius: 12, display: 'flex', gap: 10, marginBottom: 16 }}>
          <span className="mi" style={{ fontSize: 22, color: '#D97706' }}>info</span>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12px/1.3 Inter', color: '#92400E' }}>Some features unavailable</div>
            <div style={{ font: '400 11px/1.4 Inter', color: '#78350F', marginTop: 2 }}>AI audit, chat, and live requirements need a connection. You can still view your documents and previous audits.</div>
          </div>
        </div>

        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Cached (last sync · 18m ago)</div>
        {[
          { i: 'badge', t: 'Passport audit · score 87', s: 'Read-only · cached Feb 18, 9:23 AM' },
          { i: 'description', t: 'France requirements snapshot', s: 'Snapshot · check freshness when online' },
          { i: 'folder_open', t: 'France Schengen application', s: 'View-only · changes blocked until online' },
        ].map((r, i) => (
          <Card key={i} padding={14} elevation={1} style={{ marginBottom: 10, opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span className="mi" style={{ fontSize: 20, color: '#475569' }}>{r.i}</span>
                <span className="mi" style={{ fontSize: 12, color: '#94A3B8', position: 'absolute', bottom: -2, right: -2, background: '#fff', borderRadius: '50%', padding: 1 }}>cloud_off</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{r.s}</div>
              </div>
              <Chip tone="neutral" size="sm">View</Chip>
            </div>
          </Card>
        ))}
      </div>
    </PhoneBody>
  );
}

// ─── Camera document capture ────────────────────────────────────────────────
function MCamera() {
  return (
    <PhoneBody bg="#000">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #1f2937 0%, #000 70%)' }}/>
      {/* top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between', position: 'relative', zIndex: 2, color: '#fff', flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>close</span></button>
        <div style={{ padding: '6px 12px', background: 'rgba(0,0,0,.6)', borderRadius: 999, font: '600 12px/1 Inter' }}>📄 Passport — page 1</div>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 0 }}><span className="mi" style={{ fontSize: 22, color: '#F59E0B' }}>flash_auto</span></button>
      </div>
      {/* guide overlay */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ font: '500 12px/1.4 Inter', color: 'rgba(255,255,255,.85)', textAlign: 'center', padding: '8px 16px', background: 'rgba(16,185,129,.18)', borderRadius: 999, marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="mi" style={{ fontSize: 16, color: '#10B981' }}>check_circle</span>
          Document detected · hold steady
        </div>
        <div style={{ position: 'relative', width: '78%', aspectRatio: '85/55', border: '3px solid #10B981', borderRadius: 16, boxShadow: '0 0 40px rgba(16,185,129,.3)' }}>
          {/* corner markers */}
          {[['t','l'],['t','r'],['b','l'],['b','r']].map((p, i) => (
            <div key={i} style={{ position: 'absolute', [p[0] === 't' ? 'top' : 'bottom']: -3, [p[1] === 'l' ? 'left' : 'right']: -3, width: 28, height: 28, borderTop: p[0] === 't' ? '4px solid #10B981' : 'none', borderBottom: p[0] === 'b' ? '4px solid #10B981' : 'none', borderLeft: p[1] === 'l' ? '4px solid #10B981' : 'none', borderRight: p[1] === 'r' ? '4px solid #10B981' : 'none', borderRadius: p[0] + p[1] === 'tl' ? '8px 0 0 0' : p[0] + p[1] === 'tr' ? '0 8px 0 0' : p[0] + p[1] === 'bl' ? '0 0 0 8px' : '0 0 8px 0' }}/>
          ))}
          {/* passport preview content */}
          <div style={{ position: 'absolute', inset: 8, background: 'linear-gradient(135deg, rgba(26,86,219,.3), rgba(11,31,75,.5))', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4, padding: 12 }}>
            <div style={{ font: '700 8px/1 Inter', color: 'rgba(255,255,255,.7)', letterSpacing: 1.5 }}>REPUBLIC OF INDIA · PASSPORT</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <div style={{ width: 28, height: 36, background: 'rgba(255,255,255,.15)', borderRadius: 3 }}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[55, 70, 40].map((w, i) => <div key={i} style={{ width: `${w}%`, height: 2, background: 'rgba(255,255,255,.4)', borderRadius: 1 }}/>)}
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 24, font: '500 11px/1.4 Inter', color: 'rgba(255,255,255,.6)', textAlign: 'center' }}>Auto-capturing in 2s…</div>
      </div>
      {/* tips strip */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', position: 'relative', zIndex: 2, justifyContent: 'center', flexShrink: 0 }}>
        {[['light_mode', 'Good light'], ['fit_screen', 'Fits frame'], ['blur_off', 'No blur']].map(([i, l], k) => (
          <div key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(16,185,129,.18)', borderRadius: 999, font: '500 10px/1 Inter', color: '#86EFAC' }}>
            <span className="mi" style={{ fontSize: 13 }}>{i}</span> {l}
          </div>
        ))}
      </div>
      {/* shutter row */}
      <div style={{ padding: '0 32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <button style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.1)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 22, color: '#fff' }}>photo_library</span>
        </button>
        <div style={{ width: 76, height: 76, borderRadius: '50%', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff' }}/>
        </div>
        <button style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.1)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 22, color: '#fff' }}>flip_camera_android</span>
        </button>
      </div>
    </PhoneBody>
  );
}

// ─── Push notification preview (Android system lockscreen) ─────────────────
function MPush() {
  return (
    <PhoneBody bg="#0F172A">
      {/* lockscreen bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0F172A,#1E293B,#0EA5E9 200%)' }}/>
      <div style={{ position: 'relative', zIndex: 2, color: '#fff', flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 16px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '300 64px/1 Inter', color: '#fff', letterSpacing: '-0.04em' }}>9:41</div>
          <div style={{ font: '500 14px/1 Inter', color: 'rgba(255,255,255,.6)', marginTop: 6 }}>Mon, Mar 4</div>
        </div>
        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* main push */}
          <div style={{ padding: 14, background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'linear-gradient(135deg,#1A56DB,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 9px/1 Plus Jakarta Sans', color: '#fff' }}>IQ</div>
              <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.7)' }}>VisaIQ</span>
              <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.5)' }}>· now</span>
            </div>
            <div style={{ font: '600 14px/1.3 Inter' }}>Passport audit complete — scored 87</div>
            <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Excellent — ready to submit. Tap to view 3 findings and your full report.</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.08)' }}>
              <button style={{ flex: 1, padding: '8px 0', background: 'transparent', color: '#7DD3FC', border: 0, font: '600 12px/1 Inter' }}>View report</button>
              <button style={{ flex: 1, padding: '8px 0', background: 'transparent', color: 'rgba(255,255,255,.6)', border: 0, font: '500 12px/1 Inter' }}>Dismiss</button>
            </div>
          </div>
          {/* secondary push */}
          <div style={{ padding: 12, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(20px)', borderRadius: 14, border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: '#7C3AED' }}/>
              <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.7)' }}>VisaIQ Pro</span>
              <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.5)' }}>· 12m ago</span>
            </div>
            <div style={{ font: '600 13px/1.3 Inter' }}>Priya is online — your assigned consultant</div>
            <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Free first 5 min for Pro members. Tap to start chat.</div>
          </div>
          {/* grouped */}
          <div style={{ padding: 12, background: 'rgba(15,23,42,.4)', backdropFilter: 'blur(20px)', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg,#1A56DB,#0EA5E9)' }}/>
              <span style={{ flex: 1, font: '500 11px/1 Inter', color: 'rgba(255,255,255,.7)' }}>VisaIQ · 3 more notifications</span>
              <span className="mi" style={{ fontSize: 16, color: 'rgba(255,255,255,.6)' }}>expand_more</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ paddingBottom: 24, display: 'flex', justifyContent: 'space-between', padding: '0 12px 24px' }}>
          <button style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mi" style={{ fontSize: 22, color: '#fff' }}>flashlight_on</span>
          </button>
          <button style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mi" style={{ fontSize: 22, color: '#fff' }}>photo_camera</span>
          </button>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── Payment / Checkout ────────────────────────────────────────────────────
function MCheckout() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Checkout" leading="arrow_back" trailing={[{ icon: 'shield' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Order summary */}
        <Card padding={16} elevation={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 28 }}>workspace_premium</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>VIP Expert · 60-min deep dive</div>
              <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Priya Raghavan · Today 3:30 PM IST</div>
            </div>
          </div>
          <div style={{ height: 1, background: '#F1F5F9', margin: '14px 0' }}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Session fee', '$89.00'],
              ['Audit pre-share', 'Free'],
              ['Platform fee · 5%', '$4.45'],
              ['Promo · FIRST20', '−$10.00'],
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: '500 13px/1 Inter', color: i === 3 ? '#10B981' : '#475569' }}>
                <span>{r[0]}</span><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{r[1]}</span>
              </div>
            ))}
            <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: '700 14px/1 Inter', color: '#0F172A' }}>Total · USD</span>
              <span style={{ font: '800 22px/1 Plus Jakarta Sans', color: '#0F172A' }}>$83.45</span>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 16, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Pay with</div>
        {/* Payment methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* selected card */}
          <Card padding={14} elevation={1} style={{ border: '2px solid #1A56DB', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 28, borderRadius: 4, background: 'linear-gradient(135deg,#1A56DB,#0F172A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 9px/1 Plus Jakarta Sans' }}>VISA</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>•••• 4242</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Expires 09/27 · Sarah M.</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '6px solid #1A56DB', background: '#fff' }}/>
          </Card>
          <Card padding={14} elevation={1} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mi" style={{ fontSize: 28, color: '#1A56DB' }}>account_balance_wallet</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>UPI</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Pay via any UPI app</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #CBD5E1' }}/>
          </Card>
          <Card padding={14} elevation={1} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mi" style={{ fontSize: 28, color: '#0F172A' }}>add_circle</span>
            <div style={{ flex: 1, font: '500 13px/1.3 Inter', color: '#475569' }}>Add new payment method</div>
            <span className="mi" style={{ fontSize: 20, color: '#94A3B8' }}>chevron_right</span>
          </Card>
        </div>

        {/* Trust */}
        <Card padding={14} elevation={1} style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <span className="mi" style={{ fontSize: 22, color: '#059669', flexShrink: 0 }}>lock</span>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12px/1.3 Inter', color: '#047857' }}>100% money-back guarantee</div>
            <div style={{ font: '400 11px/1.5 Inter', color: '#166534', marginTop: 2 }}>If your consultant doesn't show up or the call ends in under 5 minutes, we refund you automatically. Powered by Stripe · PCI-DSS Level 1.</div>
          </div>
        </Card>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9' }}>
        <Btn variant="primary" full size="lg" icon="lock">Pay $83.45 securely</Btn>
        <div style={{ textAlign: 'center', font: '400 10px/1.4 Inter', color: '#94A3B8', marginTop: 8 }}>By paying, you agree to our Refund Policy & Terms of Service.</div>
      </div>
    </PhoneBody>
  );
}

// ─── Dark Mode Dashboard ────────────────────────────────────────────────────
function MDashboardDark() {
  return (
    <PhoneBody bg="#0F172A">
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, color: '#fff' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 14px/1 Inter' }}>SM</div>
        <div style={{ flex: 1 }}>
          <Logo size={16} onDark/>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.08)', position: 'relative' }}>
          <span className="mi" style={{ fontSize: 22, color: '#fff' }}>notifications_outlined</span>
          <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '2px solid #0F172A' }}/>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 0', color: '#fff' }}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ font: '500 13px/1.3 Inter', color: 'rgba(255,255,255,.5)' }}>Good evening</div>
          <div style={{ font: '800 26px/1.2 Plus Jakarta Sans', letterSpacing: '-0.02em' }}>Sarah ✨</div>
        </div>
        <div style={{ margin: '14px 16px 0', padding: 18, borderRadius: 20, background: 'linear-gradient(135deg, #1E293B 0%, #1A56DB 100%)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0EA5E9', fontWeight: 600 }}>
            <span className="mi" style={{ fontSize: 14 }}>flight_takeoff</span>
            <span>NEXT TRIP · 12 DAYS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              <div style={{ font: '800 22px/1.2 Plus Jakarta Sans' }}>{flag('FR')} France Schengen</div>
              <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Tourist · 15 Mar – 24 Mar</div>
            </div>
            <ScoreRing value={87} size={64} stroke={6}/>
          </div>
        </div>
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ font: '600 11px/1 Inter', color: 'rgba(255,255,255,.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { i: 'upload_file', l: 'Upload', c: '#0EA5E9' },
              { i: 'auto_awesome', l: 'Ask AI', c: '#A78BFA' },
              { i: 'travel_explore', l: 'Requirements', c: '#34D399' },
              { i: 'workspace_premium', l: 'VIP Expert', c: '#FBBF24' },
            ].map(a => (
              <div key={a.l} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${a.c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 22, color: a.c }}>{a.i}</span>
                </div>
                <div style={{ font: '600 13px/1.3 Inter', color: '#fff' }}>{a.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 72, background: '#1E293B', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', paddingTop: 6, paddingBottom: 8, flexShrink: 0 }}>
        {[
          { l: 'Home', i: 'home', on: true },
          { l: 'Apps', i: 'folder_open' },
          { l: 'Docs', i: 'description' },
          { l: 'Chat', i: 'chat_bubble_outline', badge: 2 },
          { l: 'Profile', i: 'person_outline' },
        ].map((n, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ height: 28, minWidth: 56, borderRadius: 14, background: n.on ? 'rgba(14,165,233,.18)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span className="mi" style={{ fontSize: 22, color: n.on ? '#7DD3FC' : 'rgba(255,255,255,.4)' }}>{n.i}</span>
              {n.badge && <span style={{ position: 'absolute', top: -2, right: 6, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 7, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.badge}</span>}
            </div>
            <div style={{ font: `${n.on ? 600 : 500} 10px/1 Inter`, color: n.on ? '#7DD3FC' : 'rgba(255,255,255,.4)' }}>{n.l}</div>
          </div>
        ))}
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MNewAppWizard, MNotifications, MSearch, MEmptyApps, MOffline, MCamera, MPush, MCheckout, MDashboardDark });
