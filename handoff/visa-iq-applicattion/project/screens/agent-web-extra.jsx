/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, flag, WebShellAgent, WebShell */
// Agent / Consultant — web extras: Live Call Console, Clients CRM, Schedule, Profile editor, Chats
// Also a polished B2B Employee web view.

// ─── 10 Agent · Live Call Console (in-session pro tool) ───────────────────
function WAgentLiveCall() {
  return (
    <WebShellAgent active="queue">
      <div style={{ position: 'absolute', inset: 0, top: 64, left: 248, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ height: 56, background: '#0F172A', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <Chip tone="error" size="md" icon="fiber_manual_record" style={{ background: 'rgba(239,68,68,.18)', color: '#FCA5A5' }}>LIVE · 04:18</Chip>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', font: '700 11px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SM</div>
            <div>
              <div style={{ font: '600 13px/1.2 Inter' }}>Sarah Mitchell</div>
              <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{flag('GB')} → {flag('FR')} France Schengen</div>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <Chip tone="success" size="md" style={{ background: 'rgba(16,185,129,.2)', color: '#34D399' }}>$5.16 billed</Chip>
          <Chip tone="ai" size="md" icon="auto_awesome" style={{ background: 'rgba(124,58,237,.2)', color: '#A78BFA' }}>Transcript on</Chip>
          <Btn variant="outlined" size="sm" icon="open_in_new" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)' }}>Pop out</Btn>
        </div>

        {/* Main grid: video + doc viewer + sidebar */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', gridTemplateRows: '1fr', minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: '#020617' }}>
            {/* Video region */}
            <div style={{ flex: 1.1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 14, minHeight: 0 }}>
              {/* Client tile */}
              <div style={{ borderRadius: 14, background: 'linear-gradient(135deg, #1E293B, #475569)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', font: '800 44px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SM</div>
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '6px 12px', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(10px)', borderRadius: 8, font: '600 12px/1 Inter', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' }}/>
                  Sarah Mitchell · speaking
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                  <span className="mi" style={{ fontSize: 16, color: '#10B981', padding: 4, background: 'rgba(0,0,0,.4)', borderRadius: 4 }}>signal_cellular_alt</span>
                </div>
              </div>
              {/* Agent self tile */}
              <div style={{ borderRadius: 14, background: 'linear-gradient(135deg,#312E81,#7C3AED)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '800 44px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(255,255,255,.1)' }}>PR</div>
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '6px 12px', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(10px)', borderRadius: 8, font: '600 12px/1 Inter', color: '#fff' }}>You · muted</div>
              </div>
            </div>

            {/* Live transcript */}
            <div style={{ flex: 0.9, padding: '0 14px 14px', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14, flex: 1, overflow: 'auto', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <AIBadge small/>
                  <div style={{ font: '600 11px/1 Inter', color: '#A78BFA' }}>Live transcript · auto-saved</div>
                  <div style={{ flex: 1 }}/>
                  <Chip tone="success" size="sm" style={{ background: 'rgba(16,185,129,.15)', color: '#34D399' }}>EN → EN · 87% conf</Chip>
                </div>
                {[
                  { who: 'Sarah', t: '11:42:14', m: 'Hi Priya! Thanks so much for taking this. I\'m worried about my France application — HR\'s AI flagged my bank statement.', c: '#F59E0B' },
                  { who: 'Priya', t: '11:42:32', m: 'No worries Sarah, walk me through it. Was it the average balance or coverage period?', c: '#A78BFA', me: true },
                  { who: 'Sarah', t: '11:42:51', m: 'Average balance — I have about £3,600 but the AI said I needed £5,000 minimum.', c: '#F59E0B' },
                  { who: 'Priya', t: '11:43:08', m: 'OK so that 5k figure isn\'t a hard rule for France — France Consulate typically wants €100/day for the duration of stay. For 8 nights that\'s €800.', c: '#A78BFA', me: true },
                  { who: 'AI tip', t: '11:43:12', m: 'France Schengen funds requirement: €100/day if no booked hotel, €65/day if hotel pre-paid (source: official consulate).', c: '#10B981', ai: true },
                  { who: 'Sarah', t: '11:43:24', m: 'Oh! That\'s a huge relief. So I\'m fine then? My hotel is paid.', c: '#F59E0B' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <div style={{ flexShrink: 0, font: '500 10px/1 JetBrains Mono', color: 'rgba(255,255,255,.4)', width: 60, paddingTop: 2 }}>{l.t}</div>
                    <div style={{ minWidth: 60, flexShrink: 0 }}>
                      {l.ai ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: 'rgba(16,185,129,.15)', color: l.c, font: '700 9px/1 Inter', borderRadius: 4, letterSpacing: 0.4 }}>
                          <span className="mi" style={{ fontSize: 10 }}>tips_and_updates</span>AI
                        </div>
                      ) : (
                        <span style={{ font: '700 11px/1 Inter', color: l.c }}>{l.who}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, font: '400 12px/1.5 Inter', color: l.ai ? '#86EFAC' : 'rgba(255,255,255,.85)', fontStyle: l.ai ? 'italic' : 'normal' }}>{l.m}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls dock */}
            <div style={{ padding: '4px 14px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.06)', padding: '8px 14px', borderRadius: 28 }}>
                {[
                  { i: 'mic', on: false },
                  { i: 'videocam', on: true },
                  { i: 'screen_share', on: true, c: '#7C3AED' },
                  { i: 'closed_caption', on: true, c: '#0EA5E9' },
                  { i: 'present_to_all', on: false },
                ].map((b, i) => (
                  <button key={i} style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: b.on ? (b.c || '#1A56DB') : 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mi" style={{ fontSize: 20, color: '#fff' }}>{b.i}</span>
                  </button>
                ))}
              </div>
              <div style={{ flex: 1 }}/>
              <Btn variant="outlined" icon="picture_as_pdf" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)' }}>Summary</Btn>
              <Btn variant="destruct" icon="call_end">End call</Btn>
            </div>
          </div>

          {/* Right rail — context */}
          <div style={{ background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Chip tone="info" size="sm">Application context</Chip>
              <div style={{ flex: 1 }}/>
              <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>open_in_full</span>
            </div>
            {/* tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', padding: '0 8px', flexShrink: 0 }}>
              {[ ['Audit', true], ['Docs · 4', false], ['History · 3', false], ['Notes', false] ].map(([l, on], i) => (
                <div key={i} style={{ padding: '10px 12px', font: `${on ? 700 : 500} 12px/1 Inter`, color: on ? '#1A56DB' : '#64748B', borderBottom: on ? '2px solid #1A56DB' : '2px solid transparent', marginBottom: -1, cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#F8FAFC', borderRadius: 12 }}>
                <ScoreRing value={87} size={56} stroke={6}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>AI readiness</div>
                  <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 4 }}>Strong overall</div>
                  <div style={{ font: '500 11px/1.4 Inter', color: '#F97316', marginTop: 4 }}>1 amber finding · funds</div>
                </div>
              </div>

              <div style={{ font: '700 12px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 16, marginBottom: 10 }}>Findings · live</div>
              {[
                { c: '#10B981', t: 'Passport · valid 2030', i: 'check_circle' },
                { c: '#10B981', t: 'Employment letter · cleared', i: 'check_circle' },
                { c: '#F97316', t: 'Bank balance covers 4/6 mo', i: 'warning_amber', live: true },
                { c: '#10B981', t: 'Hotel paid · Marriott Paris', i: 'check_circle' },
                { c: '#10B981', t: 'Insurance €50k coverage', i: 'check_circle' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #F8FAFC', background: f.live ? 'rgba(124,58,237,.05)' : 'transparent' }}>
                  <span className="mi" style={{ fontSize: 18, color: f.c }}>{f.i}</span>
                  <div style={{ flex: 1, font: '500 12px/1.4 Inter', color: '#0F172A' }}>{f.t}</div>
                  {f.live && <Chip tone="ai" size="sm">DISCUSSING</Chip>}
                </div>
              ))}

              <div style={{ font: '700 12px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 16, marginBottom: 10 }}>Quick replies</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Send checklist to client',
                  'Mark audit as overridden',
                  'Email summary post-call',
                  'Book follow-up in 7 days',
                ].map((q, i) => (
                  <button key={i} style={{ padding: '8px 12px', textAlign: 'left', font: '500 12px/1.4 Inter', color: '#1A56DB', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 8, cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebShellAgent>
  );
}

// ─── 11 Agent · Clients CRM (list of all clients) ──────────────────────────
function WAgentClients() {
  return (
    <WebShellAgent active="clients">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>My clients</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>284 lifetime · 38 active · 12 awaiting follow-up</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="filter_list">Filters</Btn>
            <Btn variant="outlined" icon="download">Export</Btn>
            <Btn variant="primary" icon="add">Manual add</Btn>
          </div>
        </div>

        {/* Segmented summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { l: 'Active', v: '38', sub: '12 paid plans', c: '#1A56DB', i: 'group' },
            { l: 'Avg LTV', v: '$184', sub: '+12% vs platform', c: '#10B981', i: 'savings' },
            { l: 'NPS', v: '72', sub: 'Top 4% on platform', c: '#7C3AED', i: 'sentiment_satisfied' },
            { l: 'At risk', v: '4', sub: 'no contact 30d+', c: '#F59E0B', i: 'priority_high' },
          ].map((k, i) => (
            <Card key={i} padding={18} elevation={1}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: k.c }}>{k.i}</span>
                </div>
              </div>
              <div style={{ font: '800 26px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 14 }}>{k.v}</div>
              <div style={{ font: '500 12px/1.3 Inter', color: '#64748B', marginTop: 4 }}>{k.l}</div>
              <div style={{ font: '500 11px/1 Inter', color: k.c, marginTop: 6 }}>{k.sub}</div>
            </Card>
          ))}
        </div>

        {/* CRM table */}
        <Card padding={0} elevation={1}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 36, background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
              <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
              <span style={{ font: '400 13px/1 Inter', color: '#94A3B8', flex: 1 }}>Search by name, country, status, application…</span>
            </div>
            <Chip tone="info" size="sm">All countries</Chip>
            <Chip tone="info" size="sm">All statuses</Chip>
            <Chip tone="neutral" size="sm">Last 90 days</Chip>
            <Btn variant="text" size="sm" icon="settings">Columns</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 0.7fr 1.2fr 0.7fr 0.7fr 0.9fr 0.9fr 110px', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #F1F5F9', font: '600 11px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase', gap: 10 }}>
            <input type="checkbox" style={{ accentColor: '#7C3AED' }} readOnly/>
            <span>Client</span><span>Country</span><span>Active visa</span><span>Audit</span><span>LTV</span><span>Last contact</span><span>Status</span><span/>
          </div>
          {[
            { sel: false, n: 'Sarah Mitchell', email: 'sarah.m@gmail.com', cc: 'FR', t: 'Schengen Tourist', sc: 87, ltv: '$184', last: 'Live now', st: 'live', stL: 'In call' },
            { sel: false, n: 'David Chen', email: 'd.chen@google.com', cc: 'US', t: 'B1 Business', sc: 92, ltv: '$320', last: 'Yesterday', st: 'success', stL: 'Active' },
            { sel: true, n: 'Maria Santos', email: 'maria.s@acme.com', cc: 'DE', t: 'Schengen', sc: 74, ltv: '$96', last: '2d', st: 'warning', stL: 'Pending review' },
            { sel: false, n: 'Lin Wei', email: 'lin@ulw.design', cc: 'CA', t: 'TRV', sc: 88, ltv: '$58', last: '5d', st: 'info', stL: 'Active' },
            { sel: false, n: 'Rahul Singh', email: 'rahul@x.com', cc: 'GB', t: 'UK Visitor', sc: 72, ltv: '$140', last: '8d', st: 'info', stL: 'Active' },
            { sel: false, n: 'Amir Hossein', email: 'amir@startup.io', cc: 'AE', t: 'UAE Tourist', sc: 100, ltv: '$72', last: '12d', st: 'success', stL: 'Approved' },
            { sel: false, n: 'Sofia Kim', email: 'sofia@kakao.com', cc: 'JP', t: 'Japan Tourist', sc: 94, ltv: '$48', last: '34d', st: 'neutral', stL: 'Idle · at risk' },
            { sel: false, n: 'Carla Rossi', email: 'c.rossi@uni.it', cc: 'FR', t: 'Student long stay', sc: 81, ltv: '$184', last: '2m', st: 'neutral', stL: 'Idle · at risk' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 0.7fr 1.2fr 0.7fr 0.7fr 0.9fr 0.9fr 110px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 10, background: r.sel ? '#FAF5FF' : '#fff' }}>
              <input type="checkbox" checked={r.sel} readOnly style={{ accentColor: '#7C3AED' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#1A56DB','#10B981','#F97316','#7C3AED','#0EA5E9','#EC4899'][i%6], color: '#fff', font: '700 11px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.n.split(' ').map(s=>s[0]).join('')}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{r.n}</div>
                  <div style={{ font: '400 11px/1.2 Inter', color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 16 }}>{flag(r.cc)}</span><span style={{ font: '500 12px/1 Inter', color: '#475569' }}>{r.cc}</span></div>
              <span style={{ font: '500 12px/1.3 Inter', color: '#0F172A' }}>{r.t}</span>
              <span style={{ font: '700 14px/1 Plus Jakarta Sans', color: r.sc >= 90 ? '#10B981' : r.sc >= 75 ? '#EAB308' : '#F97316' }}>{r.sc}</span>
              <span style={{ font: '700 12px/1 JetBrains Mono', color: '#0F172A' }}>{r.ltv}</span>
              <span style={{ font: '500 12px/1 Inter', color: r.st === 'live' ? '#7C3AED' : '#475569' }}>{r.last}</span>
              <Chip tone={r.st === 'live' ? 'ai' : r.st} size="sm">{r.stL}</Chip>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn variant="text" size="sm" icon="chat_bubble_outline" style={{ padding: 0 }}/>
                <Btn variant="text" size="sm" icon="videocam" style={{ padding: 0 }}/>
                <Btn variant="text" size="sm" icon="open_in_new" style={{ padding: 0 }}/>
              </div>
            </div>
          ))}
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ font: '500 12px/1 Inter', color: '#64748B' }}>Showing 8 of 284</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn variant="outlined" size="sm" icon="chevron_left">Prev</Btn>
              <Btn variant="primary" size="sm">1</Btn>
              <Btn variant="outlined" size="sm">2</Btn>
              <Btn variant="outlined" size="sm">3</Btn>
              <Btn variant="outlined" size="sm" trailing="chevron_right">Next</Btn>
            </div>
          </div>
        </Card>
      </div>
    </WebShellAgent>
  );
}

// ─── 12 Agent · Schedule (calendar week view) ─────────────────────────────
function WAgentSchedule() {
  const days = ['Mon 4','Tue 5','Wed 6','Thu 7','Fri 8','Sat 9','Sun 10'];
  const hours = ['9','10','11','12','13','14','15','16','17','18'];
  const events = [
    { day: 1, h: 11, dur: 0.5, n: 'Sarah Mitchell · live call', cc: 'FR', live: true, c: '#7C3AED' },
    { day: 1, h: 14, dur: 1, n: 'David Chen · doc review', cc: 'US', c: '#1A56DB' },
    { day: 1, h: 15.5, dur: 0.5, n: 'Lin Wei · chat', cc: 'CA', c: '#0EA5E9' },
    { day: 1, h: 17, dur: 1, n: 'Marcus K · onboarding', cc: 'DE', c: '#F59E0B' },
    { day: 2, h: 9, dur: 1, n: 'Open block · review queue', open: true, c: '#94A3B8' },
    { day: 2, h: 11, dur: 0.5, n: 'Amir Hossein · override', cc: 'AE', c: '#10B981' },
    { day: 3, h: 10, dur: 1.5, n: 'Sofia Kim · pre-submit', cc: 'JP', c: '#EC4899' },
    { day: 3, h: 14, dur: 1, n: 'Webinar · UK refusals 101', host: true, c: '#7C3AED' },
    { day: 4, h: 13, dur: 0.5, n: 'Carla Rossi · check-in', cc: 'IT', c: '#1A56DB' },
    { day: 4, h: 16, dur: 1, n: 'Team office hours', open: true, c: '#94A3B8' },
  ];
  return (
    <WebShellAgent active="reports">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Schedule</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Mar 4 – 10 · 12 sessions booked · 18 hours available</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Chip tone="success" size="md" icon="bolt">Auto-accept on</Chip>
            <Btn variant="outlined" icon="settings">Availability</Btn>
            <Btn variant="primary" icon="add">Block time</Btn>
          </div>
        </div>

        <Card padding={0} elevation={1}>
          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9' }}>
            <div/>
            {days.map((d, i) => (
              <div key={i} style={{ padding: '14px 12px', borderLeft: '1px solid #F1F5F9', textAlign: 'center' }}>
                <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{d.split(' ')[0]}</div>
                <div style={{ font: '700 18px/1 Plus Jakarta Sans', color: i === 1 ? '#1A56DB' : '#0F172A', marginTop: 6 }}>{d.split(' ')[1]}</div>
                {i === 1 && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#1A56DB', margin: '6px auto 0' }}/>}
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            {/* Hours rail */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {hours.map((h, i) => (
                <div key={i} style={{ height: 60, padding: '4px 8px 0 0', textAlign: 'right', font: '500 11px/1 JetBrains Mono', color: '#94A3B8', borderTop: '1px solid #F1F5F9' }}>{h}:00</div>
              ))}
            </div>
            {/* Day columns */}
            {days.map((_, dayIdx) => (
              <div key={dayIdx} style={{ position: 'relative', borderLeft: '1px solid #F1F5F9' }}>
                {hours.map((_, hi) => (
                  <div key={hi} style={{ height: 60, borderTop: '1px solid #F1F5F9' }}/>
                ))}
                {/* Now line on Tuesday */}
                {dayIdx === 1 && (
                  <div style={{ position: 'absolute', top: (11 - 9) * 60 + 42, left: 0, right: 0, height: 2, background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,.4)', zIndex: 2 }}>
                    <div style={{ position: 'absolute', left: -6, top: -5, width: 12, height: 12, borderRadius: 6, background: '#EF4444' }}/>
                  </div>
                )}
                {/* Events */}
                {events.filter(e => e.day === dayIdx).map((e, ei) => (
                  <div key={ei} style={{
                    position: 'absolute', left: 6, right: 6,
                    top: (e.h - 9) * 60 + 2, height: e.dur * 60 - 4,
                    background: e.open ? `${e.c}10` : `${e.c}15`,
                    border: e.live ? `2px solid ${e.c}` : `1px solid ${e.c}30`,
                    borderLeft: `3px solid ${e.c}`,
                    borderRadius: 8, padding: '6px 8px', overflow: 'hidden', cursor: 'pointer',
                  }}>
                    {e.live && <div style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, background: '#EF4444' }}/>}
                    <div style={{ font: '700 11px/1.2 Inter', color: e.c, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {e.cc && <span style={{ fontSize: 12 }}>{flag(e.cc)}</span>}
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.n}</span>
                    </div>
                    {e.dur > 0.6 && <div style={{ font: '500 10px/1.3 Inter', color: '#475569', marginTop: 4 }}>{e.live ? 'LIVE · 4:18 elapsed' : `${Math.round(e.dur*60)} min`}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Legend + summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 20 }}>
          <Card padding={18} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>This week at a glance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {[
                { l: 'Live calls', v: '7', sub: '5.5h booked', c: '#7C3AED' },
                { l: 'Document reviews', v: '4', sub: 'avg 18 min', c: '#1A56DB' },
                { l: 'Chat sessions', v: '3', sub: '1.2h estimated', c: '#0EA5E9' },
                { l: 'Office hours / open blocks', v: '2', sub: '3h reserved', c: '#94A3B8' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: b.c }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{b.l}</div>
                    <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8' }}>{b.sub}</div>
                  </div>
                  <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>{b.v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card padding={18} elevation={1}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Booking link</div>
            <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 4 }}>Clients can request slots without leaving VisaIQ</div>
            <div style={{ marginTop: 14, padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, font: '500 12px/1 JetBrains Mono', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              visaiq.app/c/priya-r
              <span className="mi" style={{ fontSize: 18, color: '#1A56DB' }}>content_copy</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Btn variant="tonal" size="sm" icon="share" style={{ flex: 1 }}>Share</Btn>
              <Btn variant="outlined" size="sm" icon="qr_code" style={{ flex: 1 }}>QR</Btn>
            </div>
          </Card>
        </div>
      </div>
    </WebShellAgent>
  );
}

// ─── 13 Agent · Profile editor (public-facing card) ───────────────────────
function WAgentProfileEditor() {
  return (
    <WebShellAgent active="settings">
      <div style={{ padding: '28px 32px 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div>
          <div style={{ font: '500 12px/1 Inter', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase' }}>Public profile</div>
          <div style={{ font: '800 28px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 6, letterSpacing: '-0.02em' }}>How clients see you</div>
          <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>This is your VisaIQ marketplace card. Changes are reviewed and live within 2 hours.</div>

          {/* Identity */}
          <Card padding={20} elevation={1} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '800 26px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
              <div style={{ flex: 1 }}>
                <Input label="Display name" value="Priya Raghavan"/>
              </div>
              <div style={{ flex: 1 }}>
                <Input label="Headline" value="UK & Schengen visa specialist"/>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ font: '500 12px/1.4 Inter', color: '#475569', marginBottom: 6 }}>Bio · 280 chars</div>
              <div style={{ minHeight: 100, border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 12, font: '400 13px/1.6 Inter', color: '#0F172A', background: '#fff' }}>
                Former UKVI case officer (2015–2019), now an independent consultant on the VisaIQ network. I specialize in family + tourist visas and refusal-appeal cases for UK and Schengen. Your application will look <em>good</em>.
              </div>
              <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', marginTop: 6, textAlign: 'right' }}>248 / 280</div>
            </div>
          </Card>

          {/* Specialties */}
          <Card padding={20} elevation={1} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Specialties</div>
              <Btn variant="text" size="sm" icon="add">Add</Btn>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {[
                { l: 'UK Visitor', cc: 'GB' },
                { l: 'Schengen Tourist', cc: 'FR' },
                { l: 'Schengen Student', cc: 'FR' },
                { l: 'USA B1/B2', cc: 'US' },
                { l: 'UKVI complex cases', primary: true },
                { l: 'Refusal appeals', primary: true },
              ].map((t, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: t.primary ? '#FAF5FF' : '#EFF6FF', color: t.primary ? '#6D28D9' : '#1547C0', borderRadius: 999, font: '600 12px/1 Inter', border: t.primary ? '1px solid #DDD6FE' : '1px solid #DBEAFE' }}>
                  {t.cc && <span style={{ fontSize: 14 }}>{flag(t.cc)}</span>}
                  {t.l}
                  <span className="mi" style={{ fontSize: 14, cursor: 'pointer' }}>close</span>
                </span>
              ))}
            </div>
          </Card>

          {/* Credentials list */}
          <Card padding={0} elevation={1} style={{ marginTop: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Credentials & verifications</div>
              <Btn variant="text" size="sm" icon="add">Add credential</Btn>
            </div>
            {[
              { i: 'verified', t: 'ICCRC Certified · R504218', d: 'Verified by VisaIQ · expires Dec 2026', ok: true, doc: 'iccrc-cert.pdf' },
              { i: 'school', t: 'Law degree · Univ. of Bristol', d: 'Verified · 2014', ok: true, doc: 'transcript.pdf' },
              { i: 'work_history', t: 'UKVI case officer · 4 years', d: 'Reference: M. Henderson', ok: true, doc: '—' },
              { i: 'language', t: 'Languages: English, Hindi, Tamil, basic French', d: 'Self-declared', ok: true, doc: '—' },
              { i: 'hourglass_empty', t: 'Background check', d: 'Renewing · expected Mar 12', ok: false, doc: 'pending' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1.6fr 1fr 120px 100px', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: r.ok ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: r.ok ? '#10B981' : '#D97706' }}>{r.i}</span>
                </div>
                <div>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.d}</div>
                </div>
                <div style={{ font: '500 12px/1 JetBrains Mono', color: '#475569' }}>{r.doc}</div>
                <Chip tone={r.ok ? 'success' : 'warning'} size="sm">{r.ok ? 'Verified' : 'Pending'}</Chip>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <Btn variant="text" size="sm" icon="edit" style={{ padding: 0 }}/>
                  <Btn variant="text" size="sm" icon="delete_outline" style={{ padding: 0 }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right rail — live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Chip tone="info" size="sm" icon="visibility">Live preview</Chip>
          <Card padding={0} elevation={3} style={{ overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(155deg, #0F172A, #7C3AED)', color: '#fff', padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(245,158,11,.18)' }}/>
              <Chip tone="success" size="sm" style={{ background: 'rgba(16,185,129,.2)', color: '#34D399', position: 'relative' }}>● Online now</Chip>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, position: 'relative' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '800 22px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,.2)' }}>PR</div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '800 18px/1.2 Plus Jakarta Sans' }}>Priya Raghavan</div>
                  <div style={{ font: '500 11px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>UK & Schengen visa specialist</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <span className="mi" style={{ fontSize: 14, color: '#F59E0B' }}>star</span>
                    <span style={{ font: '700 13px/1 Plus Jakarta Sans' }}>4.92</span>
                    <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.5)' }}>(284) · $1.20/min</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                <Chip tone="info" size="sm">{flag('GB')} UK</Chip>
                <Chip tone="info" size="sm">{flag('FR')} Schengen</Chip>
                <Chip tone="info" size="sm">{flag('US')} B1/B2</Chip>
                <Chip tone="ai" size="sm">Refusal appeals</Chip>
              </div>
              <div style={{ font: '400 12px/1.6 Inter', color: '#475569', marginBottom: 16 }}>Former UKVI case officer (2015–2019)…</div>
              <Btn variant="primary" full icon="videocam">Book a session</Btn>
              <Btn variant="outlined" full icon="chat_bubble_outline" style={{ marginTop: 8 }}>Send a message</Btn>
            </div>
          </Card>
          <Card padding={16} elevation={1}>
            <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Tips for a great profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {[
                { ok: true, t: 'Headline mentions specialty' },
                { ok: true, t: 'Bio under 280 chars' },
                { ok: true, t: 'At least 3 verified credentials' },
                { ok: false, t: 'Profile photo professional' },
                { ok: true, t: 'Specialties cover top 3 countries' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 12px/1.4 Inter', color: r.ok ? '#475569' : '#9A3412' }}>
                  <span className="mi" style={{ fontSize: 16, color: r.ok ? '#10B981' : '#F59E0B' }}>{r.ok ? 'check_circle' : 'warning_amber'}</span>
                  {r.t}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: 10, background: '#FAF5FF', borderRadius: 8, font: '500 11px/1.4 Inter', color: '#6D28D9', display: 'flex', gap: 8 }}>
              <span className="mi" style={{ fontSize: 14, marginTop: 1 }}>lightbulb</span>
              <span>Profiles with photos earn 24% more on average.</span>
            </div>
          </Card>
        </div>
      </div>
    </WebShellAgent>
  );
}

// ─── 14 B2B Employee · Web view (for completeness) ─────────────────────────
function WEmployeeDash() {
  return (
    <WebShell role="b2b" active="home">
      <div style={{ padding: '28px 32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Chip tone="ai" size="sm">Employee view · Acme Corp</Chip>
            <div style={{ font: '800 32px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 10, letterSpacing: '-0.02em' }}>Hi Maria — 2 visa tasks today</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Anita Verma is your HR manager · everything you upload is auto-shared with her.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outlined" icon="chat_bubble_outline">Message HR</Btn>
            <Btn variant="primary" icon="upload_file">Upload doc</Btn>
          </div>
        </div>

        {/* Top alert */}
        <Card padding={20} elevation={2} accent="#F97316" style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mi" style={{ fontSize: 28, color: '#F97316' }}>schedule</span>
          </div>
          <div style={{ flex: 1 }}>
            <Chip tone="error" size="sm">DUE IN 5 DAYS</Chip>
            <div style={{ font: '700 18px/1.3 Plus Jakarta Sans', color: '#0F172A', marginTop: 6 }}>HR needs 2 documents from you for Germany Schengen</div>
            <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 2 }}>Bank statement · October · paid hotel confirmation</div>
          </div>
          <Btn variant="primary" size="lg" icon="upload_file">Upload now</Btn>
        </Card>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 20 }}>
          {[
            { l: 'Active applications', v: '2', sub: '1 needs you', c: '#1A56DB', i: 'folder_open' },
            { l: 'Tasks open', v: '2', sub: 'Due Mar 18 + 19', c: '#F97316', i: 'checklist' },
            { l: 'Profile', v: '92%', sub: 'Add resume', c: '#10B981', i: 'person' },
            { l: 'Days to travel', v: '47', sub: 'Berlin', c: '#7C3AED', i: 'flight_takeoff' },
          ].map((k, i) => (
            <Card key={i} padding={18} elevation={1}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${k.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 22, color: k.c }}>{k.i}</span>
              </div>
              <div style={{ font: '800 28px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 14 }}>{k.v}</div>
              <div style={{ font: '500 12px/1.3 Inter', color: '#64748B', marginTop: 4 }}>{k.l}</div>
              <div style={{ font: '500 11px/1 Inter', color: k.c, marginTop: 6 }}>{k.sub}</div>
            </Card>
          ))}
        </div>

        {/* Two-up: assigned apps + HR + tasks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 20 }}>
          <Card padding={0} elevation={1}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Your assigned applications</div>
              <Btn variant="text" size="sm" trailing="arrow_forward">See all</Btn>
            </div>
            {[
              { cc: 'DE', t: 'Germany · Schengen Tourist', sc: 74, dt: 'Mar 22 · in 5d', sub: '2 docs missing', tone: 'warning', urg: true, pct: 67 },
              { cc: 'US', t: 'USA · B1 Business', sc: 88, dt: 'Apr 14 · in 27d', sub: 'On track', tone: 'success', pct: 88 },
            ].map((a, i, arr) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{flag(a.cc)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{a.t}</div>
                    <div style={{ font: '400 12px/1.3 Inter', color: a.urg ? '#DC2626' : '#64748B', marginTop: 2 }}>{a.sub} · {a.dt}</div>
                  </div>
                  <ScoreRing value={a.sc} size={48} stroke={5}/>
                  <Chip tone={a.tone} size="sm">{a.tone === 'success' ? 'Ready' : 'Action needed'}</Chip>
                  <Btn variant="text" size="sm" trailing="chevron_right">Open</Btn>
                </div>
                <div style={{ marginTop: 12, height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: a.tone === 'success' ? '#10B981' : '#F97316', borderRadius: 3 }}/>
                </div>
              </div>
            ))}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card padding={18} elevation={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', font: '700 15px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  AV
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#10B981', border: '2px solid #fff' }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Anita Verma · HR</div>
                  <div style={{ font: '400 11px/1.4 Inter', color: '#10B981', marginTop: 2 }}>● Online · replies in 1h</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Btn variant="tonal" size="sm" icon="chat_bubble_outline" style={{ flex: 1 }}>Message</Btn>
                <Btn variant="outlined" size="sm" icon="phone" style={{ flex: 1 }}>Call</Btn>
              </div>
            </Card>
            <Card padding={0} elevation={1}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Open tasks</div>
              </div>
              {[
                { t: 'Upload bank statement · Oct', d: 'Due Mar 18 · 1d', i: 'account_balance', c: '#EF4444' },
                { t: 'Upload paid hotel confirmation', d: 'Due Mar 19 · 2d', i: 'hotel', c: '#F59E0B' },
                { t: 'Add resume to profile', d: 'Optional', i: 'description', c: '#94A3B8' },
              ].map((t, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                  <span className="mi" style={{ fontSize: 18, color: t.c }}>{t.i}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>{t.t}</div>
                    <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8' }}>{t.d}</div>
                  </div>
                  <Btn variant="tonal" size="sm">Do</Btn>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </WebShell>
  );
}

Object.assign(window, { WAgentLiveCall, WAgentClients, WAgentSchedule, WAgentProfileEditor, WEmployeeDash });
