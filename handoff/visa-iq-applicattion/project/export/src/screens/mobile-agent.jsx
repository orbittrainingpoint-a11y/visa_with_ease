/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Agent / Consultant mobile app

const AgentNav = ({ active = 0 }) => (
  <BottomNav active={active} items={[
    { label: 'Queue', icon: 'inbox', active: 'inbox', badge: 4 },
    { label: 'Clients', icon: 'group', active: 'group' },
    { label: 'Chats', icon: 'forum', active: 'forum', badge: 7 },
    { label: 'Earnings', icon: 'savings', active: 'savings' },
    { label: 'Profile', icon: 'person_outline', active: 'person' },
  ]}/>
);

// ─── Agent Dashboard / Queue ───────────────────────────────────────────────
function AgentQueue() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: '#0F172A', color: '#fff', padding: '0 0 14px' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px/1 Inter' }}>PR</div>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{ font: '600 14px/1 Inter' }}>Priya Raghavan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,.3)' }}/>
              <span style={{ font: '500 11px/1 Inter', color: '#10B981' }}>Online · accepting</span>
            </div>
          </div>
          <div style={{ width: 50, height: 28, borderRadius: 14, background: '#10B981', padding: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff' }}/>
          </div>
        </div>
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.5)', letterSpacing: 1, textTransform: 'uppercase' }}>Today</div>
          <div style={{ font: '800 24px/1.2 Plus Jakarta Sans', marginTop: 4 }}>$ 184.20 earned</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
            {[
              { l: 'Active calls', v: '1' },
              { l: 'Reviews done', v: '7' },
              { l: 'Rating today', v: '5.0 ★' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#fff' }}>{s.v}</div>
                <div style={{ font: '400 10px/1 Inter', color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 12px' }}>
        {/* Live now banner */}
        <Card padding={14} elevation={3} style={{ background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span className="mi" style={{ fontSize: 22, color: '#fff' }}>videocam</span>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #fff', opacity: 0.6 }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.2 Plus Jakarta Sans' }}>Live with Sarah Mitchell</div>
              <div style={{ font: '400 11px/1.3 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>France Schengen · 4:18 elapsed · $5.16 billed</div>
            </div>
            <Btn variant="dark" size="sm" style={{ background: '#fff', color: '#1A56DB' }}>Resume</Btn>
          </div>
        </Card>

        {/* Pending queue */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Incoming requests · 4</div>
            <Chip tone="info" size="sm">Auto-accept off</Chip>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: 'David Chen', cc: 'US', t: 'USA B1 Business', urg: 'NEW', m: 96, k: 'chat', wait: '12s' },
              { n: 'Maria Santos', cc: 'DE', t: 'Schengen · doc review', urg: 'HOT', m: 91, k: 'review', wait: '34s' },
              { n: 'Lin Wei', cc: 'CA', t: 'Canada TRV', urg: '', m: 84, k: 'chat', wait: '1m' },
              { n: 'Rahul Singh', cc: 'GB', t: 'UK Visitor', urg: '', m: 72, k: 'audit', wait: '3m' },
            ].map((r, i) => (
              <Card key={i} padding={14} elevation={1}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: ['#1A56DB','#10B981','#0EA5E9','#F59E0B'][i], color: '#fff', font: '700 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.n.split(' ').map(s=>s[0]).join('')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ font: '600 14px/1.2 Inter', color: '#0F172A' }}>{r.n}</div>
                      {r.urg && <Chip tone={r.urg === 'HOT' ? 'error' : 'info'} size="sm">{r.urg}</Chip>}
                    </div>
                    <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{flag(r.cc)}</span>{r.t}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <Chip tone="success" size="sm">{r.m}% match</Chip>
                      <span style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>· waiting {r.wait}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <Btn variant="outlined" size="sm" icon="close" style={{ flex: 0.4 }}>Pass</Btn>
                  <Btn variant="primary" size="sm" icon={r.k === 'chat' ? 'chat' : r.k === 'review' ? 'fact_check' : 'auto_awesome'} style={{ flex: 1 }}>
                    {r.k === 'chat' ? 'Start chat' : r.k === 'review' ? 'Review docs' : 'Open audit'}
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance card */}
        <Card padding={18} elevation={1} style={{ marginTop: 18 }}>
          <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 12 }}>This week</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { l: 'Hours', v: '32h', sub: '+6h vs last' },
              { l: 'Earnings', v: '$1,842', sub: '+$320' },
              { l: 'Avg rating', v: '4.92 ★', sub: 'Top 3%' },
              { l: 'Approval rate', v: '94%', sub: 'after your reviews' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{s.l}</div>
                <div style={{ font: '800 18px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 6 }}>{s.v}</div>
                <div style={{ font: '500 11px/1 Inter', color: '#10B981', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <AgentNav active={0}/>
    </PhoneBody>
  );
}

// ─── Agent Review — sees customer's documents & audit ──────────────────────
function AgentReview() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Maria Santos · Review" sub={`${flag('DE')} Germany · Schengen Tourist`} leading="arrow_back" trailing={[{ icon: 'phone' }, { icon: 'more_vert' }]}/>
      {/* customer summary */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card padding={14} elevation={2}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#10B981', color: '#fff', font: '700 16px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MS</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Maria Santos</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Acme Corp · Sales · {flag('IN')} Indian → {flag('DE')} Germany</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <Chip tone="warning" size="sm">Needs review</Chip>
                <Chip tone="ai" size="sm" icon="auto_awesome">AI score 74</Chip>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {/* AI summary */}
        <Card padding={14} elevation={1} style={{ background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AIBadge small/>
            <div style={{ font: '600 12px/1 Inter', color: '#6D28D9' }}>AI pre-review summary</div>
          </div>
          <div style={{ font: '400 12px/1.5 Inter', color: '#475569' }}>
            <strong style={{ color: '#0F172A' }}>2 issues blocking submission:</strong> hotel reservation unpaid · bank balance €4,120 below recommended €5,000. Other 4 docs cleared. Recommend re-upload of bank Oct + paid hotel confirm.
          </div>
        </Card>

        <div style={{ marginTop: 14, font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Documents · 6</div>
        {[
          { i: 'badge', n: 'Passport.pdf', sc: 92, st: 'pass' },
          { i: 'photo_camera_front', n: 'Photo.jpg', sc: 95, st: 'pass' },
          { i: 'account_balance', n: 'Bank-Oct-Nov-Dec.pdf', sc: 62, st: 'warn', note: 'AI flag: avg balance below threshold' },
          { i: 'work', n: 'Employment-Letter.pdf', sc: 88, st: 'pass' },
          { i: 'hotel', n: 'Hotel.pdf', sc: 48, st: 'fail', note: 'AI flag: held only, not paid' },
          { i: 'local_hospital', n: 'Insurance.pdf', sc: 91, st: 'pass' },
        ].map((d, i) => (
          <Card key={i} padding={12} elevation={1} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 48, borderRadius: 8, background: d.st === 'fail' ? '#FEE2E2' : d.st === 'warn' ? '#FEF3C7' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="mi" style={{ fontSize: 22, color: d.st === 'fail' ? '#DC2626' : d.st === 'warn' ? '#D97706' : '#059669' }}>{d.i}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.n}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: d.note ? '#B91C1C' : '#94A3B8', marginTop: 2 }}>{d.note || 'AI cleared'}</div>
              </div>
              <ScoreRing value={d.sc} size={36} stroke={4}/>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <Btn variant="text" size="sm" icon="visibility" style={{ flex: 1, padding: 0 }}>View</Btn>
              <Btn variant="text" size="sm" icon="thumb_up" style={{ flex: 1, padding: 0 }}>Approve</Btn>
              <Btn variant="text" size="sm" icon="comment" style={{ flex: 1, padding: 0 }}>Annotate</Btn>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ padding: 14, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
        <Btn variant="outlined" icon="chat_bubble_outline" style={{ flex: 1 }}>Chat with client</Btn>
        <Btn variant="primary" icon="task_alt" style={{ flex: 1 }}>Send review</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Agent Earnings ────────────────────────────────────────────────────────
function AgentEarnings() {
  const bars = [4, 6, 3, 8, 12, 9, 7];
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Earnings" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Card padding={18} elevation={3} style={{ background: 'linear-gradient(135deg,#0F172A,#1A56DB)', color: '#fff', border: 'none' }}>
          <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.6)', letterSpacing: 1, textTransform: 'uppercase' }}>Available balance</div>
          <div style={{ font: '800 36px/1 Plus Jakarta Sans', marginTop: 8 }}>$1,842.40</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn variant="gold" size="sm" icon="account_balance">Withdraw</Btn>
            <Btn variant="outlined" size="sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)' }}>History</Btn>
          </div>
          <div style={{ marginTop: 18, padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.6)' }}>Next payout</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span className="mi" style={{ fontSize: 18, color: '#F59E0B' }}>schedule</span>
              <span style={{ font: '600 13px/1.3 Inter' }}>Friday, Mar 8 · est. $2,140</span>
            </div>
          </div>
        </Card>

        {/* Weekly bar chart */}
        <Card padding={18} elevation={1} style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>This week</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>Mon → Sun · in $</div>
            </div>
            <Chip tone="success" size="sm" icon="trending_up">+22%</Chip>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, marginTop: 18 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: v * 9, borderRadius: '6px 6px 0 0', background: i === 5 ? '#1A56DB' : '#DBEAFE' }}/>
                <span style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>{'MTWTFSS'[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent transactions */}
        <div style={{ marginTop: 16, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px 8px' }}>Recent</div>
        <Card padding={0} elevation={1}>
          {[
            { t: 'Live call · 18m', n: 'Sarah Mitchell', v: '+$21.60', c: '#10B981', i: 'videocam' },
            { t: 'Doc review · 4 files', n: 'David Chen', v: '+$32.00', c: '#10B981', i: 'fact_check' },
            { t: 'Chat session · 12m', n: 'Lin Wei', v: '+$10.80', c: '#10B981', i: 'chat' },
            { t: 'Platform fee · 12%', n: 'VisaIQ', v: '−$7.74', c: '#EF4444', i: 'remove_circle' },
            { t: 'Tip', n: 'Maria Santos', v: '+$5.00', c: '#F59E0B', i: 'star' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${r.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 20, color: r.c }}>{r.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{r.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.n}</div>
              </div>
              <div style={{ font: '700 14px/1 JetBrains Mono', color: r.c }}>{r.v}</div>
            </div>
          ))}
        </Card>
      </div>
      <AgentNav active={3}/>
    </PhoneBody>
  );
}

Object.assign(window, { AgentQueue, AgentReview, AgentEarnings, AgentNav });
