/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody, AgentNav */
// Agent / Consultant — extra MOBILE screens
// Live call, schedule, chats, client detail, profile

// ─── 04 Agent · Live Call (in-session) ─────────────────────────────────────
function AgentLiveCall() {
  return (
    <PhoneBody bg="#0F172A" surface="#0F172A">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 8px', color: '#fff', flexShrink: 0 }}>
        <button style={{ width: 36, height: 36, border: 0, background: 'rgba(255,255,255,.08)', borderRadius: 18 }}>
          <span className="mi" style={{ fontSize: 18, color: '#fff' }}>expand_more</span>
        </button>
        <div style={{ flex: 1, paddingLeft: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#EF4444', boxShadow: '0 0 0 4px rgba(239,68,68,.25)' }}/>
            <span style={{ font: '600 12px/1 Inter', color: '#EF4444' }}>REC · 04:18</span>
          </div>
          <div style={{ font: '700 14px/1 Plus Jakarta Sans', marginTop: 4 }}>Live with Sarah Mitchell</div>
        </div>
        <div style={{ padding: '4px 10px', background: 'rgba(16,185,129,.2)', borderRadius: 12, color: '#34D399', font: '700 11px/1 JetBrains Mono' }}>$5.16</div>
      </div>

      {/* Video tile */}
      <div style={{ margin: '0 12px', borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #1E293B, #475569)', height: 290, position: 'relative', flexShrink: 0 }}>
        {/* fake video — silhouette + initials */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', font: '800 36px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SM</div>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '6px 10px', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)', borderRadius: 8, font: '600 12px/1 Inter', color: '#fff' }}>
          Sarah Mitchell · {flag('FR')} France
        </div>
        {/* self video */}
        <div style={{ position: 'absolute', top: 12, right: 12, width: 80, height: 110, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,.3)', background: 'linear-gradient(135deg,#7C3AED,#0EA5E9)' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 18px/1 Plus Jakarta Sans', color: '#fff' }}>PR</div>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '4px 8px', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)', borderRadius: 6, font: '500 10px/1 Inter', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="mi" style={{ fontSize: 12, color: '#10B981' }}>signal_cellular_alt</span>HD
        </div>
      </div>

      {/* AI insights */}
      <div style={{ margin: '12px 12px 0', padding: 14, background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.3)', borderRadius: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <AIBadge small/>
          <div style={{ font: '600 11px/1 Inter', color: '#A78BFA' }}>Live transcript · 87% conf</div>
          <div style={{ flex: 1 }}/>
          <span style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.5)' }}>EN → EN</span>
        </div>
        <div style={{ font: '400 12px/1.5 Inter', color: 'rgba(255,255,255,.85)' }}>
          <strong style={{ color: '#fff' }}>Sarah:</strong> "…my hotel was on hold last time and HR said that was the issue, so what should I do this time?"
        </div>
        <div style={{ marginTop: 10, padding: 10, background: 'rgba(245,158,11,.1)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span className="mi" style={{ fontSize: 14, color: '#F59E0B', marginTop: 1 }}>tips_and_updates</span>
          <div style={{ flex: 1, font: '500 11px/1.4 Inter', color: '#FCD34D' }}>AI: ask if she has Booking.com or direct hotel — direct payments process faster</div>
        </div>
      </div>

      {/* Quick docs */}
      <div style={{ margin: '12px 12px 0', flex: 1, overflow: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ font: '700 12px/1 Plus Jakarta Sans', color: 'rgba(255,255,255,.7)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Sarah's documents</div>
          <span style={{ font: '500 11px/1 Inter', color: '#7C3AED' }}>Open audit</span>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[
            { i: 'badge', n: 'Passport', sc: 92, c: '#10B981' },
            { i: 'account_balance', n: 'Bank Oct', sc: 78, c: '#F59E0B' },
            { i: 'hotel', n: 'Hotel', sc: 48, c: '#EF4444' },
            { i: 'work', n: 'Employer', sc: 88, c: '#10B981' },
          ].map((d, i) => (
            <div key={i} style={{ flexShrink: 0, padding: 10, background: 'rgba(255,255,255,.05)', borderRadius: 12, width: 86, textAlign: 'center', border: `1px solid ${d.c}30` }}>
              <span className="mi" style={{ fontSize: 22, color: d.c }}>{d.i}</span>
              <div style={{ font: '600 11px/1.2 Inter', color: '#fff', marginTop: 4 }}>{d.n}</div>
              <div style={{ font: '700 12px/1 JetBrains Mono', color: d.c, marginTop: 2 }}>{d.sc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Call controls */}
      <div style={{ padding: '14px 12px 12px', display: 'flex', justifyContent: 'space-around', flexShrink: 0 }}>
        {[
          { i: 'mic', c: 'rgba(255,255,255,.1)', size: 50 },
          { i: 'videocam', c: 'rgba(255,255,255,.1)', size: 50 },
          { i: 'screen_share', c: 'rgba(124,58,237,.4)', size: 50 },
          { i: 'chat_bubble_outline', c: 'rgba(255,255,255,.1)', size: 50, badge: 3 },
          { i: 'call_end', c: '#EF4444', size: 58 },
        ].map((c, i) => (
          <button key={i} style={{ width: c.size, height: c.size, borderRadius: '50%', background: c.c, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span className="mi" style={{ fontSize: c.size > 50 ? 26 : 22, color: '#fff' }}>{c.i}</span>
            {c.badge && <span style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, background: '#EF4444', color: '#fff', font: '700 10px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0F172A' }}>{c.badge}</span>}
          </button>
        ))}
      </div>
    </PhoneBody>
  );
}

// ─── 05 Agent · Schedule / Calendar ────────────────────────────────────────
function AgentSchedule() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Schedule" sub="This week · 12 sessions" trailing={[{ icon: 'today' }, { icon: 'add' }]}/>
      {/* Week strip */}
      <div style={{ padding: '14px 8px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 12px 10px' }}>
          <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>March 2026</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="mi" style={{ fontSize: 20, color: '#475569' }}>chevron_left</span>
            <span className="mi" style={{ fontSize: 20, color: '#475569' }}>chevron_right</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 8px' }}>
          {[
            { d: 'Mo', n: '4', m: 1 },
            { d: 'Tu', n: '5', m: 3, today: true },
            { d: 'We', n: '6', m: 2 },
            { d: 'Th', n: '7', m: 4 },
            { d: 'Fr', n: '8', m: 2 },
            { d: 'Sa', n: '9', m: 0 },
            { d: 'Su', n: '10', m: 0 },
          ].map((d, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 4px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
              background: d.today ? '#1A56DB' : (d.m === 0 ? '#F8FAFC' : '#fff'),
              border: d.today ? '1px solid #1547C0' : '1px solid #F1F5F9',
            }}>
              <div style={{ font: '500 10px/1 Inter', color: d.today ? 'rgba(255,255,255,.7)' : '#94A3B8' }}>{d.d}</div>
              <div style={{ font: `700 16px/1 Plus Jakarta Sans`, color: d.today ? '#fff' : (d.m === 0 ? '#CBD5E1' : '#0F172A'), marginTop: 4 }}>{d.n}</div>
              {d.m > 0 && (
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {Array.from({ length: Math.min(d.m, 3) }).map((_, j) => (
                    <span key={j} style={{ width: 4, height: 4, borderRadius: 2, background: d.today ? '#fff' : ['#7C3AED', '#10B981', '#0EA5E9'][j] }}/>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Today summary */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <Card padding={14} elevation={2} style={{ background: 'linear-gradient(135deg,#0F172A,#1A56DB)', color: '#fff', border: 'none' }}>
          <Chip tone="success" size="sm" style={{ background: 'rgba(16,185,129,.2)', color: '#34D399' }} icon="bolt">Auto-accept on</Chip>
          <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', marginTop: 10 }}>Tuesday · 3 sessions today</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div><div style={{ font: '800 18px/1 Plus Jakarta Sans' }}>2h 14m</div><div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Booked time</div></div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }}/>
            <div><div style={{ font: '800 18px/1 Plus Jakarta Sans', color: '#10B981' }}>$184</div><div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Earned today</div></div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }}/>
            <div><div style={{ font: '800 18px/1 Plus Jakarta Sans' }}>5</div><div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Free slots</div></div>
          </div>
        </Card>
      </div>

      {/* Today list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 16px' }}>
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Today's sessions</div>
        {[
          { t: '11:00', dur: '30m', n: 'Sarah Mitchell', cc: 'FR', type: 'Live call · pre-submit', tone: 'success', tag: 'NOW · 4:18', live: true },
          { t: '14:00', dur: '20m', n: 'David Chen', cc: 'US', type: 'Doc review · B1', tone: 'info', tag: 'In 1h' },
          { t: '15:30', dur: '15m', n: 'Lin Wei', cc: 'CA', type: 'Chat session · TRV', tone: 'neutral', tag: 'In 3h' },
          { t: '17:00', dur: '60m', n: 'Marcus Köhler', cc: 'DE', type: 'Onboarding · new client', tone: 'ai', tag: 'In 5h', new: true },
        ].map((s, i) => (
          <Card key={i} padding={0} elevation={1} style={{ marginBottom: 10, overflow: 'hidden', borderLeft: s.live ? '4px solid #EF4444' : '4px solid transparent' }}>
            <div style={{ display: 'flex', padding: '14px 14px' }}>
              <div style={{ width: 58, flexShrink: 0 }}>
                <div style={{ font: '800 18px/1 Plus Jakarta Sans', color: '#0F172A' }}>{s.t}</div>
                <div style={{ font: '500 11px/1.3 Inter', color: '#64748B', marginTop: 4 }}>{s.dur}</div>
              </div>
              <div style={{ width: 1, background: '#F1F5F9', margin: '0 12px' }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{s.n}</div>
                  {s.new && <Chip tone="ai" size="sm">NEW</Chip>}
                </div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14 }}>{flag(s.cc)}</span>{s.type}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Chip tone={s.tone} size="sm">{s.tag}</Chip>
                  {s.live ? <Btn variant="destruct" size="sm" icon="videocam">Resume</Btn> : <Btn variant="text" size="sm" trailing="chevron_right" style={{ padding: 0 }}>Open</Btn>}
                </div>
              </div>
            </div>
          </Card>
        ))}

        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Tomorrow · 4 sessions</div>
        {[
          { t: '9:00', n: 'Amir Hossein', type: 'Audit override', cc: 'AE' },
          { t: '11:30', n: 'Sofia Kim', type: 'Pre-submit chat', cc: 'JP' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ font: '600 13px/1 JetBrains Mono', color: '#475569', width: 50 }}>{s.t}</div>
            <span style={{ fontSize: 20 }}>{flag(s.cc)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>{s.n}</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8' }}>{s.type}</div>
            </div>
            <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>
          </div>
        ))}
      </div>
      <AgentNav active={1}/>
    </PhoneBody>
  );
}

// ─── 06 Agent · Chat list (conversations) ──────────────────────────────────
function AgentChats() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Conversations" sub="7 active · 2 unread" trailing={[{ icon: 'search' }, { icon: 'filter_list' }]}/>
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', overflowX: 'auto', flexShrink: 0 }}>
        {[['All', true], ['Unread · 2', false], ['Paid · 3', false], ['Free · 4', false]].map(([l, on], i) => (
          <Chip key={i} tone={on ? 'royal' : 'neutral'} size="sm">{l}</Chip>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {[
          { n: 'Sarah Mitchell', cc: 'FR', last: 'Yes, refundable is fine — but it needs to say PAID', t: 'Live · now', unread: 0, live: true, c: '#F59E0B' },
          { n: 'David Chen', cc: 'US', last: 'Thanks — I\'ll re-upload the I-94 by tonight', t: '12m', unread: 2, c: '#1A56DB' },
          { n: 'Maria Santos', cc: 'DE', last: 'Your review is in, take a look 👀', t: '1h', unread: 0, c: '#10B981' },
          { n: 'Lin Wei', cc: 'CA', last: 'Question: do I need a separate Quebec doc?', t: '2h', unread: 1, c: '#0EA5E9' },
          { n: 'Rahul Singh', cc: 'GB', last: 'Voice message · 2:14', t: 'Yesterday', voice: true, unread: 0, c: '#EF4444' },
          { n: 'Amir Hossein', cc: 'AE', last: 'You: All set for Tuesday at 9!', t: 'Yesterday', me: true, c: '#7C3AED' },
          { n: 'Sofia Kim', cc: 'JP', last: 'Got it, thank you so much!', t: '2d', c: '#EC4899' },
        ].map((c, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F1F5F9' : 'none', background: c.unread ? '#EFF6FF' : (c.live ? '#FEF3C7' : '#fff') }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.c, color: '#fff', font: '700 15px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.n.split(' ').map(s=>s[0]).join('')}</div>
              {c.live && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 11, color: '#fff' }}>videocam</span>
              </div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <div style={{ font: `${c.unread ? 700 : 600} 14px/1.2 Inter`, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14 }}>{flag(c.cc)}</span>{c.n}
                </div>
                <div style={{ font: `${c.unread ? 700 : 500} 11px/1 Inter`, color: c.live ? '#DC2626' : (c.unread ? '#1A56DB' : '#94A3B8'), flexShrink: 0 }}>{c.t}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {c.voice && <span className="mi" style={{ fontSize: 14, color: '#7C3AED' }}>mic</span>}
                {c.me && <span className="mi" style={{ fontSize: 14, color: '#94A3B8' }}>done_all</span>}
                <div style={{ flex: 1, font: `${c.unread ? 600 : 400} 12px/1.4 Inter`, color: c.unread ? '#0F172A' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                {c.unread > 0 && <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#1A56DB', color: '#fff', font: '700 10px/1 Inter', padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.unread}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <AgentNav active={2}/>
    </PhoneBody>
  );
}

// ─── 07 Agent · Client detail (CRM view) ───────────────────────────────────
function AgentClient() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Sarah Mitchell" leading="arrow_back" trailing={[{ icon: 'phone' }, { icon: 'chat_bubble_outline' }, { icon: 'more_vert' }]}/>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(155deg, #0F172A, #1A56DB)', padding: '14px 16px 22px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', font: '800 20px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,.15)' }}>SM</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '800 18px/1.2 Plus Jakarta Sans' }}>Sarah Mitchell</div>
            <div style={{ font: '500 11px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{flag('GB')} British → {flag('FR')} France · client since Jan 2026</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <Chip tone="gold" size="sm" icon="workspace_premium" style={{ background: 'rgba(245,158,11,.2)', color: '#FCD34D' }}>VIP · $1.20/min</Chip>
              <Chip tone="success" size="sm" style={{ background: 'rgba(16,185,129,.2)', color: '#34D399' }}>Live now</Chip>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
          {[
            { l: 'Sessions', v: '3' },
            { l: 'Spent', v: '$184' },
            { l: 'Rating', v: '5.0 ★' },
          ].map(s => (
            <div key={s.l} style={{ padding: 10, background: 'rgba(255,255,255,.08)', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ font: '800 18px/1 Plus Jakarta Sans' }}>{s.v}</div>
              <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 16px' }}>
        {/* Active application */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Active application</div>
        <Card padding={14} elevation={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{flag('FR')}</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>France Schengen Tourist</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Deadline Mar 15 · 12 days</div>
            </div>
            <ScoreRing value={87} size={48} stroke={5}/>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <Btn variant="tonal" size="sm" icon="fact_check" style={{ flex: 1 }}>Audit</Btn>
            <Btn variant="tonal" size="sm" icon="description" style={{ flex: 1 }}>6 docs</Btn>
            <Btn variant="tonal" size="sm" icon="auto_awesome" style={{ flex: 1 }}>AI summary</Btn>
          </div>
        </Card>

        {/* Session history */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Session history</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'videocam', t: 'Live call · pre-submit', d: 'Today · 4:18 elapsed', v: '+$5.16', c: '#7C3AED' },
            { i: 'fact_check', t: 'Document review · 4 files', d: 'Yesterday · 22m', v: '+$32.00', c: '#1A56DB' },
            { i: 'chat', t: 'Chat session', d: 'Jan 28 · 18m', v: '+$21.60', c: '#0EA5E9' },
            { i: 'auto_awesome', t: 'AI audit override', d: 'Jan 22 · 6m', v: '+$18.00', c: '#10B981' },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 20, color: s.c }}>{s.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{s.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{s.d}</div>
              </div>
              <div style={{ font: '700 13px/1 JetBrains Mono', color: '#10B981' }}>{s.v}</div>
            </div>
          ))}
        </Card>

        {/* Quick notes */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Private notes</div>
        <Card padding={14} elevation={1}>
          <div style={{ font: '400 12px/1.5 Inter', color: '#475569' }}>
            • First-time Schengen applicant, anxious type — explain things thoroughly<br/>
            • Travels with husband, kids in school — prefers evening slots<br/>
            • Sensitive about money topics; bank statement is below comfort
          </div>
          <Btn variant="text" size="sm" icon="edit" style={{ marginTop: 8, padding: 0 }}>Edit notes</Btn>
        </Card>
      </div>
    </PhoneBody>
  );
}

// ─── 08 Agent · Profile (public-facing card + reviews) ────────────────────
function AgentProfile() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="My profile" leading="arrow_back" trailing={[{ icon: 'share' }, { icon: 'edit' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Public preview banner */}
        <div style={{ background: 'linear-gradient(155deg, #0F172A 0%, #7C3AED 100%)', padding: '20px 20px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(245,158,11,.18)' }}/>
          <Chip tone="ai" size="sm" icon="visibility" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', position: 'relative' }}>Public preview</Chip>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '800 22px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,.2)' }}>PR</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '800 20px/1.2 Plus Jakarta Sans' }}>Priya Raghavan</div>
              <div style={{ font: '500 12px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>UK & Schengen visa specialist · 7 yrs · ICCRC certified</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <span className="mi" style={{ fontSize: 14, color: '#F59E0B' }}>star</span>
                <span style={{ font: '700 13px/1 Plus Jakarta Sans' }}>4.92</span>
                <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.6)' }}>(284 reviews)</span>
                <span style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.6)' }}>· $1.20/min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ padding: '0 16px', marginTop: -20 }}>
          <Card padding={14} elevation={3}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
              {[
                { l: 'Approval rate', v: '94%' },
                { l: 'Avg response', v: '47s' },
                { l: 'Clients helped', v: '1.2k' },
                { l: 'Languages', v: '4' },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ font: '800 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>{s.v}</div>
                  <div style={{ font: '500 10px/1.3 Inter', color: '#94A3B8', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ padding: '14px 16px 16px' }}>
          {/* Specialties */}
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Specialties</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            <Chip tone="info" size="md">{flag('GB')} UK Visitor</Chip>
            <Chip tone="info" size="md">{flag('FR')} Schengen Tourist</Chip>
            <Chip tone="info" size="md">{flag('FR')} Schengen Student</Chip>
            <Chip tone="info" size="md">{flag('US')} B1/B2</Chip>
            <Chip tone="info" size="md">UKVI complex cases</Chip>
            <Chip tone="info" size="md">Refusal appeals</Chip>
          </div>

          {/* About */}
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>About</div>
          <Card padding={14} elevation={1} style={{ marginBottom: 16 }}>
            <div style={{ font: '400 13px/1.6 Inter', color: '#475569' }}>
              Former UKVI case officer (2015–2019), now an independent consultant on the VisaIQ network. I specialize in family + tourist visas and refusal-appeal cases for UK and Schengen. I'm a coffee snob and a recovering paperwork purist — your application will look <em>good</em>.
            </div>
          </Card>

          {/* Credentials */}
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Credentials & verifications</div>
          <Card padding={0} elevation={1} style={{ marginBottom: 16 }}>
            {[
              { i: 'verified', t: 'ICCRC Certified · ID R504218', d: 'Verified by VisaIQ · expires Dec 2026', ok: true },
              { i: 'school', t: 'Law degree · Univ. of Bristol', d: 'Verified · 2014', ok: true },
              { i: 'work_history', t: 'UKVI case officer · 4 years', d: 'Verified by reference', ok: true },
              { i: 'language', t: 'Languages: English, Hindi, Tamil, basic French', d: 'Self-declared', ok: true },
              { i: 'pending', t: 'Background check', d: 'Renewing · expected Mar 12', ok: false },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: r.ok ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: r.ok ? '#10B981' : '#D97706' }}>{r.i}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.d}</div>
                </div>
              </div>
            ))}
          </Card>

          {/* Recent reviews */}
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Recent reviews</div>
          {[
            { n: 'Sarah M.', stars: 5, t: '"Priya spotted my hotel issue in 30 seconds — saved my visa!"', d: '12m ago', cc: 'GB' },
            { n: 'David C.', stars: 5, t: '"Calm, fast, and very specific. Exactly what I needed before my B1 interview."', d: 'Yesterday', cc: 'US' },
          ].map((r, i) => (
            <Card key={i} padding={14} elevation={1} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A56DB', color: '#fff', font: '700 11px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.n.split('.')[0][0]}</div>
                <div style={{ flex: 1, font: '600 12px/1.3 Inter', color: '#0F172A' }}>{r.n} <span style={{ fontSize: 14 }}>{flag(r.cc)}</span></div>
                <div style={{ display: 'flex', color: '#F59E0B' }}>{Array.from({length: r.stars}).map((_,j) => <span key={j} className="mi" style={{ fontSize: 14 }}>star</span>)}</div>
              </div>
              <div style={{ font: '400 12px/1.5 Inter', color: '#475569', marginTop: 8, fontStyle: 'italic' }}>{r.t}</div>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', marginTop: 8 }}>{r.d}</div>
            </Card>
          ))}
        </div>
      </div>
      <AgentNav active={4}/>
    </PhoneBody>
  );
}

// ─── 09 Agent · Availability & rates settings ──────────────────────────────
function AgentSettings() {
  const Toggle = ({ on }) => (
    <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? '#1A56DB' : '#CBD5E1', padding: 2, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }}/>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Settings" leading="arrow_back"/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Online status */}
        <Card padding={16} elevation={2} style={{ background: 'linear-gradient(135deg,#0F172A,#1A56DB)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: '#10B981', boxShadow: '0 0 0 4px rgba(16,185,129,.3)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.3 Plus Jakarta Sans' }}>You're online and accepting</div>
              <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Auto-match on · 4 requests in queue</div>
            </div>
            <Toggle on={true}/>
          </div>
        </Card>

        {/* Hours */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Working hours · IST</div>
        <Card padding={0} elevation={1}>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d, i, arr) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ flex: 1, font: '600 13px/1.3 Inter', color: i >= 5 ? '#94A3B8' : '#0F172A' }}>{d}</div>
              <div style={{ font: '500 12px/1.3 Inter', color: i >= 5 ? '#94A3B8' : '#475569', fontFamily: i < 5 ? 'JetBrains Mono' : 'Inter' }}>
                {i >= 5 ? 'Off' : '9:00 — 18:00'}
              </div>
              <Toggle on={i < 5}/>
            </div>
          ))}
        </Card>

        {/* Rates */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Rates</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'videocam', t: 'Live call', v: '$1.20 / min', sub: 'Most popular · 60% of revenue' },
            { i: 'fact_check', t: 'Document review', v: '$32 flat', sub: 'Per application · 1-4 docs' },
            { i: 'chat', t: 'Chat session', v: '$0.60 / min', sub: 'Async chat · billed by minute' },
            { i: 'auto_awesome', t: 'AI audit override', v: '$18 flat', sub: 'Re-audit + verdict letter' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>{r.i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.sub}</div>
              </div>
              <div style={{ font: '700 13px/1 JetBrains Mono', color: '#0F172A', marginRight: 4 }}>{r.v}</div>
              <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>
            </div>
          ))}
        </Card>

        {/* Payouts */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Payouts & tax</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'account_balance', t: 'Bank account', sub: 'HDFC ****8421', v: 'Connected' },
            { i: 'description', t: 'Tax info', sub: 'PAN: ABCDE1234F', v: 'Complete' },
            { i: 'schedule', t: 'Payout schedule', sub: 'Friday · weekly', v: 'Edit' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <span className="mi" style={{ fontSize: 22, color: '#475569' }}>{r.i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.sub}</div>
              </div>
              <Chip tone={r.v === 'Connected' || r.v === 'Complete' ? 'success' : 'info'} size="sm">{r.v}</Chip>
            </div>
          ))}
        </Card>
        <div style={{ height: 16 }}/>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { AgentLiveCall, AgentSchedule, AgentChats, AgentClient, AgentProfile, AgentSettings });
