/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Real-time AI analysis — same-time streaming for document and application-level audits

// ─── Mobile · Streaming document analysis (in-progress) ─────────────────────
function MAIAnalysisLive() {
  const stages = [
    { l: 'Extracting text · OCR pass', c: '#10B981', done: true, dur: '0.4s' },
    { l: 'Reading biographic fields', c: '#10B981', done: true, dur: '0.6s' },
    { l: 'Validating passport format', c: '#10B981', done: true, dur: '0.3s' },
    { l: 'Cross-checking with profile name', c: '#7C3AED', active: true, dur: '…' },
    { l: 'Checking expiry against destination rules', c: '#94A3B8' },
    { l: 'Generating findings report', c: '#94A3B8' },
  ];
  return (
    <PhoneBody bg="#0B1F4B">
      <div style={{ flex: 1, padding: '12px 0 0', display: 'flex', flexDirection: 'column', color: '#fff' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <button style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>arrow_back</span></button>
          <div style={{ flex: 1, font: '600 14px/1 Inter' }}>Live AI analysis</div>
          <Chip tone="ai" size="sm" icon="bolt" style={{ background: 'rgba(124,58,237,.3)', color: '#fff' }}>Real-time</Chip>
        </div>
        {/* Doc preview */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* doc card */}
            <div style={{ width: 168, height: 224, borderRadius: 12, background: '#fff', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,.4)', position: 'relative' }}>
              <div style={{ height: 50, background: 'linear-gradient(135deg,#1A56DB,#0EA5E9)', color: '#fff', padding: 10 }}>
                <div style={{ font: '700 8px/1 Inter', letterSpacing: 1.5, opacity: 0.7 }}>REPUBLIC OF INDIA</div>
                <div style={{ font: '700 11px/1 Plus Jakarta Sans', marginTop: 4 }}>PASSPORT</div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: 10 }}>
                <div style={{ width: 38, height: 50, background: '#F1F5F9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 22, color: '#94A3B8' }}>person</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[60, 80, 50, 70].map((w, i) => <div key={i} style={{ width: `${w}%`, height: 4, background: '#E2E8F0', borderRadius: 2 }}/>)}
                </div>
              </div>
              <div style={{ padding: '4px 10px' }}>
                {[90, 65, 75].map((w, i) => <div key={i} style={{ width: `${w}%`, height: 3, background: '#F1F5F9', marginBottom: 4, borderRadius: 2 }}/>)}
              </div>
              {/* Animated scan line */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '62%', height: 3, background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)', boxShadow: '0 0 20px #0EA5E9' }}/>
            </div>
            {/* AI rings */}
            <div style={{ position: 'absolute', inset: -20, borderRadius: 24, border: '2px dashed rgba(124,58,237,.4)', animation: 'spin 8s linear infinite' }}/>
            <div style={{ position: 'absolute', top: -8, left: 50, padding: '3px 9px', background: '#7C3AED', borderRadius: 999, font: '700 9px/1 Inter', letterSpacing: 0.4 }}>CLAUDE 3.5</div>
          </div>
          {/* live score */}
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Live readiness</div>
            <div style={{ font: '800 56px/1 Plus Jakarta Sans', color: '#fff', marginTop: 8, fontFeatureSettings: '"tnum"' }}>
              <span style={{ color: '#0EA5E9' }}>72</span>
              <span style={{ font: '500 14px/1 Inter', color: 'rgba(255,255,255,.5)', marginLeft: 6 }}>/ 100</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, font: '600 11px/1 Inter', color: '#0EA5E9' }}>
              <span className="mi" style={{ fontSize: 14 }}>arrow_upward</span> updating live · est 8s left
            </div>
          </div>
        </div>
        {/* progress dots */}
        <div style={{ padding: '24px 24px 0', flex: 1, overflow: 'auto' }}>
          {stages.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? '#10B981' : s.active ? 'transparent' : 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                {s.done && <span className="mi" style={{ fontSize: 14, color: '#fff' }}>check</span>}
                {s.active && (
                  <>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }}/>
                  </>
                )}
              </div>
              <div style={{ flex: 1, font: `${s.active ? 600 : 500} 13px/1.3 Inter`, color: s.done ? 'rgba(255,255,255,.55)' : s.active ? '#fff' : 'rgba(255,255,255,.4)' }}>
                {s.l}{s.active && <span style={{ opacity: 0.6 }}>…</span>}
              </div>
              {s.dur && <span style={{ font: '600 10px/1 JetBrains Mono', color: s.done ? '#10B981' : s.active ? '#7C3AED' : 'rgba(255,255,255,.3)' }}>{s.dur}</span>}
            </div>
          ))}
          {/* streamed token preview */}
          <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="mi" style={{ fontSize: 16, color: '#A78BFA' }}>auto_awesome</span>
              <span style={{ font: '600 11px/1 Inter', color: '#A78BFA', letterSpacing: 0.5 }}>AI reasoning · streaming</span>
            </div>
            <div style={{ font: '400 12px/1.5 JetBrains Mono', color: 'rgba(255,255,255,.85)' }}>
              "Name on document: <span style={{ color: '#0EA5E9' }}>SARAH MITCHELL</span>. Profile name: <span style={{ color: '#0EA5E9' }}>Sarah Mitchell</span>. Match: exact (case-insensitive). DOB on doc: <span style={{ color: '#0EA5E9' }}>14-MAR-1992</span>▎"
            </div>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', gap: 10 }}>
          <Btn variant="outlined" size="md" style={{ flex: 1, background: 'rgba(255,255,255,.08)', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}>Run in background</Btn>
          <Btn variant="text" size="md" style={{ flex: 0.6, color: '#94A3B8' }}>Cancel</Btn>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin {to{transform:rotate(360deg)}}' }}/>
    </PhoneBody>
  );
}

// ─── Mobile · Application-level same-time analysis (multi-doc readiness) ───
function MAppRealtime() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="France · live analysis" sub="Updating every change" leading="arrow_back" trailing={[{ icon: 'pause' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Card padding={18} elevation={3} style={{ background: 'linear-gradient(135deg,#0B1F4B,#7C3AED)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(14,165,233,.25)' }}/>
          <Chip tone="ai" size="sm" icon="bolt" style={{ background: 'rgba(14,165,233,.2)', color: '#7DD3FC', position: 'relative' }}>Same-time AI</Chip>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <ScoreRing value={87} size={84} stroke={8}/>
              <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.3)', animation: 'spin 10s linear infinite' }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 18px/1.2 Plus Jakarta Sans' }}>Updated 2s ago</div>
              <div style={{ font: '400 12px/1.5 Inter', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Score recalculates whenever you add, edit, or re-upload a document.</div>
            </div>
          </div>
        </Card>

        {/* Streaming insights */}
        <div style={{ marginTop: 18, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>AI insights — streaming</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { i: 'trending_up', c: '#10B981', t: 'Score went up by +5', s: 'Bank Nov statement just added → balance trend improved', ts: 'just now', live: true },
            { i: 'check_circle', c: '#10B981', t: 'Name consistency confirmed', s: '6/6 documents match "Sarah Mitchell"', ts: '12s ago' },
            { i: 'flag', c: '#EF4444', t: 'Hotel booking still blocking', s: 'Reservation held, not paid — Schengen requires confirmed', ts: '34s ago' },
            { i: 'schedule', c: '#0EA5E9', t: 'Submit window calculated', s: 'Optimal submission: Mar 1-5 (8-12 days before travel)', ts: '1m ago' },
            { i: 'tips_and_updates', c: '#F59E0B', t: 'AI tip', s: 'Add a no-objection letter from employer to boost confidence', ts: '2m ago' },
          ].map((n, i) => (
            <Card key={i} padding={12} elevation={1} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${n.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <span className="mi" style={{ fontSize: 18, color: n.c }}>{n.i}</span>
                {n.live && <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,.3)' }}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{n.t}</div>
                  <span style={{ font: '500 10px/1 Inter', color: '#94A3B8' }}>{n.ts}</span>
                </div>
                <div style={{ font: '400 12px/1.5 Inter', color: '#64748B', marginTop: 4 }}>{n.s}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Active analyses queue */}
        <div style={{ marginTop: 18, font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Currently analyzing</div>
        <Card padding={14} elevation={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span className="mi" style={{ fontSize: 16, color: '#7C3AED' }}>description</span>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 8, border: '2px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 1.2s linear infinite' }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Employment-Letter.pdf</div>
              <div style={{ font: '400 11px/1.3 Inter', color: '#7C3AED', marginTop: 2 }}>Stage 3 of 5 · checking signatory authenticity</div>
            </div>
            <span style={{ font: '700 13px/1 JetBrains Mono', color: '#7C3AED' }}>62%</span>
          </div>
          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '62%', height: '100%', background: 'linear-gradient(90deg,#7C3AED,#A78BFA)' }}/>
          </div>
        </Card>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin {to{transform:rotate(360deg)}}' }}/>
    </PhoneBody>
  );
}

// ─── Web · Real-time analysis dashboard ─────────────────────────────────────
function WRealtimeAudit() {
  return (
    <WebShell role="consumer" active="apps">
      <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 6, font: '500 12px/1 Inter', color: '#64748B' }}>
        <span>Applications</span><span className="mi" style={{ fontSize: 14 }}>chevron_right</span>
        <span>France Schengen</span><span className="mi" style={{ fontSize: 14 }}>chevron_right</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>Live AI analysis</span>
      </div>
      <div style={{ padding: '16px 32px 32px' }}>
        {/* hero */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', marginBottom: 24 }}>
          <Card padding={28} elevation={3} style={{ flex: 1, background: 'linear-gradient(135deg,#0B1F4B,#1A56DB 60%,#7C3AED 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,.25), transparent 70%)' }}/>
            <div style={{ position: 'relative', display: 'flex', gap: 40, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <ScoreRing value={87} size={180} stroke={14}/>
                <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px dashed rgba(255,255,255,.25)', animation: 'spin 14s linear infinite' }}/>
                <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: '1px dashed rgba(124,58,237,.4)', animation: 'spin 22s linear infinite reverse' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Chip tone="ai" size="sm" icon="bolt" style={{ background: 'rgba(14,165,233,.2)', color: '#7DD3FC' }}>LIVE · same-time AI</Chip>
                  <Chip tone="success" size="sm" icon="trending_up" style={{ background: 'rgba(16,185,129,.2)', color: '#6EE7B7' }}>+5 in last 2 min</Chip>
                </div>
                <div style={{ font: '800 48px/1 Plus Jakarta Sans', marginTop: 18, letterSpacing: '-0.02em' }}>Application readiness</div>
                <div style={{ font: '400 14px/1.5 Inter', color: 'rgba(255,255,255,.75)', marginTop: 8, maxWidth: 540 }}>
                  Claude 3.5 Sonnet + Gemini 2.0 Flash analyzing 6 documents against live France Schengen requirements. Score updates on every change — no need to refresh.
                </div>
                <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
                  {[
                    { l: 'Last update', v: 'just now', c: '#10B981' },
                    { l: 'Tokens used', v: '12.4k', c: '#fff' },
                    { l: 'Models active', v: '2', c: '#A78BFA' },
                    { l: 'Confidence', v: '94%', c: '#7DD3FC' },
                  ].map(s => (
                    <div key={s.l}>
                      <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.55)', letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.l}</div>
                      <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', color: s.c, marginTop: 6 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 3-col: live docs · stream · suggestions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16 }}>
          {/* Documents pulsing through */}
          <Card padding={0} elevation={1}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Documents · live audit</div>
              <Chip tone="ai" size="sm" icon="autorenew">2 running</Chip>
            </div>
            {[
              { i: 'badge', n: 'Passport.pdf', sc: 92, st: 'done', sub: 'Done · 0.8s' },
              { i: 'account_balance', n: 'Bank-Nov.pdf', sc: 78, st: 'active', sub: 'Step 4 of 5 · checking trends', p: 78 },
              { i: 'work', n: 'Emp-Letter.pdf', sc: null, st: 'active', sub: 'Step 3 of 5 · verifying signatory', p: 62 },
              { i: 'hotel', n: 'Hotel.pdf', sc: 48, st: 'flag', sub: 'Done · 2 issues' },
              { i: 'local_hospital', n: 'Insurance.pdf', sc: 95, st: 'done', sub: 'Done · 1.1s' },
              { i: 'photo_camera_front', n: 'Photo.jpg', sc: null, st: 'queue', sub: 'Queued · ~3s' },
            ].map((d, i, arr) => (
              <div key={i} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 32, height: 40, borderRadius: 6, background: d.st === 'flag' ? '#FEE2E2' : d.st === 'active' ? '#FAF5FF' : d.st === 'queue' ? '#F1F5F9' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span className="mi" style={{ fontSize: 18, color: d.st === 'flag' ? '#DC2626' : d.st === 'active' ? '#7C3AED' : d.st === 'queue' ? '#94A3B8' : '#059669' }}>{d.i}</span>
                  {d.st === 'active' && <div style={{ position: 'absolute', inset: 0, borderRadius: 6, border: '2px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 1.2s linear infinite' }}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {d.n}
                    {d.st === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,.25)' }}/>}
                  </div>
                  <div style={{ font: '400 11px/1.3 Inter', color: d.st === 'active' ? '#7C3AED' : '#64748B', marginTop: 2 }}>{d.sub}</div>
                  {d.p != null && (
                    <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${d.p}%`, height: '100%', background: 'linear-gradient(90deg,#7C3AED,#A78BFA)' }}/>
                    </div>
                  )}
                </div>
                {d.sc != null && <ScoreRing value={d.sc} size={36} stroke={4}/>}
              </div>
            ))}
          </Card>

          {/* AI reasoning stream */}
          <Card padding={0} elevation={1} style={{ background: '#0F172A', color: '#fff', border: 'none' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mi" style={{ fontSize: 16, color: '#A78BFA' }}>terminal</span>
                <span style={{ font: '700 12px/1 Inter', color: '#fff' }}>AI reasoning</span>
              </div>
              <Chip tone="ai" size="sm" style={{ background: 'rgba(124,58,237,.3)', color: '#A78BFA' }}>Claude · streaming</Chip>
            </div>
            <div style={{ padding: 16, font: '400 11.5px/1.65 JetBrains Mono', color: 'rgba(255,255,255,.85)', minHeight: 300 }}>
              <div style={{ color: '#94A3B8' }}>{`> emp-letter.pdf — stage 3/5`}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ color: '#A78BFA' }}>// extracting signatory block</span><br/>
                Detected signature: <span style={{ color: '#7DD3FC' }}>"M. Acharya, Director HR, Stripe Inc."</span><br/>
                Cross-checking with LinkedIn public record…<br/>
                <span style={{ color: '#10B981' }}>✓</span> Match found — title confirmed.<br/><br/>
                <span style={{ color: '#A78BFA' }}>// validating letterhead</span><br/>
                Letterhead OCR: <span style={{ color: '#7DD3FC' }}>"Stripe, Inc."</span><br/>
                Domain in footer: <span style={{ color: '#7DD3FC' }}>stripe.com</span><br/>
                <span style={{ color: '#10B981' }}>✓</span> Domain verified · WHOIS registrar matches.<br/><br/>
                <span style={{ color: '#A78BFA' }}>// checking leave approval phrase</span><br/>
                Phrase: <span style={{ color: '#7DD3FC' }}>"approved leave 15-24 March 2026"</span><br/>
                Travel dates from application: <span style={{ color: '#7DD3FC' }}>15-24 March 2026</span><br/>
                <span style={{ color: '#10B981' }}>✓</span> Date coverage: exact match.<br/><br/>
                <span style={{ color: '#F59E0B' }}>partial_score = 0.88</span><br/>
                <span style={{ color: '#A78BFA' }}>// continuing to stage 4…</span>
                <span style={{ display: 'inline-block', width: 6, height: 14, background: '#A78BFA', verticalAlign: -2, marginLeft: 4, animation: 'blink 1s steps(1) infinite' }}/>
              </div>
            </div>
          </Card>

          {/* AI suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card padding={16} elevation={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AIBadge small/>
                <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Next best action</div>
              </div>
              <div style={{ font: '600 14px/1.4 Inter', color: '#0F172A' }}>Pay your hotel reservation today</div>
              <div style={{ font: '400 12px/1.5 Inter', color: '#64748B', marginTop: 6 }}>This is your single biggest blocker. Switching to a paid refundable rate jumps your score from 87 → 95.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8 }}>
                <span className="mi" style={{ fontSize: 16, color: '#10B981' }}>trending_up</span>
                <span style={{ font: '600 11px/1 Inter', color: '#047857' }}>Predicted impact: +8 readiness</span>
              </div>
              <Btn variant="primary" full size="sm" icon="open_in_new" style={{ marginTop: 12 }}>Open hotel booking</Btn>
            </Card>
            <Card padding={16} elevation={1}>
              <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Predicted timeline</div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { t: 'Now', l: 'Score 87 · 2 blockers', c: '#7C3AED' },
                  { t: 'Today + fix hotel', l: 'Projected 95', c: '#10B981' },
                  { t: 'Mar 3', l: 'Optimal submit window', c: '#1A56DB' },
                  { t: 'Mar 13', l: 'Expected decision', c: '#94A3B8' },
                ].map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.c }}/>
                    <div style={{ font: '600 11px/1 JetBrains Mono', color: '#0F172A', width: 88 }}>{e.t}</div>
                    <div style={{ flex: 1, font: '500 12px/1.3 Inter', color: '#475569' }}>{e.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin {to{transform:rotate(360deg)} } @keyframes blink {50%{opacity:0}}' }}/>
    </WebShell>
  );
}

Object.assign(window, { MAIAnalysisLive, MAppRealtime, WRealtimeAudit });
