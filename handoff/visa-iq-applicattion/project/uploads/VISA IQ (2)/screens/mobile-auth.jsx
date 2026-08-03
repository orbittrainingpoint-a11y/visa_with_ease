/* global React, Chip, ScoreRing, Logo, Btn, Input, Card, AIBadge, PhoneAppBar, BottomNav, flag */
// Mobile Android — Auth & Onboarding screens

// Shared phone-content wrapper
const PhoneBody = ({ bg = '#fff', children, p = 0 }) => (
  <div style={{ width: '100%', height: '100%', background: bg, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: p }}>{children}</div>
);

// ─── 01 — Splash ────────────────────────────────────────────────────────────
function MSplash() {
  return (
    <PhoneBody bg="#0B1F4B">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24 }}>
        <div style={{ width: 88, height: 88, borderRadius: 24, background: 'linear-gradient(135deg,#1A56DB,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 20px 40px rgba(14,165,233,.3)' }}>
          <span style={{ font: '800 36px/1 Plus Jakarta Sans', color: '#fff' }}>IQ</span>
        </div>
        <Logo size={40} onDark/>
        <div style={{ font: '400 14px/1.5 Inter', color: '#94A3B8', marginTop: 14, textAlign: 'center' }}>AI-Powered Visa Intelligence</div>
      </div>
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ height: 3, background: '#1A3373', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg,#1A56DB,#0EA5E9)' }}/>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 02 — Welcome ───────────────────────────────────────────────────────────
function MWelcome() {
  return (
    <PhoneBody>
      <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg,#0B1F4B 0%,#1A56DB 100%)', color: '#fff', padding: '40px 28px 0' }}>
        {/* decorative passport illustration */}
        <div style={{ position: 'absolute', top: 36, right: -10, width: 140, height: 140, borderRadius: 20,
          background: 'linear-gradient(135deg,#F59E0B,#D97706)', transform: 'rotate(12deg)', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
          <div style={{ position: 'absolute', inset: 12, border: '2px solid rgba(255,255,255,.3)', borderRadius: 10, padding: 12 }}>
            <div style={{ font: '700 9px/1 Inter', color: '#fff', letterSpacing: 1 }}>PASSPORT</div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', margin: '14px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 22, color: '#fff' }}>person</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 90, left: 30, width: 30, height: 30, borderRadius: '50%', background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mi" style={{ fontSize: 18, color: '#fff' }}>flight</span>
        </div>
        <div style={{ marginTop: 220 }}>
          <Logo size={22} onDark/>
          <div style={{ font: '800 32px/1.15 Plus Jakarta Sans', marginTop: 24, letterSpacing: '-0.02em' }}>Visa applications,<br/>simplified.</div>
          <div style={{ font: '400 14px/1.5 Inter', color: 'rgba(255,255,255,.75)', marginTop: 14 }}>AI-powered guidance from checklist to approval — know exactly what you need, before you apply.</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: 24, marginTop: -16, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 18, padding: '0 8px' }}>
          {[['shield', 'GDPR'], ['auto_awesome', '94% accuracy'], ['support_agent', 'Expert support']].map(([i, t]) => (
            <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span className="mi" style={{ fontSize: 22, color: '#0EA5E9' }}>{i}</span>
              <span style={{ font: '500 10px/1.2 Inter', color: '#475569' }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="outlined" full size="lg" icon="g_translate">Continue with Google</Btn>
          <Btn variant="primary" full size="lg" icon="mail">Sign up with email</Btn>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <span style={{ font: '500 13px/1 Inter', color: '#1A56DB' }}>I already have an account</span>
          </div>
        </div>
        <div style={{ font: '400 10px/1.4 Inter', color: '#94A3B8', textAlign: 'center', marginTop: 16 }}>By continuing, you agree to our <span style={{ color: '#1A56DB', fontWeight: 500 }}>Terms</span> & <span style={{ color: '#1A56DB', fontWeight: 500 }}>Privacy Policy</span></div>
      </div>
    </PhoneBody>
  );
}

// ─── 03 — Register ──────────────────────────────────────────────────────────
function MRegister() {
  return (
    <PhoneBody>
      <PhoneAppBar title="Create account" leading="arrow_back" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px/1 Inter' }}>1</div>
          <span style={{ font: '600 13px/1 Inter', color: '#1A56DB' }}>Account</span>
          <div style={{ flex: 1, height: 2, background: '#E2E8F0', margin: '0 6px' }}/>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px/1 Inter' }}>2</div>
          <span style={{ font: '500 13px/1 Inter', color: '#94A3B8' }}>Verify</span>
        </div>
        <div style={{ font: '700 24px/1.25 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Welcome aboard ✈️</div>
        <div style={{ font: '400 13px/1.5 Inter', color: '#64748B', marginTop: 4, marginBottom: 24 }}>Set up your account to start your visa journey.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full name" value="Sarah Mitchell"/>
          <Input label="Email" icon="mail" value="sarah.m@email.com" state="focused"/>
          <div>
            <Input label="Password" type="password" value="strongpass1" trailing="visibility_off"/>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {[1,1,1,0].map((on, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? ['#EF4444','#F97316','#EAB308','#10B981'][i] : '#E2E8F0' }}/>
              ))}
            </div>
            <div style={{ font: '500 11px/1.3 Inter', color: '#EAB308', marginTop: 6 }}>Good — add a special character for Strong</div>
          </div>
          <Input label="Confirm password" type="password" value="strongpass1" trailing="check_circle" state="success"/>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 18, padding: 12, background: '#F8FAFC', borderRadius: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="mi" style={{ fontSize: 14, color: '#fff' }}>check</span>
          </div>
          <div style={{ font: '400 12px/1.5 Inter', color: '#475569' }}>I agree to the <span style={{ color: '#1A56DB', fontWeight: 600 }}>Terms of Service</span> and acknowledge the <span style={{ color: '#1A56DB', fontWeight: 600 }}>Privacy Policy</span>.</div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Btn variant="primary" full size="lg">Create Account</Btn>
          <div style={{ textAlign: 'center', font: '500 13px/1 Inter', color: '#64748B' }}>or sign up with</div>
          <Btn variant="outlined" full size="lg" icon="g_translate">Continue with Google</Btn>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 04 — Email Verify ──────────────────────────────────────────────────────
function MVerify() {
  return (
    <PhoneBody>
      <PhoneAppBar title="" leading="arrow_back" trailing={[{ icon: 'help_outline' }]}/>
      <div style={{ flex: 1, padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, #DBEAFE 0%, #fff 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: '#fff', boxShadow: '0 8px 24px rgba(26,86,219,.15), 0 0 0 1.5px #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span className="mi" style={{ fontSize: 40, color: '#1A56DB' }}>mark_email_unread</span>
          </div>
          <div style={{ position: 'absolute', top: 4, right: 8, width: 28, height: 28, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
            <span className="mi" style={{ fontSize: 14, color: '#fff' }}>check</span>
          </div>
        </div>
        <div style={{ font: '700 24px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>Check your email</div>
        <div style={{ font: '400 14px/1.5 Inter', color: '#64748B', marginTop: 10, maxWidth: 280 }}>
          We sent a verification link to<br/>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>sarah.m@email.com</span>
        </div>
        <div style={{ marginTop: 28, padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, font: '400 12px/1.5 Inter', color: '#64748B', width: '100%' }}>
          Didn't get it? Check spam or use a different email.
        </div>
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="primary" full size="lg" icon="mail">Open email app</Btn>
          <div style={{ textAlign: 'center', font: '500 13px/1 Inter', color: '#94A3B8' }}>Resend available in 0:42</div>
        </div>
      </div>
    </PhoneBody>
  );
}

// ─── 05 — Onboarding 1: Nationality ────────────────────────────────────────
function MOnboard1() {
  return (
    <PhoneBody>
      <PhoneAppBar title="" leading="arrow_back" trailing={[{ icon: 'close' }]}/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1,0,0,0].map((on, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === 0 ? '#1A56DB' : '#E2E8F0' }}/>
          ))}
        </div>
        <div style={{ font: '500 11px/1 Inter', color: '#1A56DB', letterSpacing: 1, textTransform: 'uppercase' }}>Step 1 of 4</div>
        <div style={{ font: '700 28px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 8, letterSpacing: '-0.01em' }}>Where are you from?</div>
        <div style={{ font: '400 14px/1.5 Inter', color: '#64748B', marginTop: 6 }}>This helps us identify which visa rules apply to you.</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Country of citizenship" icon="public" value={`${flag('IN')}  India`} trailing="expand_more"/>
        <Input label="Passport number" type="mono" value="K8472913" placeholder="A12345678" state="success" trailing="check_circle" helper="Indian passport format detected"/>
        <Input label="Passport expiry date" value="22 / 08 / 2031" trailing="calendar_today" helper="✓ Valid for at least 6 months"/>
        <div style={{ display: 'flex', gap: 10, padding: 14, background: '#EFF6FF', borderRadius: 12, marginTop: 6 }}>
          <span className="mi" style={{ fontSize: 22, color: '#1A56DB', flexShrink: 0 }}>shield</span>
          <div>
            <div style={{ font: '600 12px/1.4 Inter', color: '#1547C0' }}>Your data is encrypted</div>
            <div style={{ font: '400 11px/1.5 Inter', color: '#475569', marginTop: 2 }}>Documents are auto-deleted within 72 hours. GDPR-compliant.</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 20, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
        <Btn variant="outlined" size="lg" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" size="lg" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 06 — Onboarding 2: Destination ────────────────────────────────────────
function MOnboard2() {
  const VisaCard = ({ icon, name, desc, on, color }) => (
    <div style={{ borderRadius: 14, padding: 14, border: on ? `2px solid ${color}` : '1.5px solid #E2E8F0', background: on ? `${color}10` : '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: on ? color : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mi" style={{ fontSize: 24, color: on ? '#fff' : '#64748B' }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: '600 14px/1.3 Inter', color: '#0F172A' }}>{name}</div>
        <div style={{ font: '400 12px/1.4 Inter', color: '#64748B' }}>{desc}</div>
      </div>
      {on && <span className="mi" style={{ fontSize: 22, color }}>check_circle</span>}
    </div>
  );
  return (
    <PhoneBody>
      <PhoneAppBar title="" leading="arrow_back" trailing={[{ icon: 'close' }]}/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1,1,0,0].map((on, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: on ? '#1A56DB' : '#E2E8F0' }}/>)}
        </div>
        <div style={{ font: '500 11px/1 Inter', color: '#1A56DB', letterSpacing: 1, textTransform: 'uppercase' }}>Step 2 of 4</div>
        <div style={{ font: '700 28px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 8, letterSpacing: '-0.01em' }}>Where are you headed?</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Destination" icon="public" value={`${flag('FR')}  France · Schengen Area`} trailing="expand_more"/>
        <div>
          <div style={{ font: '500 12px/1.4 Inter', color: '#475569', marginBottom: 8 }}>Visa type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <VisaCard icon="beach_access" name="Tourist (Schengen C)" desc="Up to 90 days, holiday & leisure" on color="#1A56DB"/>
            <VisaCard icon="business_center" name="Business" desc="Meetings, conferences, work events"/>
            <VisaCard icon="school" name="Study" desc="Long-stay academic"/>
          </div>
        </div>
      </div>
      <div style={{ padding: 20, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
        <Btn variant="outlined" size="lg" style={{ flex: 0.4 }}>Back</Btn>
        <Btn variant="primary" size="lg" trailing="arrow_forward" style={{ flex: 1 }}>Continue</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 07 — Onboarding 4: Ready ───────────────────────────────────────────────
function MOnboard4() {
  return (
    <PhoneBody bg="#F8FAFC">
      <PhoneAppBar title="" leading="" bg="#F8FAFC"/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1,1,1,1].map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: '#10B981' }}/>)}
        </div>
        <div style={{ font: '500 11px/1 Inter', color: '#10B981', letterSpacing: 1, textTransform: 'uppercase' }}>All set!</div>
        <div style={{ font: '700 28px/1.2 Plus Jakarta Sans', color: '#0F172A', marginTop: 8, letterSpacing: '-0.01em' }}>You're ready to go ✨</div>
      </div>
      <div style={{ flex: 1, padding: '14px 20px 20px', overflow: 'auto' }}>
        <Card elevation={3} padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 36 }}>{flag('FR')}</div>
              <div>
                <div style={{ font: '700 18px/1.2 Plus Jakarta Sans', color: '#0F172A' }}>France</div>
                <div style={{ font: '500 12px/1.3 Inter', color: '#64748B' }}>Schengen Tourist · 90 days</div>
              </div>
            </div>
            <ScoreRing value={42} size={56} stroke={6} sub="ready"/>
          </div>
          <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0 16px' }}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { i: 'description', l: 'Documents to gather', v: '6 required', c: '#1A56DB' },
              { i: 'event', l: 'Estimated processing', v: '10–15 business days', c: '#64748B' },
              { i: 'payments', l: 'Application fee', v: '€80 + service', c: '#64748B' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: 18, color: r.c }}>{r.i}</span>
                </div>
                <div style={{ flex: 1, font: '500 13px/1.3 Inter', color: '#475569' }}>{r.l}</div>
                <div style={{ font: '600 13px/1.3 Inter', color: '#0F172A' }}>{r.v}</div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ marginTop: 18, padding: 14, background: '#FAF5FF', borderRadius: 12, display: 'flex', gap: 10 }}>
          <AIBadge/>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12px/1.4 Inter', color: '#6D28D9' }}>Tip from VisaIQ</div>
            <div style={{ font: '400 12px/1.5 Inter', color: '#475569', marginTop: 2 }}>Your passport is valid till 2031 ✓ — start with bank statements to maximize your score.</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 20, background: '#fff', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn variant="primary" full size="lg" icon="upload_file">Start uploading documents</Btn>
        <Btn variant="text" full>Skip for now</Btn>
      </div>
    </PhoneBody>
  );
}

// ─── 08 — Login ─────────────────────────────────────────────────────────────
function MLogin() {
  return (
    <PhoneBody>
      <PhoneAppBar title="" leading="arrow_back"/>
      <div style={{ flex: 1, padding: '12px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, marginBottom: 28 }}>
          <Logo size={28}/>
        </div>
        <div style={{ font: '700 28px/1.2 Plus Jakarta Sans', color: '#0F172A', letterSpacing: '-0.01em' }}>Welcome back</div>
        <div style={{ font: '400 14px/1.5 Inter', color: '#64748B', marginTop: 6 }}>Sign in to continue your visa journey.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
          <Input label="Email" icon="mail" value="sarah.m@email.com"/>
          <div>
            <Input label="Password" type="password" value="strongpass1" trailing="visibility_off"/>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <span style={{ font: '500 13px/1 Inter', color: '#1A56DB' }}>Forgot password?</span>
            </div>
          </div>
          <div style={{ padding: 14, background: '#FAF5FF', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #DDD6FE' }}>
            <span className="mi" style={{ fontSize: 28, color: '#7C3AED' }}>fingerprint</span>
            <div style={{ flex: 1, font: '500 13px/1.4 Inter', color: '#0F172A' }}>Sign in with fingerprint</div>
            <span className="mi" style={{ fontSize: 18, color: '#7C3AED' }}>arrow_forward</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
          <Btn variant="primary" full size="lg">Sign In</Btn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }}/>
            <span style={{ font: '500 11px/1 Inter', color: '#94A3B8' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }}/>
          </div>
          <Btn variant="outlined" full size="lg" icon="g_translate">Continue with Google</Btn>
          <div style={{ textAlign: 'center', font: '400 13px/1.4 Inter', color: '#64748B', marginTop: 8 }}>New to VisaIQ? <span style={{ color: '#1A56DB', fontWeight: 600 }}>Create an account</span></div>
        </div>
      </div>
    </PhoneBody>
  );
}

Object.assign(window, { MSplash, MWelcome, MRegister, MVerify, MOnboard1, MOnboard2, MOnboard4, MLogin, PhoneBody });
