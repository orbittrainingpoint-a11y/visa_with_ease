/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Mobile Android — Consumer journey

// ─── Dashboard ──────────────────────────────────────────────────────────────
function MDashboard() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar
        title=""
        leading=""
        trailing={[]}
        bg="#F8FAFC"
      />
      <div style={{ height: 0 }}/>
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, marginTop: -50 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 14px/1 Inter' }}>SM</div>
        <div style={{ flex: 1 }}>
          <Logo size={16}/>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: '#fff', position: 'relative' }}>
          <span className="mi" style={{ fontSize: 22, color: '#0F172A' }}>notifications_outlined</span>
          <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }}/>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 0 8px' }}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ font: '500 13px/1.3 Inter', color: '#64748B' }}>Good morning</div>
          <div style={{ font: '800 26px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.02em' }}>Sarah ✈️</div>
        </div>
        {/* Hero readiness */}
        <div style={{ margin: '14px 20px 0', padding: 18, borderRadius: 20, background: 'linear-gradient(135deg, #0B1F4B 0%, #1A56DB 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(14,165,233,.18)' }}/>
          <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,.2)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0EA5E9', fontWeight: 600, position: 'relative' }}>
            <span className="mi" style={{ fontSize: 14 }}>flight_takeoff</span>
            <span>NEXT TRIP · 12 DAYS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, position: 'relative' }}>
            <div>
              <div style={{ font: '800 22px/1.2 Plus Jakarta Sans' }}>{flag('FR')} France Schengen</div>
              <div style={{ font: '400 12px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Tourist · 15 Mar – 24 Mar</div>
            </div>
            <ScoreRing value={87} size={64} stroke={6}/>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, position: 'relative' }}>
            <Chip tone="info" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }} icon="description">4/6 docs</Chip>
            <Chip tone="info" style={{ background: 'rgba(245,158,11,.25)', color: '#FCD34D' }} icon="warning_amber">2 issues</Chip>
          </div>
          <button style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, background: '#fff', color: '#0B1F4B', border: 0, font: '600 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
            Complete checklist <span className="mi" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
        {/* Quick actions grid */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { i: 'upload_file', l: 'Upload document', c: '#1A56DB', bg: '#EFF6FF' },
              { i: 'travel_explore', l: 'Requirements', c: '#0EA5E9', bg: '#E0F2FE' },
              { i: 'auto_awesome', l: 'Ask AI', c: '#7C3AED', bg: '#EDE9FE' },
              { i: 'workspace_premium', l: 'Book expert', c: '#D97706', bg: '#FEF3C7' },
            ].map(a => (
              <div key={a.l} style={{ background: '#fff', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #F1F5F9' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 22, color: a.c }}>{a.i}</span>
                </div>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{a.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Activity */}
        <div style={{ padding: '24px 20px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>Recent activity</div>
            <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>View all</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }}>
            {[
              { i: 'auto_awesome', c: '#7C3AED', t: 'AI audit complete', s: 'Passport · scored 87/100', ts: '12m ago' },
              { i: 'task_alt', c: '#10B981', t: 'Bank statement uploaded', s: 'Dec 2025 · 2 pages', ts: '1h ago' },
              { i: 'update', c: '#1A56DB', t: 'Requirements updated', s: 'France · 3 changes detected', ts: '2h ago' },
            ].map((a, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${a.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 18, color: a.c }}>{a.i}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{a.t}</div>
                  <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{a.s}</div>
                </div>
                <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>{a.ts}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav active={0}/>
    </PhoneBody>
  );
}

// ─── Application Detail (Documents tab) ────────────────────────────────────
function MAppDetail() {
  const DocCard = ({ icon, color, name, sub, score, status, accent }) => (
    <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '14px 14px 0 0' }}/>}
      <div style={{ width: 44, height: 52, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mi" style={{ fontSize: 26, color }}>{icon}</span>
      </div>
      <div>
        <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {score != null ? <ScoreRing value={score} size={36} stroke={4}/> : <div style={{ width: 36, height: 36 }}/>}
        {status}
      </div>
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: 'linear-gradient(180deg, #0B1F4B, #1A3373)', color: '#fff', padding: '0 4px 14px' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
          <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>arrow_back</span></button>
          <div style={{ flex: 1, font: '600 15px/1 Inter' }}>Application</div>
          <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>more_vert</span></button>
        </div>
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 30 }}>{flag('FR')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 20px/1.2 Plus Jakarta Sans' }}>France — Schengen Tourist</div>
              <div style={{ font: '400 12px/1.3 Inter', color: 'rgba(255,255,255,.65)' }}>REF-2026-FR-018472-Q</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, background: 'rgba(255,255,255,.08)', borderRadius: 12 }}>
            <ScoreRing value={87} size={56} stroke={6} sub="ready"/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter' }}>Nearly ready to submit</div>
              <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.65)', marginTop: 2 }}>Address 2 issues to reach 95+</div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', padding: '0 8px' }}>
        {['Overview', 'Documents', 'Requirements', 'Chat'].map((t, i) => {
          const on = i === 1;
          return (
            <div key={t} style={{ flex: 1, padding: '14px 0', textAlign: 'center', font: `${on ? 700 : 500} 13px/1 Inter`, color: on ? '#1A56DB' : '#64748B', borderBottom: on ? '2px solid #1A56DB' : '2px solid transparent' }}>{t}</div>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Chip tone="info" size="sm" icon="filter_list">All</Chip>
          <Chip tone="neutral" size="sm">Pending</Chip>
          <Chip tone="neutral" size="sm">Issues</Chip>
          <Chip tone="neutral" size="sm">Passed</Chip>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <DocCard icon="badge" color="#1A56DB" name="Passport.pdf" sub="Uploaded · 2h ago" score={87} status={<Chip tone="success" size="sm">Passed</Chip>}/>
          <DocCard icon="account_balance" color="#10B981" name="Bank-Statement-Dec.pdf" sub="Uploaded · 1d ago" score={92} status={<Chip tone="success" size="sm">Passed</Chip>}/>
          <DocCard icon="work" color="#F59E0B" name="Employment-Letter.pdf" sub="Audit pending" status={<Chip tone="ai" size="sm" icon="auto_awesome">Auditing</Chip>}/>
          <DocCard icon="hotel" color="#EF4444" name="Hotel-Booking.pdf" sub="Audit complete" score={48} status={<Chip tone="error" size="sm">2 issues</Chip>} accent="#EF4444"/>
          <DocCard icon="local_hospital" color="#7C3AED" name="Travel-Insurance.pdf" sub="Audit complete" score={95} status={<Chip tone="success" size="sm">Passed</Chip>}/>
          <div style={{ background: '#EFF6FF', borderRadius: 14, padding: 12, border: '2px dashed #93C5FD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="mi" style={{ fontSize: 30, color: '#1A56DB' }}>add_circle</span>
            <div style={{ font: '600 12px/1.3 Inter', color: '#1547C0', textAlign: 'center' }}>Upload<br/>flight itinerary</div>
          </div>
        </div>
      </div>
      {/* FAB */}
      <div style={{ position: 'absolute', right: 16, bottom: 88, zIndex: 5 }}>
        <button style={{ height: 52, padding: '0 20px', borderRadius: 26, background: '#1A56DB', color: '#fff', border: 0, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(26,86,219,.4)', font: '600 14px/1 Inter' }}>
          <span className="mi" style={{ fontSize: 22 }}>upload_file</span> Upload
        </button>
      </div>
      <BottomNav active={2}/>
    </PhoneBody>
  );
}

// ─── Audit Report ──────────────────────────────────────────────────────────
function MAuditReport() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Audit Report" leading="arrow_back" trailing={[{ icon: 'share' }, { icon: 'download' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ background: '#fff', padding: '20px 20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 70, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 32, color: '#1A56DB' }}>badge</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 16px/1.3 Plus Jakarta Sans', color: '#0F172A' }}>Passport.pdf</div>
              <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>2.1 MB · Audited just now</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <AIBadge small/>
                <span style={{ font: '400 11px/1 Inter', color: '#94A3B8' }}>Analyzed by Claude AI</span>
              </div>
            </div>
            <ScoreRing value={87} size={72} stroke={7}/>
          </div>
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#D1FAE5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mi" style={{ fontSize: 20, color: '#059669' }}>verified</span>
            <div style={{ flex: 1, font: '600 13px/1.3 Inter', color: '#047857' }}>Excellent — ready to submit</div>
          </div>
        </div>
        {/* Findings */}
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>Findings</div>
            <Chip tone="info" size="sm">3 checks passed · 1 info</Chip>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { sev: 'pass',  i: 'verified',    c: '#10B981', t: 'Valid for 4y 8m', s: 'Expiry 22 Aug 2031 — exceeds 6-month rule.', conf: 99 },
              { sev: 'pass',  i: 'how_to_reg',  c: '#10B981', t: 'Name matches profile', s: 'SARAH MITCHELL — exact match across documents.', conf: 96 },
              { sev: 'info',  i: 'info',        c: '#0EA5E9', t: 'Photo page legibility', s: 'Image quality good. Re-shoot only if embassy asks.', conf: 78 },
              { sev: 'warn',  i: 'warning_amber', c: '#F97316', t: 'Margins slightly cropped', s: 'Right edge of stamp cropped in scan. Consider re-uploading at higher resolution.', conf: 71 },
            ].map((f, i) => (
              <Card key={i} elevation={1} padding={14} accent={f.c}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span className="mi" style={{ fontSize: 22, color: f.c, marginTop: -1 }}>{f.i}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{f.t}</div>
                      <span style={{ font: '600 10px/1 JetBrains Mono', color: '#94A3B8' }}>{f.conf}%</span>
                    </div>
                    <div style={{ font: '400 12px/1.5 Inter', color: '#64748B', marginTop: 4 }}>{f.s}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ font: '400 10px/1.4 Inter', color: '#94A3B8', textAlign: 'center', padding: 12 }}>AI-generated guidance. Not legal advice — always verify with official embassy sources.</div>
        </div>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
        <Btn variant="outlined" icon="autorenew" style={{ flex: 1 }}>Re-audit</Btn>
        <Btn variant="primary" icon="check" style={{ flex: 1 }}>Accept & continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── Document Upload Bottom Sheet ──────────────────────────────────────────
function MDocUpload() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Documents" leading="menu" trailing={[{ icon: 'search' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px 0', opacity: 0.4, filter: 'blur(1px)', pointerEvents: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: '#fff', height: 140, borderRadius: 14 }}/>)}
        </div>
      </div>
      {/* Scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 4 }}/>
      {/* Bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '24px 24px 0 0', padding: '12px 0 24px', zIndex: 5 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E2E8F0', margin: '0 auto 16px' }}/>
        <div style={{ padding: '0 24px 8px' }}>
          <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Add document</div>
          <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Your file will be auto-audited by AI within seconds.</div>
        </div>
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column' }}>
          {[
            { i: 'photo_camera', t: 'Take photo', s: 'Auto-crop and detect document edges', c: '#1A56DB' },
            { i: 'image', t: 'Choose from gallery', s: 'Pick an existing photo or scan', c: '#0EA5E9' },
            { i: 'folder', t: 'Browse files', s: 'PDF, JPG, PNG up to 10 MB', c: '#7C3AED' },
            { i: 'cloud', t: 'Import from Drive', s: 'Connect Google Drive or iCloud', c: '#10B981' },
          ].map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${o.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 24, color: o.c }}>{o.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 14px/1.3 Inter', color: '#0F172A' }}>{o.t}</div>
                <div style={{ font: '400 12px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{o.s}</div>
              </div>
              <span className="mi" style={{ fontSize: 22, color: '#CBD5E1' }}>chevron_right</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 24px 0', font: '400 11px/1.5 Inter', color: '#94A3B8', textAlign: 'center' }}>
          🔒 Documents are encrypted and auto-deleted after 72 hours.
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── Requirements ──────────────────────────────────────────────────────────
function MRequirements() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Requirements" sub="France · Schengen Tourist" leading="arrow_back" trailing={[{ icon: 'refresh' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Freshness banner */}
        <div style={{ margin: '12px 16px', padding: 12, background: '#FEF3C7', borderRadius: 12, display: 'flex', gap: 10, border: '1px solid #FDE68A' }}>
          <span className="mi" style={{ fontSize: 22, color: '#D97706' }}>schedule</span>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12px/1.3 Inter', color: '#92400E' }}>Data is 18 hours old</div>
            <div style={{ font: '400 11px/1.4 Inter', color: '#78350F', marginTop: 2 }}>Refresh before submitting to verify against the latest embassy info.</div>
          </div>
          <button style={{ padding: '0 12px', height: 32, borderRadius: 8, background: '#D97706', color: '#fff', border: 0, font: '600 12px/1 Inter' }}>Refresh</button>
        </div>
        {/* Top metric cards */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card padding={14} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mi" style={{ fontSize: 16, color: '#1A56DB' }}>schedule</span>
              <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>Processing</div>
            </div>
            <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 8 }}>10–15 days</div>
            <div style={{ font: '400 10px/1.3 Inter', color: '#94A3B8', marginTop: 2 }}>Rush: 3–5 days (+€40)</div>
          </Card>
          <Card padding={14} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mi" style={{ fontSize: 16, color: '#10B981' }}>payments</span>
              <div style={{ font: '500 11px/1 Inter', color: '#64748B' }}>Fee</div>
            </div>
            <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 8 }}>€80</div>
            <div style={{ font: '400 10px/1.3 Inter', color: '#94A3B8', marginTop: 2 }}>+ €30 VFS service</div>
          </Card>
        </div>
        {/* Required docs */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>Required documents</div>
            <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>6 items</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }}>
            {[
              { n: 1, t: 'Valid passport', s: 'Min 6 months validity, 2 blank pages', on: true },
              { n: 2, t: 'Recent passport-size photo', s: '35×45 mm, white bg, ≤6 months old', on: true },
              { n: 3, t: 'Bank statements', s: 'Last 3 months, min balance €5,000', on: true },
              { n: 4, t: 'Employment letter', s: 'On letterhead, leave approval', on: true },
              { n: 5, t: 'Travel insurance', s: 'Min €30,000 coverage, full duration', on: false },
              { n: 6, t: 'Hotel/flight bookings', s: 'Round-trip confirmed reservations', on: false },
            ].map((d, i, arr) => (
              <div key={d.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: d.on ? '#10B981' : '#F1F5F9', color: d.on ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {d.on ? <span className="mi" style={{ fontSize: 18 }}>check</span> : <span style={{ font: '700 12px/1 Inter' }}>{d.n}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{d.t}</div>
                  <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{d.s}</div>
                </div>
                {d.on ? <Chip tone="success" size="sm">Uploaded</Chip> : <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>upload</span>}
              </div>
            ))}
          </div>
        </div>
        {/* Sources */}
        <div style={{ padding: 16, margin: 16, background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <AIBadge small/>
            <div style={{ font: '600 12px/1 Inter', color: '#0F172A' }}>Sources verified</div>
          </div>
          {['france-visas.gouv.fr', 'VFS Global India', 'Schengen Code (EU 810/2009)'].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <span className="mi" style={{ fontSize: 16, color: '#0EA5E9' }}>link</span>
              <span style={{ font: '500 12px/1.4 Inter', color: '#1A56DB', flex: 1 }}>{s}</span>
              <span className="mi" style={{ fontSize: 14, color: '#94A3B8' }}>open_in_new</span>
            </div>
          ))}
        </div>
        <div style={{ font: '400 10px/1.4 Inter', color: '#94A3B8', textAlign: 'center', padding: '0 24px 16px' }}>AI-gathered guidance. Always verify with the official embassy before submission.</div>
      </div>
    </PhoneBody>
  );
}

// ─── AI Chat ───────────────────────────────────────────────────────────────
function MChat() {
  const Msg = ({ role, children, ts }) => {
    const u = role === 'user';
    return (
      <div style={{ display: 'flex', justifyContent: u ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
        <div style={{ maxWidth: '82%' }}>
          {!u && <div style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}><AIBadge small/><span style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>VisaIQ · {ts}</span></div>}
          <div style={{
            background: u ? '#1A56DB' : '#fff',
            color: u ? '#fff' : '#0F172A',
            padding: '10px 14px',
            borderRadius: u ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
            font: '400 13.5px/1.5 Inter',
            boxShadow: u ? 'none' : '0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)',
            border: u ? 'none' : '1px solid #F1F5F9',
          }}>{children}</div>
          {u && <div style={{ textAlign: 'right', font: '500 10px/1 Inter', color: '#94A3B8', marginTop: 4 }}>{ts}</div>}
        </div>
      </div>
    );
  };
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="VisaIQ Assistant" sub="AI · Online" leading="arrow_back" trailing={[{ icon: 'info_outline' }, { icon: 'more_vert' }]}/>
      {/* context chip row */}
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 6, overflowX: 'auto' }}>
        <Chip tone="info" size="sm" icon="public">{flag('FR')} France</Chip>
        <Chip tone="neutral" size="sm" icon="description">4/6 docs</Chip>
        <Chip tone="warning" size="sm" icon="warning_amber">2 issues</Chip>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px' }}>
        <Msg role="ai" ts="9:41 AM">Good morning Sarah! I see your France Schengen application is 87% ready. Want me to flag the 2 issues blocking you from 95+?</Msg>
        <Msg role="user" ts="9:42 AM">Yes please, and tell me which one I should fix first.</Msg>
        <Msg role="ai" ts="9:42 AM">
          Sure — here's the priority order:<br/><br/>
          <strong style={{ color: '#DC2626' }}>1. Hotel booking</strong> — your reservation is held but not paid. France requires <em>confirmed</em> bookings.<br/><br/>
          <strong style={{ color: '#F97316' }}>2. Bank statement</strong> — your average balance is €4,120; the recommended threshold is €5,000+ for a 10-day stay.<br/><br/>
          Want me to walk you through fixing #1?
        </Msg>
        {/* Typing indicator */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 14px', background: '#fff', borderRadius: '4px 18px 18px 18px', width: 'fit-content', border: '1px solid #F1F5F9' }}>
          {[0,150,300].map(d => (
            <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#1A56DB', opacity: 0.5 }}/>
          ))}
        </div>
      </div>
      {/* Suggested chips */}
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
        {['Yes, fix #1', 'Show me my docs', 'Book an expert'].map(s => (
          <div key={s} style={{ flexShrink: 0, height: 32, padding: '0 12px', borderRadius: 16, border: '1.5px solid #DBEAFE', background: '#fff', color: '#1547C0', font: '500 12px/1 Inter', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="mi" style={{ fontSize: 14, color: '#1A56DB' }}>auto_awesome</span>{s}
          </div>
        ))}
      </div>
      {/* Disclaimer */}
      <div style={{ padding: '6px 16px', background: '#FEF3C7', font: '500 10px/1.4 Inter', color: '#92400E', textAlign: 'center', flexShrink: 0 }}>
        AI guidance — not legal advice. Verify with official embassy.
      </div>
      {/* Input */}
      <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#94A3B8' }}>attach_file</span></button>
        <div style={{ flex: 1, height: 44, borderRadius: 22, background: '#F1F5F9', padding: '0 16px', display: 'flex', alignItems: 'center', font: '400 13px/1 Inter', color: '#94A3B8' }}>
          Ask about your application…
        </div>
        <button style={{ width: 44, height: 44, borderRadius: '50%', border: 0, background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 22 }}>send</span>
        </button>
      </div>
    </PhoneBody>
  );
}

// ─── VIP Booking ───────────────────────────────────────────────────────────
function MBooking() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Book a VIP Expert" leading="arrow_back"/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Hero */}
        <div style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg,#0B1F4B 0%,#7C3AED 60%,#F59E0B 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(245,158,11,.3), transparent 50%)' }}/>
          <Chip tone="gold" size="sm" icon="workspace_premium" style={{ position: 'relative' }}>VIP service</Chip>
          <div style={{ font: '800 24px/1.2 Plus Jakarta Sans', marginTop: 14, position: 'relative' }}>Talk to a real visa expert</div>
          <div style={{ font: '400 13px/1.5 Inter', color: 'rgba(255,255,255,.75)', marginTop: 6, position: 'relative' }}>30-min 1:1 video call — your audit + documents pre-shared.</div>
        </div>
        {/* Expert */}
        <Card padding={14} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 18px/1 Inter', color: '#fff' }}>PR</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 15px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Priya Raghavan</div>
            <div style={{ font: '400 12px/1.4 Inter', color: '#64748B' }}>Sr. Visa Consultant · 12 years</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {[1,1,1,1,1].map((_, i) => <span key={i} className="mi" style={{ fontSize: 14, color: '#F59E0B' }}>star</span>)}
              <span style={{ font: '600 12px/1 Inter', color: '#0F172A', marginLeft: 4 }}>4.9</span>
              <span style={{ font: '400 12px/1 Inter', color: '#94A3B8' }}>(284)</span>
            </div>
          </div>
        </Card>
        {/* Session types */}
        <div style={{ marginTop: 16 }}>
          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Choose a session</div>
          {[
            { t: '30 min · Standard', p: '$49', s: 'Audit review + Q&A', on: false },
            { t: '60 min · Deep dive', p: '$89', s: 'Full review + custom checklist', on: true, badge: 'Most chosen' },
            { t: 'Emergency · 24h', p: '$149', s: 'Same-day prioritized slot', on: false },
          ].map((o, i) => (
            <div key={i} style={{ marginTop: 10, padding: 14, borderRadius: 14, background: '#fff', border: o.on ? '2px solid #1A56DB' : '1.5px solid #E2E8F0', position: 'relative' }}>
              {o.badge && <div style={{ position: 'absolute', top: -8, right: 14, padding: '2px 10px', background: '#7C3AED', color: '#fff', font: '700 10px/1 Inter', borderRadius: 999, letterSpacing: 0.4 }}>{o.badge}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: o.on ? '6px solid #1A56DB' : '2px solid #CBD5E1', flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 14px/1.3 Inter', color: '#0F172A' }}>{o.t}</div>
                  <div style={{ font: '400 12px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{o.s}</div>
                </div>
                <div style={{ font: '800 18px/1 Plus Jakarta Sans', color: '#0F172A' }}>{o.p}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9' }}>
        <Btn variant="gold" full size="lg" icon="calendar_today">Choose a time slot</Btn>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MDashboard, MAppDetail, MAuditReport, MDocUpload, MRequirements, MChat, MBooking });
