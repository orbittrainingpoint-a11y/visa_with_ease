/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// B2B Employee — the member-of-team experience. HR manages their applications;
// employee uploads requested docs, replies to HR, and tracks deadlines.

// ─── Shared bottom nav for the employee app ────────────────────────────────
const EmpNav = ({ active = 0 }) => (
  <BottomNav active={active} items={[
    { label: 'Home', icon: 'home', active: 'home' },
    { label: 'Tasks', icon: 'assignment_ind', active: 'assignment_ind', badge: 2 },
    { label: 'Docs', icon: 'description', active: 'description' },
    { label: 'HR Chat', icon: 'chat_bubble_outline', active: 'chat_bubble', badge: 1 },
    { label: 'Me', icon: 'person_outline', active: 'person' },
  ]}/>
);

// ─── 01 Employee Dashboard (polished) ──────────────────────────────────────
function MEmployeeDash() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: 'linear-gradient(155deg, #0B1F4B 0%, #1547C0 100%)', padding: '0 0 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,.3), transparent 65%)' }}/>
        <div style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>menu</span></button>
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.55)', letterSpacing: 1, textTransform: 'uppercase' }}>Acme Corp · Sales</div>
            <div style={{ font: '600 13px/1 Inter', marginTop: 4 }}>Maria Santos</div>
          </div>
          <button style={{ width: 40, height: 40, border: 0, background: 'transparent', position: 'relative' }}>
            <span className="mi" style={{ fontSize: 22, color: '#fff' }}>notifications_outlined</span>
            <span style={{ position: 'absolute', top: 8, right: 8, width: 14, height: 14, borderRadius: 7, background: '#EF4444', color: '#fff', font: '700 9px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </button>
        </div>
        <div style={{ padding: '4px 20px 0', position: 'relative' }}>
          <div style={{ font: '500 12px/1 Inter', color: 'rgba(255,255,255,.7)' }}>Good morning,</div>
          <div style={{ font: '800 26px/1.2 Plus Jakarta Sans', marginTop: 4, letterSpacing: '-0.02em' }}>2 visa tasks need you today</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span className="mi" style={{ fontSize: 16, color: '#0EA5E9' }}>shield</span>
            <span style={{ font: '500 11px/1.3 Inter', color: 'rgba(255,255,255,.7)' }}>Anita Verma (HR) is your manager · GDPR managed</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 8px', marginTop: -14 }}>
        {/* Urgent action card */}
        <Card padding={14} elevation={3} accent="#F97316">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="mi" style={{ fontSize: 22, color: '#F97316' }}>schedule</span>
            </div>
            <div style={{ flex: 1 }}>
              <Chip tone="error" size="sm">DUE IN 5 DAYS</Chip>
              <div style={{ font: '700 14px/1.3 Plus Jakarta Sans', color: '#0F172A', marginTop: 8 }}>HR needs 2 documents from you</div>
              <div style={{ font: '400 12px/1.4 Inter', color: '#64748B', marginTop: 4 }}>Germany Schengen submission window opens Mar 22</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <Btn variant="primary" size="sm" icon="upload_file">Upload now</Btn>
                <Btn variant="text" size="sm">View details</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          {[
            { l: 'Active', v: '2', c: '#1A56DB', i: 'folder_open' },
            { l: 'On track', v: '1', c: '#10B981', i: 'task_alt' },
            { l: 'Need you', v: '1', c: '#F97316', i: 'priority_high' },
          ].map((k, i) => (
            <Card key={i} padding={12} elevation={1}>
              <span className="mi" style={{ fontSize: 18, color: k.c }}>{k.i}</span>
              <div style={{ font: '800 22px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 6 }}>{k.v}</div>
              <div style={{ font: '500 10px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{k.l}</div>
            </Card>
          ))}
        </div>

        {/* Assigned applications */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>Your assignments</div>
          <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>See all</span>
        </div>
        {[
          { cc: 'DE', t: 'Germany · Schengen Tourist', sc: 74, dt: 'Mar 22 · in 5d', urg: true, sub: '2 docs missing', tone: 'warning', pct: 67 },
          { cc: 'US', t: 'USA · B1 Business visit', sc: 88, dt: 'Apr 14 · in 27d', sub: 'AI audit complete', tone: 'success', pct: 88 },
        ].map((a, i) => (
          <Card key={i} padding={14} elevation={1} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 30 }}>{flag(a.cc)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{a.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: a.urg ? '#DC2626' : '#64748B', marginTop: 2 }}>{a.sub} · {a.dt}</div>
              </div>
              <ScoreRing value={a.sc} size={40} stroke={4}/>
            </div>
            <div style={{ marginTop: 10, height: 5, background: '#F1F5F9', borderRadius: 3 }}>
              <div style={{ width: `${a.pct}%`, height: '100%', background: a.tone === 'success' ? '#10B981' : '#F97316', borderRadius: 3 }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{a.pct}% ready</span>
              <Chip tone={a.tone} size="sm">{a.tone === 'success' ? 'Ready' : 'Action needed'}</Chip>
            </div>
          </Card>
        ))}

        {/* HR contact + reusable docs */}
        <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <Card padding={14} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', font: '700 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                AV
                <span style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#10B981', border: '2px solid #fff' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Anita Verma · HR</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Online · usually replies in 1h</div>
              </div>
              <Btn variant="tonal" size="sm" icon="chat_bubble_outline">Message</Btn>
            </div>
          </Card>
        </div>

        {/* Profile completion */}
        <div style={{ marginTop: 14, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Your profile</div>
        <Card padding={14} elevation={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScoreRing value={92} size={44} stroke={5}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>92% complete</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Add resume + emergency contact</div>
            </div>
            <Btn variant="text" size="sm" trailing="arrow_forward">Finish</Btn>
          </div>
        </Card>
      </div>
      <EmpNav active={0}/>
    </PhoneBody>
  );
}

// ─── 02 Employee Tasks (HR-assigned checklist) ─────────────────────────────
function MEmployeeTasks() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Tasks" sub="2 tasks open · 4 completed" trailing={[{ icon: 'filter_list' }]}/>
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', overflowX: 'auto' }}>
        {[['All · 6', true], ['Open · 2', false], ['Done · 4', false]].map(([l, on], i) => (
          <Chip key={i} tone={on ? 'royal' : 'neutral'} size="sm">{l}</Chip>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Open · 2 tasks</div>
        {[
          { i: 'account_balance', t: 'Upload bank statement (Oct)', s: 'Germany Schengen · needed for funds proof', due: 'Due Mar 18 · 1d', urg: 'high', kind: 'upload', ai: 'AI: a JPG of an ATM slip won\'t pass — need a stamped statement.' },
          { i: 'hotel', t: 'Upload paid hotel confirmation', s: 'Germany Schengen · current booking is held, not paid', due: 'Due Mar 19 · 2d', urg: 'high', kind: 'upload', ai: 'AI: Booking.com refundable rates accepted if shown as paid.' },
        ].map((t, i) => (
          <Card key={i} padding={14} elevation={2} style={{ marginBottom: 10, position: 'relative', borderLeft: `3px solid ${t.urg === 'high' ? '#EF4444' : '#F59E0B'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="mi" style={{ fontSize: 20, color: '#1A56DB' }}>{t.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 14px/1.3 Plus Jakarta Sans', color: '#0F172A' }}>{t.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{t.s}</div>
                <div style={{ font: '600 11px/1 Inter', color: '#DC2626', marginTop: 6 }}>{t.due}</div>
              </div>
            </div>
            {/* AI helper */}
            <div style={{ marginTop: 12, padding: 10, background: '#FAF5FF', border: '1px solid #DDD6FE', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AIBadge small/>
              <div style={{ flex: 1, font: '400 11px/1.5 Inter', color: '#475569' }}>{t.ai}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <Btn variant="primary" size="sm" icon="upload_file" style={{ flex: 1 }}>Upload</Btn>
              <Btn variant="outlined" size="sm" icon="photo_camera">Camera</Btn>
              <Btn variant="outlined" size="sm" icon="chat_bubble_outline">Ask HR</Btn>
            </div>
          </Card>
        ))}

        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 }}>Completed · 4 tasks</div>
        {[
          { t: 'Upload passport bio page', dt: 'Done · 4 days ago' },
          { t: 'Upload employment letter', dt: 'Done · 3 days ago' },
          { t: 'Sign GDPR consent', dt: 'Done · 6 days ago' },
          { t: 'Verify travel dates', dt: 'Done · 6 days ago' },
        ].map((t, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: i < arr.length-1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 16, color: '#10B981' }}>check</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '500 13px/1.3 Inter', color: '#0F172A', textDecoration: 'line-through', textDecorationColor: '#CBD5E1' }}>{t.t}</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#94A3B8', marginTop: 1 }}>{t.dt}</div>
            </div>
          </div>
        ))}
      </div>
      <EmpNav active={1}/>
    </PhoneBody>
  );
}

// ─── 03 Employee Application Detail (their read-only view of HR's app) ─────
function MEmployeeApp() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Germany Schengen" sub={`Managed by Anita Verma · ${flag('DE')}`} leading="arrow_back" trailing={[{ icon: 'share' }, { icon: 'more_vert' }]}/>
      {/* Hero status */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card padding={16} elevation={2} style={{ background: 'linear-gradient(135deg,#1547C0,#7C3AED)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ScoreRing value={74} size={64} stroke={6} showLabel={true}/>
            <div style={{ flex: 1 }}>
              <Chip tone="warning" size="sm" icon="warning_amber" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>2 items pending</Chip>
              <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', marginTop: 8 }}>Almost there — 2 docs from you</div>
              <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.75)', marginTop: 4 }}>Submission opens Mar 22</div>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        {/* Timeline */}
        <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 12 }}>Where we are</div>
        <Card padding={16} elevation={1} style={{ marginBottom: 16 }}>
          {[
            { t: 'Created by HR', d: 'Mar 02', c: '#10B981', done: true },
            { t: 'Documents uploading', d: 'In progress · 4 of 6', c: '#1A56DB', done: 'active' },
            { t: 'AI audit', d: 'Auto · runs on each upload', c: '#94A3B8', done: false },
            { t: 'HR review & submit', d: 'Mar 22 · embassy intake', c: '#94A3B8', done: false },
            { t: 'Decision', d: 'Expected Apr 02', c: '#94A3B8', done: false },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done === true ? '#D1FAE5' : s.done === 'active' ? '#DBEAFE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span className="mi" style={{ fontSize: 14, color: s.done === true ? '#10B981' : s.done === 'active' ? '#1A56DB' : '#94A3B8' }}>
                    {s.done === true ? 'check' : s.done === 'active' ? 'autorenew' : 'radio_button_unchecked'}
                  </span>
                </div>
                {i < arr.length-1 && <div style={{ width: 2, flex: 1, background: s.done === true ? '#10B981' : '#E2E8F0', minHeight: 18 }}/>}
              </div>
              <div style={{ paddingBottom: i < arr.length-1 ? 14 : 0 }}>
                <div style={{ font: `${s.done === 'active' ? 700 : 600} 13px/1.3 Inter`, color: s.done === false ? '#94A3B8' : '#0F172A' }}>{s.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* What you need to do */}
        <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>What you need to do</div>
        {[
          { i: 'account_balance', t: 'Bank statement · October', sub: 'Last 3 months at €5k+ balance', st: 'todo' },
          { i: 'hotel', t: 'Paid hotel confirmation', sub: 'Berlin · 4 nights · paid in full', st: 'todo' },
        ].map((d, i) => (
          <Card key={i} padding={12} elevation={1} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 44, borderRadius: 8, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 20, color: '#F97316' }}>{d.i}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{d.t}</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{d.sub}</div>
            </div>
            <Btn variant="tonal" size="sm" icon="upload_file">Upload</Btn>
          </Card>
        ))}

        {/* What HR has uploaded */}
        <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10, marginTop: 18 }}>What HR has on file</div>
        {[
          { i: 'badge', t: 'Passport.pdf', sub: 'Verified · audit 92', sc: 92 },
          { i: 'work', t: 'Employment letter', sub: 'Acme letterhead · audit 88', sc: 88 },
          { i: 'photo_camera_front', t: 'Bio photo', sub: 'Schengen compliant · audit 95', sc: 95 },
          { i: 'local_hospital', t: 'Travel insurance', sub: 'EUR 50k coverage · audit 91', sc: 91 },
        ].map((d, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: i < arr.length-1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ width: 32, height: 38, borderRadius: 6, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 18, color: '#10B981' }}>{d.i}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>{d.t}</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{d.sub}</div>
            </div>
            <Chip tone="success" size="sm">{d.sc}</Chip>
          </div>
        ))}
      </div>
    </PhoneBody>
  );
}

// ─── 04 Employee · Upload Document (single doc workflow) ──────────────────
function MEmployeeUpload() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Bank statement · Oct" leading="close" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Chip tone="info" size="sm">Step 2 of 3 · Upload & review</Chip>
        <div style={{ font: '800 22px/1.3 Plus Jakarta Sans', color: '#0F172A', marginTop: 10, letterSpacing: '-0.01em' }}>Upload your October bank statement</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Anita (HR) requested this for your Germany application. Auto-deletes 72 hours after submission.</div>

        {/* AI tips */}
        <Card padding={14} elevation={1} style={{ marginTop: 16, background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AIBadge small/>
            <div style={{ font: '600 12px/1 Inter', color: '#6D28D9' }}>How to make this pass first time</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { ok: true, t: 'Cover full month · Oct 1 → Oct 31' },
              { ok: true, t: 'Stamped or with bank header' },
              { ok: true, t: 'Average balance over €5,000' },
              { ok: false, t: 'Don\'t crop or redact the IBAN' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 12px/1.4 Inter', color: '#475569' }}>
                <span className="mi" style={{ fontSize: 16, color: r.ok ? '#10B981' : '#EF4444' }}>{r.ok ? 'check_circle' : 'cancel'}</span>
                {r.t}
              </div>
            ))}
          </div>
        </Card>

        {/* Drop / capture zone */}
        <div style={{ marginTop: 16, padding: 18, borderRadius: 16, border: '2px dashed #93C5FD', background: '#EFF6FF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span className="mi" style={{ fontSize: 40, color: '#1A56DB' }}>cloud_upload</span>
          <div style={{ font: '700 14px/1.3 Inter', color: '#1547C0' }}>Tap to upload PDF</div>
          <div style={{ font: '400 11px/1.4 Inter', color: '#64748B' }}>Max 10 MB · PDF preferred</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Btn variant="outlined" icon="photo_camera">Camera</Btn>
          <Btn variant="outlined" icon="folder">Browse files</Btn>
        </div>

        {/* Preview area */}
        <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 18, marginBottom: 10 }}>Uploaded</div>
        <Card padding={14} elevation={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 44, borderRadius: 6, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 20, color: '#DC2626' }}>picture_as_pdf</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bank-Oct-2025.pdf</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>2.1 MB · just now</div>
            </div>
            <Chip tone="ai" size="sm" icon="auto_awesome">AI auditing</Chip>
          </div>
          {/* progress */}
          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginTop: 12 }}>
            <div style={{ width: '64%', height: '100%', background: 'linear-gradient(90deg,#7C3AED,#0EA5E9)', borderRadius: 2 }}/>
          </div>
          <div style={{ font: '500 11px/1 Inter', color: '#7C3AED', marginTop: 6 }}>Reading 23 transactions… avg balance €5,210 — looking good</div>
        </Card>
      </div>
      <div style={{ padding: 14, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
        <Btn variant="outlined" style={{ flex: 0.4 }}>Cancel</Btn>
        <Btn variant="primary" trailing="arrow_forward" style={{ flex: 1 }}>Submit to HR</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 05 Employee · HR Chat ─────────────────────────────────────────────────
function MEmployeeHRChat() {
  const Msg = ({ me, text, time, attachment, status }) => (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: me ? '#1A56DB' : '#fff', color: me ? '#fff' : '#0F172A',
          padding: '10px 14px', borderRadius: me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          font: '400 13px/1.5 Inter', border: me ? 'none' : '1px solid #F1F5F9',
        }}>
          {attachment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: me ? 'rgba(255,255,255,.15)' : '#F1F5F9', borderRadius: 8, marginBottom: 6 }}>
              <span className="mi" style={{ fontSize: 20, color: me ? '#fff' : '#DC2626' }}>picture_as_pdf</span>
              <div style={{ font: '600 11px/1.2 Inter' }}>{attachment}</div>
            </div>
          )}
          {text}
        </div>
        <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', marginTop: 4, textAlign: me ? 'right' : 'left' }}>
          {time}{me && status && ` · ${status}`}
        </div>
      </div>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ height: 64, background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22 }}>arrow_back</span></button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', font: '700 12px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          AV
          <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#10B981', border: '2px solid #fff' }}/>
        </div>
        <div style={{ flex: 1, padding: '0 10px' }}>
          <div style={{ font: '600 14px/1.2 Inter', color: '#0F172A' }}>Anita Verma</div>
          <div style={{ font: '500 11px/1 Inter', color: '#10B981', marginTop: 2 }}>● HR · online</div>
        </div>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#475569' }}>videocam</span></button>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#475569' }}>more_vert</span></button>
      </div>

      {/* Context banner */}
      <div style={{ padding: '8px 16px', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mi" style={{ fontSize: 18, color: '#1A56DB' }}>flight_takeoff</span>
        <div style={{ flex: 1, font: '500 11px/1.4 Inter', color: '#1547C0' }}>Re: Germany Schengen · deadline Mar 22</div>
        <Chip tone="warning" size="sm">2 docs needed</Chip>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', font: '500 11px/1 Inter', color: '#94A3B8', margin: '4px 0 12px' }}>Today</div>
        <Msg text="Hi Maria! Quick check — could you grab your October bank statement when you have a moment? AI flagged that we need a full 3-month range." time="9:12 AM"/>
        <Msg me text="Hey Anita! Yes — pulling it now. Should I also re-upload the hotel one? I got a refundable rate but it shows 'on hold' on the PDF." time="9:14 AM" status="read"/>
        <Msg text="Good catch. Yes please — refundable is fine, but it needs to say PAID in the confirmation, not just held." time="9:15 AM"/>
        <Msg text="I'll keep the application paused on my end until those two land. No pressure." time="9:15 AM"/>
        <Msg me attachment="Bank-Oct-2025.pdf · 2.1 MB" text="Just uploaded the bank statement. Hotel coming in 10 min." time="11:42 AM" status="delivered"/>
        {/* AI assist suggestion */}
        <div style={{ alignSelf: 'center', maxWidth: '90%', padding: 10, background: '#FAF5FF', border: '1px solid #DDD6FE', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <AIBadge small/>
          <div style={{ font: '500 11px/1.4 Inter', color: '#6D28D9', flex: 1 }}>AI suggests: "Hotel PDF is ready in 9 min. Want me to draft a reply?"</div>
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: '#F1F5F9' }}>
          <span className="mi" style={{ fontSize: 22, color: '#475569' }}>add</span>
        </button>
        <div style={{ flex: 1, padding: '0 14px', height: 40, background: '#F1F5F9', borderRadius: 20, display: 'flex', alignItems: 'center', font: '400 13px/1 Inter', color: '#94A3B8' }}>Message Anita…</div>
        <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: '#1A56DB' }}>
          <span className="mi" style={{ fontSize: 20, color: '#fff' }}>send</span>
        </button>
      </div>
    </PhoneBody>
  );
}

// ─── 06 Employee · Profile (their identity) ───────────────────────────────
function MEmployeeProfile() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="My profile" leading="arrow_back" trailing={[{ icon: 'edit' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Avatar + identity */}
        <div style={{ background: 'linear-gradient(155deg, #0B1F4B, #1547C0)', padding: '20px 20px 36px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', color: '#fff', font: '800 20px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,.15)' }}>MS</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '800 18px/1.2 Plus Jakarta Sans' }}>Maria Santos</div>
              <div style={{ font: '500 11px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Senior Account Manager · Sales</div>
              <Chip tone="ai" size="sm" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', marginTop: 6 }}>Acme Corp employee</Chip>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
            {[
              { l: 'Profile', v: '92%' },
              { l: 'Prior visas', v: '7' },
              { l: 'Approval rate', v: '100%' },
            ].map(s => (
              <div key={s.l} style={{ padding: 10, background: 'rgba(255,255,255,.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ font: '800 18px/1 Plus Jakarta Sans' }}>{s.v}</div>
                <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '14px 16px', marginTop: -16 }}>
          <Card padding={0} elevation={1}>
            {[
              { i: 'badge', t: 'Passport · IN K8472913', sub: 'Expires Aug 2031', ok: true },
              { i: 'cake', t: 'Date of birth · 04 Aug 1989', sub: 'Verified by HR', ok: true },
              { i: 'phone', t: '+91 98 1234 5678', sub: 'Primary number', ok: true },
              { i: 'home', t: 'Bengaluru, India', sub: 'Permanent address', ok: true },
              { i: 'business', t: 'Acme Corp · Sales', sub: 'Manager: Anita Verma', ok: true },
              { i: 'description', t: 'Resume', sub: 'Not uploaded yet', ok: false },
              { i: 'sos', t: 'Emergency contact', sub: 'Not set yet', ok: false },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: r.ok ? '#EFF6FF' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: r.ok ? '#1A56DB' : '#D97706' }}>{r.i}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: r.ok ? '#64748B' : '#9A3412', marginTop: 2 }}>{r.sub}</div>
                </div>
                {r.ok ? <span className="mi" style={{ fontSize: 20, color: '#10B981' }}>check_circle</span> : <Chip tone="warning" size="sm">Add</Chip>}
              </div>
            ))}
          </Card>

          {/* Privacy */}
          <div style={{ marginTop: 18, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Privacy & data</div>
          <Card padding={0} elevation={1}>
            {[
              { i: 'shield_lock', t: 'Data visible to HR', sub: 'Anita Verma only — not other employees' },
              { i: 'download', t: 'Export my data', sub: 'GDPR Article 20 · download in 24h' },
              { i: 'delete_forever', t: 'Delete my account', sub: 'Requires HR approval', danger: true },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <span className="mi" style={{ fontSize: 22, color: r.danger ? '#EF4444' : '#475569' }}>{r.i}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: r.danger ? '#DC2626' : '#0F172A' }}>{r.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.sub}</div>
                </div>
                <span className="mi" style={{ fontSize: 20, color: '#CBD5E1' }}>chevron_right</span>
              </div>
            ))}
          </Card>
          <div style={{ height: 20 }}/>
        </div>
      </div>
      <EmpNav active={4}/>
    </PhoneBody>
  );
}

Object.assign(window, { MEmployeeDash, MEmployeeTasks, MEmployeeApp, MEmployeeUpload, MEmployeeHRChat, MEmployeeProfile });
