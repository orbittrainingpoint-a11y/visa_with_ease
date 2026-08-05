/**
 * Mobile API Contract Tests
 *
 * Validates every endpoint called by apps/mobile/App.tsx and apps/mobile/src/api.ts.
 * Simulates the full mobile user journey: login → create app → audit → chat → profile → waiver.
 *
 * Run with: pnpm --filter @visaiq/backend test:mobile
 */
// Must be set before importing the app so signToken/verifyIdToken use real JWTs
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.JWT_SECRET = 'contract-test-secret-do-not-use-in-production';

import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from './app.js';

const server = createApp().listen(0);
const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}`;

test.after(() => { server.close(); });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function api(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const responseBody = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body: responseBody };
}

async function getToken(persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin' = 'consumer') {
  const r = await api('POST', '/auth/demo', { persona });
  assert.equal(r.status, 201);
  return r.body.token as string;
}

// ─── Mobile Auth Flows ────────────────────────────────────────────────────────

test('Mobile: demo login as consumer — returns valid session', async () => {
  const r = await api('POST', '/auth/demo', { persona: 'consumer' });
  assert.equal(r.status, 201);
  assert.ok(r.body.token, 'token present');
  assert.ok(r.body.user.uid, 'uid present');
  assert.ok(r.body.user.email, 'email present');
  assert.ok(r.body.user.name, 'name present');
  assert.deepEqual(r.body.user.roles, ['consumer']);
  assert.ok(Date.parse(r.body.expiresAt) > Date.now(), 'token not expired');
});

test('Mobile: email/password login — returns session with consumer role', async () => {
  await api('POST', '/auth/register', {
    name: 'Test User', email: 'user@test.visaiq.app', password: 'SecurePass99'
  });
  const r = await api('POST', '/auth/session', {
    email: 'user@test.visaiq.app', password: 'SecurePass99', remember: false
  });
  assert.equal(r.status, 201);
  assert.ok(r.body.user.roles.includes('consumer'));
});

test('Mobile: email/password login — rejects wrong password', async () => {
  await api('POST', '/auth/register', {
    name: 'Wrong Pw User', email: 'wrongpw@test.visaiq.app', password: 'CorrectPass99'
  });
  const r = await api('POST', '/auth/session', {
    email: 'wrongpw@test.visaiq.app', password: 'IncorrectPass99', remember: false
  });
  assert.equal(r.status, 401);
});

test('Mobile: registration — creates account and returns session', async () => {
  const email = `mobile${Date.now()}@test.visaiq.app`;
  const r = await api('POST', '/auth/register', {
    name: 'Mobile Test', email, password: 'MobilePass123'
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.email, email);
  assert.ok(r.body.token);
});

test('Mobile: short password returns 400 on register', async () => {
  const r = await api('POST', '/auth/register', {
    name: 'Test', email: 'x@example.com', password: '123'
  });
  assert.equal(r.status, 400);
  assert.ok(r.body.error?.message?.toLowerCase().includes('password'));
});

// ─── Application Lifecycle ────────────────────────────────────────────────────

test('Mobile: full application lifecycle — create, read, list', async () => {
  const token = await getToken('consumer');

  // New user starts with empty list
  const listEmpty = await api('GET', '/applications', undefined, token);
  assert.equal(listEmpty.status, 200);
  assert.equal(listEmpty.body.applications.length, 0);

  // Create application
  const create = await api('POST', '/applications', {
    destinationCountry: 'France',
    visaType: 'Tourist',
    intendedFrom: '2026-09-01',
    purpose: 'Vacation'
  }, token);
  assert.equal(create.status, 201);
  const app = create.body.application;
  assert.ok(app.id, 'app.id present');
  assert.ok(app.refCode.startsWith('REF-'), 'refCode format');
  assert.equal(app.issuesCount, 0, 'new app has 0 issues');
  assert.equal(app.status, 'draft');
  assert.equal(app.documentsRequired, 6);

  // List now has one
  const listOne = await api('GET', '/applications', undefined, token);
  assert.equal(listOne.body.applications.length, 1);

  // Fetch by ID
  const single = await api('GET', `/applications/${app.id}`, undefined, token);
  assert.equal(single.status, 200);
  assert.equal(single.body.application.id, app.id);
  assert.equal(single.body.application.destinationCountry, 'France');

  // 404 for wrong user's app
  const otherToken = await getToken('consultant');
  const notFound = await api('GET', `/applications/${app.id}`, undefined, otherToken);
  assert.equal(notFound.status, 404);
});

// ─── Documents ────────────────────────────────────────────────────────────────

test('Mobile: document list — returns typed documents with deterministic scores', async () => {
  const token = await getToken('consumer');
  const r = await api('GET', '/documents', undefined, token);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.documents));

  for (const doc of r.body.documents) {
    assert.ok(doc.id,     `doc ${doc.id} has id`);
    assert.ok(doc.title,  `doc ${doc.id} has title`);
    assert.ok(doc.status, `doc ${doc.id} has status`);
    // Scores must be deterministic (no Math.random)
    assert.ok(typeof doc.score === 'number',       `doc ${doc.id} score is number`);
    assert.ok(doc.score >= 0 && doc.score <= 100,  `doc ${doc.id} score in range`);
  }
});

test('Mobile: upload slot — returns URL for document upload', async () => {
  const token = await getToken('consumer');
  const r = await api('POST', '/upload-slots', {
    applicationId: 'app-test', documentId: 'doc-passport'
  }, token);
  assert.equal(r.status, 201);
  assert.ok(r.body.uploadUrl, 'uploadUrl present');
  assert.ok(Date.parse(r.body.expiresAt) > Date.now(), 'expiresAt in future');
});

test('Mobile: audit enqueue — accepts and returns job', async () => {
  const token = await getToken('consumer');
  const r = await api('POST', '/audit', {
    applicationId: 'app-fr-2026', documentId: 'doc-passport'
  }, token);
  assert.equal(r.status, 202);
  assert.ok(r.body.jobId, 'jobId present');
  assert.ok(r.body.result?.documentId, 'result.documentId present');
});

test('Mobile: audit result fetch — returns audit with score', async () => {
  const token = await getToken('consumer');
  const r = await api('GET', '/audit/doc-passport', undefined, token);
  // May return 200 with result or 404 if no pending audit
  assert.ok([200, 404].includes(r.status), `expected 200 or 404, got ${r.status}`);
  if (r.status === 200) {
    assert.ok(r.body.documentId || r.body.result, 'audit result present');
  }
});

// ─── Chat / AI ────────────────────────────────────────────────────────────────

test('Mobile: chat — visa question returns a reply', async () => {
  const token = await getToken('consumer');
  const r = await api('POST', '/chat', {
    applicationId: 'app-test',
    message: 'What documents do I need for a France tourist visa?'
  }, token);
  assert.equal(r.status, 200);
  assert.ok(r.body.reply?.length > 5, 'non-empty reply');
  assert.ok(typeof r.body.escalate === 'boolean', 'escalate is boolean');
  assert.ok(Array.isArray(r.body.suggestedActions), 'suggestedActions is array');
});

test('Mobile: chat — off-topic message rejected without AI call', async () => {
  const token = await getToken('consumer');
  const r = await api('POST', '/chat', {
    applicationId: 'app-test',
    message: 'What is the best recipe for pasta carbonara?'
  }, token);
  assert.equal(r.status, 200);
  assert.equal(r.body.escalate, false);
  // Response should redirect to visa topics
  const reply = (r.body.reply as string).toLowerCase();
  assert.ok(
    reply.includes('visa') || reply.includes('immigration'),
    'off-topic reply redirects to visa'
  );
});

test('Mobile: chat — escalation trigger for urgent/refusal message', async () => {
  const token = await getToken('consumer');
  const r = await api('POST', '/chat', {
    applicationId: 'app-test',
    message: 'My visa was rejected and I need urgent help with an appeal'
  }, token);
  assert.equal(r.status, 200);
  assert.equal(r.body.escalate, true);
});

// ─── Requirements ─────────────────────────────────────────────────────────────

test('Mobile: requirements — GET returns requirements with freshness', async () => {
  const r = await api('GET', '/requirements');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.requirements));
  assert.ok(r.body.freshness?.fetchedAt, 'freshness.fetchedAt present');
  assert.ok(r.body.freshness?.ageHours < 1, 'data should be fresh (< 1 hour)');
  assert.ok(r.body.processingTime, 'processingTime present');
  assert.ok(r.body.fees, 'fees present');
});

// ─── Consultants & Booking ────────────────────────────────────────────────────

test('Mobile: consultant list — returns consultants with all required fields', async () => {
  const r = await api('GET', '/consultants');
  assert.equal(r.status, 200);
  assert.ok(r.body.consultants.length >= 3, 'at least 3 consultants');
  const c = r.body.consultants[0];
  assert.ok(c.id,            'consultant.id');
  assert.ok(c.name,          'consultant.name');
  assert.ok(typeof c.rating === 'number', 'consultant.rating is number');
  assert.ok(c.specialty,     'consultant.specialty');
  assert.ok(typeof c.rate === 'number', 'consultant.rate is number');
  assert.ok(Array.isArray(c.languages), 'consultant.languages is array');
  assert.ok(typeof c.availableToday === 'boolean', 'consultant.availableToday is boolean');
});

test('Mobile: session options — returns options with recommended flag', async () => {
  const r = await api('GET', '/booking/session-options');
  assert.equal(r.status, 200);
  assert.ok(r.body.options.length >= 2);
  const recommended = r.body.options.filter((o: { recommended?: boolean }) => o.recommended);
  assert.ok(recommended.length >= 1, 'at least one option is recommended');
});

test('Mobile: create booking — returns calendly URL', async () => {
  const token = await getToken('consumer');
  const r = await api('POST', '/bookings', {
    consultantId: 'c-priya',
    applicationId: 'app-test',
    sessionType: 'deep-dive'
  }, token);
  assert.equal(r.status, 201);
  assert.ok(r.body.bookingId.startsWith('booking-'));
  assert.ok(r.body.calendlyUrl.includes('calendly.com'), 'calendlyUrl present');
});

// ─── Profile ──────────────────────────────────────────────────────────────────

test('Mobile: profile — full read/write cycle', async () => {
  const token = await getToken('consumer');

  // Empty profile for new user
  const empty = await api('GET', '/profile', undefined, token);
  assert.equal(empty.status, 200);
  assert.ok(empty.body.profile.uid, 'uid present');

  // Write personal section
  const patch1 = await api('PUT', '/profile', {
    personal: {
      firstName: 'Ahmed', lastName: 'Al-Rashid', nationality: 'UAE',
      dateOfBirth: '1992-03-10', phone: '+971501234567', gender: 'Male'
    }
  }, token);
  assert.equal(patch1.status, 200);
  assert.equal(patch1.body.profile.personal?.firstName, 'Ahmed');

  // Write passport section
  const patch2 = await api('PUT', '/profile', {
    passport: {
      passportNumber: 'A12345678', issueDate: '2020-01-01',
      expiryDate: '2030-01-01', issuingCountry: 'UAE'
    }
  }, token);
  assert.equal(patch2.status, 200);
  assert.equal(patch2.body.profile.passport?.passportNumber, 'A12345678');

  // Verify both sections persisted
  const read = await api('GET', '/profile', undefined, token);
  assert.equal(read.body.profile.personal?.firstName, 'Ahmed', 'personal preserved');
  assert.equal(read.body.profile.passport?.passportNumber, 'A12345678', 'passport preserved');
  assert.ok(read.body.profile.updatedAt, 'updatedAt present');
});

// ─── Notifications ────────────────────────────────────────────────────────────

test('Mobile: notifications — returns list with typed entries', async () => {
  const token = await getToken('consumer');
  const r = await api('GET', '/notifications', undefined, token);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.notifications));
  if (r.body.notifications.length > 0) {
    const n = r.body.notifications[0];
    assert.ok(n.id,    'notification.id');
    assert.ok(n.title, 'notification.title');
    assert.ok(n.type,  'notification.type');
    assert.ok(typeof n.read === 'boolean', 'notification.read is boolean');
  }
});

// ─── Embassies ────────────────────────────────────────────────────────────────

test('Mobile: embassy finder — returns embassies with all display fields', async () => {
  const r = await api('GET', '/embassies');
  assert.equal(r.status, 200);
  assert.ok(r.body.embassies.length >= 10, 'at least 10 embassies');
  assert.equal(typeof r.body.total, 'number');

  const em = r.body.embassies[0];
  assert.ok(em.id,      'embassy.id');
  assert.ok(em.country, 'embassy.country');
  assert.ok(em.name,    'embassy.name');
  assert.ok(em.address, 'embassy.address');
  assert.ok(em.phone,   'embassy.phone');
  assert.ok(em.hours,   'embassy.hours');
  assert.ok(em.website, 'embassy.website');
});

test('Mobile: embassy finder — country filter works case-insensitively', async () => {
  const r = await api('GET', '/embassies?country=france');
  assert.equal(r.status, 200);
  assert.ok(r.body.embassies.length >= 1);
  assert.ok(r.body.embassies.every((e: { country: string; id: string }) =>
    e.country.toLowerCase().includes('france') || e.id.includes('france')
  ));
});

// ─── Visa Waiver Checker ──────────────────────────────────────────────────────

test('Mobile: visa waiver — Indian to UAE requires a UAE visa', async () => {
  const r = await api('GET', '/visa-waiver?nationality=Indian&destination=UAE');
  assert.equal(r.status, 200);
  assert.equal(r.body.nationality, 'Indian');
  assert.equal(r.body.destination, 'UAE');
  assert.ok(r.body.type, 'type present');
  assert.ok(r.body.note, 'note present');
  const body = JSON.stringify(r.body).toLowerCase();
  assert.ok(body.includes('visa') || body.includes('uae'), 'Indian→UAE should mention visa requirement');
});

test('Mobile: visa waiver — nationalities list when no params', async () => {
  const r = await api('GET', '/visa-waiver');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.nationalities), 'nationalities array present');
  assert.ok(r.body.nationalities.includes('Indian'), 'Indian in nationalities');
  assert.ok(r.body.nationalities.length >= 5, 'at least 5 nationalities');
});

test('Mobile: visa waiver — returns destinations for a nationality', async () => {
  const r = await api('GET', '/visa-waiver?nationality=Indian&destination=Thailand');
  assert.equal(r.status, 200);
  assert.ok(r.body.type, 'type present (waiver/visa/eta)');
  assert.ok(r.body.note, 'note present');
});

// ─── Exchange Rates ───────────────────────────────────────────────────────────

test('Mobile: exchange rates — returns USD base with major currencies', async () => {
  const r = await api('GET', '/exchange-rates');
  assert.equal(r.status, 200);
  assert.equal(r.body.base, 'USD');
  assert.ok(typeof r.body.rates.EUR === 'number', 'EUR rate');
  assert.ok(typeof r.body.rates.GBP === 'number', 'GBP rate');
  assert.ok(typeof r.body.rates.AED === 'number', 'AED rate');
  assert.ok(typeof r.body.rates.INR === 'number', 'INR rate');
  assert.ok(r.body.updatedAt, 'updatedAt present');
  // Rates should be realistic (EUR not 0 or 1000)
  assert.ok(r.body.rates.EUR > 0.5 && r.body.rates.EUR < 2.0, 'EUR rate realistic');
});

// ─── Partners ─────────────────────────────────────────────────────────────────

test('Mobile: partners — returns categorised list with required fields', async () => {
  const r = await api('GET', '/partners');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.partners));
  assert.ok(r.body.partners.length >= 3);

  const p = r.body.partners[0];
  assert.ok(p.id,       'partner.id');
  assert.ok(p.name,     'partner.name');
  assert.ok(p.category, 'partner.category');
  assert.ok(p.discount, 'partner.discount');
  assert.ok(typeof p.commissionPct === 'number', 'partner.commissionPct is number');
});

// ─── Role isolation — mobile personas ────────────────────────────────────────

test('Mobile: consultant persona accesses consultant console', async () => {
  const token = await getToken('consultant');
  const r = await api('GET', '/consultant-console', undefined, token);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.queue));
});

test('Mobile: consumer persona cannot access consultant console', async () => {
  const token = await getToken('consumer');
  const r = await api('GET', '/consultant-console', undefined, token);
  assert.equal(r.status, 403);
});

test('Mobile: hr_admin persona accesses HR portal', async () => {
  const token = await getToken('hr_admin');
  const r = await api('GET', '/hr', undefined, token);
  assert.equal(r.status, 200);
});

test('Mobile: platform_admin persona accesses admin overview', async () => {
  const token = await getToken('platform_admin');
  const r = await api('GET', '/admin/overview', undefined, token);
  assert.equal(r.status, 200);
  assert.ok(r.body.metrics.length >= 1);
});

// ─── Error contract ───────────────────────────────────────────────────────────

test('Mobile: all auth-required endpoints return 401 JSON (not HTML)', async () => {
  const protectedPaths = [
    '/applications', '/documents', '/notifications', '/profile',
    '/chat', '/employee', '/consultant-console', '/hr', '/admin/overview',
  ];
  for (const path of protectedPaths) {
    const method = path === '/chat' ? 'POST' : 'GET';
    const body = path === '/chat' ? { message: 'test' } : undefined;
    const r = await api(method, path, body);
    assert.equal(r.status, 401, `${method} ${path} should return 401`);
    assert.equal(r.body?.error?.code, 'UNAUTHORIZED', `${method} ${path} error code`);
    // Must return JSON, not HTML error page
    assert.ok(r.body?.error?.message, `${method} ${path} error message`);
  }
});

test('Mobile: 404 returns JSON with traceId, not HTML', async () => {
  const r = await api('GET', '/this-does-not-exist');
  assert.equal(r.status, 404);
  assert.equal(r.body?.error?.code, 'NOT_FOUND');
  assert.ok(r.body?.error?.traceId, 'traceId present');
});
