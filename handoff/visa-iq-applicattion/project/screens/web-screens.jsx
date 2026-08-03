/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, flag */
// Web screens — Consumer, Pro, B2B, Admin

// ─── Shared web shell ─────────────────────────────────────────────────────────
function WebShell({ role = 'consumer', active = 'home', children, search = true }) {
  const navs = {
    consumer: [
      { id: 'home', i: 'home', l: 'Home' },
      { id: 'apps', i: 'folder_open', l: 'Applications', badge: '3' },
      { id: 'docs', i: 'description', l: 'Documents' },
      { id: 'req',  i: 'travel_explore', l: 'Requirements' },
      { id: 'chat', i: 'chat_bubble_outline', l: 'AI Assistant', badge: '2' },
      { id: 'vip',  i: 'workspace_premium', l: 'VIP Expert' },
    ],
    b2b: [
      { id: 'home', i: 'dashboard', l: 'Dashboard' },
      { id: 'team', i: 'group', l: 'Team', badge: '23' },
      { id: 'apps', i: 'assignment', l: 'Applications' },
      { id: 'bulk', i: 'upload_file', l: 'Bulk upload' },
      { id: 'reports', i: 'bar_chart', l: 'Reports' },
      { id: 'billing', i: 'payments', l: 'Billing' },
    ],
    admin: [
      { id: 'home', i: 'dashboard', l: 'Overview' },
      { id: 'users', i: 'group', l: 'Users' },
      { id: 'apps', i: 'assignment', l: 'Applications' },
      { id: 'ai', i: 'psychology', l: 'AI Monitoring', badge: '4' },
      { id: 'req', i: 'library_books', l: 'Requirements DB' },
      { id: 'rev', i: 'payments', l: 'Revenue' },
      { id: 'settings', i: 'admin_panel_settings', l: 'Settings' },
      { id: 'logs', i: 'receipt_long', l: 'Audit log' },
    ],
  };
  const nav = navs[role] || navs.consumer;
  const userInfo = { consumer: { n: 'Sarah Mitchell', r: 'Free plan', i: 'SM', c: '#1A56DB' },
                     b2b:      { n: 'Anita Verma', r: 'Acme Corp · HR', i: 'AV', c: '#7C3AED' },
                     admin:    { n: 'Platform Admin', r: 'Super Admin', i: 'PA', c: '#0F172A' } }[role];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 248, background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ height: 64, padding: '0 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <Logo size={20}/>
          {role === 'admin' && <span style={{ marginLeft: 8, padding: '2px 7px', background: '#0F172A', color: '#fff', font: '700 9px/1 Inter', borderRadius: 4, letterSpacing: 0.4 }}>ADMIN</span>}
          {role === 'b2b' && <span style={{ marginLeft: 8, padding: '2px 7px', background: '#7C3AED', color: '#fff', font: '700 9px/1 Inter', borderRadius: 4, letterSpacing: 0.4 }}>B2B</span>}
        </div>
        <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
          <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', padding: '6px 12px 8px' }}>{role === 'admin' ? 'Platform' : 'Main'}</div>
          {nav.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
              borderRadius: 8, background: n.id === active ? '#EFF6FF' : 'transparent',
              borderLeft: n.id === active ? '3px solid #1A56DB' : '3px solid transparent',
              marginLeft: n.id === active ? -3 : -3, paddingLeft: n.id === active ? 12 : 12 }}>
              <span className="mi" style={{ fontSize: 19, color: n.id === active ? '#1A56DB' : '#64748B' }}>{n.i}</span>
              <span style={{ flex: 1, font: `${n.id === active ? 600 : 500} 13px/1 Inter`, color: n.id === active ? '#1547C0' : '#475569' }}>{n.l}</span>
              {n.badge && <Chip tone={n.id === active ? 'royal' : 'neutral'} size="sm">{n.badge}</Chip>}
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: userInfo.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px/1 Inter' }}>{userInfo.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 12px/1.2 Inter', color: '#0F172A' }}>{userInfo.n}</div>
              <div style={{ font: '400 11px/1.2 Inter', color: '#64748B' }}>{userInfo.r}</div>
            </div>
            <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>more_vert</span>
          </div>
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: 64, background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          {search && (
            <div style={{ flex: 1, maxWidth: 520, height: 38, background: '#F1F5F9', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
              <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
              <span style={{ flex: 1, font: '400 13px/1 Inter', color: '#94A3B8' }}>Search applications, documents, requirements…</span>
              <span style={{ font: '500 11px/1 JetBrains Mono', color: '#94A3B8', padding: '2px 6px', borderRadius: 4, background: '#fff', border: '1px solid #E2E8F0' }}>⌘K</span>
            </div>
          )}
          <div style={{ flex: 1 }}/>
          <button style={{ width: 38, height: 38, borderRadius: 10, border: 0, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: 20, color: '#475569' }}>help_outline</span>
          </button>
          <button style={{ width: 38, height: 38, borderRadius: 10, border: 0, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <span className="mi" style={{ fontSize: 20, color: '#475569' }}>notifications_outlined</span>
            <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '2px solid #F1F5F9' }}/>
          </button>
          <div style={{ height: 38, padding: '0 4px 0 4px', borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: userInfo.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px/1 Inter' }}>{userInfo.i}</div>
            <span className="mi" style={{ fontSize: 18, color: '#64748B' }}>expand_more</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSUMER WEB
// ═══════════════════════════════════════════════════════════════════════════

function WConsumerDashboard() {
  const Stat = ({ i, ic, l, v, sub, c }) => (
    <Card padding={18} elevation={1}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 20, color: c }}>{ic}</span>
        </div>
        <div style={{ font: '500 12px/1.2 Inter', color: '#64748B' }}>{l}</div>
      </div>
      <div style={{ font: '800 28px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 14 }}>{v}</div>
      <div style={{ font: '500 11px/1.4 Inter', color: '#94A3B8', marginTop: 4 }}>{sub}</div>
    </Card>
  );
  return (
    <WebShell role="consumer" active="home">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '500 13px/1 Inter', color: '#64748B' }}>Good morning</div>
            <div style={{ font: '800 32px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em', marginTop: 4 }}>Welcome back, Sarah</div>
          </div>
          <Btn variant="primary" icon="add">New application</Btn>
        </div>

        {/* Hero — France readiness */}
        <Card padding={24} elevation={2} style={{ background: 'linear-gradient(135deg, #0B1F4B 0%, #1A56DB 100%)', color: '#fff', border: 'none', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,.25), transparent 70%)' }}/>
          <div style={{ position: 'absolute', right: 80, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.2), transparent 70%)' }}/>
          <div style={{ display: 'flex', gap: 28, position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <Chip tone="info" size="sm" icon="flight_takeoff" style={{ background: 'rgba(14,165,233,.2)', color: '#7DD3FC' }}>Next trip · 12 days</Chip>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                <span style={{ fontSize: 40 }}>{flag('FR')}</span>
                <div>
                  <div style={{ font: '800 26px/1.2 Plus Jakarta Sans' }}>France Schengen</div>
                  <div style={{ font: '400 13px/1.4 Inter', color: 'rgba(255,255,255,.7)' }}>Tourist · 15 Mar – 24 Mar · REF-2026-FR-018472-Q</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 26 }}>
                {[
                  { l: 'Documents', v: '4 / 6', c: '#0EA5E9' },
                  { l: 'Audit issues', v: '2', c: '#F59E0B' },
                  { l: 'Requirements', v: 'Updated 2h ago', c: '#10B981' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.6)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.l}</div>
                    <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', marginTop: 6, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <Btn variant="gold" icon="checklist">Complete checklist</Btn>
                <Btn variant="outlined" trailing="arrow_forward" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'transparent' }}>Open application</Btn>
              </div>
            </div>
            <div style={{ flexShrink: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <ScoreRing value={87} size={140} stroke={12}/>
              <div style={{ font: '600 12px/1 Inter', color: 'rgba(255,255,255,.7)' }}>Readiness score</div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 24 }}>
          <Stat ic="folder_open" l="Active applications" v="3" sub="2 in progress · 1 ready" c="#1A56DB"/>
          <Stat ic="description" l="Documents uploaded" v="12" sub="of 18 needed" c="#10B981"/>
          <Stat ic="auto_awesome" l="AI audits run" v="8" sub="avg score · 84" c="#7C3AED"/>
          <Stat ic="chat_bubble_outline" l="AI chat" v="32" sub="messages this week" c="#0EA5E9"/>
        </div>

        {/* Applications list */}
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <Card padding={0} elevation={1}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>My applications</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Chip tone="info" size="sm">All</Chip>
                <Chip tone="neutral" size="sm">Active</Chip>
                <Chip tone="neutral" size="sm">Submitted</Chip>
              </div>
            </div>
            {[
              { c: 'FR', n: 'France · Schengen Tourist', d: '15 Mar – 24 Mar', sc: 87, st: 'In progress', tone: 'info' },
              { c: 'JP', n: 'Japan · Tourist', d: '08 May – 22 May', sc: 64, st: 'Attention', tone: 'warning' },
              { c: 'AU', n: 'Australia · ETA', d: '12 Oct – 30 Oct', sc: 100, st: 'Approved', tone: 'success' },
            ].map((a, i, arr) => (
              <div key={i} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <span style={{ fontSize: 24 }}>{flag(a.c)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 14px/1.3 Inter', color: '#0F172A' }}>{a.n}</div>
                  <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{a.d}</div>
                </div>
                <ScoreRing value={a.sc} size={44} stroke={5}/>
                <Chip tone={a.tone} size="sm">{a.st}</Chip>
                <span className="mi" style={{ fontSize: 20, color: '#CBD5E1' }}>chevron_right</span>
              </div>
            ))}
          </Card>
          <Card padding={20} elevation={3} style={{ background: 'linear-gradient(135deg,#0B1F4B,#7C3AED 60%,#F59E0B)', color: '#fff', border: '1.5px solid #F59E0B' }}>
            <Chip tone="gold" size="sm" icon="workspace_premium">VIP</Chip>
            <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', marginTop: 12 }}>Talk to a visa expert</div>
            <div style={{ font: '400 12px/1.5 Inter', color: 'rgba(255,255,255,.8)', marginTop: 8 }}>30-min 1:1 with a certified consultant. Audit + docs pre-shared.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <span className="mi" style={{ fontSize: 18, color: '#F59E0B' }}>schedule</span>
              <div style={{ font: '500 12px/1 Inter' }}>Next slot: Today 3:30 PM</div>
            </div>
            <Btn variant="gold" full style={{ marginTop: 16 }}>Book a session</Btn>
          </Card>
        </div>
      </div>
    </WebShell>
  );
}

function WAppDetail() {
  return (
    <WebShell role="consumer" active="apps">
      {/* breadcrumb */}
      <div style={{ padding: '16px 32px 0', display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 Inter', color: '#64748B' }}>
        <span>Applications</span><span className="mi" style={{ fontSize: 14 }}>chevron_right</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{flag('FR')} France — Schengen Tourist</span>
      </div>
      <div style={{ padding: '16px 32px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          {/* Status banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#EFF6FF', borderRadius: 12, border: '1px solid #DBEAFE' }}>
            <span className="mi" style={{ fontSize: 28, color: '#1A56DB' }}>hourglass_top</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 14px/1.3 Inter', color: '#0F172A' }}>In progress · 87% ready</div>
              <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Last activity 12 min ago · Submission deadline March 5 (8 days)</div>
            </div>
            <Btn variant="primary" trailing="arrow_forward">Submit when ready</Btn>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '1px solid #E2E8F0' }}>
            {['Overview', 'Documents', 'Requirements', 'Audit history', 'Chat'].map((t, i) => {
              const on = i === 1;
              return <div key={t} style={{ padding: '14px 18px', font: `${on ? 700 : 500} 13px/1 Inter`, color: on ? '#1A56DB' : '#64748B', borderBottom: on ? '3px solid #1A56DB' : '3px solid transparent', marginBottom: -1, cursor: 'pointer' }}>{t}{i === 1 && <span style={{ marginLeft: 6, padding: '1px 6px', background: '#EFF6FF', color: '#1A56DB', borderRadius: 10, font: '700 10px/1 Inter' }}>6</span>}</div>;
            })}
          </div>

          {/* Document grid */}
          <div style={{ marginTop: 20, display: 'flex', gap: 8, marginBottom: 16 }}>
            <Chip tone="info" size="sm">All · 6</Chip>
            <Chip tone="success" size="sm">Passed · 3</Chip>
            <Chip tone="ai" size="sm">Auditing · 1</Chip>
            <Chip tone="error" size="sm">Issues · 1</Chip>
            <Chip tone="neutral" size="sm">Missing · 1</Chip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { i: 'badge', c: '#1A56DB', n: 'Passport.pdf', s: 'Audit complete', sc: 87, st: 'success', stL: 'Passed' },
              { i: 'account_balance', c: '#10B981', n: 'Bank Statement Dec.pdf', s: 'Audit complete', sc: 92, st: 'success', stL: 'Passed' },
              { i: 'work', c: '#F59E0B', n: 'Employment Letter.pdf', s: 'Auditing…', st: 'ai', stL: 'Auditing' },
              { i: 'hotel', c: '#EF4444', n: 'Hotel Booking.pdf', s: '2 issues found', sc: 48, st: 'error', stL: '2 issues' },
              { i: 'local_hospital', c: '#7C3AED', n: 'Travel Insurance.pdf', s: 'Audit complete', sc: 95, st: 'success', stL: 'Passed' },
              { i: 'add', c: '#94A3B8', n: 'Flight itinerary', s: 'Not uploaded yet', st: 'empty' },
            ].map((d, i) => (
              d.st === 'empty' ? (
                <div key={i} style={{ background: '#fff', borderRadius: 14, border: '2px dashed #CBD5E1', padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200 }}>
                  <span className="mi" style={{ fontSize: 36, color: '#94A3B8' }}>upload_file</span>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#475569', textAlign: 'center' }}>Flight itinerary</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8' }}>Required</div>
                  <Btn variant="tonal" size="sm" icon="add">Upload</Btn>
                </div>
              ) : (
                <Card key={i} padding={16} elevation={2}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 52, borderRadius: 8, background: `${d.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="mi" style={{ fontSize: 24, color: d.c }}>{d.i}</span>
                    </div>
                    <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>more_horiz</span>
                  </div>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A', marginTop: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.n}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 4 }}>{d.s}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                    {d.sc != null ? <ScoreRing value={d.sc} size={36} stroke={4}/> : <div style={{ width: 36, height: 36 }}/>}
                    <Chip tone={d.st} size="sm">{d.stL}</Chip>
                  </div>
                </Card>
              )
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={20} elevation={2}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ font: '500 11px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>Readiness</div>
                <div style={{ font: '800 32px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 8 }}>87 / 100</div>
              </div>
              <ScoreRing value={87} size={72} stroke={7}/>
            </div>
            <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: 'Documents', v: '4 / 6', p: 67, c: '#1A56DB' },
                { l: 'Audit pass rate', v: '3 of 4', p: 75, c: '#10B981' },
                { l: 'Requirements coverage', v: '100%', p: 100, c: '#10B981' },
              ].map(b => (
                <div key={b.l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ font: '500 12px/1 Inter', color: '#64748B' }}>{b.l}</span>
                    <span style={{ font: '700 12px/1 Inter', color: '#0F172A' }}>{b.v}</span>
                  </div>
                  <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${b.p}%`, height: '100%', background: b.c }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card padding={18} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AIBadge small/>
              <div style={{ font: '600 12px/1 Inter', color: '#0F172A' }}>AI suggestions</div>
            </div>
            <div style={{ font: '400 12px/1.5 Inter', color: '#475569', marginTop: 10 }}>Fix the Hotel Booking issues first — it's the only blocker preventing a 95+ readiness score.</div>
            <Btn variant="text" trailing="arrow_forward" size="sm" style={{ marginTop: 8, padding: 0 }}>See all 3 suggestions</Btn>
          </Card>
          <Card padding={18} elevation={1}>
            <div style={{ font: '600 12px/1 Inter', color: '#0F172A', marginBottom: 12 }}>Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { d: 'Today', t: 'Documents uploaded', c: '#10B981' },
                { d: 'Mar 05', t: 'Submission deadline', c: '#1A56DB' },
                { d: 'Mar 18', t: 'Expected decision', c: '#94A3B8' },
                { d: 'Mar 15', t: 'Departure ✈️', c: '#94A3B8' },
              ].map((t, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.c, marginTop: 4 }}/>
                    {i < arr.length-1 && <div style={{ width: 2, flex: 1, background: '#E2E8F0', marginTop: 2 }}/>}
                  </div>
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{t.d}</div>
                    <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A', marginTop: 2 }}>{t.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </WebShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B2B HR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function WB2BDashboard() {
  return (
    <WebShell role="b2b" active="home">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Chip tone="ai" size="sm" icon="business">Acme Corp · 84 employees</Chip>
            </div>
            <div style={{ font: '800 32px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 10, letterSpacing: '-0.02em' }}>Team visa overview</div>
            <div style={{ font: '400 14px/1.5 Inter', color: '#64748B', marginTop: 4 }}>23 active applications · 8 ready to submit · 5 need attention</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="download">Export</Btn>
            <Btn variant="primary" icon="upload_file">Bulk upload</Btn>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { l: 'Total active', v: '23', d: '+4 this week', c: '#1A56DB', i: 'folder_open' },
            { l: 'Ready to submit', v: '8', d: '+2 this week', c: '#10B981', i: 'task_alt' },
            { l: 'Need action', v: '5', d: '−1 since Monday', c: '#F97316', i: 'warning_amber' },
            { l: 'Avg. audit score', v: '82', d: '+3.1 vs last month', c: '#7C3AED', i: 'auto_awesome' },
          ].map((k, i) => (
            <Card key={i} padding={20} elevation={1}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 22, color: k.c }}>{k.i}</span>
                </div>
                <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>more_horiz</span>
              </div>
              <div style={{ font: '800 32px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 16 }}>{k.v}</div>
              <div style={{ font: '500 12px/1.4 Inter', color: '#64748B', marginTop: 4 }}>{k.l}</div>
              <div style={{ font: '600 11px/1 Inter', color: k.c, marginTop: 6 }}>{k.d}</div>
            </Card>
          ))}
        </div>

        {/* Team table */}
        <Card padding={0} elevation={1} style={{ marginTop: 24 }}>
          <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
            <div>
              <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>Active applications</div>
              <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Sort and filter to drill down · click a row for details</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Chip tone="info" size="sm" icon="filter_list">3 filters</Chip>
              <Btn variant="text" size="sm" icon="settings">Columns</Btn>
            </div>
          </div>
          {/* Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 0.7fr 1.2fr 0.8fr 0.7fr 1fr 32px', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', font: '600 11px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase', gap: 10 }}>
            <input type="checkbox" style={{ accentColor: '#1A56DB' }} readOnly/>
            <span>Employee</span><span>Country</span><span>Visa type</span><span>Status</span><span>Score</span><span>Deadline</span><span/>
          </div>
          {[
            { sel: true, n: 'David Chen', r: 'Engineering · L4', cc: 'US', t: 'B1 Business', st: 'success', stL: 'Ready', sc: 92, dt: 'Mar 12 · 3d', urg: true },
            { sel: false, n: 'Maria Santos', r: 'Sales', cc: 'DE', t: 'Schengen Tourist', st: 'warning', stL: 'Attention', sc: 74, dt: 'Mar 14 · 5d' },
            { sel: false, n: 'Rahul Singh', r: 'Product', cc: 'GB', t: 'UK Visitor', st: 'warning', stL: 'Attention', sc: 58, dt: 'Mar 17 · 8d' },
            { sel: false, n: 'Lin Wei', r: 'Design', cc: 'CA', t: 'TRV', st: 'info', stL: 'In progress', sc: 88, dt: 'Apr 02 · 24d' },
            { sel: false, n: 'Amir Hossein', r: 'Data', cc: 'AE', t: 'UAE Tourist', st: 'success', stL: 'Approved', sc: 100, dt: '—' },
            { sel: false, n: 'Sofia Kim', r: 'Operations', cc: 'JP', t: 'Japan Tourist', st: 'ai', stL: 'Auditing', sc: null, dt: 'Apr 18 · 40d' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 0.7fr 1.2fr 0.8fr 0.7fr 1fr 32px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', background: r.sel ? '#EFF6FF' : '#fff', gap: 10 }}>
              <input type="checkbox" checked={r.sel} readOnly style={{ accentColor: '#1A56DB' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#1A56DB','#10B981','#F97316','#7C3AED','#0EA5E9','#EC4899'][i%6], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px/1 Inter', flexShrink: 0 }}>{r.n.split(' ').map(s=>s[0]).join('')}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{r.n}</div>
                  <div style={{ font: '400 11px/1.2 Inter', color: '#64748B', marginTop: 2 }}>{r.r}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 18 }}>{flag(r.cc)}</span><span style={{ font: '500 12px/1 Inter', color: '#475569' }}>{r.cc}</span></div>
              <span style={{ font: '500 12px/1.3 Inter', color: '#0F172A' }}>{r.t}</span>
              <Chip tone={r.st} size="sm">{r.stL}</Chip>
              {r.sc != null ? <span style={{ font: '700 14px/1 Plus Jakarta Sans', color: r.sc >= 90 ? '#10B981' : r.sc >= 75 ? '#EAB308' : '#F97316' }}>{r.sc}</span> : <span style={{ font: '500 12px/1 Inter', color: '#94A3B8' }}>—</span>}
              <span style={{ font: '500 12px/1 Inter', color: r.urg ? '#DC2626' : '#475569' }}>{r.dt}</span>
              <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>more_vert</span>
            </div>
          ))}
        </Card>

        {/* Two-up charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Applications by month</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, marginTop: 18, padding: '0 4px' }}>
              {[
                { m: 'Sep', v: 8, c: '#DBEAFE' },{ m: 'Oct', v: 14, c: '#93C5FD' },
                { m: 'Nov', v: 11, c: '#93C5FD' },{ m: 'Dec', v: 18, c: '#1A56DB' },
                { m: 'Jan', v: 22, c: '#1A56DB' },{ m: 'Feb', v: 23, c: '#1A56DB' },
              ].map(b => (
                <div key={b.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', height: b.v * 6, background: b.c, borderRadius: '6px 6px 0 0' }}/>
                  <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>{b.m}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Top destinations</div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { cc: 'US', l: 'United States', v: 8, p: 80 },
                { cc: 'DE', l: 'Germany (Schengen)', v: 6, p: 60 },
                { cc: 'GB', l: 'United Kingdom', v: 4, p: 40 },
                { cc: 'JP', l: 'Japan', v: 3, p: 30 },
                { cc: 'AE', l: 'UAE', v: 2, p: 20 },
              ].map(r => (
                <div key={r.cc} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{flag(r.cc)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 12px/1 Inter', color: '#475569' }}><span>{r.l}</span><span style={{ color: '#0F172A', fontWeight: 700 }}>{r.v}</span></div>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 6 }}>
                      <div style={{ width: `${r.p}%`, height: '100%', background: '#1A56DB', borderRadius: 3 }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </WebShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════════════════
function WAdminDashboard() {
  return (
    <WebShell role="admin" active="home">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Platform overview</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Real-time metrics · last refreshed 1 min ago</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Chip tone="success" size="md" icon="check_circle">All systems operational</Chip>
            <Btn variant="outlined" icon="download">Export</Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {[
            { l: 'Total users', v: '24,318', d: '+412 today', c: '#1A56DB' },
            { l: 'DAU', v: '4,852', d: '+8.4%', c: '#10B981' },
            { l: 'Applications today', v: '186', d: '+12 vs avg', c: '#7C3AED' },
            { l: 'AI audits / hr', v: '342', d: '94% pass', c: '#0EA5E9' },
            { l: 'Revenue today', v: '$8.4k', d: '+22%', c: '#F59E0B' },
          ].map((k, i) => (
            <Card key={i} padding={18} elevation={1}>
              <div style={{ font: '500 11px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.l}</div>
              <div style={{ font: '800 26px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 10 }}>{k.v}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <span className="mi" style={{ fontSize: 14, color: k.c }}>trending_up</span>
                <span style={{ font: '600 11px/1 Inter', color: k.c }}>{k.d}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 20 }}>
          <Card padding={20} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>User growth · last 30 days</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 4 }}>Consumer + B2B signups, plotted daily</div>
              </div>
              <div style={{ display: 'flex', gap: 14, font: '500 11px/1 Inter' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#1A56DB', borderRadius: 2 }}/>Consumer</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#7C3AED', borderRadius: 2 }}/>B2B</span>
              </div>
            </div>
            {/* Mini line chart */}
            <svg width="100%" height="180" viewBox="0 0 600 180" style={{ marginTop: 16 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A56DB" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#1A56DB" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* grid */}
              {[0,1,2,3].map(i => <line key={i} x1="0" x2="600" y1={20 + i*45} y2={20 + i*45} stroke="#F1F5F9"/>)}
              <path d="M 0 140 L 30 125 L 60 130 L 90 110 L 120 115 L 150 95 L 180 100 L 210 80 L 240 90 L 270 70 L 300 75 L 330 55 L 360 60 L 390 50 L 420 45 L 450 35 L 480 40 L 510 30 L 540 32 L 570 28 L 600 22 L 600 180 L 0 180 Z" fill="url(#g1)"/>
              <path d="M 0 140 L 30 125 L 60 130 L 90 110 L 120 115 L 150 95 L 180 100 L 210 80 L 240 90 L 270 70 L 300 75 L 330 55 L 360 60 L 390 50 L 420 45 L 450 35 L 480 40 L 510 30 L 540 32 L 570 28 L 600 22" stroke="#1A56DB" strokeWidth="2.5" fill="none"/>
              <path d="M 0 160 L 30 155 L 60 158 L 90 145 L 120 148 L 150 140 L 180 138 L 210 130 L 240 132 L 270 120 L 300 118 L 330 110 L 360 112 L 390 105 L 420 100 L 450 95 L 480 90 L 510 88 L 540 82 L 570 78 L 600 72" stroke="#7C3AED" strokeWidth="2.5" fill="none" strokeDasharray="4 4"/>
            </svg>
          </Card>
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>AI performance</div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { l: 'Audit accuracy', v: 94, c: '#10B981' },
                { l: 'Requirements freshness', v: 87, c: '#1A56DB' },
                { l: 'Chat completion', v: 96, c: '#7C3AED' },
                { l: 'Low-confidence flag rate', v: 4, c: '#F97316', invert: true },
              ].map(b => (
                <div key={b.l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 12px/1 Inter', color: '#64748B' }}><span>{b.l}</span><span style={{ color: '#0F172A', fontWeight: 700 }}>{b.v}%</span></div>
                  <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${b.v}%`, height: '100%', background: b.c, borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Flagged items */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 20 }}>
          <Card padding={0} elevation={1}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Flagged for review</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Low-confidence audits, reported messages, failed payments</div>
              </div>
              <Btn variant="text" size="sm" trailing="arrow_forward">View all</Btn>
            </div>
            {[
              { i: 'auto_awesome', c: '#7C3AED', t: 'Audit confidence 41% · Bank Statement', s: 'User u_3kfd · Document b_71d2', a: 'Review' },
              { i: 'flag', c: '#EF4444', t: 'Reported chat message · user appeal', s: 'User u_9a4f · Topic: visa rejection', a: 'Open' },
              { i: 'payments', c: '#F59E0B', t: 'Payment declined · VIP booking', s: 'User u_2bcc · $89 · Stripe error', a: 'Retry' },
              { i: 'help', c: '#0EA5E9', t: 'Requirements cache stale · 24h+', s: 'India → Germany Schengen', a: 'Refresh' },
            ].map((f, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${f.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: f.c }}>{f.i}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{f.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2, fontFamily: 'JetBrains Mono' }}>{f.s}</div>
                </div>
                <Btn variant="tonal" size="sm">{f.a}</Btn>
              </div>
            ))}
          </Card>
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>System health</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: 'API · P50 latency', v: '142 ms', s: 'success' },
                { l: 'API · P95 latency', v: '480 ms', s: 'success' },
                { l: 'Error rate (24h)', v: '0.21%', s: 'success' },
                { l: 'Audit queue depth', v: '12 jobs', s: 'success' },
                { l: 'Firestore writes / hr', v: '8,420', s: 'success' },
                { l: 'Storage used', v: '64% of 2 TB', s: 'warning' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.s === 'success' ? '#10B981' : '#F97316' }}/>
                  <div style={{ flex: 1, font: '500 12px/1 Inter', color: '#475569' }}>{r.l}</div>
                  <div style={{ font: '700 12px/1 JetBrains Mono', color: '#0F172A' }}>{r.v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </WebShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN: AI Monitoring
// ═══════════════════════════════════════════════════════════════════════════
function WAdminAI() {
  return (
    <WebShell role="admin" active="ai">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <Chip tone="ai" size="sm" icon="psychology">AI Monitoring</Chip>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 10, letterSpacing: '-0.02em' }}>Recent audits</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Manual override available for low-confidence runs.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="filter_list">Filter</Btn>
            <Btn variant="primary" icon="refresh">Refresh</Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { l: 'Audits / day', v: '2,184', d: '+14%', c: '#1A56DB' },
            { l: 'Avg processing', v: '4.8 s', d: '−0.3s', c: '#10B981' },
            { l: 'Low-confidence rate', v: '4.2%', d: '−0.8%', c: '#10B981' },
            { l: 'Manual overrides', v: '12', d: 'today', c: '#F97316' },
          ].map((k, i) => (
            <Card key={i} padding={16} elevation={1}>
              <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>{k.l}</div>
              <div style={{ font: '800 22px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 8 }}>{k.v}</div>
              <div style={{ font: '600 11px/1 Inter', color: k.c, marginTop: 4 }}>{k.d}</div>
            </Card>
          ))}
        </div>

        {/* Audit feed */}
        <Card padding={0} elevation={1}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1.4fr 1fr 0.8fr 0.7fr 0.9fr 100px', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F1F5F9', font: '600 10px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase', gap: 12 }}>
            <span>Time</span><span>User · Document</span><span>Type</span><span>Model</span><span>Score</span><span>Confidence</span><span/>
          </div>
          {[
            { t: 'just now', u: 'u_3kfd · Bank-Stmt.pdf', dt: 'Financial', m: 'Claude 3.5 Sonnet', sc: 48, cf: 41, flag: true },
            { t: '2m ago', u: 'u_71fa · Passport.pdf', dt: 'Identity', m: 'Claude 3.5 Sonnet', sc: 92, cf: 96 },
            { t: '4m ago', u: 'u_82bb · Hotel-Booking.pdf', dt: 'Itinerary', m: 'Claude 3.5 Sonnet', sc: 78, cf: 84 },
            { t: '6m ago', u: 'u_19df · Insurance.pdf', dt: 'Coverage', m: 'Claude 3.5 Sonnet', sc: 95, cf: 99 },
            { t: '8m ago', u: 'u_4452 · IMG_4421.jpg', dt: 'Unknown', m: 'Claude 3.5 Sonnet', sc: 0, cf: 28, flag: true },
            { t: '11m ago', u: 'u_9b32 · Emp-Letter.pdf', dt: 'Employment', m: 'Claude 3.5 Sonnet', sc: 86, cf: 91 },
            { t: '14m ago', u: 'u_2bcc · Bank-Stmt.pdf', dt: 'Financial', m: 'Claude 3.5 Sonnet', sc: 89, cf: 94 },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1.4fr 1fr 0.8fr 0.7fr 0.9fr 100px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', background: r.flag ? '#FFFBEB' : '#fff', gap: 12 }}>
              <span style={{ font: '400 12px/1 Inter', color: '#64748B' }}>{r.t}</span>
              <span style={{ font: '500 12px/1.3 JetBrains Mono', color: '#0F172A' }}>{r.u}</span>
              <Chip tone="neutral" size="sm">{r.dt}</Chip>
              <span style={{ font: '500 11px/1 Inter', color: '#475569' }}>{r.m}</span>
              <span style={{ font: '700 14px/1 Plus Jakarta Sans', color: r.sc >= 90 ? '#10B981' : r.sc >= 50 ? '#F59E0B' : '#EF4444' }}>{r.sc}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 60, height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${r.cf}%`, height: '100%', background: r.cf >= 80 ? '#10B981' : r.cf >= 60 ? '#F59E0B' : '#EF4444' }}/>
                </div>
                <span style={{ font: '600 11px/1 JetBrains Mono', color: '#475569' }}>{r.cf}%</span>
              </div>
              {r.flag ? <Btn variant="tonal" size="sm">Review</Btn> : <span style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>OK</span>}
            </div>
          ))}
        </Card>
      </div>
    </WebShell>
  );
}

Object.assign(window, { WebShell, WConsumerDashboard, WAppDetail, WB2BDashboard, WAdminDashboard, WAdminAI });
