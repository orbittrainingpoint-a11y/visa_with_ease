/**
 * Backend contract tests — full API surface including auth, roles, and all new endpoints.
 * Run with: pnpm --filter @visaiq/backend test
 */
// Must be set before importing the app so signToken/verifyIdToken use real JWTs
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.JWT_SECRET = 'contract-test-secret-do-not-use-in-production';
process.env.FIRESTORE_DISABLED = 'true';
process.env.ENABLE_DEMO_LOGIN = 'true';

import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from './app.js';

const server = createApp().listen(0);
const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}`;

test.after(() => { server.close(); });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function json(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { res, body: await res.json() };
}
const get  = (path: string, token?: string) => json('GET',    path, undefined, token);
const post = (path: string, body: unknown, token?: string) => json('POST', path, body, token);
const put  = (path: string, body: unknown, token?: string) => json('PUT',  path, body, token);

/** Get a demo token for the given persona. */
async function demoToken(persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin') {
  const { res, body } = await post('/auth/demo', { persona });
  assert.equal(res.status, 201, `demoToken(${persona}): expected 201 got ${res.status}`);
  return body.token as string;
}

// ─── Health ───────────────────────────────────────────────────────────────────

test('GET /health — unauthenticated returns minimal status', async () => {
  const { res, body } = await get('/health');
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  // Detailed fields must NOT be exposed without auth
  assert.equal(body.firestore, undefined);
  assert.equal(body.aiMock,    undefined);
});

test('GET /health — authenticated returns detailed status', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/health', token);
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.firestore, 'mock');
  assert.equal(body.storage,   'mock');
  assert.equal(body.fcm,       'mock');
  assert.equal(body.aiMock,    true);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

test('POST /auth/session — rejects invalid credentials format', async () => {
  const { res, body } = await post('/auth/session', { email: 'bad', password: 'short' });
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_FAILED');
});

test('POST /auth/session — valid credentials return a session', async () => {
  const { res, body } = await post('/auth/session', {
    email: 'sarah.mathew@example.com', password: 'demo1234', remember: true
  });
  assert.equal(res.status, 201);
  assert.equal(body.user.email, 'sarah.mathew@example.com');
  assert.ok(body.token, 'token present');
  assert.ok(Date.parse(body.expiresAt) > Date.now(), 'expiresAt in future');
});

test('POST /auth/register — password too short returns 400', async () => {
  const { res, body } = await post('/auth/register', {
    name: 'Test User', email: 'test@example.com', password: 'short'
  });
  assert.equal(res.status, 400);
  assert.ok(body.error?.message?.toLowerCase().includes('password'));
});

test('POST /auth/register — valid registration returns session', async () => {
  const email = `test${Date.now()}@example.com`;
  const { res, body } = await post('/auth/register', {
    name: 'New User', email, password: 'SecurePass123'
  });
  assert.equal(res.status, 201);
  assert.equal(body.user.email, email);
  assert.ok(body.token, 'token present');
});

test('POST /auth/demo — all four personas return correct roles', async () => {
  const cases: Array<['consumer' | 'consultant' | 'hr_admin' | 'platform_admin', string[]]> = [
    ['consumer',       ['consumer']],
    ['consultant',     ['consumer', 'consultant']],
    ['hr_admin',       ['consumer', 'hr_admin']],
    ['platform_admin', ['consumer', 'consultant', 'hr_admin', 'platform_admin']],
  ];
  for (const [persona, expectedRoles] of cases) {
    const { res, body } = await post('/auth/demo', { persona });
    assert.equal(res.status, 201, `persona ${persona}`);
    for (const role of expectedRoles) {
      assert.ok(body.user.roles.includes(role), `${persona} should have role ${role}`);
    }
    assert.ok(body.token, `${persona} token present`);
    assert.ok(Date.parse(body.expiresAt) > Date.now(), `${persona} expiresAt valid`);
  }
});

// ─── Applications ─────────────────────────────────────────────────────────────

test('GET /applications — requires auth', async () => {
  const { res } = await get('/applications');
  assert.equal(res.status, 401);
});

test('GET /applications — new user starts with empty list', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/applications', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.applications));
  assert.equal(body.applications.length, 0);
});

test('POST /applications — creates application with correct shape', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/applications', {
    destinationCountry: 'France',
    visaType: 'Tourist',
    intendedFrom: '2026-08-01',
    purpose: 'Vacation'
  }, token);
  assert.equal(res.status, 201);
  assert.ok(body.application.id.startsWith('app-'));
  assert.ok(body.application.refCode.startsWith('REF-'));
  assert.equal(body.application.destinationCountry, 'France');
  assert.equal(body.application.issuesCount, 0, 'new apps should have 0 issues');
  assert.equal(body.application.status, 'draft');
});

test('POST /applications — persists nationality and residenceCountry when provided', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/applications', {
    destinationCountry: 'France',
    visaType: 'Tourist',
    intendedFrom: '2026-08-01',
    nationality: 'India',
    residenceCountry: 'United Arab Emirates'
  }, token);
  assert.equal(res.status, 201);
  assert.equal(body.application.nationality, 'India');
  assert.equal(body.application.residenceCountry, 'United Arab Emirates');

  const { body: fetched } = await get(`/applications/${body.application.id}`, token);
  assert.equal(fetched.application.nationality, 'India');
  assert.equal(fetched.application.residenceCountry, 'United Arab Emirates');
});

test('POST /applications — missing required fields returns 400', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/applications', { destinationCountry: 'France' }, token);
  assert.equal(res.status, 400);
  assert.ok(body.error?.message);
});

test('GET /applications/:id — returns created application', async () => {
  const token = await demoToken('consumer');
  const { body: created } = await post('/applications', {
    destinationCountry: 'Germany', visaType: 'Business', intendedFrom: '2026-09-15'
  }, token);
  const appId = created.application.id;

  const { res, body } = await get(`/applications/${appId}`, token);
  assert.equal(res.status, 200);
  assert.equal(body.application.id, appId);
  assert.equal(body.application.destinationCountry, 'Germany');
});

test('GET /applications/:id — 404 for unknown id', async () => {
  const token = await demoToken('consumer');
  const { res } = await get('/applications/non-existent-id', token);
  assert.equal(res.status, 404);
});

// ─── Requirements ─────────────────────────────────────────────────────────────

test('GET /requirements — public, returns visa requirements', async () => {
  const { res, body } = await get('/requirements');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.requirements));
  assert.ok(body.freshness?.fetchedAt, 'freshness.fetchedAt present');
  assert.ok(body.freshness.ageHours < 1, 'freshness should be recent (< 1 hour)');
});

// ─── Documents ────────────────────────────────────────────────────────────────

test('GET /documents — requires auth', async () => {
  const { res } = await get('/documents');
  assert.equal(res.status, 401);
});

test('GET /documents — returns document list', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/documents', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.documents));
  if (body.documents.length > 0) {
    const doc = body.documents[0];
    assert.ok(doc.id, 'doc has id');
    assert.ok(doc.title, 'doc has title');
    assert.ok(doc.status, 'doc has status');
    // Audit scores must be deterministic (no Math.random)
    assert.ok(typeof doc.score === 'number', 'doc.score is number');
    assert.ok(doc.score >= 0 && doc.score <= 100, 'doc.score in range');
  }
});

// ─── Audit ────────────────────────────────────────────────────────────────────

test('POST /audit — requires auth', async () => {
  const { res } = await post('/audit', { applicationId: 'app-fr-2026', documentId: 'doc-passport' });
  assert.equal(res.status, 401);
});

test('POST /audit — accepts valid input when authenticated', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;
  const { res, body } = await post('/audit', {
    applicationId, documentId: 'doc-passport'
  }, token);
  assert.equal(res.status, 202);
  assert.equal(body.jobId, 'audit-doc-passport');
  assert.equal(body.result.documentId, 'doc-passport');
});

test('POST /audit — 404 for an application the caller does not own', async () => {
  const token = await demoToken('consumer');
  const { res } = await post('/audit', { applicationId: 'someone-elses-app', documentId: 'doc-not-owned' }, token);
  assert.equal(res.status, 404);
});

test('POST /audit — 409 when documentId is already claimed by a different application', async () => {
  const token = await demoToken('consumer');
  const otherToken = await demoToken('consultant');
  const create1 = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const create2 = await post('/applications', { destinationCountry: 'Germany', visaType: 'Business', intendedFrom: '2026-10-01' }, otherToken);
  const sharedDocId = 'doc-shared-conflict-test';
  const first = await post('/audit', { applicationId: create1.body.application.id, documentId: sharedDocId }, token);
  assert.equal(first.res.status, 202);
  const second = await post('/audit', { applicationId: create2.body.application.id, documentId: sharedDocId }, otherToken);
  assert.equal(second.res.status, 409);
});

test('POST /audit — rejects missing applicationId', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/audit', { documentId: 'doc-passport' }, token);
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_FAILED');
  assert.equal(body.error.traceId, res.headers.get('x-trace-id'));
});

test('Malformed JSON returns 400 VALIDATION_FAILED', async () => {
  const res = await fetch(`${base}/audit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: "{'",
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_FAILED');
  assert.equal(body.error.message, 'Malformed JSON request body');
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

test('POST /chat — requires auth', async () => {
  const { res } = await post('/chat', { applicationId: 'app-fr-2026', message: 'Hello' });
  assert.equal(res.status, 401);
});

test('POST /chat — visa question uses deterministic fallback in mock mode', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/chat', {
    applicationId: 'app-fr-2026',
    message: 'urgent consultant review needed for my visa refusal'
  }, token);
  assert.equal(res.status, 200);
  assert.equal(body.escalate, true);
  assert.ok(body.reply.length > 20);
});

test('POST /chat — off-topic message is rejected before AI call', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/chat', {
    applicationId: 'app-fr-2026',
    message: 'Tell me a recipe for chocolate cake please'
  }, token);
  assert.equal(res.status, 200);
  assert.equal(body.escalate, false);
  assert.ok(
    body.reply.toLowerCase().includes('visa') || body.reply.toLowerCase().includes('immigration'),
    'off-topic response should redirect to visa topic'
  );
});

// ─── Consultants ──────────────────────────────────────────────────────────────

test('GET /consultants — public, returns filtered list', async () => {
  const { res, body } = await get('/consultants?q=Schengen');
  assert.equal(res.status, 200);
  assert.ok(body.consultants.length >= 1);
  assert.equal(body.consultants[0].id, 'c-priya');
});

test('GET /consultants/:id — returns consultant profile', async () => {
  const { res, body } = await get('/consultants/c-priya');
  assert.equal(res.status, 200);
  assert.equal(body.consultant.availableToday, true);
  assert.ok(body.consultant.rating >= 4);
});

test('GET /consultants/:id — 404 for unknown consultant', async () => {
  const { res } = await get('/consultants/unknown-consultant');
  assert.equal(res.status, 404);
});

test('GET /booking/session-options — public, returns session types', async () => {
  const { res, body } = await get('/booking/session-options');
  assert.equal(res.status, 200);
  assert.ok(body.options.length >= 2);
  assert.ok(body.options.some((o: { recommended?: boolean }) => o.recommended), 'at least one recommended option');
});

test('POST /bookings — requires auth', async () => {
  const { res } = await post('/bookings', { consultantId: 'c-priya' });
  assert.equal(res.status, 401);
});

test('POST /bookings — validates required fields', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/bookings', { consultantId: 'c-priya' }, token);
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_FAILED');
});

test('POST /bookings — creates booking with calendly URL', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/bookings', {
    consultantId: 'c-priya',
    applicationId: 'app-fr-2026',
    sessionType: 'deep-dive'
  }, token);
  assert.equal(res.status, 201);
  assert.ok(body.bookingId.startsWith('booking-'));
  assert.ok(body.calendlyUrl.includes('calendly.com'));
});

// ─── Role-gated endpoints ─────────────────────────────────────────────────────

test('GET /consultant-console — rejects consumer token (403)', async () => {
  const token = await demoToken('consumer');
  const { res } = await get('/consultant-console', token);
  assert.equal(res.status, 403);
});

test('GET /consultant-console — accepts consultant token', async () => {
  const token = await demoToken('consultant');
  const { res, body } = await get('/consultant-console', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.queue));
  assert.ok(Array.isArray(body.conversations));
});

test('GET /hr — rejects consumer token (403)', async () => {
  const token = await demoToken('consumer');
  const { res } = await get('/hr', token);
  assert.equal(res.status, 403);
});

test('GET /hr — accepts hr_admin token', async () => {
  const token = await demoToken('hr_admin');
  const { res, body } = await get('/hr', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.teams));
  assert.ok(Array.isArray(body.reports));
});

test('GET /admin/overview — rejects consumer token (403)', async () => {
  const token = await demoToken('consumer');
  const { res } = await get('/admin/overview', token);
  assert.equal(res.status, 403);
});

test('GET /admin/overview — accepts platform_admin token', async () => {
  const token = await demoToken('platform_admin');
  const { res, body } = await get('/admin/overview', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.metrics));
  assert.ok(body.metrics.length >= 1);
});

test('GET /admin/embassy-updates — rejects non-admin tokens', async () => {
  const consumerToken   = await demoToken('consumer');
  const consultantToken = await demoToken('consultant');
  const { res: r1 } = await get('/admin/embassy-updates', consumerToken);
  const { res: r2 } = await get('/admin/embassy-updates', consultantToken);
  assert.equal(r1.status, 403);
  assert.equal(r2.status, 403);
});

test('GET /admin/embassy-updates — accepts platform_admin', async () => {
  const token = await demoToken('platform_admin');
  const { res, body } = await get('/admin/embassy-updates', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.updates));
});

test('GET /employee — requires auth, returns employee portal', async () => {
  const { res: unauth } = await get('/employee');
  assert.equal(unauth.status, 401);

  const token = await demoToken('consumer');
  const { res, body } = await get('/employee', token);
  assert.equal(res.status, 200);
  assert.ok(body.profile?.name, 'profile.name present');
  assert.ok(Array.isArray(body.tasks));
});

// ─── Profile ──────────────────────────────────────────────────────────────────

test('GET /profile — requires auth', async () => {
  const { res } = await get('/profile');
  assert.equal(res.status, 401);
});

test('GET /profile — returns empty profile for new user', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/profile', token);
  assert.equal(res.status, 200);
  assert.ok(body.profile.uid, 'uid present');
  assert.ok(body.profile.updatedAt, 'updatedAt present');
});

test('PUT /profile — persists and GET reflects changes', async () => {
  const token = await demoToken('consumer');

  const { res: putRes, body: putBody } = await put('/profile', {
    personal: {
      firstName: 'Sara', lastName: 'Test', nationality: 'Indian',
      dateOfBirth: '1990-05-15', phone: '+971501234567', gender: 'Female'
    }
  }, token);
  assert.equal(putRes.status, 200);
  assert.equal(putBody.profile.personal?.firstName, 'Sara');

  const { res: getRes, body: getBody } = await get('/profile', token);
  assert.equal(getRes.status, 200);
  assert.equal(getBody.profile.personal?.firstName, 'Sara');
  assert.equal(getBody.profile.personal?.lastName, 'Test');
});

test('PUT /profile — partial update does not overwrite existing fields', async () => {
  const token = await demoToken('hr_admin');

  await put('/profile', { personal: { firstName: 'Ali', lastName: 'Hassan', nationality: 'UAE', dateOfBirth: '1985-01-01', phone: '+97150000000', gender: 'Male' } }, token);
  await put('/profile', { employment: { employer: 'Acme Corp', jobTitle: 'Manager', annualIncomeUsd: '120000' } }, token);

  const { body } = await get('/profile', token);
  assert.equal(body.profile.personal?.firstName, 'Ali', 'personal preserved after employment update');
  assert.equal(body.profile.employment?.employer, 'Acme Corp');
});

// ─── Notifications ────────────────────────────────────────────────────────────

test('GET /notifications — requires auth', async () => {
  const { res } = await get('/notifications');
  assert.equal(res.status, 401);
});

test('GET /notifications — returns notification list', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/notifications', token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.notifications));
});

// ─── Embassies ────────────────────────────────────────────────────────────────

test('GET /embassies — public, returns embassy list', async () => {
  const { res, body } = await get('/embassies');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.embassies));
  assert.ok(body.embassies.length >= 5, 'at least 5 embassies');
  const em = body.embassies[0];
  assert.ok(em.id,      'embassy.id');
  assert.ok(em.country, 'embassy.country');
  assert.ok(em.name,    'embassy.name');
  assert.ok(em.address, 'embassy.address');
  assert.ok(em.phone,   'embassy.phone');
});

test('GET /embassies?country=France — filters by country', async () => {
  const { res, body } = await get('/embassies?country=France');
  assert.equal(res.status, 200);
  assert.ok(body.embassies.length >= 1);
  assert.ok(body.embassies.every((e: { country: string }) =>
    e.country.toLowerCase().includes('france')
  ), 'all results should match France');
});

// ─── Visa Waiver ──────────────────────────────────────────────────────────────

test('GET /visa-waiver — returns nationalities list when no params given', async () => {
  const { res, body } = await get('/visa-waiver');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.nationalities), 'nationalities array present');
  assert.ok(body.nationalities.length >= 5, 'at least 5 nationalities');
});

test('GET /visa-waiver?nationality=Indian — returns destinations for that nationality', async () => {
  const { res, body } = await get('/visa-waiver?nationality=Indian');
  assert.equal(res.status, 200);
  assert.equal(body.nationality, 'Indian');
  assert.ok(Array.isArray(body.destinations), 'destinations array present');
  assert.ok(body.destinations.length >= 3, 'at least 3 destinations');
});

test('GET /visa-waiver?nationality=Indian&destination=UAE — returns specific rule', async () => {
  const { res, body } = await get('/visa-waiver?nationality=Indian&destination=UAE');
  assert.equal(res.status, 200);
  assert.equal(body.nationality, 'Indian');
  assert.equal(body.destination, 'UAE');
  assert.ok(body.type, 'type present (visa/waiver/eta)');
  assert.ok(body.note, 'note present');
});

// ─── Partners ─────────────────────────────────────────────────────────────────

test('GET /partners — public, returns partners with categories', async () => {
  const { res, body } = await get('/partners');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.partners));
  assert.ok(body.partners.length >= 3, 'at least 3 partners');
  const p = body.partners[0];
  assert.ok(p.id, 'partner.id');
  assert.ok(p.name, 'partner.name');
  assert.ok(typeof p.commissionPct === 'number', 'commissionPct is number');
});

// ─── Exchange Rates ───────────────────────────────────────────────────────────

test('GET /exchange-rates — returns rates with base currency', async () => {
  const { res, body } = await get('/exchange-rates');
  assert.equal(res.status, 200);
  assert.equal(body.base, 'USD');
  assert.ok(body.rates?.EUR, 'EUR rate present');
  assert.ok(body.rates?.GBP, 'GBP rate present');
  assert.ok(body.updatedAt, 'updatedAt present');
});

// ─── Usage & Compliance DB (auth-gated) ──────────────────────────────────────

test('GET /usage — requires auth', async () => {
  const { res } = await get('/usage');
  assert.equal(res.status, 401);
});

test('GET /usage — authenticated returns usage metrics', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/usage', token);
  assert.equal(res.status, 200);
  assert.ok(body.period, 'period present');
  assert.ok(body.apiCalls, 'apiCalls present');
  assert.ok(body.updatedAt, 'updatedAt present');
});

test('GET /compliance-db — requires auth', async () => {
  const { res } = await get('/compliance-db');
  assert.equal(res.status, 401);
});

test('GET /compliance-db — returns country compliance list', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await get('/compliance-db', token);
  assert.equal(res.status, 200);
  assert.ok(typeof body.totalCountries === 'number');
  assert.ok(body.totalCountries >= 10, 'at least 10 countries');
});

// ─── Access Grants ────────────────────────────────────────────────────────────

test('POST /access-grants — requires auth', async () => {
  const { res } = await post('/access-grants', {
    applicationId: 'app-fr-2026', consultantId: 'c-priya',
    categories: ['requirements'], expiresAt: '2026-12-01T00:00:00.000Z'
  });
  assert.equal(res.status, 401);
});

test('POST /access-grants — creates grant when authenticated', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/access-grants', {
    applicationId: 'app-fr-2026',
    consultantId: 'c-priya',
    categories: ['requirements', 'audit_findings'],
    expiresAt: '2026-12-01T00:00:00.000Z'
  }, token);
  assert.equal(res.status, 201);
  assert.equal(body.status, 'active');
  assert.ok(body.grantId.startsWith('grant-'));
});

// ─── 404 ─────────────────────────────────────────────────────────────────────

test('Unknown route returns generic 404', async () => {
  const { res, body } = await get('/this-route-does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
  // Must not leak stack trace or internal info
  assert.equal(body.error.stack, undefined);
});
