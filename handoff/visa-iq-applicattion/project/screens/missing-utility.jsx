/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag, PhoneBody */
// Utility screens — onboarding-03, auth recovery, settings, paywall, help, decision, receipt, referral

// ─── 01 F-ONBOARD-03 · Tell us about you (occupation, income, history) ────
function MOnboard3() {
  const Pill = ({ on, t, i }) => (
    <div style={{ padding: '10px 14px', borderRadius: 999, border: `1.5px solid ${on ? '#1A56DB' : '#E2E8F0'}`, background: on ? '#EFF6FF' : '#fff', color: on ? '#1547C0' : '#475569', font: `${on ? 700 : 600} 12px/1 Inter`, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="mi" style={{ fontSize: 16, color: on ? '#1A56DB' : '#94A3B8' }}>{i}</span>{t}
    </div>
  );
  return (
    <PhoneBody bg="#fff">
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
        <button style={{ width: 40, height: 40, border: 0, background: 'transparent' }}><span className="mi" style={{ fontSize: 22 }}>arrow_back</span></button>
        <div style={{ flex: 1 }}/>
        <span style={{ font: '600 12px/1 Inter', color: '#1A56DB', padding: 12 }}>Skip</span>
      </div>
      <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,1,1,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
        </div>
        <div style={{ font: '500 11px/1 Inter', color: '#1A56DB', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14 }}>Step 3 of 4</div>
        <div style={{ font: '800 24px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 6, letterSpacing: '-0.01em' }}>Tell us about you</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4 }}>Helps us auto-fill embassy forms and recommend the right visa types.</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px' }}>
        {/* Occupation */}
        <div style={{ font: '600 12px/1 Inter', color: '#475569', marginBottom: 10 }}>Occupation</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          <Pill on t="Employed" i="work"/>
          <Pill t="Self-employed" i="business_center"/>
          <Pill t="Student" i="school"/>
          <Pill t="Retired" i="elderly"/>
          <Pill t="Other" i="more_horiz"/>
        </div>

        {/* Income */}
        <Input label="Annual income (USD equivalent)" value="$45,000 – $75,000" trailing="expand_more"/>

        {/* Prior visa history */}
        <div style={{ font: '600 12px/1 Inter', color: '#475569', marginBottom: 10, marginTop: 8 }}>Prior visas (last 5 years)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {['🇬🇧 UK ×2','🇺🇸 USA','🇫🇷 Schengen ×3','🇸🇬 Singapore','+ Add'].map((t, i) => (
            <span key={i} style={{ padding: '7px 12px', borderRadius: 999, background: i === 4 ? '#fff' : '#EFF6FF', color: i === 4 ? '#1A56DB' : '#1547C0', border: i === 4 ? '1.5px dashed #1A56DB' : 'none', font: '600 12px/1 Inter' }}>{t}</span>
          ))}
        </div>

        {/* Rejections */}
        <Card padding={14} elevation={1} style={{ marginTop: 10, background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mi" style={{ fontSize: 22, color: '#475569' }}>warning_amber</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>Any prior rejections?</div>
              <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>This is confidential and helps AI flag risks.</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid #E2E8F0', background: '#fff', font: '600 11px/1 Inter', color: '#475569' }}>No</button>
              <button style={{ padding: '6px 14px', borderRadius: 20, border: 'none', background: '#1A56DB', color: '#fff', font: '600 11px/1 Inter' }}>Yes</button>
            </div>
          </div>
        </Card>

        {/* AI hint */}
        <Card padding={12} elevation={1} style={{ marginTop: 14, background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <AIBadge small/>
            <div style={{ font: '500 11px/1.5 Inter', color: '#475569', flex: 1 }}>Based on your travel history, you're likely eligible for <b>Visa Waiver</b> in 3 countries. We'll show details next.</div>
          </div>
        </Card>
      </div>
      <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
        <Btn variant="outlined" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 02 Forgot password ────────────────────────────────────────────────────
function MForgotPwd() {
  return (
    <PhoneBody bg="#fff">
      <PhoneAppBar title="Reset password" leading="arrow_back"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <span className="mi" style={{ fontSize: 32, color: '#1A56DB' }}>lock_reset</span>
        </div>
        <div style={{ font: '800 24px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Forgot your password?</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 6 }}>No worries — enter the email you signed up with and we'll send a reset link.</div>
        <div style={{ marginTop: 24 }}>
          <Input label="Email" value="sarah@gmail.com" icon="mail" state="focused"/>
        </div>
        <Btn variant="primary" full size="lg" trailing="arrow_forward" style={{ marginTop: 16 }}>Send reset link</Btn>
        <div style={{ height: 1, background: '#F1F5F9', margin: '24px 0' }}/>
        <div style={{ font: '500 12px/1.5 Inter', color: '#64748B', textAlign: 'center' }}>Still stuck? <b style={{ color: '#1A56DB' }}>Email support</b> or <b style={{ color: '#1A56DB' }}>Live chat</b></div>
      </div>
    </PhoneBody>
  );
}

// ─── 03 Reset password (set new) ───────────────────────────────────────────
function MResetPwd() {
  const Strength = ({ level }) => (
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= level ? (level === 4 ? '#10B981' : level === 3 ? '#0EA5E9' : level === 2 ? '#F59E0B' : '#EF4444') : '#E2E8F0' }}/>
      ))}
    </div>
  );
  return (
    <PhoneBody bg="#fff">
      <PhoneAppBar title="Set new password" leading="arrow_back"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px' }}>
        <Card padding={14} elevation={1} style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mi" style={{ fontSize: 22, color: '#10B981' }}>verified</span>
            <div style={{ flex: 1, font: '500 12px/1.4 Inter', color: '#065F46' }}>Link verified · sarah@gmail.com</div>
          </div>
        </Card>

        <div style={{ font: '800 22px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Create a strong password</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 6 }}>Min 8 chars · 1 number · 1 symbol</div>

        <div style={{ marginTop: 18 }}>
          <Input label="New password" value="••••••••••••" type="password" icon="lock" trailing="visibility_off" state="focused"/>
          <Strength level={4}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {[
              { t: 'At least 8 characters', ok: true },
              { t: 'Includes a number', ok: true },
              { t: 'Includes a symbol', ok: true },
              { t: 'Not used before', ok: true },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px/1 Inter', color: r.ok ? '#10B981' : '#94A3B8' }}>
                <span className="mi" style={{ fontSize: 14 }}>{r.ok ? 'check_circle' : 'radio_button_unchecked'}</span>{r.t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Input label="Confirm new password" value="••••••••••••" type="password" icon="lock" trailing="check_circle" state="success" helper="Passwords match"/>
        </div>

        <Btn variant="primary" full size="lg" style={{ marginTop: 20 }}>Update password</Btn>

        <div style={{ marginTop: 20, padding: 12, background: '#FAF5FF', borderRadius: 10, display: 'flex', gap: 8 }}>
          <span className="mi" style={{ fontSize: 18, color: '#7C3AED', marginTop: 1 }}>tips_and_updates</span>
          <div style={{ flex: 1, font: '500 11px/1.5 Inter', color: '#475569' }}>Want password-less? Set up <b style={{ color: '#6D28D9' }}>Face / Touch ID</b> after sign-in for instant access.</div>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 04 Settings hub ───────────────────────────────────────────────────────
function MSettings() {
  const Row = ({ i, t, sub, v, danger, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid #F8FAFC' }}>
      <span className="mi" style={{ fontSize: 22, color: danger ? '#EF4444' : '#475569' }}>{i}</span>
      <div style={{ flex: 1 }}>
        <div style={{ font: '600 13px/1.3 Inter', color: danger ? '#DC2626' : '#0F172A' }}>{t}</div>
        {sub && <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{sub}</div>}
      </div>
      {v && <span style={{ font: '500 12px/1 Inter', color: '#94A3B8' }}>{v}</span>}
      {!danger && <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>}
    </div>
  );
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Settings" leading="arrow_back" trailing={[{ icon: 'search' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Profile teaser */}
        <div style={{ padding: '16px 16px 0' }}>
          <Card padding={14} elevation={1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', font: '700 16px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SM</div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 14px/1.2 Inter', color: '#0F172A' }}>Sarah Mitchell</div>
                <div style={{ font: '500 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>sarah@gmail.com · {flag('GB')} GB passport</div>
              </div>
              <Chip tone="gold" size="sm" icon="workspace_premium">Free</Chip>
            </div>
          </Card>
        </div>

        {/* Sections */}
        <div style={{ padding: '16px 16px' }}>
          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Account</div>
          <Card padding={0} elevation={1}>
            <Row i="person" t="Personal information" sub="Name, DOB, nationality"/>
            <Row i="lock" t="Password & security" sub="Last changed 12 days ago"/>
            <Row i="fingerprint" t="Biometric sign-in" v="On"/>
            <Row i="email" t="Email & phone" sub="2 verified"/>
            <Row i="workspace_premium" t="Plan & billing" sub="Free · Upgrade to Pro" last/>
          </Card>

          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Notifications</div>
          <Card padding={0} elevation={1}>
            <Row i="notifications" t="Push notifications" v="On"/>
            <Row i="mail" t="Email digests" v="Weekly"/>
            <Row i="schedule" t="Reminders" sub="Bookings + deadlines" last/>
          </Card>

          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Preferences</div>
          <Card padding={0} elevation={1}>
            <Row i="dark_mode" t="Theme" v="Auto"/>
            <Row i="language" t="Language" v="English"/>
            <Row i="public" t="Region" v="India"/>
            <Row i="format_color_text" t="Text size" v="Default" last/>
          </Card>

          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Privacy & data</div>
          <Card padding={0} elevation={1}>
            <Row i="shield" t="Privacy controls" sub="GDPR · 72-hour doc retention"/>
            <Row i="download" t="Download my data" sub="JSON + PDF · 24h delivery"/>
            <Row i="delete_forever" t="Delete account" sub="Permanent · 14-day grace period" danger last/>
          </Card>

          <div style={{ font: '600 11px/1 Inter', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>Help</div>
          <Card padding={0} elevation={1}>
            <Row i="help_outline" t="Help center" sub="Articles · FAQs"/>
            <Row i="chat" t="Contact support" sub="Mon-Fri · usually 1h"/>
            <Row i="info" t="About VisaIQ" v="v2.4.1" last/>
          </Card>

          <div style={{ font: '400 10px/1.5 Inter', color: '#94A3B8', textAlign: 'center', marginTop: 18 }}>
            VisaIQ v2.4.1 · build 8421 · made with ♥ in Bangalore
          </div>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 05 Paywall / Pricing ──────────────────────────────────────────────────
function MPaywall() {
  return (
    <PhoneBody bg="#0B1F4B" surface="#0B1F4B">
      <div style={{ position: 'relative', background: 'linear-gradient(155deg,#0B1F4B 0%,#1A56DB 50%,#7C3AED 100%)', padding: '14px 16px 26px', color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.25), transparent 65%)' }}/>
        <button style={{ width: 36, height: 36, border: 0, background: 'rgba(255,255,255,.15)', borderRadius: 18, position: 'relative' }}>
          <span className="mi" style={{ fontSize: 20, color: '#fff' }}>close</span>
        </button>
        <Chip tone="gold" size="md" icon="workspace_premium" style={{ background: 'rgba(245,158,11,.25)', color: '#FCD34D', marginTop: 12 }}>Upgrade to Pro</Chip>
        <div style={{ font: '800 26px/1.2 Plus Jakarta Sans', marginTop: 12, letterSpacing: '-0.02em' }}>Unlock unlimited<br/>visa intelligence.</div>
        <div style={{ font: '400 12px/1.5 Inter', color: 'rgba(255,255,255,.7)', marginTop: 6 }}>For frequent travelers, families and professionals.</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: '#fff', padding: '16px 16px', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, position: 'relative', zIndex: 2 }}>
        {/* Plan toggle */}
        <div style={{ display: 'flex', padding: 4, background: '#F1F5F9', borderRadius: 14, marginBottom: 16 }}>
          {[['Monthly', false], ['Annual · save 30%', true]].map(([l, on], i) => (
            <button key={i} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 0, background: on ? '#fff' : 'transparent', font: '600 12px/1 Inter', color: on ? '#0F172A' : '#64748B', boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{l}</button>
          ))}
        </div>

        {/* Plans */}
        {[
          { n: 'Free', p: '$0', sub: '1 application · basic audit', features: ['1 active visa application', 'Basic AI audit', 'AI chat · 20 msg/mo', '72h doc retention'], sel: false },
          { n: 'Pro', p: '$12', sub: 'per month · billed annually', features: ['Unlimited applications', 'Advanced AI audit + reasoning', 'AI chat · unlimited + tool use', 'Cross-app document library', 'Priority embassy slot alerts', 'Family group (up to 4)'], sel: true, badge: 'MOST POPULAR' },
          { n: 'VIP', p: '$49', sub: 'per month · includes consults', features: ['Everything in Pro', '2 free expert calls per month', 'White-glove document review', 'Refund guarantee'], sel: false, badge: 'GOLD' },
        ].map((p, i) => (
          <Card key={i} padding={16} elevation={p.sel ? 3 : 1} style={{
            marginBottom: 12, position: 'relative',
            border: p.sel ? '2px solid #1A56DB' : '1px solid #F1F5F9',
            background: p.sel ? 'linear-gradient(135deg,#EFF6FF,#FAF5FF)' : '#fff',
          }}>
            {p.badge && <div style={{ position: 'absolute', top: -10, right: 14, padding: '3px 10px', background: p.sel ? '#1A56DB' : 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', borderRadius: 999, font: '700 9px/1 Inter', letterSpacing: 0.5 }}>{p.badge}</div>}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div style={{ font: '800 18px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>{p.n}</div>
                <div style={{ font: '400 11px/1.4 Inter', color: '#64748B', marginTop: 2 }}>{p.sub}</div>
              </div>
              <div>
                <div style={{ font: '800 28px/1 Plus Jakarta Sans', color: '#0F172A' }}>{p.p}</div>
                <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', textAlign: 'right', marginTop: 2 }}>/mo</div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 11px/1.4 Inter', color: '#475569' }}>
                  <span className="mi" style={{ fontSize: 14, color: p.sel ? '#1A56DB' : '#10B981' }}>check</span>{f}
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Social proof */}
        <Card padding={12} elevation={1} style={{ background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {['#10B981','#F59E0B','#0EA5E9','#7C3AED'].map((c, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '2px solid #fff', marginLeft: i ? -8 : 0, color: '#fff', font: '700 9px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'JKMP'[i]}</div>
              ))}
            </div>
            <div style={{ flex: 1, font: '500 11px/1.4 Inter', color: '#475569' }}>Join <b>12k+</b> travelers on Pro · avg 30% faster approval</div>
          </div>
        </Card>

        <Btn variant="primary" full size="lg" style={{ marginTop: 14 }}>Continue with Pro · $12/mo</Btn>
        <div style={{ font: '400 10px/1.5 Inter', color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>Cancel anytime · 7-day free trial · pay with Apple Pay, Google Pay or card</div>
      </div>
    </PhoneBody>
  );
}

// ─── 06 Help center ────────────────────────────────────────────────────────
function MHelp() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Help center" leading="arrow_back" trailing={[{ icon: 'chat_bubble_outline' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '14px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, background: '#F1F5F9', borderRadius: 22 }}>
            <span className="mi" style={{ fontSize: 20, color: '#94A3B8' }}>search</span>
            <span style={{ flex: 1, font: '400 13px/1 Inter', color: '#94A3B8' }}>Search articles, e.g. "rejected visa"</span>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { i: 'auto_awesome', t: 'AI audits', sub: '24 articles', c: '#7C3AED' },
              { i: 'upload_file', t: 'Uploads', sub: '12 articles', c: '#1A56DB' },
              { i: 'payments', t: 'Payments & billing', sub: '8 articles', c: '#10B981' },
              { i: 'shield', t: 'Privacy & GDPR', sub: '15 articles', c: '#0EA5E9' },
            ].map((c, i) => (
              <Card key={i} padding={14} elevation={1}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 20, color: c.c }}>{c.i}</span>
                </div>
                <div style={{ font: '700 13px/1.3 Plus Jakarta Sans', color: '#0F172A', marginTop: 10 }}>{c.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8', marginTop: 2 }}>{c.sub}</div>
              </Card>
            ))}
          </div>

          {/* Popular */}
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 18, marginBottom: 10 }}>Popular articles</div>
          <Card padding={0} elevation={1}>
            {[
              { t: 'Why was my audit score lower than expected?', sub: '8 min read · updated last week' },
              { t: 'How does VisaIQ store my documents?', sub: '5 min · GDPR compliance' },
              { t: 'When should I book a VIP consultant?', sub: '6 min · with examples' },
              { t: 'Can I share my application with someone else?', sub: '4 min · secure link sharing' },
              { t: 'How accurate is the AI audit?', sub: '7 min · 94% benchmark' },
            ].map((a, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <span className="mi" style={{ fontSize: 20, color: '#94A3B8', marginTop: 1 }}>article</span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{a.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#94A3B8', marginTop: 2 }}>{a.sub}</div>
                </div>
                <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>
              </div>
            ))}
          </Card>

          {/* Contact */}
          <Card padding={16} elevation={2} style={{ marginTop: 16, background: 'linear-gradient(135deg,#0F172A,#1A56DB)', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mi" style={{ fontSize: 26, color: '#34D399' }}>support_agent</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 14px/1.2 Plus Jakarta Sans' }}>Still need help?</div>
                <div style={{ font: '400 11px/1.4 Inter', color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Live chat · usually under 5 min</div>
              </div>
              <Btn variant="gold" size="sm">Start chat</Btn>
            </div>
          </Card>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 07 Visa Decision (Approved / Rejected outcome) ───────────────────────
function MDecisionApproved() {
  return (
    <PhoneBody bg="#F8FAFC">
      <div style={{ background: 'linear-gradient(165deg,#0B1F4B 0%,#10B981 100%)', color: '#fff', padding: '20px 20px 90px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }}/>
        <div style={{ position: 'absolute', left: -30, bottom: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,.2)' }}/>
        <button style={{ width: 36, height: 36, border: 0, background: 'rgba(255,255,255,.15)', borderRadius: 18 }}>
          <span className="mi" style={{ fontSize: 20, color: '#fff' }}>close</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 14, position: 'relative' }}>
          <Chip tone="success" size="md" icon="celebration" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>Decision · official notice</Chip>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <span style={{ fontSize: 56 }}>{flag('FR')}</span>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 52, color: '#10B981' }}>verified</span>
            </div>
          </div>
          <div style={{ font: '800 28px/1.2 Plus Jakarta Sans', marginTop: 18, letterSpacing: '-0.02em' }}>Visa approved! 🎉</div>
          <div style={{ font: '400 13px/1.5 Inter', color: 'rgba(255,255,255,.85)', marginTop: 6, textAlign: 'center' }}>France Schengen Tourist · 90 days · multiple entry</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', marginTop: -66 }}>
        <Card padding={16} elevation={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Reference</div>
              <div style={{ font: '700 14px/1 JetBrains Mono', color: '#0F172A', marginTop: 6 }}>FR-2026-Q-018472</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Decided</div>
              <div style={{ font: '700 14px/1 Inter', color: '#0F172A', marginTop: 6 }}>Mar 12 · 4d after submit</div>
            </div>
          </div>
          <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }}/>
          {[
            { k: 'Valid from', v: 'Mar 15, 2026' },
            { k: 'Valid until', v: 'Mar 15, 2027' },
            { k: 'Stay duration', v: 'Up to 90 days / 180' },
            { k: 'Entries', v: 'Multiple' },
            { k: 'Issued by', v: 'Consulate of France, Mumbai' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', font: '500 12px/1.4 Inter' }}>
              <span style={{ color: '#64748B' }}>{r.k}</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </Card>

        {/* Next steps */}
        <div style={{ marginTop: 18, font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginBottom: 10 }}>Next steps</div>
        <Card padding={0} elevation={1}>
          {[
            { i: 'flight_takeoff', t: 'Travel checklist', sub: 'Insurance, currency, SIM card' },
            { i: 'description', t: 'Print boarding-eligible PDF', sub: 'Show at immigration' },
            { i: 'savings', t: 'Plan your second trip', sub: 'Visa valid for 1 year · 90/180 rule' },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
              <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>{s.i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{s.t}</div>
                <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{s.sub}</div>
              </div>
              <span className="mi" style={{ fontSize: 18, color: '#CBD5E1' }}>chevron_right</span>
            </div>
          ))}
        </Card>

        <Btn variant="primary" full size="lg" icon="download" style={{ marginTop: 18 }}>Download approval letter</Btn>
        <Btn variant="text" full size="md" style={{ marginTop: 6 }}>Share the good news</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 08 Receipt / Invoice ──────────────────────────────────────────────────
function MReceipt() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Receipt" leading="arrow_back" trailing={[{ icon: 'ios_share' }, { icon: 'download' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Receipt header */}
        <Card padding={18} elevation={2}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Logo size={18}/>
              <div style={{ font: '500 10px/1.4 Inter', color: '#64748B', marginTop: 6 }}>VisaIQ Technologies Pvt Ltd<br/>Bangalore, India · GSTIN 29ABCDE1234F1Z9</div>
            </div>
            <Chip tone="success" size="sm" icon="check_circle">Paid</Chip>
          </div>

          <div style={{ height: 1, background: '#F1F5F9', margin: '16px 0' }}/>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Receipt #</div>
              <div style={{ font: '700 13px/1 JetBrains Mono', color: '#0F172A', marginTop: 6 }}>VIQ-2026-0048721</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Date</div>
              <div style={{ font: '700 13px/1 Inter', color: '#0F172A', marginTop: 6 }}>Mar 8, 2026 · 11:24 IST</div>
            </div>
          </div>

          {/* Line items */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
            {[
              { l: '30-min VIP consultation', d: 'Priya Raghavan · Mar 8 · 11:00 AM IST', v: '$49.00' },
              { l: 'Discount · first session', d: 'Code WELCOME10', v: '−$10.00', c: '#10B981' },
              { l: 'Subtotal', v: '$39.00', strong: true },
              { l: 'Tax · 18% GST', v: '$7.02' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', font: `${r.strong ? 600 : 500} 12px/1.4 Inter`, color: r.c || (r.strong ? '#0F172A' : '#64748B') }}>
                <div style={{ flex: 1 }}>
                  <div>{r.l}</div>
                  {r.d && <div style={{ font: '400 10px/1.4 Inter', color: '#94A3B8', marginTop: 2 }}>{r.d}</div>}
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: r.strong ? 700 : 500 }}>{r.v}</span>
              </div>
            ))}
            <div style={{ height: 1, background: '#0F172A', margin: '10px 0 8px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '800 16px/1 Plus Jakarta Sans', color: '#0F172A' }}>
              <span>Total paid</span><span>$46.02</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ marginTop: 16, padding: 12, background: '#F8FAFC', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 26, borderRadius: 4, background: 'linear-gradient(135deg,#1A1F71,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', font: '700 9px/1 Inter' }}>VISA</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 12px/1.2 Inter', color: '#0F172A' }}>•••• •••• •••• 4242</div>
              <div style={{ font: '400 10px/1 Inter', color: '#94A3B8', marginTop: 2 }}>Stripe · txn_3K8a2pX9z</div>
            </div>
          </div>

          {/* QR for download */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FAF5FF', borderRadius: 10 }}>
            <div style={{ width: 60, height: 60, background: '#0F172A', borderRadius: 6, display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gridTemplateRows: 'repeat(8,1fr)', gap: 1, padding: 4 }}>
              {Array.from({length: 64}).map((_, i) => (
                <div key={i} style={{ background: Math.random() > 0.4 ? '#fff' : 'transparent' }}/>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 12px/1.3 Inter', color: '#0F172A' }}>Verify this receipt</div>
              <div style={{ font: '400 10px/1.4 Inter', color: '#64748B', marginTop: 2 }}>Scan to validate authenticity at visaiq.app/verify</div>
            </div>
          </div>

          <div style={{ font: '400 9px/1.5 Inter', color: '#94A3B8', textAlign: 'center', marginTop: 14 }}>This is a system-generated receipt and does not require a signature.</div>
        </Card>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Btn variant="outlined" style={{ flex: 1 }} icon="mail">Email me</Btn>
          <Btn variant="tonal" style={{ flex: 1 }} icon="picture_as_pdf">Save PDF</Btn>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 09 Referral ───────────────────────────────────────────────────────────
function MReferral() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="Refer & earn" leading="arrow_back" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: 'linear-gradient(155deg,#F59E0B 0%,#EF4444 50%,#7C3AED 100%)', color: '#fff', padding: '24px 20px 64px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }}/>
          <div style={{ font: '800 28px/1.2 Plus Jakarta Sans', letterSpacing: '-0.02em', position: 'relative' }}>Give $10,<br/>get $10</div>
          <div style={{ font: '400 13px/1.5 Inter', color: 'rgba(255,255,255,.85)', marginTop: 8, position: 'relative', maxWidth: 280 }}>Both you and your friend get $10 credit when they complete their first audit.</div>
        </div>

        <div style={{ padding: '0 16px 16px', marginTop: -40 }}>
          {/* Code card */}
          <Card padding={18} elevation={4}>
            <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' }}>Your code</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '12px 14px', border: '2px dashed #1A56DB', borderRadius: 12, background: '#EFF6FF' }}>
              <div style={{ flex: 1, font: '800 22px/1 JetBrains Mono', color: '#1547C0', letterSpacing: 2 }}>SARAH-VIQ-10</div>
              <Btn variant="primary" size="sm" icon="content_copy">Copy</Btn>
            </div>

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
              {[
                { i: 'sms', l: 'SMS' },
                { i: 'mail', l: 'Email' },
                { i: 'forum', l: 'WhatsApp' },
                { i: 'more_horiz', l: 'More' },
              ].map((c, i) => (
                <div key={i} style={{ padding: 10, background: '#F8FAFC', borderRadius: 12 }}>
                  <span className="mi" style={{ fontSize: 22, color: '#1A56DB' }}>{c.i}</span>
                  <div style={{ font: '600 10px/1 Inter', color: '#475569', marginTop: 4 }}>{c.l}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Earnings */}
          <Card padding={0} elevation={1} style={{ marginTop: 14 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ font: '500 11px/1 Inter', color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase' }}>Earned</div>
                <div style={{ font: '800 24px/1 Plus Jakarta Sans', color: '#10B981', marginTop: 4 }}>$60.00</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>Pending</div>
                <div style={{ font: '700 14px/1 Plus Jakarta Sans', color: '#F59E0B', marginTop: 4 }}>$20.00</div>
              </div>
            </div>
            {[
              { n: 'Mike P.', d: 'Joined Feb 14', v: '+$10', c: '#10B981', st: 'Cashed in' },
              { n: 'Lisa O.', d: 'Joined Feb 22', v: '+$10', c: '#10B981', st: 'Cashed in' },
              { n: 'Carlos R.', d: 'Joined Mar 1', v: '$10', c: '#F59E0B', st: 'Pending audit' },
              { n: 'Aisha K.', d: 'Joined Mar 4', v: '$10', c: '#F59E0B', st: 'Pending audit' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: ['#1A56DB','#7C3AED','#10B981','#F59E0B'][i], color: '#fff', font: '700 12px/1 Inter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.n[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.n}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.d}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: '700 13px/1 JetBrains Mono', color: r.c }}>{r.v}</div>
                  <div style={{ font: '500 10px/1 Inter', color: '#94A3B8', marginTop: 2 }}>{r.st}</div>
                </div>
              </div>
            ))}
          </Card>

          {/* Rules */}
          <div style={{ font: '700 13px/1 Plus Jakarta Sans', color: '#0F172A', marginTop: 18, marginBottom: 10 }}>How it works</div>
          <Card padding={14} elevation={1}>
            {[
              { n: 1, t: 'Share your code', s: 'With friends planning travel' },
              { n: 2, t: 'They sign up & complete an audit', s: 'Both of you get $10 credit' },
              { n: 3, t: 'Stack rewards', s: 'No cap — refer 10 friends, get $100' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < arr.length-1 ? '1px solid #F8FAFC' : 'none', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', color: '#1A56DB', font: '700 12px/1 Plus Jakarta Sans', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.t}</div>
                  <div style={{ font: '400 11px/1.3 Inter', color: '#64748B', marginTop: 2 }}>{r.s}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MOnboard3, MForgotPwd, MResetPwd, MSettings, MPaywall, MHelp, MDecisionApproved, MReceipt, MReferral });
