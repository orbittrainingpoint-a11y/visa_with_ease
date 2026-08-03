/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Customer — Complete Profile, Profile Page, Find Consultant, Applications, Doc Clearance

// ─── Profile completion hub (entry card screen) ─────────────────────────────
function MProfileHub() {
  const Step = ({ i, t, s, status, percent }) => (
    <div style={{ display: 'flex', gap: 12, padding: '14px 14px', background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: status === 'done' ? '#D1FAE5' : status === 'active' ? '#EFF6FF' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="mi" style={{ fontSize: 22, color: status === 'done' ? '#059669' : status === 'active' ? '#1A56DB' : '#94A3B8' }}>{status === 'done' ? 'check_circle' : i}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 14px/1.3 Inter', color: '#0F172A' }}>{t}</div>
        <div style={{ font: '400 12px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{s}</div>
        {percent != null && (
          <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, height: '100%', background: status === 'done' ? '#10B981' : '#1A56DB' }}/>
          </div>
        )}
      </div>
      <span className="mi" style={{ fontSize: 22, color: '#CBD5E1', alignSelf: 'center' }}>chevron_right</span>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Complete your profile" sub="6 of 10 fields done · 60%" leading="arrow_back"/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Card padding={18} elevation={2} style={{ background: 'linear-gradient(135deg, #0B1F4B, #1A56DB)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ScoreRing value={60} size={64} stroke={7}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 16px/1.2 Plus Jakarta Sans' }}>You're 60% ready</div>
              <div style={{ font: '400 12px/1.5 Inter', color: 'rgba(255,255,255,.75)', marginTop: 4 }}>Finish your profile to auto-fill future applications and unlock the AI checklist.</div>
            </div>
          </div>
        </Card>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Step i={1} t="Personal details" s="Name, DOB, contact, marital status" status="done" percent={100}/>
          <Step i={2} t="Passport" s="Number, expiry, issuing country" status="done" percent={100}/>
          <Step i={3} t="Travel history" s="3 of 5 trips added — covers last 10 years" status="active" percent={60}/>
          <Step i={4} t="Financials" s="Bank statements · 3 months required" status="active" percent={33}/>
          <Step i={5} t="Employment & Resume" s="Current role + CV upload" status="pending"/>
          <Step i={6} t="Emergency contacts" s="2 contacts required" status="pending"/>
        </div>
        <div style={{ marginTop: 18, padding: 14, background: '#FAF5FF', borderRadius: 12, display: 'flex', gap: 10 }}>
          <AIBadge small/>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12px/1.4 Inter', color: '#6D28D9' }}>Why we need this</div>
            <div style={{ font: '400 11px/1.5 Inter', color: '#475569', marginTop: 2 }}>Most visas globally require these baseline documents — completing once lets us pre-validate every future application instantly.</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9' }}>
        <Btn variant="primary" full size="lg" trailing="arrow_forward">Continue · Travel history</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Profile — Travel history step ─────────────────────────────────────────
function MProfileTravel() {
  const Trip = ({ cc, country, dates, purpose, visa }) => (
    <div style={{ padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{flag(cc)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 13px/1.2 Inter', color: '#0F172A' }}>{country}</div>
        <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{dates} · {purpose}</div>
      </div>
      <Chip tone="success" size="sm">{visa}</Chip>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Travel history" sub="Step 3 of 6" leading="arrow_back"/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,1,1,0,0,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
        </div>
        <div style={{ font: '700 22px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em', marginTop: 18 }}>Where have you been?</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Add visas from the last 10 years. This helps embassies trust your travel record.</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Trip cc="SG" country="Singapore" dates="Mar – Apr 2024" purpose="Tourist" visa="Approved"/>
          <Trip cc="TH" country="Thailand" dates="Nov 2023" purpose="Tourist" visa="Visa-free"/>
          <Trip cc="AE" country="UAE" dates="Aug 2022" purpose="Business" visa="Approved"/>
        </div>
        <button style={{ marginTop: 14, width: '100%', height: 56, borderRadius: 14, border: '2px dashed #93C5FD', background: '#EFF6FF', color: '#1547C0', font: '600 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="mi" style={{ fontSize: 22 }}>add_circle</span> Add a trip
        </button>
        <div style={{ marginTop: 18, padding: 14, background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Previous rejections</div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: '#10B981', position: 'relative', padding: 2 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', marginLeft: 'auto' }}/>
            </div>
          </div>
          <div style={{ font: '400 12px/1.5 Inter', color: '#64748B' }}>You confirmed no prior rejections. Honesty here improves your AI readiness score.</div>
        </div>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
        <Btn variant="outlined" size="lg" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" size="lg" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Profile — Financials step ─────────────────────────────────────────────
function MProfileFinancials() {
  const Mo = ({ m, status, bal, score }) => {
    const tones = { done: { c: '#10B981', bg: '#D1FAE5', i: 'check_circle' }, ai: { c: '#7C3AED', bg: '#EDE9FE', i: 'autorenew' }, miss: { c: '#94A3B8', bg: '#F1F5F9', i: 'upload' } };
    const t = tones[status];
    return (
      <div style={{ padding: 14, background: '#fff', borderRadius: 12, border: status === 'miss' ? '1.5px dashed #CBD5E1' : '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 50, borderRadius: 8, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 22, color: t.c }}>{status === 'miss' ? 'upload' : 'account_balance'}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{m}</div>
          <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{status === 'miss' ? 'Required — tap to upload' : `Avg balance ${bal}`}</div>
        </div>
        {status === 'done' && <ScoreRing value={score} size={36} stroke={4}/>}
        {status === 'ai' && <Chip tone="ai" size="sm" icon="auto_awesome">Auditing</Chip>}
        {status === 'miss' && <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>upload</span>}
      </div>
    );
  };
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Financials" sub="Step 4 of 6" leading="arrow_back"/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,1,1,1,0,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
        </div>
        <div style={{ font: '700 22px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 18, letterSpacing: '-0.01em' }}>Bank statements</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Most visas require the last 3 months. We extract balances automatically — your file is encrypted.</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Mo m="December 2025" status="done" bal="€5,840" score={92}/>
          <Mo m="November 2025" status="ai"/>
          <Mo m="October 2025" status="miss"/>
        </div>
        <Card padding={14} elevation={1} style={{ marginTop: 18, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span className="mi" style={{ fontSize: 22, color: '#D97706' }}>tips_and_updates</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 12px/1.3 Inter', color: '#92400E' }}>AI tip</div>
              <div style={{ font: '400 12px/1.5 Inter', color: '#78350F', marginTop: 2 }}>Schengen visas typically need a minimum balance of €5,000+ for 10 days. Your average is on track.</div>
            </div>
          </div>
        </Card>
        <div style={{ marginTop: 18, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Other assets · optional</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { i: 'apartment', l: 'Property' },
            { i: 'card_membership', l: 'Investments' },
            { i: 'savings', l: 'FD / Savings' },
            { i: 'directions_car', l: 'Vehicle' },
          ].map(o => (
            <button key={o.l} style={{ padding: '14px 12px', borderRadius: 12, background: '#fff', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: 10, font: '500 12px/1 Inter', color: '#475569' }}>
              <span className="mi" style={{ fontSize: 20, color: '#1A56DB' }}>{o.i}</span>
              {o.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
        <Btn variant="text" size="lg" style={{ flex: 0.4 }}>Skip for now</Btn>
        <Btn variant="primary" size="lg" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Profile — Resume / Employment step ────────────────────────────────────
function MProfileResume() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Employment & Resume" sub="Step 5 of 6" leading="arrow_back"/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,1,1,1,1,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
        </div>
        <div style={{ font: '700 22px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 18, letterSpacing: '-0.01em' }}>Tell us about your work</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Current employer" value="Stripe Inc." icon="business"/>
        <Input label="Job title" value="Senior Product Designer"/>
        <Input label="Years in current role" value="3.5" trailing="arrow_drop_down"/>
        <Input label="Annual income" value="$ 124,000" icon="payments" trailing="lock" helper="Encrypted · only used for AI checks"/>
        <div>
          <div style={{ font: '500 12px/1.4 Inter', color: '#475569', marginBottom: 6 }}>Resume / CV</div>
          <div style={{ padding: 14, borderRadius: 14, background: '#fff', border: '1px solid #10B981', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 52, borderRadius: 8, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 24, color: '#059669' }}>description</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>SarahMitchell-Resume.pdf</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>184 KB · Uploaded Today</div>
            </div>
            <span className="mi" style={{ fontSize: 22, color: '#94A3B8' }}>more_vert</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <AIBadge small/>
            <span style={{ font: '500 11px/1.4 Inter', color: '#6D28D9' }}>Detected: 8y experience, design field, English fluent</span>
          </div>
        </div>
        <Input label="LinkedIn URL" value="linkedin.com/in/sarahmitchell" icon="link" type="mono"/>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
        <Btn variant="outlined" size="lg" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" size="lg" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Profile page (view) ────────────────────────────────────────────────────
function MProfilePage() {
  const Row = ({ i, l, v, action = 'edit' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: '1px solid #F8FAFC' }}>
      <span className="mi" style={{ fontSize: 22, color: '#1A56DB', width: 28 }}>{i}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', letterSpacing: 0.3, textTransform: 'uppercase' }}>{l}</div>
        <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A', marginTop: 4 }}>{v}</div>
      </div>
      <span className="mi" style={{ fontSize: 20, color: '#94A3B8' }}>{action}</span>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: 'linear-gradient(180deg,#0B1F4B,#1A56DB)', padding: '0 0 36px', color: '#fff' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
          <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>arrow_back</span></button>
          <div style={{ flex: 1, font: '600 16px/1 Inter' }}>Profile</div>
          <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>settings</span></button>
        </div>
        <div style={{ padding: '20px 24px 0', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 24px/1 Plus Jakarta Sans', color: '#fff', border: '3px solid rgba(255,255,255,.25)' }}>SM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 20px/1.2 Plus Jakarta Sans' }}>Sarah Mitchell</div>
            <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>sarah.m@email.com · {flag('IN')} Indian</div>
            <Chip tone="gold" size="sm" icon="workspace_premium" style={{ marginTop: 6 }}>Pro plan</Chip>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 12px', marginTop: -20 }}>
        <Card padding={0} elevation={3}>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F1F5F9' }}>
            <ScoreRing value={87} size={48} stroke={5}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Profile completeness</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>2 fields left to reach 100%</div>
            </div>
            <Btn variant="tonal" size="sm">Complete</Btn>
          </div>
          <Row i="person" l="Full name" v="Sarah Mitchell"/>
          <Row i="cake" l="Date of birth" v="14 March 1992"/>
          <Row i="badge" l="Passport" v="K8472913 · expires 22 Aug 2031"/>
          <Row i="public" l="Nationality" v={`${flag('IN')} Indian`}/>
          <Row i="phone" l="Phone" v="+91 98 1234 5678"/>
          <Row i="business" l="Employer" v="Stripe Inc. · Sr. Designer · 3.5y"/>
        </Card>

        <div style={{ marginTop: 16, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px 8px' }}>Documents library</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'description', l: 'Resume / CV', v: '184 KB · uploaded today', tone: 'success' },
            { i: 'badge', l: 'Passport scan', v: '2.1 MB · audit 87', tone: 'success' },
            { i: 'account_balance', l: 'Bank statements', v: '2 of 3 months', tone: 'warning' },
            { i: 'work', l: 'Employment letter', v: 'Auditing…', tone: 'ai' },
          ].map((d, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 20, color: '#1A56DB' }}>{d.i}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{d.l}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{d.v}</div>
              </div>
              <Chip tone={d.tone} size="sm">{d.tone === 'success' ? 'Ready' : d.tone === 'warning' ? '2/3' : 'AI'}</Chip>
            </div>
          ))}
        </Card>

        <div style={{ marginTop: 16, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px 8px' }}>Settings</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'notifications', l: 'Notifications', t: 'toggle', on: true },
            { i: 'fingerprint', l: 'Biometric login', t: 'toggle', on: true },
            { i: 'language', l: 'Language', t: 'value', v: 'English' },
            { i: 'shield', l: 'Privacy & GDPR', t: 'arrow' },
            { i: 'logout', l: 'Sign out', t: 'arrow', danger: true },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <span className="mi" style={{ fontSize: 22, color: r.danger ? '#EF4444' : '#475569' }}>{r.i}</span>
              <div style={{ flex: 1, font: '500 14px/1 Inter', color: r.danger ? '#EF4444' : '#0F172A' }}>{r.l}</div>
              {r.t === 'toggle' && (
                <div style={{ width: 44, height: 24, borderRadius: 12, background: r.on ? '#1A56DB' : '#CBD5E1', padding: 2, display: 'flex', justifyContent: r.on ? 'flex-end' : 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }}/>
                </div>
              )}
              {r.t === 'value' && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ font: '500 13px/1 Inter', color: '#64748B' }}>{r.v}</span><span className="mi" style={{ fontSize: 18, color: '#94A3B8' }}>chevron_right</span></div>}
              {r.t === 'arrow' && <span className="mi" style={{ fontSize: 20, color: '#94A3B8' }}>chevron_right</span>}
            </div>
          ))}
        </Card>
      </div>
      <BottomNav active={4}/>
    </PhoneBody>
  );
}

// ─── Applications list ─────────────────────────────────────────────────────
function MAppsList() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Applications" trailing={[{ icon: 'search' }, { icon: 'tune' }]}/>
      <div style={{ padding: '8px 16px 4px', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {[['All', 3, true], ['Active', 2, false], ['Submitted', 1, false], ['Approved', 1, false]].map(([l, n, on], i) => (
            <div key={i} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, background: on ? '#1A56DB' : '#F1F5F9', color: on ? '#fff' : '#475569', font: '500 13px/1 Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
              {l}<span style={{ padding: '0 6px', height: 18, borderRadius: 9, background: on ? 'rgba(255,255,255,.25)' : '#fff', color: on ? '#fff' : '#1A56DB', font: '700 10px/1.7 Inter' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { cc: 'FR', t: 'France · Schengen Tourist', d: '15 Mar – 24 Mar 2026', sc: 87, st: 'In progress', tone: 'info', days: '8 days to deadline' },
            { cc: 'JP', t: 'Japan · Tourist', d: '08 May – 22 May 2026', sc: 64, st: 'Attention', tone: 'warning', days: 'Submit by 25 Mar' },
            { cc: 'AU', t: 'Australia · ETA', d: '12 Oct – 30 Oct 2026', sc: 100, st: 'Approved', tone: 'success', days: 'Decision: 12 Apr' },
          ].map((a, i) => (
            <Card key={i} padding={16} elevation={2} accent={a.tone === 'warning' ? '#F97316' : a.tone === 'success' ? '#10B981' : '#1A56DB'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 30 }}>{flag(a.cc)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '700 14px/1.3 Plus Jakarta Sans', color: '#0F172A' }}>{a.t}</div>
                  <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{a.d}</div>
                </div>
                <Chip tone={a.tone} size="sm">{a.st}</Chip>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0 0', borderTop: '1px solid #F1F5F9' }}>
                <ScoreRing value={a.sc} size={48} stroke={5}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', letterSpacing: 0.3, textTransform: 'uppercase' }}>Readiness</div>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A', marginTop: 4 }}>{a.days}</div>
                </div>
                <span className="mi" style={{ fontSize: 24, color: '#1A56DB' }}>arrow_forward</span>
              </div>
            </Card>
          ))}
        </div>
        <button style={{ marginTop: 14, width: '100%', height: 64, borderRadius: 14, border: '2px dashed #93C5FD', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#1547C0', font: '600 14px/1 Inter' }}>
          <span className="mi" style={{ fontSize: 22 }}>add</span> Start a new application
        </button>
      </div>
      <BottomNav active={1}/>
    </PhoneBody>
  );
}

// ─── Document Clearance / Session — per-application clearance with AI status ─
function MDocClearance() {
  const Doc = ({ n, t, sub, st, score, criteria }) => {
    const conf = { pass: { bg: '#D1FAE5', c: '#059669', i: 'verified', l: 'AI cleared' },
                   warn: { bg: '#FEF3C7', c: '#D97706', i: 'warning_amber', l: 'Needs review' },
                   fail: { bg: '#FEE2E2', c: '#B91C1C', i: 'cancel', l: 'Not cleared' },
                   miss: { bg: '#F1F5F9', c: '#64748B', i: 'upload', l: 'Upload' },
                   ai:   { bg: '#EDE9FE', c: '#7C3AED', i: 'auto_awesome', l: 'Auditing' } }[st];
    return (
      <Card padding={14} elevation={1} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: conf.bg, color: conf.c, font: '700 13px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ font: '700 14px/1.3 Plus Jakarta Sans', color: '#0F172A' }}>{t}</div>
              {score != null && <ScoreRing value={score} size={32} stroke={3.5}/>}
            </div>
            <div style={{ font: '400 12px/1.4 Inter', color: '#64748B', marginTop: 4 }}>{sub}</div>
            {criteria && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {criteria.map((cr, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px/1.4 Inter', color: cr.ok ? '#047857' : '#B91C1C' }}>
                    <span className="mi" style={{ fontSize: 14 }}>{cr.ok ? 'check_circle' : 'cancel'}</span>
                    {cr.t}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Chip tone={st === 'pass' ? 'success' : st === 'fail' ? 'error' : st === 'warn' ? 'warning' : st === 'ai' ? 'ai' : 'neutral'} size="sm" icon={conf.i}>{conf.l}</Chip>
              {st === 'fail' && <Chip tone="info" size="sm">Re-upload</Chip>}
              {st === 'miss' && <span style={{ font: '500 12px/1 Inter', color: '#1A56DB', marginLeft: 'auto' }}>Tap to upload →</span>}
            </div>
          </div>
        </div>
      </Card>
    );
  };
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Document clearance" sub={`${flag('FR')} France · Schengen Tourist`} leading="arrow_back" trailing={[{ icon: 'share' }]}/>
      {/* Overall clearance banner */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'linear-gradient(135deg, #0B1F4B 0%, #1A56DB 100%)', color: '#fff', borderRadius: 14 }}>
          <ScoreRing value={87} size={64} stroke={7}/>
          <div style={{ flex: 1 }}>
            <Chip tone="ai" size="sm" icon="auto_awesome" style={{ background: 'rgba(124,58,237,.3)', color: '#fff' }}>AI clearance</Chip>
            <div style={{ font: '700 16px/1.2 Plus Jakarta Sans', marginTop: 6 }}>4 of 6 cleared</div>
            <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Fix 1 critical and add 1 missing doc to submit.</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <Doc n="1" t="Valid passport" sub="K8472913 · Indian passport · expires 22 Aug 2031" st="pass" score={87}
          criteria={[ { ok: true, t: 'Min 6 months validity' }, { ok: true, t: 'Name matches profile' }, { ok: true, t: 'Photo page legible' } ]}/>
        <Doc n="2" t="Recent passport photo" sub="35×45mm · white bg · ≤6mo old" st="pass" score={94}
          criteria={[ { ok: true, t: 'Size & background OK' }, { ok: true, t: 'Face clearly visible' } ]}/>
        <Doc n="3" t="Bank statements (3 months)" sub="Dec ✓ · Nov ✓ · Oct missing" st="warn" score={68}
          criteria={[ { ok: true, t: 'Dec balance €5,840 ≥ €5,000' }, { ok: true, t: 'Nov balance €5,210 ≥ €5,000' }, { ok: false, t: 'October statement missing' } ]}/>
        <Doc n="4" t="Employment letter" sub="Stripe Inc. · uploaded 2h ago" st="ai"/>
        <Doc n="5" t="Hotel booking — confirmed" sub="Hotel Premier · Paris · 15 – 24 Mar" st="fail" score={48}
          criteria={[ { ok: false, t: 'Reservation held — not paid' }, { ok: true, t: 'Covers full travel dates' }, { ok: true, t: 'Matches itinerary city' } ]}/>
        <Doc n="6" t="Flight itinerary" sub="Round-trip required" st="miss"/>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
        <Btn variant="tonal" icon="auto_awesome" style={{ flex: 1 }}>Ask AI to fix</Btn>
        <Btn variant="primary" icon="check" style={{ flex: 1 }}>Mark ready</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Find Consultant — real-time matching ──────────────────────────────────
function MFindConsultant() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Find a consultant" sub="Live · 4 available now" leading="arrow_back" trailing={[{ icon: 'tune' }]}/>
      {/* Match summary */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card padding={16} elevation={2} style={{ background: 'linear-gradient(135deg,#7C3AED,#1A56DB)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AIBadge small/>
            <div style={{ font: '600 12px/1 Inter', color: 'rgba(255,255,255,.9)' }}>Matched to your France application</div>
          </div>
          <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', marginTop: 8 }}>4 experts available right now</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {[
              { l: 'Avg response', v: '2 min' },
              { l: 'Avg rating', v: '4.8 ★' },
              { l: 'From', v: '$0.99/min' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)' }}>{s.l}</div>
                <div style={{ font: '700 14px/1.2 Inter', marginTop: 4 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* Filter tabs */}
      <div style={{ padding: '14px 16px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[['Live now', true, 'circle', '#10B981'], ['Schengen experts', false], ['Top rated', false], ['Free first 5 min', false]].map(([l, on, dot, c], i) => (
          <div key={i} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 999, background: on ? '#0F172A' : '#fff', color: on ? '#fff' : '#475569', font: '500 12px/1 Inter', border: on ? 'none' : '1px solid #E2E8F0', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 0 4px ${c}33` }}/>}
            {l}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px' }}>
        {[
          { n: 'Priya Raghavan', cred: 'Sr. Visa Consultant · IND→EU specialist', y: 12, r: 4.9, rev: 284, online: 'live', match: 96, p: '$1.20/min', flags: ['IN','FR','DE','IT'], pic: 'PR' },
          { n: 'James Okafor', cred: 'UK & Schengen attorney · OISC L3', y: 8, r: 4.8, rev: 192, online: 'live', match: 91, p: '$1.80/min', flags: ['GB','FR','ES'], pic: 'JO' },
          { n: 'Hana Tanaka', cred: 'Japan tourist visa specialist', y: 6, r: 4.9, rev: 156, online: 'busy', match: 64, p: '$0.99/min', flags: ['JP','TH','SG'], pic: 'HT' },
          { n: 'Marcus Köhler', cred: 'Schengen Code expert · Berlin', y: 15, r: 4.7, rev: 408, online: 'live', match: 88, p: '$1.50/min', flags: ['DE','AT','CH'], pic: 'MK' },
        ].map((c, i) => (
          <Card key={i} padding={14} elevation={1} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${['#0EA5E9','#10B981','#F97316','#7C3AED'][i]},${['#7C3AED','#1A56DB','#EF4444','#0EA5E9'][i]})`, color: '#fff', font: '700 18px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.pic}</div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: c.online === 'live' ? '#10B981' : '#F59E0B', border: '3px solid #fff' }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{c.n}</div>
                  <Chip tone={c.match >= 90 ? 'success' : c.match >= 70 ? 'info' : 'neutral'} size="sm">{c.match}% match</Chip>
                </div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{c.cred}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ font: '500 11px/1 Inter', color: '#0F172A' }}><span className="mi" style={{ fontSize: 12, color: '#F59E0B', verticalAlign: -1 }}>star</span> {c.r} ({c.rev})</span>
                  <span style={{ font: '500 11px/1 Inter', color: '#64748B' }}>· {c.y}y exp</span>
                  <div style={{ display: 'flex', gap: 2 }}>{c.flags.map(f => <span key={f} style={{ fontSize: 13 }}>{flag(f)}</span>)}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <Btn variant={c.online === 'live' ? 'primary' : 'outlined'} size="sm" icon={c.online === 'live' ? 'videocam' : 'schedule'} style={{ flex: 1 }}>{c.online === 'live' ? `Call now · ${c.p}` : 'Schedule'}</Btn>
              <Btn variant="tonal" size="sm" icon="chat_bubble_outline">Chat</Btn>
            </div>
          </Card>
        ))}
      </div>
    </PhoneBody>
  );
}

// ─── Live chat with consultant (real human, distinct from AI) ───────────────
function MAgentChat() {
  const Msg = ({ role, children, ts }) => {
    const u = role === 'user';
    return (
      <div style={{ display: 'flex', justifyContent: u ? 'flex-end' : 'flex-start', marginBottom: 12, gap: 8 }}>
        {!u && <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '700 12px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>PR</div>}
        <div style={{ maxWidth: '74%' }}>
          <div style={{
            background: u ? '#1A56DB' : '#fff', color: u ? '#fff' : '#0F172A',
            padding: '10px 14px', borderRadius: u ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
            font: '400 13.5px/1.5 Inter', boxShadow: u ? 'none' : '0 1px 3px rgba(15,23,42,.06)',
            border: u ? 'none' : '1px solid #F1F5F9',
          }}>{children}</div>
          <div style={{ textAlign: u ? 'right' : 'left', font: '500 10px/1 Inter', color: '#94A3B8', marginTop: 4 }}>{ts}</div>
        </div>
      </div>
    );
  };
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 8 }}>
          <span className="mi" style={{ fontSize: 22, color: '#0F172A', padding: 10 }}>arrow_back</span>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '700 13px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#10B981', border: '2.5px solid #fff' }}/>
          </div>
          <div style={{ flex: 1, marginLeft: 4 }}>
            <div style={{ font: '600 14px/1.2 Inter', color: '#0F172A' }}>Priya Raghavan</div>
            <div style={{ font: '400 11px/1 Inter', color: '#10B981' }}>● Online · typing…</div>
          </div>
          <span className="mi" style={{ fontSize: 22, color: '#1A56DB', padding: 10 }}>videocam</span>
          <span className="mi" style={{ fontSize: 22, color: '#1A56DB', padding: 10 }}>call</span>
        </div>
        <div style={{ padding: '6px 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Chip tone="ai" size="sm" icon="share">Audit shared automatically</Chip>
          <Chip tone="neutral" size="sm">$1.20/min · 4:18</Chip>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px' }}>
        <Msg role="agent" ts="9:42 AM">Hi Sarah! I've reviewed your audit. Your bank balance is healthy but your hotel booking will be the blocker — the embassy needs a paid confirmation, not a held reservation.</Msg>
        <Msg role="user" ts="9:43 AM">Got it. Booking.com lets me pay now to lock — should I do that?</Msg>
        <Msg role="agent" ts="9:43 AM">Yes, but use a fully refundable rate. France accepts those and you can cancel after the visa is approved.</Msg>
        <Msg role="user" ts="9:44 AM">Perfect — uploading the paid confirmation now.</Msg>
        {/* shared doc card */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Card padding={10} elevation={1} style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '74%' }}>
            <div style={{ width: 36, height: 44, borderRadius: 6, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 22, color: '#DC2626' }}>picture_as_pdf</span>
            </div>
            <div>
              <div style={{ font: '600 12px/1.2 Inter', color: '#0F172A' }}>Hotel-Booking-PAID.pdf</div>
              <div style={{ font: '400 10px/1.2 Inter', color: '#64748B', marginTop: 2 }}>248 KB · just now</div>
            </div>
          </Card>
        </div>
      </div>
      <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#94A3B8' }}>add</span></button>
        <div style={{ flex: 1, height: 44, borderRadius: 22, background: '#F1F5F9', padding: '0 16px', display: 'flex', alignItems: 'center', font: '400 13px/1 Inter', color: '#94A3B8' }}>Message Priya…</div>
        <button style={{ width: 44, height: 44, borderRadius: '50%', border: 0, background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 22 }}>mic</span>
        </button>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MProfileHub, MProfileTravel, MProfileFinancials, MProfileResume, MProfilePage, MAppsList, MDocClearance, MFindConsultant, MAgentChat });
