/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, flag, WebShell, PhoneAppBar, BottomNav, PhoneBody */
// Extra dashboards: Admin User Mgmt, Revenue, Requirements DB, Super Admin, Agent Earnings, B2B Employee

// ─── Admin · User Management ───────────────────────────────────────────────
function WAdminUsers() {
  return (
    <WebShell role="admin" active="users">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Users</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>24,318 total · 4,852 active today · 412 new this week</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="download">Export CSV</Btn>
            <Btn variant="outlined" icon="mail">Broadcast</Btn>
            <Btn variant="primary" icon="person_add">Invite admin</Btn>
          </div>
        </div>

        {/* Segments strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { l: 'All users', v: '24,318', c: '#1A56DB', on: true },
            { l: 'Consumer Free', v: '19,402' },
            { l: 'Consumer Pro', v: '3,184' },
            { l: 'B2B', v: '1,420' },
            { l: 'Agents', v: '312' },
            { l: 'Blocked / churned', v: '184', c: '#EF4444' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, background: s.on ? '#0F172A' : '#fff', color: s.on ? '#fff' : '#0F172A', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
              <div style={{ font: '500 10px/1 Inter', color: s.on ? 'rgba(255,255,255,.55)' : '#64748B', letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ font: '800 20px/1 Plus Jakarta Sans', marginTop: 8, color: s.on ? '#fff' : '#0F172A' }}>{s.v}</div>
            </div>
          ))}
        </div>

        <Card padding={0} elevation={1}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 36, background: '#F1F5F9', borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
              <span style={{ font: '500 12px/1 Inter', color: '#94A3B8', flex: 1 }}>Search by name, email, UID, or country…</span>
            </div>
            <Chip tone="info" size="sm" icon="filter_list">Active · Last 30d</Chip>
            <Chip tone="neutral" size="sm">2 selected</Chip>
            <Btn variant="tonal" size="sm">Bulk action</Btn>
          </div>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1.6fr 0.9fr 0.8fr 0.7fr 0.9fr 0.7fr 0.9fr 100px', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', font: '600 10px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase', gap: 10 }}>
            <input type="checkbox" style={{ accentColor: '#1A56DB' }} readOnly/>
            <span>User</span><span>UID</span><span>Plan</span><span>Apps</span><span>Country</span><span>LTV</span><span>Last active</span><span/>
          </div>
          {[
            { sel: true, n: 'Sarah Mitchell', e: 'sarah.m@email.com', uid: 'u_3kfd4', plan: 'Pro', planTone: 'info', cc: 'IN', apps: 3, ltv: '$148', last: '2m ago' },
            { sel: false, n: 'David Chen', e: 'd.chen@stripe.com', uid: 'u_71fa8', plan: 'B2B · Acme', planTone: 'ai', cc: 'US', apps: 1, ltv: '—', last: '1h ago' },
            { sel: false, n: 'Maria Santos', e: 'm.santos@email.com', uid: 'u_82bb1', plan: 'B2B · Acme', planTone: 'ai', cc: 'IN', apps: 2, ltv: '—', last: '4h ago' },
            { sel: true, n: 'Priya Raghavan', e: 'priya.r@expert.io', uid: 'a_4452a', plan: 'Agent', planTone: 'gold', cc: 'IN', apps: '—', ltv: '$1,842 paid', last: 'online' },
            { sel: false, n: 'Lin Wei', e: 'lin@example.com', uid: 'u_9b323', plan: 'Free', planTone: 'neutral', cc: 'CA', apps: 1, ltv: '$0', last: 'yesterday' },
            { sel: false, n: 'Marcus Köhler', e: 'm.kohler@expert.io', uid: 'a_2bcc7', plan: 'Agent', planTone: 'gold', cc: 'DE', apps: '—', ltv: '$3,210 paid', last: '12m ago' },
            { sel: false, n: 'Amir Hossein', e: 'amir@example.com', uid: 'u_19df4', plan: 'Free', planTone: 'neutral', cc: 'AE', apps: 1, ltv: '$0', last: '2d ago' },
            { sel: false, n: 'Sofia Kim', e: 's.kim@email.com', uid: 'u_3a91b', plan: 'Free · suspended', planTone: 'error', cc: 'JP', apps: 0, ltv: '$0', last: '8d ago' },
          ].map((u, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1.6fr 0.9fr 0.8fr 0.7fr 0.9fr 0.7fr 0.9fr 100px', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', background: u.sel ? '#EFF6FF' : '#fff', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" checked={u.sel} readOnly style={{ accentColor: '#1A56DB' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#1A56DB','#10B981','#F97316','#7C3AED','#0EA5E9','#EC4899','#F59E0B','#94A3B8'][i%8], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px/1 Inter' }}>{u.n.split(' ').map(s=>s[0]).join('')}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{u.n}</div>
                  <div style={{ font: '400 11px/1.2 Inter', color: '#64748B', marginTop: 2 }}>{u.e}</div>
                </div>
              </div>
              <span style={{ font: '500 11px/1 JetBrains Mono', color: '#475569' }}>{u.uid}</span>
              <Chip tone={u.planTone} size="sm">{u.plan}</Chip>
              <span style={{ font: '600 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>{u.apps}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px/1 Inter', color: '#475569' }}><span style={{ fontSize: 16 }}>{flag(u.cc)}</span>{u.cc}</div>
              <span style={{ font: '600 12px/1.2 JetBrains Mono', color: '#0F172A' }}>{u.ltv}</span>
              <span style={{ font: '500 11px/1 Inter', color: u.last === 'online' ? '#10B981' : '#475569' }}>{u.last}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="text" size="sm" icon="more_vert" style={{ padding: 0 }}/>
              </div>
            </div>
          ))}
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ font: '500 12px/1 Inter', color: '#64748B' }}>Showing 1 – 8 of 24,318</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn variant="outlined" size="sm">Prev</Btn>
              <Btn variant="tonal" size="sm">1</Btn>
              <Btn variant="text" size="sm">2</Btn>
              <Btn variant="text" size="sm">3</Btn>
              <Btn variant="text" size="sm">…</Btn>
              <Btn variant="text" size="sm">3,040</Btn>
              <Btn variant="outlined" size="sm">Next</Btn>
            </div>
          </div>
        </Card>
      </div>
    </WebShell>
  );
}

// ─── Admin · Revenue ───────────────────────────────────────────────────────
function WAdminRevenue() {
  return (
    <WebShell role="admin" active="rev">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Revenue</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>MRR $48,420 · ARR $581k · 22% MoM growth</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Chip tone="info" size="md" icon="calendar_month">Feb 2026</Chip>
            <Btn variant="outlined" icon="download">Export</Btn>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {[
            { l: 'MRR', v: '$48,420', d: '+22%', c: '#10B981' },
            { l: 'ARR', v: '$581k', d: '+18%', c: '#10B981' },
            { l: 'Active subs', v: '3,496', d: '+184', c: '#1A56DB' },
            { l: 'ARPU', v: '$13.85', d: '+$0.94', c: '#7C3AED' },
            { l: 'Churn', v: '2.4%', d: '−0.6%', c: '#10B981' },
          ].map((k, i) => (
            <Card key={i} padding={18} elevation={1}>
              <div style={{ font: '500 11px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.l}</div>
              <div style={{ font: '800 24px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 10 }}>{k.v}</div>
              <div style={{ font: '600 11px/1 Inter', color: k.c, marginTop: 6 }}>{k.d}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 20 }}>
          {/* Revenue chart */}
          <Card padding={20} elevation={1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Revenue · last 90 days</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 4 }}>Daily $ split by stream</div>
              </div>
              <div style={{ display: 'flex', gap: 14, font: '500 11px/1 Inter', color: '#64748B' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#1A56DB', borderRadius: 2 }}/>Subscription</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#7C3AED', borderRadius: 2 }}/>VIP Booking</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#F59E0B', borderRadius: 2 }}/>B2B</span>
              </div>
            </div>
            <svg width="100%" height="240" viewBox="0 0 600 240" style={{ marginTop: 18 }}>
              {[0,1,2,3,4].map(i => <line key={i} x1="0" x2="600" y1={20+i*45} y2={20+i*45} stroke="#F1F5F9"/>)}
              {/* B2B (bottom layer) */}
              <path d="M 0 220 L 30 215 L 60 210 L 90 215 L 120 205 L 150 198 L 180 192 L 210 185 L 240 188 L 270 180 L 300 175 L 330 168 L 360 160 L 390 155 L 420 150 L 450 142 L 480 138 L 510 132 L 540 125 L 570 120 L 600 115 L 600 240 L 0 240 Z" fill="#F59E0B" opacity="0.9"/>
              {/* VIP */}
              <path d="M 0 200 L 30 195 L 60 188 L 90 195 L 120 182 L 150 175 L 180 168 L 210 158 L 240 162 L 270 150 L 300 142 L 330 132 L 360 122 L 390 115 L 420 108 L 450 95 L 480 88 L 510 78 L 540 68 L 570 62 L 600 55 L 600 115 L 600 115 L 570 120 L 540 125 L 510 132 L 480 138 L 450 142 L 420 150 L 390 155 L 360 160 L 330 168 L 300 175 L 270 180 L 240 188 L 210 185 L 180 192 L 150 198 L 120 205 L 90 215 L 60 210 L 30 215 L 0 220 Z" fill="#7C3AED" opacity="0.9"/>
              {/* Subscription */}
              <path d="M 0 160 L 30 155 L 60 148 L 90 152 L 120 138 L 150 130 L 180 120 L 210 108 L 240 112 L 270 95 L 300 85 L 330 75 L 360 60 L 390 50 L 420 42 L 450 30 L 480 22 L 510 12 L 540 8 L 570 5 L 600 2 L 600 55 L 570 62 L 540 68 L 510 78 L 480 88 L 450 95 L 420 108 L 390 115 L 360 122 L 330 132 L 300 142 L 270 150 L 240 162 L 210 158 L 180 168 L 150 175 L 120 182 L 90 195 L 60 188 L 30 195 L 0 200 Z" fill="#1A56DB"/>
              <path d="M 0 160 L 30 155 L 60 148 L 90 152 L 120 138 L 150 130 L 180 120 L 210 108 L 240 112 L 270 95 L 300 85 L 330 75 L 360 60 L 390 50 L 420 42 L 450 30 L 480 22 L 510 12 L 540 8 L 570 5 L 600 2" stroke="#0EA5E9" strokeWidth="2.5" fill="none"/>
            </svg>
          </Card>
          {/* Stream breakdown */}
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 16 }}>Revenue by stream · today</div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="90" cy="90" r="70" stroke="#1A56DB" strokeWidth="22" fill="none" strokeDasharray="240 440"/>
                <circle cx="90" cy="90" r="70" stroke="#7C3AED" strokeWidth="22" fill="none" strokeDasharray="120 440" strokeDashoffset="-240"/>
                <circle cx="90" cy="90" r="70" stroke="#F59E0B" strokeWidth="22" fill="none" strokeDasharray="80 440" strokeDashoffset="-360"/>
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>Today</div>
                <div style={{ font: '800 22px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 4 }}>$8,420</div>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { c: '#1A56DB', l: 'Subscriptions', v: '$4,820', p: '57%' },
                { c: '#7C3AED', l: 'VIP Booking', v: '$2,400', p: '29%' },
                { c: '#F59E0B', l: 'B2B Plans', v: '$1,200', p: '14%' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: r.c }}/>
                  <div style={{ flex: 1, font: '500 12px/1 Inter', color: '#475569' }}>{r.l}</div>
                  <div style={{ font: '700 12px/1 JetBrains Mono', color: '#0F172A' }}>{r.v}</div>
                  <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', width: 32, textAlign: 'right' }}>{r.p}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent transactions */}
        <Card padding={0} elevation={1} style={{ marginTop: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Recent transactions</div>
            <Btn variant="text" size="sm" trailing="arrow_forward">All transactions</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1.4fr 1fr 0.9fr 0.7fr 0.7fr 100px', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F1F5F9', font: '600 10px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase', gap: 12 }}>
            <span>Date</span><span>User</span><span>Product</span><span>Method</span><span>Net</span><span>Status</span><span/>
          </div>
          {[
            { d: 'Mar 4, 9:42 AM', n: 'Sarah Mitchell', p: 'VIP · 60-min · Priya R.', m: 'Visa •••4242', net: '$83.45', st: 'success', stL: 'Captured' },
            { d: 'Mar 4, 8:14 AM', n: 'David Chen', p: 'Pro plan · Annual', m: 'Apple Pay', net: '$149.00', st: 'success', stL: 'Captured' },
            { d: 'Mar 4, 7:30 AM', n: 'Acme Corp', p: 'B2B · 50 seats', m: 'Wire transfer', net: '$2,400.00', st: 'info', stL: 'Pending' },
            { d: 'Mar 3, 11:18 PM', n: 'Lin Wei', p: 'Pro plan · Monthly', m: 'Visa •••8821', net: '$14.99', st: 'error', stL: 'Failed' },
            { d: 'Mar 3, 9:02 PM', n: 'Marcus Köhler', p: 'Payout to agent', m: 'SEPA', net: '−$642.00', st: 'success', stL: 'Sent' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1.4fr 1fr 0.9fr 0.7fr 0.7fr 100px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 12 }}>
              <span style={{ font: '500 11px/1.3 Inter', color: '#64748B' }}>{r.d}</span>
              <span style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>{r.n}</span>
              <span style={{ font: '500 12px/1.3 Inter', color: '#475569' }}>{r.p}</span>
              <span style={{ font: '500 11px/1 JetBrains Mono', color: '#475569' }}>{r.m}</span>
              <span style={{ font: '700 13px/1 JetBrains Mono', color: r.net.startsWith('−') ? '#EF4444' : '#0F172A' }}>{r.net}</span>
              <Chip tone={r.st} size="sm">{r.stL}</Chip>
              <Btn variant="text" size="sm" icon="more_vert" style={{ padding: 0, justifyContent: 'flex-end' }}/>
            </div>
          ))}
        </Card>
      </div>
    </WebShell>
  );
}

// ─── Admin · Requirements DB ───────────────────────────────────────────────
function WAdminReqDB() {
  return (
    <WebShell role="admin" active="req">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Requirements database</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>1,284 country pairs cached · 47 stale · last global refresh 2h ago</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="auto_awesome">Re-run AI</Btn>
            <Btn variant="primary" icon="refresh">Refresh all</Btn>
          </div>
        </div>

        {/* health strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { l: 'Fresh (<6h)', v: '1,098', c: '#10B981' },
            { l: 'Aging (6-24h)', v: '139', c: '#F59E0B' },
            { l: 'Stale (>24h)', v: '47', c: '#EF4444' },
            { l: 'Manual overrides', v: '12', c: '#7C3AED' },
          ].map((s, i) => (
            <Card key={i} padding={18} elevation={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }}/>
                <span style={{ font: '500 11px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.l}</span>
              </div>
              <div style={{ font: '800 24px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 10 }}>{s.v}</div>
            </Card>
          ))}
        </div>

        <Card padding={0} elevation={1}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, height: 36, background: '#F1F5F9', borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
              <span style={{ font: '500 12px/1 Inter', color: '#94A3B8', flex: 1 }}>nationality → destination → visa type</span>
            </div>
            <Chip tone="error" size="sm" icon="warning_amber">47 stale</Chip>
            <Chip tone="info" size="sm" icon="filter_list">All visa types</Chip>
            <Btn variant="primary" size="sm" icon="add">Add new pair</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.9fr 0.9fr 0.7fr 1fr 120px', padding: '12px 20px', borderBottom: '1px solid #F1F5F9', font: '600 10px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase', gap: 12 }}>
            <span>Pair</span><span>Visa type</span><span>Cache age</span><span>Last fetched</span><span>Sources</span><span>Override</span><span/>
          </div>
          {[
            { f: 'IN → FR', t: 'Schengen Tourist (C)', age: '2 h', last: '7:42 AM', s: '3 sources', tone: 'success', or: '—' },
            { f: 'IN → DE', t: 'Schengen Tourist (C)', age: '5 h', last: '4:18 AM', s: '3 sources', tone: 'success', or: '—' },
            { f: 'IN → US', t: 'B1 Business', age: '18 h', last: 'Yesterday 11:42 AM', s: '4 sources', tone: 'warning', or: 'Active · MFA' },
            { f: 'IN → GB', t: 'Standard Visitor', age: '26 h', last: '2 days ago', s: '2 sources', tone: 'error', or: '—' },
            { f: 'IN → JP', t: 'Tourist', age: '4 h', last: '5:42 AM', s: '2 sources', tone: 'success', or: '—' },
            { f: 'AE → CA', t: 'TRV (Visitor)', age: '32 h', last: '2 days ago', s: '2 sources', tone: 'error', or: '—' },
            { f: 'BR → ES', t: 'Schengen Tourist (C)', age: '8 h', last: '1:42 AM', s: '3 sources', tone: 'success', or: 'Active · custom' },
            { f: 'PH → US', t: 'B2 Tourist', age: '14 h', last: 'Yesterday 7:42 PM', s: '3 sources', tone: 'warning', or: '—' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.9fr 0.9fr 0.7fr 1fr 120px', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '600 13px/1.2 Inter', color: '#0F172A' }}>
                <span style={{ fontSize: 18 }}>{flag(r.f.slice(0,2))}</span>
                <span className="mi" style={{ fontSize: 14, color: '#94A3B8' }}>arrow_forward</span>
                <span style={{ fontSize: 18 }}>{flag(r.f.slice(-2))}</span>
                <span style={{ marginLeft: 4 }}>{r.f}</span>
              </div>
              <span style={{ font: '500 12px/1.3 Inter', color: '#475569' }}>{r.t}</span>
              <Chip tone={r.tone} size="sm">{r.age}</Chip>
              <span style={{ font: '500 11px/1 Inter', color: '#64748B' }}>{r.last}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, font: '500 11px/1 Inter', color: '#1A56DB' }}><span className="mi" style={{ fontSize: 14 }}>link</span>{r.s}</div>
              <span style={{ font: '500 11px/1.3 Inter', color: r.or === '—' ? '#94A3B8' : '#7C3AED' }}>{r.or}</span>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <Btn variant="text" size="sm" icon="refresh" style={{ padding: 0 }}/>
                <Btn variant="text" size="sm" icon="edit" style={{ padding: 0 }}/>
                <Btn variant="text" size="sm" icon="open_in_new" style={{ padding: 0 }}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </WebShell>
  );
}

// ─── Super Admin · Feature flags + system ──────────────────────────────────
function WSuperAdmin() {
  const Flag = ({ on, name, desc, env, danger }) => (
    <div style={{ padding: 16, borderRadius: 12, border: '1px solid #F1F5F9', background: '#fff', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: danger ? '#FEE2E2' : on ? '#D1FAE5' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mi" style={{ fontSize: 22, color: danger ? '#DC2626' : on ? '#059669' : '#94A3B8' }}>{danger ? 'priority_high' : 'toggle_on'}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{name}</div>
          <Chip tone={env === 'prod' ? 'error' : env === 'staging' ? 'warning' : 'info'} size="sm">{env}</Chip>
          {danger && <Chip tone="error" size="sm">Destructive</Chip>}
        </div>
        <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#10B981' : '#CBD5E1', padding: 2, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', cursor: 'pointer' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }}/>
      </div>
    </div>
  );
  return (
    <WebShell role="admin" active="settings">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <Chip tone="error" size="sm" icon="admin_panel_settings">Super Admin only</Chip>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 8, letterSpacing: '-0.02em' }}>System & Feature flags</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Changes here ship to production. All actions are logged with audit trail.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="history">Audit log</Btn>
            <Btn variant="destruct" icon="warning_amber">Emergency kill switch</Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
          <div>
            {/* AI model config */}
            <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>AI · Model routing</div>
            <Card padding={0} elevation={1} style={{ marginBottom: 20 }}>
              {[
                { l: 'Document audit', v: 'Claude 3.5 Sonnet', fb: 'Claude 3 Haiku', tok: '4.2 M / day' },
                { l: 'Requirements grounding', v: 'Gemini 2.0 Flash', fb: 'Gemini 1.5', tok: '1.8 M / day' },
                { l: 'Chat assistant', v: 'Claude 3.5 Sonnet', fb: 'Claude 3 Haiku', tok: '8.4 M / day' },
                { l: 'Translation', v: 'Gemini 2.0 Flash', fb: 'Google Translate API', tok: '0.6 M / day' },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 60px', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', alignItems: 'center', gap: 12 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.l}</div>
                  <div>
                    <div style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>Primary</div>
                    <div style={{ font: '600 12px/1.3 Inter', color: '#7C3AED', marginTop: 4 }}>{r.v}</div>
                  </div>
                  <div>
                    <div style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>Fallback</div>
                    <div style={{ font: '500 12px/1.3 Inter', color: '#475569', marginTop: 4 }}>{r.fb}</div>
                  </div>
                  <div>
                    <div style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>Usage</div>
                    <div style={{ font: '600 12px/1.3 JetBrains Mono', color: '#0F172A', marginTop: 4 }}>{r.tok}</div>
                  </div>
                  <Btn variant="text" size="sm" icon="edit" style={{ padding: 0, justifyContent: 'flex-end' }}/>
                </div>
              ))}
            </Card>

            {/* Feature flags */}
            <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Feature flags</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Flag on name="agent_marketplace" env="prod" desc="Real-time consultant matching + chat (all users)"/>
              <Flag on name="vip_booking" env="prod" desc="Calendly-backed VIP expert sessions"/>
              <Flag name="bulk_b2b_upload" env="staging" desc="HR multi-file ingestion with auto-employee matching"/>
              <Flag on name="ai_audit_streaming" env="prod" desc="Server-sent events for live audit progress"/>
              <Flag name="rejection_appeals" env="dev" desc="New appeal flow for rejected applications"/>
              <Flag danger name="auto_submit_to_embassy" env="prod" desc="Direct embassy API integration (high-risk — kept off)"/>
            </div>
          </div>

          {/* System health detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card padding={20} elevation={1}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>API keys & secrets</div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'Anthropic API', s: 'Rotated 8d ago', tone: 'success' },
                  { l: 'Google AI Studio', s: 'Rotated 3d ago', tone: 'success' },
                  { l: 'Stripe live', s: 'Rotation due in 22d', tone: 'warning' },
                  { l: 'Firebase Admin', s: '90d auto-rotate on', tone: 'success' },
                  { l: 'Calendly OAuth', s: 'Last refresh 18h ago', tone: 'success' },
                ].map((k, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mi" style={{ fontSize: 18, color: '#7C3AED' }}>key</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: '500 12px/1.2 Inter', color: '#0F172A' }}>{k.l}</div>
                      <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{k.s}</div>
                    </div>
                    <Chip tone={k.tone} size="sm">{k.tone === 'warning' ? 'Due' : 'OK'}</Chip>
                  </div>
                ))}
              </div>
            </Card>
            <Card padding={20} elevation={1}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Recent admin actions</div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { who: 'You', t: 'Enabled flag · ai_audit_streaming', ts: '2h ago' },
                  { who: 'admin@orbit', t: 'Refreshed IN→FR Schengen cache', ts: '4h ago' },
                  { who: 'You', t: 'Rotated Anthropic key', ts: 'Yesterday' },
                  { who: 'admin@orbit', t: 'Suspended user u_3a91b', ts: '3d ago' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A56DB', marginTop: 6, flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: '500 12px/1.3 Inter', color: '#0F172A' }}>{a.t}</div>
                      <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{a.who} · {a.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </WebShell>
  );
}

// ─── Agent · Web Earnings detail ───────────────────────────────────────────
function WAgentEarnings() {
  return (
    <WebShellAgent active="earnings">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Earnings</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Withdraw to your bank or hold for tax season · payouts Fridays at midnight UTC</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="description">Tax docs</Btn>
            <Btn variant="primary" icon="account_balance">Withdraw $1,842</Btn>
          </div>
        </div>

        {/* Hero balance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
          <Card padding={24} elevation={3} style={{ background: 'linear-gradient(135deg,#0F172A,#7C3AED 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.2), transparent 60%)' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.55)', letterSpacing: 1, textTransform: 'uppercase' }}>Available balance</div>
              <div style={{ font: '800 56px/1 Plus Jakarta Sans', marginTop: 12, letterSpacing: '-0.03em' }}>$1,842.40</div>
              <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
                {[
                  { l: 'Pending payout', v: '$642' },
                  { l: 'Lifetime', v: '$18,420' },
                  { l: 'Tax held', v: '$184 (10%)' },
                  { l: 'Goal · monthly', v: '74% to $2,500' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.55)' }}>{s.l}</div>
                    <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', marginTop: 4 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, marginTop: 16, overflow: 'hidden' }}>
                <div style={{ width: '74%', height: '100%', background: 'linear-gradient(90deg,#F59E0B,#10B981)' }}/>
              </div>
            </div>
          </Card>

          {/* Earnings goals */}
          <Card padding={20} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Earnings by stream</div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { l: 'Live calls', v: '$842', p: 72, c: '#7C3AED' },
                { l: 'Document reviews', v: '$640', p: 58, c: '#1A56DB' },
                { l: 'Chat sessions', v: '$240', p: 35, c: '#0EA5E9' },
                { l: 'Tips & bonuses', v: '$120', p: 18, c: '#F59E0B' },
              ].map(b => (
                <div key={b.l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 12px/1 Inter', color: '#475569' }}>
                    <span>{b.l}</span><span style={{ color: '#0F172A', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{b.v}</span>
                  </div>
                  <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${b.p}%`, height: '100%', background: b.c, borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Chart + transaction list */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <Card padding={20} elevation={1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Earnings · last 30 days</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 4 }}>Daily total · all streams combined</div>
              </div>
              <Chip tone="success" size="sm" icon="trending_up">+22%</Chip>
            </div>
            <svg width="100%" height="220" viewBox="0 0 600 220" style={{ marginTop: 18 }}>
              <defs>
                <linearGradient id="ge1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[0,1,2,3,4].map(i => <line key={i} x1="0" x2="600" y1={20+i*40} y2={20+i*40} stroke="#F1F5F9"/>)}
              <path d="M 0 180 L 20 165 L 40 175 L 60 150 L 80 160 L 100 130 L 120 140 L 140 110 L 160 120 L 180 95 L 200 105 L 220 80 L 240 90 L 260 65 L 280 75 L 300 50 L 320 60 L 340 35 L 360 50 L 380 25 L 400 40 L 420 20 L 440 35 L 460 15 L 480 30 L 500 12 L 520 25 L 540 18 L 560 32 L 580 10 L 600 5 L 600 220 L 0 220 Z" fill="url(#ge1)"/>
              <path d="M 0 180 L 20 165 L 40 175 L 60 150 L 80 160 L 100 130 L 120 140 L 140 110 L 160 120 L 180 95 L 200 105 L 220 80 L 240 90 L 260 65 L 280 75 L 300 50 L 320 60 L 340 35 L 360 50 L 380 25 L 400 40 L 420 20 L 440 35 L 460 15 L 480 30 L 500 12 L 520 25 L 540 18 L 560 32 L 580 10 L 600 5" stroke="#7C3AED" strokeWidth="2.5" fill="none"/>
            </svg>
          </Card>

          {/* Reviews / ratings */}
          <Card padding={20} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Client reviews</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="mi" style={{ fontSize: 16, color: '#F59E0B' }}>star</span>
                <span style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>4.92</span>
                <span style={{ font: '500 12px/1 Inter', color: '#94A3B8' }}>(284)</span>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[5,4,3,2,1].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px/1 Inter' }}>
                  <span style={{ width: 14, color: '#475569' }}>{s}</span>
                  <span className="mi" style={{ fontSize: 12, color: '#F59E0B' }}>star</span>
                  <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${[88,8,2,1,1][5-s]}%`, height: '100%', background: '#F59E0B' }}/>
                  </div>
                  <span style={{ color: '#94A3B8', width: 28, textAlign: 'right' }}>{[88,8,2,1,1][5-s]}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#F8FAFC', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 2, color: '#F59E0B' }}>{[1,2,3,4,5].map(i => <span key={i} className="mi" style={{ fontSize: 14 }}>star</span>)}</div>
              <div style={{ font: '500 12px/1.5 Inter', color: '#0F172A', marginTop: 6 }}>"Priya spotted my hotel issue in 30 seconds — saved my visa!"</div>
              <div style={{ font: '400 11px/1 Inter', color: '#94A3B8', marginTop: 4 }}>— Sarah M. · 12m ago</div>
            </div>
          </Card>
        </div>
      </div>
    </WebShellAgent>
  );
}

// ─── Mobile · B2B Employee (member, not manager) ──────────────────────────
function MEmployee() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: '#0B1F4B', padding: '0 0 18px', color: '#fff' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>menu</span></button>
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.55)', letterSpacing: 1, textTransform: 'uppercase' }}>Acme Corp · Sales</div>
            <div style={{ font: '600 13px/1 Inter', marginTop: 4 }}>Maria Santos</div>
          </div>
          <span className="mi" style={{ fontSize: 22, padding: 10 }}>notifications_outlined</span>
        </div>
        <div style={{ padding: '6px 20px' }}>
          <div style={{ font: '800 22px/1.2 Plus Jakarta Sans' }}>Welcome back, Maria</div>
          <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.65)', marginTop: 2 }}>Anita Verma (HR) is managing your visa applications.</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 8px', marginTop: -10 }}>
        {/* Action needed banner */}
        <Card padding={14} elevation={3} accent="#F97316">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mi" style={{ fontSize: 26, color: '#F97316', flexShrink: 0 }}>warning_amber</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.3 Plus Jakarta Sans', color: '#0F172A' }}>HR needs 2 docs from you</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Bank Oct statement + paid hotel confirmation</div>
            </div>
            <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>chevron_right</span>
          </div>
        </Card>

        {/* Assigned applications */}
        <div style={{ marginTop: 16, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Your assignments</div>
        {[
          { cc: 'DE', t: 'Germany · Schengen', sc: 74, dt: 'Mar 22 · 5d', urg: true, sb: '2 docs needed' },
          { cc: 'US', t: 'USA · B1 Business', sc: 88, dt: 'Apr 14 · 27d', sb: 'On track' },
        ].map((a, i) => (
          <Card key={i} padding={14} elevation={1} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>{flag(a.cc)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{a.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: a.urg ? '#DC2626' : '#64748B', marginTop: 2 }}>{a.sb} · deadline {a.dt}</div>
              </div>
              <ScoreRing value={a.sc} size={40} stroke={4}/>
            </div>
          </Card>
        ))}

        {/* HR contact */}
        <Card padding={14} elevation={1} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', font: '700 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AV</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Anita Verma · HR</div>
            <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Your designated visa manager</div>
          </div>
          <Btn variant="tonal" size="sm" icon="chat_bubble_outline">Message</Btn>
        </Card>

        {/* Profile completion */}
        <div style={{ marginTop: 16, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Your details</div>
        <Card padding={16} elevation={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScoreRing value={92} size={44} stroke={5}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>92% complete</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Resume + emergency contact left</div>
            </div>
            <Btn variant="text" size="sm" trailing="arrow_forward">Finish</Btn>
          </div>
        </Card>
      </div>
      <BottomNav active={0} items={[
        { label: 'Home', icon: 'home', active: 'home' },
        { label: 'Assigned', icon: 'assignment_ind', active: 'assignment' },
        { label: 'Docs', icon: 'description', active: 'description' },
        { label: 'HR Chat', icon: 'chat_bubble_outline', active: 'chat_bubble', badge: 1 },
        { label: 'Me', icon: 'person_outline', active: 'person' },
      ]}/>
    </PhoneBody>
  );
}

Object.assign(window, { WAdminUsers, WAdminRevenue, WAdminReqDB, WSuperAdmin, WAgentEarnings, MEmployee });
