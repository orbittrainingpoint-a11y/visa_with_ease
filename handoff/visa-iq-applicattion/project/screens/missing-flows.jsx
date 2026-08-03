/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Booking flow (F-BOOKING-02 / 03 / 04) + Audit flow (F-AUD-04 / 07 / 08 / 09)

// ─── 01 F-BOOKING-02 · Calendar slot selection ─────────────────────────────
function MBookingCalendar() {
  const Slot = ({ t, taken, sel }) => (
    <div style={{
      padding: '10px 0', textAlign: 'center', borderRadius: 10,
      background: sel ? '#1A56DB' : taken ? '#F1F5F9' : '#fff',
      color: sel ? '#fff' : taken ? '#94A3B8' : '#0F172A',
      border: sel ? 'none' : `1px solid ${taken ? '#E2E8F0' : '#CBD5E1'}`,
      font: `${sel ? 700 : 600} 12px/1 JetBrains Mono`,
      textDecoration: taken ? 'line-through' : 'none',
    }}>{t}</div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Pick a time" sub="With Priya R. · UK Schengen specialist" leading="arrow_back" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ display: 'flex', gap: 4, padding: '14px 16px 0', background: '#fff', flexShrink: 0 }}>
        {[1,1,1,0,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
      </div>
      <div style={{ padding: '8px 16px 16px', background: '#fff', flexShrink: 0, borderBottom: '1px solid #F1F5F9' }}>
        <Chip tone="info" size="sm">Step 3 of 5 · Pick a slot</Chip>
        <div style={{ font: '700 20px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 8, letterSpacing: '-0.01em' }}>When works for you?</div>
        <div style={{ font: '400 12px/1.4 Inter', color: '#64748B', marginTop: 4 }}>All times in IST (your local timezone) · 30-minute session</div>
      </div>

      {/* Month strip */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>March 2026</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span className="mi" style={{ fontSize: 20, color: '#475569' }}>chevron_left</span>
            <span className="mi" style={{ fontSize: 20, color: '#1A56DB' }}>chevron_right</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 14 }}>
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} style={{ font: '500 10px/1 Inter', color: '#94A3B8', textAlign: 'center', padding: '4px 0' }}>{d}</div>)}
          {Array.from({length: 31}).map((_, i) => {
            const d = i + 1;
            const sel = d === 8;
            const today = d === 5;
            const past = d < 5;
            const taken = [4,6,11,18,25].includes(d);
            const hasSlots = !past && !taken;
            return (
              <div key={i} style={{
                padding: '8px 0', textAlign: 'center', borderRadius: 8,
                background: sel ? '#1A56DB' : 'transparent',
                color: sel ? '#fff' : past ? '#CBD5E1' : today ? '#1A56DB' : '#0F172A',
                font: `${sel || today ? 700 : 500} 13px/1 Inter`, position: 'relative',
              }}>
                {d}
                {hasSlots && !sel && <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: '#10B981' }}/>}
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background: '#F1F5F9', margin: '10px 0' }}/>
        <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Sun, Mar 8 · 9 slots available</div>

        {/* Morning slots */}
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Morning · IST</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          <Slot t="9:00 AM"/>
          <Slot t="9:30 AM"/>
          <Slot t="10:00 AM" taken/>
          <Slot t="10:30 AM"/>
          <Slot t="11:00 AM" sel/>
          <Slot t="11:30 AM"/>
        </div>
        <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Afternoon</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          <Slot t="2:00 PM"/>
          <Slot t="2:30 PM" taken/>
          <Slot t="3:00 PM"/>
          <Slot t="3:30 PM"/>
          <Slot t="4:00 PM" taken/>
          <Slot t="4:30 PM"/>
        </div>

        {/* Timezone tip */}
        <Card padding={12} elevation={1} style={{ background: '#FAF5FF', border: '1px solid #DDD6FE', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mi" style={{ fontSize: 18, color: '#6D28D9' }}>schedule</span>
            <div style={{ flex: 1, font: '500 11px/1.4 Inter', color: '#475569' }}>Priya is online <b>now</b>. Sun 11 AM = 6:30 AM UK · 1:30 AM EST.</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: 14, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>Selected</div>
          <div style={{ font: '700 13px/1.2 Inter', color: '#0F172A', marginTop: 2 }}>Sun, Mar 8 · 11:00 AM</div>
        </div>
        <Btn variant="primary" trailing="arrow_forward">Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 02 F-BOOKING-03 · Pre-call summary (review what's shared) ────────────
function MBookingPrecall() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Review & confirm" sub="Step 4 of 5" leading="arrow_back"/>
      <div style={{ display: 'flex', gap: 4, padding: '14px 16px 14px', background: '#fff', flexShrink: 0, borderBottom: '1px solid #F1F5F9' }}>
        {[1,1,1,1,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ font: '700 22px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Your call is almost set.</div>
        <div style={{ font: '400 12px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Priya will see this summary <b>before</b> your call so she's prepped.</div>

        {/* Expert + slot card */}
        <Card padding={16} elevation={2} style={{ marginTop: 16, background: 'linear-gradient(135deg,#0F172A,#1A56DB)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '700 16px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.2 Plus Jakarta Sans' }}>Priya Raghavan</div>
              <div style={{ font: '500 11px/1.4 Inter', color: 'rgba(255,255,255,.7)' }}>UK & Schengen · ★ 4.92</div>
            </div>
            <Chip tone="gold" size="sm">$49</Chip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,.15)' }}>
            <div>
              <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)' }}>When</div>
              <div style={{ font: '700 12px/1.3 Inter', marginTop: 4 }}>Sun, Mar 8 · 11:00 AM IST</div>
            </div>
            <div>
              <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.6)' }}>Duration</div>
              <div style={{ font: '700 12px/1.3 Inter', marginTop: 4 }}>30 min · video call</div>
            </div>
          </div>
        </Card>

        {/* What's shared */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A' }}>Shared with Priya</div>
          <span style={{ font: '500 12px/1 Inter', color: '#1A56DB' }}>Edit</span>
        </div>
        <Card padding={0} elevation={1} style={{ marginTop: 8 }}>
          {[
            { i: 'flag', t: 'France Schengen Tourist · Mar 15', sub: 'Application context', on: true },
            { i: 'auto_awesome', t: 'AI audit summary · score 87/100', sub: '3 issues highlighted', on: true },
            { i: 'description', t: '6 uploaded documents', sub: 'View-only · auto-redacted', on: true },
            { i: 'edit_note', t: 'Your question / topic', sub: '"Bank balance — is mine enough?"', on: true },
            { i: 'flight_takeoff', t: 'Travel history (last 3 yrs)', sub: 'Optional · helps context', on: false },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <span className="mi" style={{ fontSize: 20, color: r.on ? '#10B981' : '#CBD5E1', marginTop: 1 }}>{r.on ? 'check_circle' : 'radio_button_unchecked'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 12px/1.3 Inter', color: r.on ? '#0F172A' : '#94A3B8' }}>{r.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#94A3B8', marginTop: 2 }}>{r.sub}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Order summary */}
        <div style={{ marginTop: 18, font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 8 }}>Order summary</div>
        <Card padding={14} elevation={1}>
          {[
            { l: '30-min VIP session', v: '$49.00' },
            { l: 'Discount · first session', v: '−$10.00', c: '#10B981' },
            { l: 'Tax · 18% GST', v: '$7.02' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', font: '500 12px/1.4 Inter', color: r.c || '#475569' }}>
              <span>{r.l}</span><span style={{ font: '600 12px JetBrains Mono' }}>{r.v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>
            <span>Total</span><span>$46.02</span>
          </div>
        </Card>

        {/* Terms */}
        <div style={{ font: '400 10px/1.5 Inter', color: '#94A3B8', marginTop: 14, textAlign: 'center' }}>
          By confirming you agree to our <b style={{ color: '#1A56DB' }}>Marketplace Terms</b>. Free reschedule up to 1h before.
        </div>
      </div>

      <div style={{ padding: 14, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8, flexShrink: 0 }}>
        <Btn variant="outlined" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" trailing="lock" style={{ flex: 1 }}>Pay & confirm</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 03 F-BOOKING-04 · Confirmed (celebration + meeting details) ──────────
function MBookingConfirmed() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: 'linear-gradient(155deg,#10B981,#1A56DB)', color: '#fff', padding: '30px 20px 80px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }}/>
        <div style={{ position: 'absolute', left: -30, bottom: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,.2)' }}/>
        <button style={{ width: 36, height: 36, border: 0, background: 'rgba(255,255,255,.15)', borderRadius: 18 }}>
          <span className="mi" style={{ fontSize: 20, color: '#fff' }}>close</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20, position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(0,0,0,.2)' }}>
            <span className="mi" style={{ fontSize: 48, color: '#10B981' }}>check_circle</span>
          </div>
          <div style={{ font: '800 26px/1.2 Plus Jakarta Sans', marginTop: 18, letterSpacing: '-0.02em' }}>You're booked!</div>
          <div style={{ font: '400 13px/1.5 Inter', color: 'rgba(255,255,255,.8)', marginTop: 6, textAlign: 'center' }}>Confirmation sent to <b>sarah@gmail.com</b></div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', marginTop: -56 }}>
        {/* Meeting card */}
        <Card padding={18} elevation={4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#0EA5E9,#7C3AED)', color: '#fff', font: '700 14px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Priya Raghavan</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>UK & Schengen specialist</div>
            </div>
            <Chip tone="success" size="sm" icon="videocam">30 min</Chip>
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mi" style={{ fontSize: 28, color: '#1A56DB' }}>event</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.3 Plus Jakarta Sans', color: '#0F172A' }}>Sun, Mar 8</div>
              <div style={{ font: '500 12px/1.4 Inter', color: '#1547C0', marginTop: 2 }}>11:00 — 11:30 AM IST · in 3 days</div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <Btn variant="tonal" size="sm" icon="event_available">Add to calendar</Btn>
            <Btn variant="outlined" size="sm" icon="content_copy">Copy link</Btn>
          </div>

          {/* Reminders */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mi" style={{ fontSize: 18, color: '#1A56DB' }}>notifications_active</span>
            <div style={{ flex: 1, font: '500 12px/1.4 Inter', color: '#475569' }}>You'll get a push reminder 30 min before</div>
            <div style={{ width: 36, height: 22, borderRadius: 11, background: '#1A56DB', padding: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff' }}/>
            </div>
          </div>
        </Card>

        {/* What to prepare */}
        <div style={{ marginTop: 18, font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Before your call</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'wifi', t: 'Stable internet · use WiFi if possible' },
            { i: 'mic_none', t: 'Test your mic — quiet room helps' },
            { i: 'description', t: 'Have your documents ready (Priya sees a summary)' },
            { i: 'edit_note', t: 'Jot down your top 3 questions' },
          ].map((p, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <span className="mi" style={{ fontSize: 20, color: '#1A56DB' }}>{p.i}</span>
              <div style={{ flex: 1, font: '500 12px/1.4 Inter', color: '#475569' }}>{p.t}</div>
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <Btn variant="outlined" style={{ flex: 1 }} icon="event_repeat">Reschedule</Btn>
          <Btn variant="primary" style={{ flex: 1 }} icon="home">Back to home</Btn>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 04 F-AUD-04 · Pre-upload review (crop/rotate before confirm) ─────────
function MAuditPreUpload() {
  return (
    <PhoneBody bg="#0F172A" surface="#0F172A">
      {/* top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>arrow_back</span></button>
        <div style={{ flex: 1, padding: '0 4px', color: '#fff' }}>
          <div style={{ font: '700 14px/1.2 Plus Jakarta Sans' }}>Pre-upload review</div>
          <div style={{ font: '500 11px/1 Inter', color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Bank-Oct-2025.pdf · page 1 of 3</div>
        </div>
        <span className="mi" style={{ fontSize: 22, color: '#fff', padding: 10 }}>more_vert</span>
      </div>

      {/* Image preview area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* fake doc preview */}
        <div style={{ position: 'absolute', inset: '14px 24px 100px', background: '#fff', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,.4)', padding: 16, transform: 'rotate(-1deg)' }}>
          <div style={{ font: '700 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>HDFC BANK</div>
          <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', marginTop: 4 }}>Account · ****8421 · Oct 2025</div>
          <div style={{ height: 1, background: '#E2E8F0', margin: '12px 0' }}/>
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: '400 10px/1.5 Inter', color: '#475569', padding: '3px 0' }}>
              <span>Oct {String(i+2).padStart(2,'0')} · UPI · grocery</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: i % 3 ? '#10B981' : '#DC2626' }}>{i % 3 ? '+' : '−'}₹{(i+1)*420}</span>
            </div>
          ))}
        </div>

        {/* Detection chips overlay */}
        <div style={{ position: 'absolute', top: 14, left: 24, right: 24, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip tone="success" size="sm" icon="check_circle">PDF · clear</Chip>
          <Chip tone="success" size="sm" icon="visibility">All text legible</Chip>
          <Chip tone="warning" size="sm" icon="info">Slight rotation · 2°</Chip>
        </div>

        {/* Edit toolbar */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0 24px' }}>
          {[
            { i: 'crop', l: 'Crop' },
            { i: 'rotate_left', l: 'Rotate' },
            { i: 'auto_fix_high', l: 'Enhance' },
            { i: 'add', l: 'Page' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <button style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 22, color: '#fff' }}>{t.i}</span>
              </button>
              <span style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.7)' }}>{t.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: 14, background: '#1E293B', borderTop: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AIBadge small/>
          <div style={{ flex: 1, font: '500 11px/1.4 Inter', color: 'rgba(255,255,255,.85)' }}>AI pre-scan: looks like a <b>bank statement</b>. Audit ready in ~6 sec.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outlined" style={{ flex: 0.4, color: '#fff', borderColor: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)' }} icon="restart_alt">Retake</Btn>
          <Btn variant="primary" style={{ flex: 1 }} icon="cloud_upload">Confirm & upload</Btn>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 05 F-AUD-07 · Audit complete summary (celebrate good result) ─────────
function MAuditComplete() {
  return (
    <PhoneBody bg="#F8FAFC">
      {/* Hero gradient */}
      <div style={{ background: 'linear-gradient(155deg,#10B981 0%,#0EA5E9 50%,#1A56DB 100%)', color: '#fff', padding: '24px 20px 80px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }}/>
        <button style={{ width: 36, height: 36, border: 0, background: 'rgba(255,255,255,.15)', borderRadius: 18 }}>
          <span className="mi" style={{ fontSize: 20, color: '#fff' }}>close</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 14, position: 'relative' }}>
          <Chip tone="success" size="md" icon="auto_awesome" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>Audit complete · 8.2 sec</Chip>
          <div style={{ width: 132, height: 132, marginTop: 18, position: 'relative' }}>
            <ScoreRing value={92} size={132} stroke={10}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
              <div style={{ font: '800 44px/1 Plus Jakarta Sans', color: '#fff' }}>92</div>
              <div style={{ font: '500 10px/1 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2, letterSpacing: 1 }}>OF 100</div>
            </div>
          </div>
          <div style={{ font: '800 22px/1.2 Plus Jakarta Sans', marginTop: 18, letterSpacing: '-0.01em' }}>Looks great!</div>
          <div style={{ font: '400 13px/1.5 Inter', color: 'rgba(255,255,255,.85)', marginTop: 6, textAlign: 'center', maxWidth: 280 }}>Your bank statement passed all checks — funds, format, and coverage period.</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', marginTop: -56 }}>
        {/* Findings card */}
        <Card padding={16} elevation={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#0F172A' }}>What we checked</div>
            <Chip tone="success" size="sm">5 of 5 passed</Chip>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { t: 'Full month coverage · Oct 1 → Oct 31', ok: true },
              { t: 'Avg balance €5,210 · above €5k threshold', ok: true, hl: true },
              { t: 'Bank header + stamp present', ok: true },
              { t: 'No redactions on key fields', ok: true },
              { t: 'Name matches your passport', ok: true },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                <span className="mi" style={{ fontSize: 18, color: '#10B981', marginTop: 1 }}>check_circle</span>
                <div style={{ flex: 1, font: '500 12px/1.4 Inter', color: '#0F172A' }}>{r.t}</div>
                {r.hl && <Chip tone="ai" size="sm" style={{ height: 16, padding: '0 6px', fontSize: 9 }}>KEY</Chip>}
              </div>
            ))}
          </div>
        </Card>

        {/* App-level impact */}
        <div style={{ marginTop: 18, font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>This nudged your application</div>
        <Card padding={16} elevation={2} style={{ background: 'linear-gradient(135deg,#EFF6FF,#FAF5FF)', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{flag('FR')}</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>France Schengen</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Readiness improved <b style={{ color: '#10B981' }}>+8</b> · now 87/100</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: '#fff', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '79%', height: '100%', background: '#CBD5E1' }}/>
              <div style={{ position: 'absolute', top: 0, left: '79%', width: '8%', height: '100%', background: '#10B981' }}/>
            </div>
            <span style={{ font: '700 12px/1 JetBrains Mono', color: '#0F172A' }}>87</span>
          </div>
        </Card>

        {/* Next best action */}
        <div style={{ marginTop: 18, font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Next best action</div>
        <Card padding={14} elevation={1} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mi" style={{ fontSize: 22, color: '#F97316' }}>hotel</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Upload paid hotel confirmation</div>
            <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Last doc · gets you to 95</div>
          </div>
          <Btn variant="primary" size="sm">Upload</Btn>
        </Card>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <Btn variant="outlined" style={{ flex: 1 }} icon="description">Full report</Btn>
          <Btn variant="tonal" style={{ flex: 1 }} icon="ios_share">Share PDF</Btn>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 06 F-AUD-08 · Error / recovery (something went wrong) ────────────────
function MAuditError() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Audit failed" leading="arrow_back"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span className="mi" style={{ fontSize: 44, color: '#DC2626' }}>error_outline</span>
          </div>
          <div style={{ font: '800 22px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>We couldn't audit that file.</div>
          <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 6, maxWidth: 280 }}>It looks like the document was cut off or blurred. Not your fault — let's try a clean shot.</div>
        </div>

        {/* Error detail */}
        <Card padding={14} elevation={1} style={{ background: '#FEE2E2', border: '1px solid #FECACA', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span className="mi" style={{ fontSize: 20, color: '#DC2626', marginTop: 1 }}>warning</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 12px/1.3 Inter', color: '#991B1B' }}>What we saw</div>
              <div style={{ font: '400 11px/1.5 Inter', color: '#7F1D1D', marginTop: 4 }}>Bank-Oct-2025.pdf · page 2 of 3 has glare blocking the transaction column. Pages 1 and 3 look fine.</div>
              <div style={{ font: '500 10px/1 JetBrains Mono', color: '#DC2626', marginTop: 8 }}>ERR_AUDIT_OCR_LOW_CONFIDENCE · 0x84A2</div>
            </div>
          </div>
        </Card>

        {/* Recovery options */}
        <div style={{ marginTop: 18, font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Try one of these</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { i: 'photo_camera', t: 'Retake page 2 only', sub: 'We'll keep pages 1 and 3 · ~10 sec', primary: true, c: '#1A56DB' },
            { i: 'upload_file', t: 'Replace the whole PDF', sub: 'Upload a fresh export from your bank', c: '#475569' },
            { i: 'chat', t: 'Ask the AI for help', sub: 'Get specific guidance on what to fix', c: '#7C3AED' },
            { i: 'support_agent', t: 'Talk to a consultant ($)', sub: 'Priya is online · 12s wait', c: '#F59E0B' },
          ].map((o, i) => (
            <Card key={i} padding={14} elevation={o.primary ? 2 : 1} style={{
              border: o.primary ? `1.5px solid ${o.c}` : '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${o.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 22, color: o.c }}>{o.i}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{o.t}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{o.sub}</div>
              </div>
              <span className="mi" style={{ fontSize: 20, color: '#CBD5E1' }}>chevron_right</span>
            </Card>
          ))}
        </div>

        {/* Tip */}
        <Card padding={12} elevation={1} style={{ marginTop: 18, background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span className="mi" style={{ fontSize: 18, color: '#7C3AED', marginTop: 1 }}>tips_and_updates</span>
            <div style={{ flex: 1, font: '500 11px/1.5 Inter', color: '#475569' }}>
              <b style={{ color: '#0F172A' }}>Tip from Priya:</b> tilt the page slightly away from the window — glare is the #1 OCR killer.
            </div>
          </div>
        </Card>

        <Btn variant="text" size="sm" full style={{ marginTop: 14 }}>Discard upload</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 07 F-AUD-09 · Full Audit Report (PDF preview screen) ─────────────────
function MAuditPDF() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ height: 56, background: '#0F172A', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22, color: '#fff' }}>arrow_back</span></button>
        <div style={{ flex: 1, padding: '0 4px' }}>
          <div style={{ font: '700 13px/1.2 Inter' }}>Audit Report · France Schengen</div>
          <div style={{ font: '500 10px/1 JetBrains Mono', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>VIQ-REP-2026-03-08-FR · 12 pages</div>
        </div>
        <span className="mi" style={{ fontSize: 22, color: '#fff', padding: 10 }}>ios_share</span>
        <span className="mi" style={{ fontSize: 22, color: '#fff', padding: 10 }}>more_vert</span>
      </div>

      {/* PDF page preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: 14, background: '#E5E7EB' }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '2px solid #0B1F4B' }}>
            <Logo size={20}/>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>AI Audit Report</div>
              <div style={{ font: '700 11px/1 JetBrains Mono', color: '#0F172A', marginTop: 4 }}>VIQ-REP-2026-03-08-FR</div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ font: '500 11px/1 Inter', color: '#64748B', letterSpacing: 0.4, textTransform: 'uppercase' }}>Applicant</div>
            <div style={{ font: '800 18px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 6 }}>Sarah Mitchell</div>
            <div style={{ font: '500 12px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{flag('GB')} British → {flag('FR')} France Schengen Tourist · Travel Mar 15</div>
          </div>

          <div style={{ marginTop: 18, padding: 14, background: '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
            <ScoreRing value={87} size={62} stroke={6}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: '500 10px/1 Inter', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>Overall readiness</div>
              <div style={{ font: '800 24px/1.1 Plus Jakarta Sans', color: '#0F172A', marginTop: 4 }}>87 / 100</div>
              <Chip tone="success" size="sm" style={{ marginTop: 4 }}>Strong</Chip>
            </div>
          </div>

          {/* Findings */}
          <div style={{ marginTop: 18, font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Findings · 6 docs</div>
          {[
            { d: 'Passport', sc: 92, st: '#10B981', n: 'Valid until 2029-08-22' },
            { d: 'Bio photo', sc: 95, st: '#10B981', n: 'Schengen compliant' },
            { d: 'Bank statement', sc: 92, st: '#10B981', n: 'Avg €5,210 over 3 mo' },
            { d: 'Employment letter', sc: 88, st: '#10B981', n: 'Acme letterhead + signature' },
            { d: 'Hotel booking', sc: 48, st: '#DC2626', n: '⚠ HELD, not paid' },
            { d: 'Travel insurance', sc: 91, st: '#10B981', n: '€50k coverage · valid full trip' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < arr.length-1 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 11px/1.2 Inter', color: '#0F172A' }}>{r.d}</div>
                <div style={{ font: '400 10px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.n}</div>
              </div>
              <div style={{ font: '700 14px/1 JetBrains Mono', color: r.st }}>{r.sc}</div>
            </div>
          ))}

          {/* Footer */}
          <div style={{ marginTop: 16, padding: 8, background: '#F8FAFC', borderRadius: 6, font: '400 9px/1.5 Inter', color: '#94A3B8', textAlign: 'center' }}>
            Generated by VisaIQ AI · 8 Mar 2026 11:24 IST · Page 1 of 12 · Continued →
          </div>
        </div>

        {/* Page indicator */}
        <div style={{ textAlign: 'center', marginTop: 12, font: '500 11px/1 JetBrains Mono', color: '#64748B' }}>Page 1 of 12 · Scroll for findings detail, recommendations, sources</div>
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: 12, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 6, flexShrink: 0 }}>
        <Btn variant="outlined" size="md" icon="download" style={{ flex: 1 }}>PDF</Btn>
        <Btn variant="outlined" size="md" icon="mail" style={{ flex: 1 }}>Email</Btn>
        <Btn variant="primary" size="md" icon="share" style={{ flex: 1 }}>Share</Btn>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MBookingCalendar, MBookingPrecall, MBookingConfirmed, MAuditPreUpload, MAuditComplete, MAuditError, MAuditPDF });
