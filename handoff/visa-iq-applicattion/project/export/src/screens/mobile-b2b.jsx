/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Mobile Android — B2B HR Manager

const HRNav = ({ active = 0 }) => (
  <BottomNav active={active} items={[
    { label: 'Dashboard', icon: 'dashboard', active: 'dashboard' },
    { label: 'Team', icon: 'group', active: 'group' },
    { label: 'Upload', icon: 'upload_file', active: 'upload_file' },
    { label: 'Reports', icon: 'bar_chart', active: 'bar_chart' },
    { label: 'Settings', icon: 'settings', active: 'settings' },
  ]}/>
);

function MB2BDashboard() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: '#0B1F4B', color: '#fff', padding: '0 0 14px' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mi" style={{ fontSize: 20 }}>menu</span>
          </div>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.6)' }}>Acme Corp · HR</div>
            <div style={{ font: '700 14px/1.2 Inter' }}>Anita Verma</div>
          </div>
          <span className="mi" style={{ fontSize: 22, marginRight: 16 }}>search</span>
          <span className="mi" style={{ fontSize: 22 }}>notifications_outlined</span>
        </div>
        <div style={{ padding: '6px 20px 0' }}>
          <div style={{ font: '800 22px/1.2 Plus Jakarta Sans' }}>Team overview</div>
          <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>23 active visa applications</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 8px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: -28, position: 'relative' }}>
          {[
            { l: 'Active apps', v: '23', t: '+4', c: '#1A56DB' },
            { l: 'Ready to submit', v: '8', t: '+2', c: '#10B981' },
            { l: 'Need action', v: '5', t: '−1', c: '#F97316' },
            { l: 'Avg. score', v: '82', t: '+3.1', c: '#7C3AED' },
          ].map((k, i) => (
            <Card key={i} padding={14} elevation={3} style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -10, top: -10, width: 36, height: 36, borderRadius: '50%', background: `${k.c}15` }}/>
              <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>{k.l}</div>
              <div style={{ font: '800 28px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 8 }}>{k.v}</div>
              <div style={{ font: '600 11px/1 Inter', color: k.c, marginTop: 4 }}>{k.t} this week</div>
            </Card>
          ))}
        </div>

        {/* Upcoming deadlines */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Upcoming deadlines</div>
            <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>View all</span>
          </div>
          <Card padding={0} elevation={1}>
            {[
              { n: 'David Chen', d: 'USA · B1 Business', days: 3, sc: 92, c: '#10B981' },
              { n: 'Maria Santos', d: 'Germany · Schengen', days: 5, sc: 74, c: '#F97316' },
              { n: 'Rahul Singh', d: 'UK · Standard Visitor', days: 8, sc: 58, c: '#EF4444' },
              { n: 'Lin Wei', d: 'Canada · TRV', days: 12, sc: 88, c: '#1A56DB' },
            ].map((m, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${m.c}15`, color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px/1 Inter' }}>{m.n.split(' ').map(s=>s[0]).join('')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{m.n}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{m.d}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: m.days < 5 ? '#DC2626' : '#0F172A' }}>{m.days}d</div>
                  <div style={{ font: '500 10px/1 Inter', color: m.c, marginTop: 4 }}>score {m.sc}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Status donut */}
        <Card padding={18} elevation={2} style={{ marginTop: 16 }}>
          <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Status distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="18" fill="none" strokeDasharray="92 240" />
              <circle cx="50" cy="50" r="38" stroke="#1A56DB" strokeWidth="18" fill="none" strokeDasharray="80 240" strokeDashoffset="-92"/>
              <circle cx="50" cy="50" r="38" stroke="#F97316" strokeWidth="18" fill="none" strokeDasharray="40 240" strokeDashoffset="-172"/>
              <circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="18" fill="none" strokeDasharray="28 240" strokeDashoffset="-212"/>
            </svg>
            <div style={{ flex: 1 }}>
              {[
                { c: '#10B981', l: 'Ready / submitted', v: '8' },
                { c: '#1A56DB', l: 'In progress', v: '7' },
                { c: '#F97316', l: 'Needs action', v: '5' },
                { c: '#E2E8F0', l: 'Not started', v: '3' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: r.c }}/>
                  <div style={{ flex: 1, font: '500 12px/1 Inter', color: '#475569' }}>{r.l}</div>
                  <div style={{ font: '700 12px/1 Inter', color: '#0F172A' }}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <HRNav active={0}/>
    </PhoneBody>
  );
}

function MB2BTeam() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Team" sub="23 employees" trailing={[{ icon: 'filter_list' }, { icon: 'add', badge: '' }]}/>
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 14px', height: 40, borderRadius: 20, background: '#F1F5F9', alignItems: 'center' }}>
          <span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
          <span style={{ font: '400 13px/1 Inter', color: '#94A3B8', flex: 1 }}>Search employees…</span>
          <Chip tone="info" size="sm" icon="filter_list">3 filters</Chip>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', overflowX: 'auto', flexShrink: 0 }}>
        {[['All', true], ['Engineering', false], ['Sales', false], ['Marketing', false], ['Ops', false]].map(([l, on], i) => (
          <Chip key={i} tone={on ? 'royal' : 'neutral'} size="sm">{l}</Chip>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 'David Chen', r: 'Senior Engineer', d: { cc: 'US', t: 'B1 Business', dt: 'Mar 18' }, sc: 92, st: 'success' },
            { n: 'Maria Santos', r: 'Account Manager', d: { cc: 'DE', t: 'Schengen', dt: 'Mar 22' }, sc: 74, st: 'warning' },
            { n: 'Rahul Singh', r: 'Product Lead', d: { cc: 'GB', t: 'UK Visitor', dt: 'Mar 26' }, sc: 58, st: 'warning' },
            { n: 'Lin Wei', r: 'Designer', d: { cc: 'CA', t: 'TRV', dt: 'Apr 02' }, sc: 88, st: 'info' },
            { n: 'Amir Hossein', r: 'Data Scientist', d: { cc: 'AE', t: 'Tourist', dt: 'Apr 05' }, sc: 100, st: 'success' },
          ].map((e, i) => (
            <Card key={i} padding={14} elevation={1}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: ['#1A56DB','#10B981','#F97316','#7C3AED','#0EA5E9'][i%5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 14px/1 Inter' }}>{e.n.split(' ').map(s=>s[0]).join('')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 14px/1.2 Inter', color: '#0F172A' }}>{e.n}</div>
                  <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 1 }}>{e.r}</div>
                </div>
                <ScoreRing value={e.sc} size={40} stroke={4}/>
              </div>
              <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{flag(e.d.cc)}</span>
                <div style={{ flex: 1, font: '500 12px/1.3 Inter', color: '#475569' }}>{e.d.t} · deadline {e.d.dt}</div>
                <Chip tone={e.st} size="sm">{e.st === 'success' ? 'Ready' : e.st === 'warning' ? 'Attention' : 'In progress'}</Chip>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <HRNav active={1}/>
    </PhoneBody>
  );
}

function MB2BBulk() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Bulk upload" leading="arrow_back" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Card padding={16} elevation={2} style={{ background: 'linear-gradient(135deg,#1A56DB,#7C3AED)', color: '#fff', border: 'none' }}>
          <Chip tone="ai" size="sm" icon="auto_awesome" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>AI matching</Chip>
          <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', marginTop: 10 }}>Upload many documents at once</div>
          <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.75)', marginTop: 6 }}>AI matches uploaded files to employees by name and document type — you confirm any uncertain ones.</div>
        </Card>
        {/* Upload zone */}
        <div style={{ marginTop: 16, height: 160, borderRadius: 16, border: '2px dashed #93C5FD', background: '#EFF6FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="mi" style={{ fontSize: 40, color: '#1A56DB' }}>upload_file</span>
          <div style={{ font: '700 14px/1.3 Inter', color: '#1547C0' }}>Drop files or browse</div>
          <div style={{ font: '400 11px/1.3 Inter', color: '#64748B' }}>Up to 50 files · PDF/JPG/PNG</div>
        </div>
        {/* Queue */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Audit queue · 12 files</div>
            <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>4 done · 3 active · 5 queued</span>
          </div>
          <Card padding={0} elevation={1}>
            {[
              { n: 'Chen-Passport.pdf', e: 'David Chen', st: 'done', sc: 94 },
              { n: 'Chen-BankStatement.pdf', e: 'David Chen', st: 'done', sc: 88 },
              { n: 'Santos-Passport.pdf', e: 'Maria Santos', st: 'done', sc: 78 },
              { n: 'IMG_4421.jpg', e: 'Unmatched · needs assignment', st: 'unmatch' },
              { n: 'Singh-EmpLetter.pdf', e: 'Rahul Singh', st: 'active' },
              { n: 'Wei-Insurance.pdf', e: 'Lin Wei', st: 'active' },
              { n: 'Hossein-Bank.pdf', e: 'Amir Hossein', st: 'queue' },
            ].map((f, i, arr) => {
              const sm = { done: { c: '#10B981', l: 'Audited', i: 'check_circle' }, active: { c: '#7C3AED', l: 'Auditing…', i: 'autorenew' }, queue: { c: '#94A3B8', l: 'In queue', i: 'schedule' }, unmatch: { c: '#F97316', l: 'Match needed', i: 'help' } }[f.st];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${sm.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mi" style={{ fontSize: 18, color: sm.c }}>{sm.i}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.n}</div>
                    <div style={{ font: '400 11px/1.3 Inter', color: f.st === 'unmatch' ? '#EA580C' : '#64748B', marginTop: 2 }}>{f.e}</div>
                  </div>
                  {f.sc != null ? <Chip tone="success" size="sm">{f.sc}</Chip> : f.st === 'unmatch' ? <Btn variant="tonal" size="sm">Assign</Btn> : <span style={{ font: '600 11px/1 Inter', color: sm.c }}>{sm.l}</span>}
                </div>
              );
            })}
          </Card>
        </div>
      </div>
      <HRNav active={2}/>
    </PhoneBody>
  );
}

Object.assign(window, { MB2BDashboard, MB2BTeam, MB2BBulk });
