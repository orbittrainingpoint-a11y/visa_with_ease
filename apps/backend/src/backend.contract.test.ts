/**
 * Backend contract tests — full API surface including auth, roles, and all new endpoints.
 * Run with: pnpm --filter @visaiq/backend test
 */
// Must be set before importing the app so signToken/verifyIdToken use real JWTs
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.JWT_SECRET = 'contract-test-secret-do-not-use-in-production';
process.env.FIRESTORE_DISABLED = 'true';
process.env.ENABLE_DEMO_LOGIN = 'true';
process.env.AI_MOCK = 'true';
process.env.ENABLE_DEV_AUTH_BYPASS = 'true';

import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from './app.js';
import { sendPushToUser } from './services/push.js';

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
const del  = (path: string, token?: string) => json('DELETE', path, undefined, token);

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

test('POST /auth/refresh — issues a fresh long-lived session for a valid token', async () => {
  const login = await post('/auth/session', { email: 'sarah.mathew@example.com', password: 'demo1234', remember: true });
  const { res, body } = await post('/auth/refresh', {}, login.body.token);
  assert.equal(res.status, 200);
  assert.equal(body.user.email, 'sarah.mathew@example.com');
  assert.ok(body.token, 'token present');
  assert.ok(Date.parse(body.expiresAt) > Date.now() + 29 * 24 * 60 * 60 * 1000, 'expires ~30 days out');
});

test('POST /auth/refresh — rejects a missing or invalid token', async () => {
  assert.equal((await post('/auth/refresh', {})).res.status, 401);
  assert.equal((await post('/auth/refresh', {}, 'not-a-token')).res.status, 401);
});

test('POST /chat — without an applicationId it still answers about the caller own latest application', async () => {
  // A fresh account, so the shared demo user's application list (asserted empty elsewhere) stays untouched.
  const reg = await post('/auth/register', { name: 'Chat Default', email: `chat-default-${Date.now()}@example.com`, password: 'Sup3rSecret!x' });
  assert.equal(reg.res.status, 201);
  const token = reg.body.token as string;
  const created = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, token);
  assert.equal(created.res.status, 201);
  const { res, body } = await post('/chat', { message: "what's my score" }, token);
  assert.equal(res.status, 200);
  assert.match(body.reply, /France/, 'grounded in the caller own France application, not a generic reply');
});

test('Bookings — list is scoped to the caller, cancel frees the slot, others cannot cancel', async () => {
  const reg = async (tag: string) => {
    const r = await post('/auth/register', { name: `Book ${tag}`, email: `book-${tag}-${Date.now()}@example.com`, password: 'Sup3rSecret!x' });
    assert.equal(r.res.status, 201);
    return r.body.token as string;
  };
  const alice = await reg('a');
  const bob = await reg('b');
  const app1 = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, alice);
  const slotISO = '2027-03-10T06:00:00.000Z'; // 10:00 AM GST
  const made = await post('/bookings', { consultantId: 'c-priya', applicationId: app1.body.application.id, sessionType: 'standard', slotISO }, alice);
  assert.equal(made.res.status, 201);

  const mineA = await get('/bookings', alice);
  assert.equal(mineA.res.status, 200);
  assert.equal(mineA.body.bookings.length, 1);
  assert.equal(mineA.body.bookings[0].consultantName, 'Priya Sharma');
  assert.equal(mineA.body.bookings[0].destinationCountry, 'France');
  assert.equal((await get('/bookings', bob)).body.bookings.length, 0, 'another user sees none of the first user bookings');
  assert.equal((await get('/bookings')).res.status, 401);

  const taken = await get('/booking/slots/c-priya?date=2027-03-10');
  assert.ok(taken.body.takenSlots.includes('10:00 AM'), 'booked slot is taken');

  assert.equal((await post(`/bookings/${made.body.bookingId}/cancel`, {}, bob)).res.status, 404, 'cannot cancel another user booking');
  const cancelled = await post(`/bookings/${made.body.bookingId}/cancel`, {}, alice);
  assert.equal(cancelled.res.status, 200);
  assert.equal(cancelled.body.status, 'cancelled');
  assert.equal((await get('/bookings', alice)).body.bookings[0].status, 'cancelled');
  const freed = await get('/booking/slots/c-priya?date=2027-03-10');
  assert.ok(!freed.body.takenSlots.includes('10:00 AM'), 'cancelling frees the slot');
});

test('DELETE /applications/:id — owner only; cancels its bookings and revokes its access grants', async () => {
  const reg = async (tag: string) => {
    const r = await post('/auth/register', { name: `Del ${tag}`, email: `del-${tag}-${Date.now()}@example.com`, password: 'Sup3rSecret!x' });
    assert.equal(r.res.status, 201);
    return r.body.token as string;
  };
  const owner = await reg('o');
  const other = await reg('x');
  const made = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, owner);
  const id = made.body.application.id as string;
  const keep = await post('/applications', { destinationCountry: 'Germany', visaType: 'schengen-tourist', intendedFrom: '2027-01-01' }, owner);
  await post('/bookings', { consultantId: 'c-priya', applicationId: id, sessionType: 'standard', slotISO: '2027-04-10T06:00:00.000Z' }, owner);
  await post('/access-grants', { applicationId: id, consultantId: 'c-priya', categories: ['profile'], acceptedTerms: true, expiresAt: '2027-05-01T00:00:00.000Z' }, owner);

  assert.equal((await del(`/applications/${id}`)).res.status, 401, 'needs auth');
  assert.equal((await del(`/applications/${id}`, other)).res.status, 404, 'another user cannot delete it');
  assert.equal((await get(`/applications/${id}`, owner)).res.status, 200, 'still there after the failed attempt');

  const res = await del(`/applications/${id}`, owner);
  assert.equal(res.res.status, 200);
  assert.equal(res.body.cancelledBookings, 1);
  assert.equal(res.body.revokedGrants, 1);
  assert.equal((await get(`/applications/${id}`, owner)).res.status, 404, 'gone');
  const list = await get('/applications', owner);
  assert.deepEqual(list.body.applications.map((a: { id: string }) => a.id), [keep.body.application.id], 'only the other application remains');
  assert.equal((await get('/bookings', owner)).body.bookings[0].status, 'cancelled', 'its appointment was cancelled');
  assert.equal((await del(`/applications/${id}`, owner)).res.status, 404, 'deleting twice is a clean 404');
});

// ─── Consultant workspace, consent, calls and face verification ───────────────

async function registerFresh(tag: string) {
  const r = await post('/auth/register', { name: `T ${tag}`, email: `t-${tag}-${Date.now()}@example.com`, password: 'Sup3rSecret!x' });
  assert.equal(r.res.status, 201);
  return r.body.token as string;
}

test('Grants must carry accepted terms — without them no access is created', async () => {
  const client = await registerFresh('terms');
  const app1 = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, client);
  const id = app1.body.application.id as string;
  const noTerms = await post('/access-grants', { applicationId: id, consultantId: 'c-priya', categories: ['profile'], expiresAt: '2030-01-01T00:00:00.000Z' }, client);
  assert.equal(noTerms.res.status, 400);
  const falseTerms = await post('/access-grants', { applicationId: id, consultantId: 'c-priya', categories: ['profile'], expiresAt: '2030-01-01T00:00:00.000Z', acceptedTerms: false }, client);
  assert.equal(falseTerms.res.status, 400);
  assert.equal((await get('/access-grants', client)).body.grants.length, 0);
  assert.equal((await post('/access-grants', { applicationId: id, consultantId: 'c-priya', categories: ['profile'], expiresAt: '2030-01-01T00:00:00.000Z', acceptedTerms: true }, client)).res.status, 201);
});

test('Consultant workspace — sees only own appointments, and client data only after an explicit grant', async () => {
  const consultant = await demoToken('consultant'); // demo consultant is linked to c-priya
  const client = await registerFresh('cw');
  const stranger = await registerFresh('stranger');
  const app1 = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01', nationality: 'India' }, client);
  const appId = app1.body.application.id as string;
  const mine = await post('/bookings', { consultantId: 'c-priya', applicationId: appId, sessionType: 'standard', slotISO: '2030-06-10T06:00:00.000Z' }, client);
  assert.equal(mine.res.status, 201);
  const other = await post('/bookings', { consultantId: 'c-omar', applicationId: appId, sessionType: 'standard', slotISO: '2030-06-11T06:00:00.000Z' }, client);
  assert.equal(other.res.status, 201);

  assert.equal((await get('/consultant/appointments', client)).res.status, 403, 'a normal user has no consultant workspace');
  const list = await get('/consultant/appointments', consultant);
  assert.equal(list.res.status, 200);
  const row = list.body.appointments.find((a: { bookingId: string }) => a.bookingId === mine.body.bookingId);
  assert.ok(row, 'own appointment is listed');
  assert.ok(!list.body.appointments.some((a: { bookingId: string }) => a.bookingId === other.body.bookingId), 'another consultant\'s appointment is not listed');
  assert.equal(row.access.granted, false, 'no access before the client grants it');
  assert.ok(row.clientName && row.destinationCountry === 'France', 'only name and destination are visible pre-grant');
  assert.equal(row.nationality, undefined);

  const denied = await get(`/consultant/appointments/${mine.body.bookingId}/case`, consultant);
  assert.equal(denied.res.status, 403);
  assert.equal(denied.body.error.code, 'ACCESS_NOT_GRANTED');
  assert.equal((await get(`/consultant/appointments/${other.body.bookingId}/case`, consultant)).res.status, 404, 'not their appointment');

  // The client grants only profile + requirements — nothing else may appear.
  const grant = await post('/access-grants', { applicationId: appId, consultantId: 'c-priya', categories: ['profile', 'requirements'], expiresAt: '2031-01-01T00:00:00.000Z', acceptedTerms: true }, client);
  assert.equal(grant.res.status, 201);
  const caseView = await get(`/consultant/appointments/${mine.body.bookingId}/case`, consultant);
  assert.equal(caseView.res.status, 200);
  assert.equal(caseView.body.profile.nationality, 'India');
  assert.ok(Array.isArray(caseView.body.requirements));
  assert.equal(caseView.body.documents, undefined, 'documents were not shared');
  assert.equal(caseView.body.auditFindings, undefined, 'audit findings were not shared');
  assert.equal(caseView.body.contact, undefined, 'contact was not shared');
  assert.ok(caseView.body.access.termsAcceptedAt, 'the terms acceptance is recorded');

  // Revoking closes it again immediately.
  assert.equal((await del(`/access-grants/${grant.body.grantId}`, client)).res.status, 200);
  assert.equal((await get(`/consultant/appointments/${mine.body.bookingId}/case`, consultant)).res.status, 403);
  // A different user's token can never read the case either.
  assert.equal((await get(`/consultant/appointments/${mine.body.bookingId}/case`, stranger)).res.status, 403);
});

test('Call link — opens only inside the join window, only for the client or their consultant', async () => {
  const client = await registerFresh('call');
  const stranger = await registerFresh('callx');
  const consultant = await demoToken('consultant');
  const app1 = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, client);
  const appId = app1.body.application.id as string;
  const far = await post('/bookings', { consultantId: 'c-priya', applicationId: appId, sessionType: 'standard', slotISO: '2031-03-10T06:00:00.000Z' }, client);
  const listed = await get('/bookings', client);
  const call = listed.body.bookings.find((b: { bookingId: string }) => b.bookingId === far.body.bookingId).call;
  assert.equal(call.available, true);
  assert.equal(call.open, false);
  assert.equal(call.url, undefined, 'the link is never in a list');

  const tooEarly = await get(`/bookings/${far.body.bookingId}/join`, client);
  assert.equal(tooEarly.res.status, 409);
  assert.equal(tooEarly.body.error.code, 'JOIN_NOT_OPEN');
  assert.equal((await get(`/bookings/${far.body.bookingId}/join`, stranger)).res.status, 404, 'outsiders get nothing');

  // A session that starts in 5 minutes is inside the window; with no Google Meet configured that is reported honestly.
  const soon = await post('/bookings', { consultantId: 'c-priya', applicationId: appId, sessionType: 'standard', slotISO: new Date(Date.now() + 5 * 60_000).toISOString() }, client);
  const noProvider = await get(`/bookings/${soon.body.bookingId}/join`, client);
  assert.equal(noProvider.res.status, 503);
  assert.equal(noProvider.body.error.code, 'MEETING_PROVIDER_NOT_CONFIGURED');
  assert.equal((await get(`/bookings/${soon.body.bookingId}/join`, consultant)).res.status, 503, 'the consultant is allowed too — same honest answer');

  // Now with a (fake) Google backend: the Meet room is created once and the same link is given to both sides.
  const { createServer } = await import('node:http');
  let created = 0;
  const fake = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url === '/token') return void res.end(JSON.stringify({ access_token: 'fake-token' }));
      if (req.url?.includes('/events')) {
        created += 1;
        const body = JSON.parse(raw);
        assert.ok(body.conferenceData.createRequest.conferenceSolutionKey.type === 'hangoutsMeet');
        return void res.end(JSON.stringify({ id: 'evt-1', hangoutLink: 'https://meet.google.com/abc-defg-hij' }));
      }
      res.statusCode = 404; res.end('{}');
    });
  });
  await new Promise<void>((r) => fake.listen(0, '127.0.0.1', () => r()));
  const fakePort = (fake.address() as AddressInfo).port;
  Object.assign(process.env, { GOOGLE_MEET_CLIENT_ID: 'id', GOOGLE_MEET_CLIENT_SECRET: 'secret', GOOGLE_MEET_REFRESH_TOKEN: 'refresh', GOOGLE_OAUTH_URL: `http://127.0.0.1:${fakePort}/token`, GOOGLE_CALENDAR_API_URL: `http://127.0.0.1:${fakePort}` });
  try {
    const first = await get(`/bookings/${soon.body.bookingId}/join`, client);
    assert.equal(first.res.status, 200);
    assert.equal(first.body.url, 'https://meet.google.com/abc-defg-hij');
    const second = await get(`/bookings/${soon.body.bookingId}/join`, consultant);
    assert.equal(second.body.url, first.body.url, 'both sides get the same room');
    assert.equal(created, 1, 'the room was created exactly once');
  } finally {
    for (const k of ['GOOGLE_MEET_CLIENT_ID', 'GOOGLE_MEET_CLIENT_SECRET', 'GOOGLE_MEET_REFRESH_TOKEN', 'GOOGLE_OAUTH_URL', 'GOOGLE_CALENDAR_API_URL']) delete process.env[k];
    fake.close();
  }
});

test('Face verification — one face per account, real thresholds, only the owner can read the template', async () => {
  const me = await registerFresh('face');
  const someone = await registerFresh('face2');
  const feature = 'f'.repeat(128);

  assert.equal((await get('/face/status', me)).body.enrolled, false);
  assert.equal((await get('/face/template', me)).res.status, 404);
  assert.equal((await post('/face/enroll', { faceFeature: feature, passportSimilarity: 0.95, liveness: 0.9, steps: ['blink'] }, me)).res.status, 400, 'needs at least two liveness steps');

  const spoof = await post('/face/enroll', { faceFeature: feature, passportSimilarity: 0.95, liveness: 0.2, steps: ['blink', 'turn_left'] }, me);
  assert.equal(spoof.res.status, 422);
  assert.equal(spoof.body.error.code, 'LIVENESS_FAILED');
  const mismatch = await post('/face/enroll', { faceFeature: feature, passportSimilarity: 0.31, liveness: 0.9, steps: ['blink', 'turn_left'] }, me);
  assert.equal(mismatch.res.status, 422);
  assert.equal(mismatch.body.error.code, 'FACE_MISMATCH');
  assert.equal((await get('/face/status', me)).body.enrolled, false, 'failed attempts store nothing');

  const ok = await post('/face/enroll', { faceFeature: feature, passportSimilarity: 92, liveness: 88, steps: ['blink', 'turn_left', 'turn_right'] }, me); // 0-100 scores are normalised
  assert.equal(ok.res.status, 201);
  assert.ok(Math.abs(ok.body.passportSimilarity - 0.92) < 1e-9);
  const status = await get('/face/status', me);
  assert.equal(status.body.verifiedBadge, true);
  assert.equal(status.body.faceFeature, undefined, 'the template is never in the status');

  const again = await post('/face/enroll', { faceFeature: 'a'.repeat(128), passportSimilarity: 0.99, liveness: 0.99, steps: ['blink', 'turn_left'] }, me);
  assert.equal(again.res.status, 409, 'a different face cannot replace the enrolled one');
  assert.equal(again.body.error.code, 'FACE_ALREADY_ENROLLED');

  assert.equal((await get('/face/template', me)).body.faceFeature, feature);
  assert.equal((await get('/face/template', someone)).res.status, 404, 'another account has no template and cannot read mine');

  assert.equal((await post('/face/verified', { similarity: 0.2, liveness: 0.9 }, me)).res.status, 422, 'a different person fails the returning check');
  assert.equal((await post('/face/verified', { similarity: 0.9, liveness: 0.9 }, me)).res.status, 200);
  assert.equal((await post('/face/verified', { similarity: 0.9, liveness: 0.9 }, someone)).res.status, 404);

  assert.equal((await del('/admin/face/x', me)).res.status, 403, 'only a platform admin can reset a face');
});

test('Analysis can be limited to the verified applicant (FACE_REQUIRED_FOR_AUDIT)', async () => {
  const me = await registerFresh('gate');
  const app1 = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, me);
  const appId = app1.body.application.id as string;
  const audit = () => post('/audit', { applicationId: appId, documentId: `${appId}-bank`, documentType: 'bank', extractedText: 'STATEMENT OF ACCOUNT Balance Debit Credit Account IFSC' }, me);
  process.env.FACE_REQUIRED_FOR_AUDIT = 'true';
  try {
    const blocked = await audit();
    assert.equal(blocked.res.status, 403);
    assert.equal(blocked.body.error.code, 'FACE_VERIFICATION_REQUIRED');
    await post('/face/enroll', { faceFeature: 'e'.repeat(128), passportSimilarity: 0.9, liveness: 0.9, steps: ['blink', 'turn_left'] }, me);
    assert.equal((await audit()).res.status, 202, 'a verified applicant can analyse');
  } finally {
    delete process.env.FACE_REQUIRED_FOR_AUDIT;
  }
});

test('Passport data read on the phone is kept and shown to a consultant only when documents are shared', async () => {
  const consultant = await demoToken('consultant');
  const client = await registerFresh('pp');
  const app1 = await post('/applications', { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' }, client);
  const appId = app1.body.application.id as string;
  const booking = await post('/bookings', { consultantId: 'c-priya', applicationId: appId, sessionType: 'standard', slotISO: '2030-07-01T06:00:00.000Z' }, client);
  // Exactly the text a real device's OCR returned for the ICAO specimen (fillers collapsed/misread).
  const text = 'PASSPORT\nP<UTOERIKSSON<<ANNA<MARIAK<\u00ab\u00ab\u00ab\u00ab\nL898902C36UTO7408122F3204153<<<';
  const audited = await post('/audit', { applicationId: appId, documentId: `${appId}-passport`, documentType: 'passport', extractedText: text }, client);
  assert.equal(audited.res.status, 202);

  await post('/access-grants', { applicationId: appId, consultantId: 'c-priya', categories: ['documents'], expiresAt: '2031-01-01T00:00:00.000Z', acceptedTerms: true }, client);
  const view = await get(`/consultant/appointments/${booking.body.bookingId}/case`, consultant);
  assert.equal(view.res.status, 200);
  assert.equal(view.body.passportData.surname, 'ERIKSSON');
  assert.equal(view.body.passportData.givenNames, 'ANNA MARIA');
  assert.equal(view.body.passportData.expiryDate, '2032-04-15');
  assert.equal(view.body.profile, undefined, 'profile was not shared');
});

test('Admin can link a login to a consultant profile — that login becomes a consultant', async () => {
  const admin = await demoToken('platform_admin');
  const email = `link-${Date.now()}@example.com`;
  const reg = await post('/auth/register', { name: 'Link Me', email, password: 'Sup3rSecret!x' });
  assert.equal(reg.res.status, 201);
  assert.deepEqual(reg.body.user.roles, ['consumer']);
  assert.equal((await get('/consultant/appointments', reg.body.token)).res.status, 403, 'not a consultant yet');

  assert.equal((await put('/admin/consultant-link', { email, consultantId: 'c-omar' }, reg.body.token)).res.status, 403, 'only a platform admin can link');
  assert.equal((await put('/admin/consultant-link', { email, consultantId: 'c-nobody' }, admin)).res.status, 404, 'unknown consultant profile');
  assert.equal((await put('/admin/consultant-link', { email, consultantId: 'c-omar' }, admin)).res.status, 200);

  const login = await post('/auth/session', { email, password: 'Sup3rSecret!x' });
  assert.ok(login.body.user.roles.includes('consultant') && login.body.user.roles.includes('consumer'));
  const me = await get('/consultant/me', login.body.token);
  assert.equal(me.body.consultantId, 'c-omar');
  assert.equal((await get('/consultant/appointments', login.body.token)).res.status, 200);
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

test('POST /auth/register — two accounts with a long shared email prefix get different uids and never see each other\'s data', async () => {
  // Regression test: uid used to be `user-${base64url(email).slice(0,12)}`,
  // which only encodes the email's first ~9 bytes. "sharedprefix-a@x.com" and
  // "sharedprefix-b@x.com" share a 13-character prefix, so the two accounts
  // used to collide onto the exact same uid and silently merge their data.
  const stamp = Date.now();
  const a = await post('/auth/register', { name: 'Prefix A', email: `sharedprefix-a-${stamp}@example.com`, password: 'SecurePass123' });
  const b = await post('/auth/register', { name: 'Prefix B', email: `sharedprefix-b-${stamp}@example.com`, password: 'SecurePass123' });
  assert.equal(a.res.status, 201);
  assert.equal(b.res.status, 201);
  assert.notEqual(a.body.user.uid, b.body.user.uid, 'different accounts must never collide onto the same uid');

  const createdA = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01', applicantName: 'A only' }, a.body.token);
  assert.equal(createdA.res.status, 201);
  const listB = await get('/applications', b.body.token);
  assert.equal(listB.body.applications.length, 0, "B must not see A's applications");
});

test('POST /auth/forgot-password — issues a reset link for a real account and it actually resets the password', async () => {
  const email = `resettest${Date.now()}@example.com`;
  await post('/auth/register', { name: 'Reset Test', email, password: 'OriginalPass123' });

  const { res: forgotRes, body: forgotBody } = await post('/auth/forgot-password', { email });
  assert.equal(forgotRes.status, 200);
  assert.ok(forgotBody.devResetUrl, 'dev mode should surface the reset link');
  const token = new URL(forgotBody.devResetUrl).searchParams.get('token');
  assert.ok(token, 'reset URL should carry a token');

  const { res: resetRes } = await post('/auth/reset-password', { token, newPassword: 'BrandNewPass456' });
  assert.equal(resetRes.status, 200);

  // Old password no longer works, new one does.
  const oldLogin = await post('/auth/session', { email, password: 'OriginalPass123' });
  assert.equal(oldLogin.res.status, 401);
  const newLogin = await post('/auth/session', { email, password: 'BrandNewPass456' });
  assert.equal(newLogin.res.status, 201);
});

test('POST /auth/forgot-password — unknown email still returns 200 (no account enumeration)', async () => {
  const { res, body } = await post('/auth/forgot-password', { email: 'no-such-account@example.com' });
  assert.equal(res.status, 200);
  assert.equal(body.devResetUrl, undefined);
});

test('POST /auth/reset-password — rejects an invalid or expired token', async () => {
  const { res, body } = await post('/auth/reset-password', { token: 'not-a-real-token', newPassword: 'WhateverPass123' });
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'INVALID_TOKEN');
});

test('POST /auth/reset-password — reused token is rejected the second time', async () => {
  const email = `resetreuse${Date.now()}@example.com`;
  await post('/auth/register', { name: 'Reset Reuse', email, password: 'OriginalPass123' });
  const { body: forgotBody } = await post('/auth/forgot-password', { email });
  const token = new URL(forgotBody.devResetUrl).searchParams.get('token');

  const first = await post('/auth/reset-password', { token, newPassword: 'FirstNewPass123' });
  assert.equal(first.res.status, 200);
  const second = await post('/auth/reset-password', { token, newPassword: 'SecondNewPass123' });
  assert.equal(second.res.status, 400);
});

test('POST /auth/forgot-password — devResetUrl is gated on ENABLE_DEV_AUTH_BYPASS, not on AI_MOCK', async () => {
  // Regression test: this leak (real reset URL handed back in the API
  // response) used to be gated on `AI_MOCK === 'true'`, which
  // .env.production.example documents leaving set until a real AI key is
  // added — meaning the recommended starting production config leaked live
  // password-reset links to anyone. AI_MOCK stays 'true' for this whole
  // suite; only toggling ENABLE_DEV_AUTH_BYPASS off should suppress the leak.
  const email = `resetgate${Date.now()}@example.com`;
  await post('/auth/register', { name: 'Reset Gate', email, password: 'OriginalPass123' });
  process.env.ENABLE_DEV_AUTH_BYPASS = 'false';
  try {
    const { res, body } = await post('/auth/forgot-password', { email });
    assert.equal(res.status, 200);
    assert.equal(body.devResetUrl, undefined, 'must not leak a live reset URL when the bypass flag is off, regardless of AI_MOCK');
  } finally {
    process.env.ENABLE_DEV_AUTH_BYPASS = 'true';
  }
});

test('POST /auth/verify-email — does not accept verification with no code on file when ENABLE_DEV_AUTH_BYPASS is off', async () => {
  process.env.ENABLE_DEV_AUTH_BYPASS = 'false';
  try {
    const { res, body } = await post('/auth/verify-email', { email: `neververified${Date.now()}@example.com`, code: '000000' });
    assert.equal(res.status, 400);
    assert.equal(body.error.code, 'INVALID_OTP');
  } finally {
    process.env.ENABLE_DEV_AUTH_BYPASS = 'true';
  }
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

test('POST /auth/delete-account — actually persists a real, checkable record, and logging back in cancels it', async () => {
  // Regression test: this used to reply "scheduled" and write nothing
  // anywhere — no record existed to check, and "cancel by logging in" wasn't
  // actually true because nothing was tracking a pending deletion at all.
  const email = `deleteme${Date.now()}@example.com`;
  const password = 'SecurePass123';
  const { body: registerBody } = await post('/auth/register', { name: 'Delete Me', email, password });
  const token = registerBody.token;

  const { res: deleteRes, body: deleteBody } = await post('/auth/delete-account', {}, token);
  assert.equal(deleteRes.status, 200);
  assert.ok(deleteBody.scheduledFor, 'a real scheduledFor date should come back');

  const { body: statusBody } = await get('/auth/delete-account/status', token);
  assert.equal(statusBody.pending, true, 'the deletion request must actually be on file');
  assert.equal(statusBody.record.uid, registerBody.user.uid);

  // Logging back in should cancel it, exactly as the delete-account message promises.
  await post('/auth/session', { email, password });
  const { body: afterLoginStatus } = await get('/auth/delete-account/status', token);
  assert.equal(afterLoginStatus.pending, false, 'logging back in must cancel the pending deletion');
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

// ─── Knowledge base (admin-managed requirements) ───────────────────────────────

test('GET /admin/knowledge-base — requires platform_admin', async () => {
  const consumerToken = await demoToken('consumer');
  const { res: unauthed } = await get('/admin/knowledge-base');
  assert.equal(unauthed.status, 401);
  const { res: forbidden } = await get('/admin/knowledge-base', consumerToken);
  assert.equal(forbidden.status, 403);
});

test('PUT /admin/knowledge-base/:country — a real edit changes what /requirements actually returns, and DELETE reverts it', async () => {
  const adminToken = await demoToken('platform_admin');
  const country = 'Testlandia';

  // Before any override, this made-up country falls back to the generic
  // default dataset — definitely not our custom fee string.
  const { body: before } = await get(`/requirements?country=${country}`);
  assert.notEqual(before.fees, 'TSL 1 (test fixture fee)');

  const override = {
    coverageStatus: 'supported',
    requirements: [{ id: 'req-tsl-passport', title: 'Valid passport', description: 'Test fixture requirement.', required: true, satisfied: false, sourceIds: ['src-tsl'] }],
    fees: 'TSL 1 (test fixture fee)',
    processingTime: '1 business day',
    sourceUrls: [{ id: 'src-tsl', label: 'Testlandia MFA', url: 'https://example.com/testlandia' }]
  };
  const { res: putRes, body: putBody } = await put(`/admin/knowledge-base/${country}`, override, adminToken);
  assert.equal(putRes.status, 200);
  assert.equal(putBody.requirements.fees, 'TSL 1 (test fixture fee)');

  // The override must be immediately visible on the real public read path —
  // this is the whole point, no deploy needed for it to take effect.
  const { body: afterPut } = await get(`/requirements?country=${country}`);
  assert.equal(afterPut.fees, 'TSL 1 (test fixture fee)');

  const { body: listBody } = await get('/admin/knowledge-base', adminToken);
  assert.equal(listBody.overrides[country]?.fees, 'TSL 1 (test fixture fee)');

  const { res: delRes } = await del(`/admin/knowledge-base/${country}`, adminToken);
  assert.equal(delRes.status, 200);

  const { body: afterDelete } = await get(`/requirements?country=${country}`);
  assert.notEqual(afterDelete.fees, 'TSL 1 (test fixture fee)', 'deleting the override should revert to the default dataset');
});

test('Knowledge base verification — only an explicit markVerified stamps who/when, and later edits keep the stamp', async () => {
  const adminToken = await demoToken('platform_admin');
  const country = 'Verifyland';
  const override = {
    coverageStatus: 'supported',
    requirements: [{ id: 'req-vl-1', title: 'Valid passport', description: 'Fixture.', required: true, satisfied: false, sourceIds: ['src-vl'], why: 'Fixture reason.' }],
    fees: 'VL 1', processingTime: '1 day',
    sourceUrls: [{ id: 'src-vl', label: 'Verifyland MFA', url: 'https://example.com/vl' }]
  };

  const first = await put(`/admin/knowledge-base/${country}`, override, adminToken);
  assert.equal(first.res.status, 200);
  assert.equal(first.body.requirements.verification.status, 'unverified');
  assert.equal(first.body.requirements.requirements[0].why, 'Fixture reason.');

  const verified = await put(`/admin/knowledge-base/${country}`, { ...override, markVerified: true }, adminToken);
  assert.equal(verified.body.requirements.verification.status, 'verified');
  assert.ok(Date.parse(verified.body.requirements.verification.verifiedAt) > Date.now() - 60_000);
  assert.ok(verified.body.requirements.verification.verifiedBy, 'records who verified');

  // A later edit that doesn't re-attest keeps the existing stamp (neither re-verifies nor un-verifies).
  const edited = await put(`/admin/knowledge-base/${country}`, { ...override, fees: 'VL 2' }, adminToken);
  assert.equal(edited.body.requirements.verification.status, 'verified');
  assert.equal(edited.body.requirements.verification.verifiedAt, verified.body.requirements.verification.verifiedAt);

  // A client cannot forge a stamp by sending its own verification fields.
  const forged = await put(`/admin/knowledge-base/Forgeland`, { ...override, verification: { status: 'verified', verifiedAt: '2020-01-01T00:00:00.000Z', verifiedBy: 'me' } }, adminToken);
  assert.equal(forged.body.requirements.verification.status, 'unverified');

  await del(`/admin/knowledge-base/${country}`, adminToken);
  await del(`/admin/knowledge-base/Forgeland`, adminToken);
});

test('PUT /admin/knowledge-base/:country — rejects an invalid payload instead of silently accepting bad data', async () => {
  const adminToken = await demoToken('platform_admin');
  const { res, body } = await put('/admin/knowledge-base/Testlandia', { fees: 'only a fee, missing everything else' }, adminToken);
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_FAILED');
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

test('GET /documents — reflects a real audit, not a fabricated count-based list', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Germany', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  // Before any upload, the passport row must be honestly "Missing".
  const before = await get(`/documents?applicationId=${applicationId}`, token);
  const beforeDoc = before.body.documents.find((d: any) => d.type === 'passport');
  assert.equal(beforeDoc.status, 'Missing');
  assert.equal(beforeDoc.score, 0);

  const richPassportText = `PASSPORT\nSURNAME: DOE\nGIVEN NAME: JANE\nP<EXMDOE<<JANE<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`;
  await post('/upload-slots', { applicationId, documentId: 'doc-real-passport' }, token);
  const audit = await post('/audit', { applicationId, documentId: 'doc-real-passport', documentType: 'passport', extractedText: richPassportText }, token);
  assert.equal(audit.res.status, 202);

  const after = await get(`/documents?applicationId=${applicationId}`, token);
  const afterDoc = after.body.documents.find((d: any) => d.type === 'passport');
  assert.equal(afterDoc.status, 'Audited');
  assert.equal(afterDoc.id, 'doc-real-passport', 'the real documentId should be surfaced, not a synthetic one');
  assert.equal(afterDoc.score, audit.body.result.score, 'the real audit score must be shown, not a hardcoded per-type constant');

  // A document type outside the 6 known templates must still show up, not be dropped.
  await post('/upload-slots', { applicationId, documentId: 'doc-real-other' }, token);
  const otherAudit = await post('/audit', { applicationId, documentId: 'doc-real-other', documentType: 'other', extractedText: 'Some supporting letter with enough text to score.' }, token);
  const afterOther = await get(`/documents?applicationId=${applicationId}`, token);
  assert.ok(afterOther.body.documents.some((d: any) => d.id === 'doc-real-other' && d.score === otherAudit.body.result.score), 'an unrecognized document type must still appear, not be silently dropped');
});

// ─── Push notifications ────────────────────────────────────────────────────────

test('POST /device-tokens — requires auth', async () => {
  const { res } = await post('/device-tokens', { token: 'abc', platform: 'android' });
  assert.equal(res.status, 401);
});

test('POST /device-tokens — rejects a missing token instead of silently accepting it', async () => {
  const token = await demoToken('consumer');
  const { res } = await post('/device-tokens', { platform: 'android' }, token);
  assert.equal(res.status, 400);
});

test('POST /device-tokens — accepts a real registration', async () => {
  const token = await demoToken('consumer');
  const { res, body } = await post('/device-tokens', { token: 'fake-fcm-token-for-test', platform: 'android' }, token);
  assert.equal(res.status, 201);
  assert.equal(body.ok, true);
});

test('sendPushToUser — reports "skipped" honestly, never a fake "sent"/"queued", when no Firebase app is configured', async () => {
  // This test environment runs with FIRESTORE_DISABLED=true, so no real
  // Firebase app exists — sendPushToUser must say so plainly rather than
  // claiming to have sent (or queued) something nothing is actually processing.
  const result = await sendPushToUser({ userId: 'demo-consumer', title: 'Test', body: 'Test body' });
  assert.equal(result.status, 'skipped');
  assert.equal(result.messageId, 'push-not-configured');
});

test('POST /audit — triggers the real push side effect without ever failing the audit itself', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Spain', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;
  const { res } = await post('/audit', { applicationId, documentId: 'doc-push-test', documentType: 'passport', extractedText: 'short' }, token);
  assert.equal(res.status, 202, 'the audit itself must succeed even though the push it triggers is a no-op in this environment');
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

test('POST /audit — score reflects the real extracted text, not a canned constant', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  // Includes a real, complete two-line MRZ (published ICAO Doc 9303 Part 3
  // worked example) — not just the name line — since the detector now
  // requires the full structural match (see documentAnalysis.ts) rather
  // than a loose shape-only regex that a non-passport photo could satisfy
  // by accident (a real bug caught in production: a photo of a laptop
  // wallpaper matched the old regex and scored as "MRZ detected, 75%").
  const richPassportText = `PASSPORT\nREPUBLIC OF EXAMPLE\nSURNAME: DOE\nGIVEN NAME: JANE\nNATIONALITY: EXAMPLELAND\nDATE OF BIRTH: 01/01/1990\nP<UTODOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10\nDATE OF EXPIRY: 01/01/2031`;
  const { res: richRes, body: richBody } = await post('/audit', {
    applicationId, documentId: 'doc-audit-real-rich', documentType: 'Passport', extractedText: richPassportText
  }, token);
  assert.equal(richRes.status, 202);
  assert.ok(richBody.result.score > 50, `expected a high score for rich passport text, got ${richBody.result.score}`);
  assert.ok(richBody.result.findings.some((f: any) => f.id === 'mrz-detected'), 'expected the MRZ pattern to be detected');

  const { res: emptyRes, body: emptyBody } = await post('/audit', {
    applicationId, documentId: 'doc-audit-real-empty', documentType: 'Passport'
  }, token);
  assert.equal(emptyRes.status, 202);
  assert.equal(emptyBody.result.status, 'issues_to_fix');
  assert.ok(emptyBody.result.findings.some((f: any) => f.id === 'ocr-unavailable'), 'expected an honest "OCR unavailable" finding, not a fake pass');
  assert.notEqual(richBody.result.score, emptyBody.result.score, 'score must vary with actual document content');
});

test('POST /audit — verifies real MRZ check digits (ICAO 9303), catching a tampered date that keyword/shape matching alone would miss', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  // Published ICAO Doc 9303 Part 3 worked example — a genuinely valid MRZ,
  // not a made-up one, so a "pass" here means the real check-digit math ran.
  const validMrzText = `PASSPORT\nSURNAME DOE\nGIVEN NAMES JOHN\nP<UTODOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10`;
  const { body: validBody } = await post('/audit', { applicationId, documentId: 'doc-mrz-valid', documentType: 'passport', extractedText: validMrzText }, token);
  const validFinding = validBody.result.findings.find((f: any) => f.id === 'mrz-checksum-valid');
  assert.ok(validFinding, 'expected a real checksum-valid finding for an authentic MRZ');
  assert.equal(validFinding.severity, 'pass');

  // Same line with the birth-date check digit flipped (2 -> 9) — everything
  // else about the text still "looks like" a passport (keywords, MRZ shape),
  // so only real check-digit math catches this, not pattern matching.
  const tamperedMrzText = validMrzText.replace('7408122', '7408129');
  const { body: tamperedBody } = await post('/audit', { applicationId, documentId: 'doc-mrz-tampered', documentType: 'passport', extractedText: tamperedMrzText }, token);
  const tamperedFinding = tamperedBody.result.findings.find((f: any) => f.id === 'mrz-checksum-mismatch');
  assert.ok(tamperedFinding, 'expected a real checksum-mismatch finding for a tampered MRZ');
  assert.equal(tamperedFinding.severity, 'red_flag');
  assert.ok(tamperedFinding.description.includes('date of birth'), 'should name the specific field that failed');
  assert.ok(tamperedBody.result.score < validBody.result.score, 'a checksum mismatch must lower the score, not just add an ignorable note');
});

test('POST /audit — a non-passport photo does not falsely register as "MRZ detected"', async () => {
  // Real bug found in production: uploading a photo of a laptop wallpaper
  // (labeled as a passport) got OCR'd into some incidental run of
  // uppercase/digit characters, and the old detector — a loose regex
  // matching ANY 20-44 character run of A-Z0-9< — confidently reported
  // "Machine-readable zone detected, 75% confidence" purely from that
  // coincidence, scoring the wallpaper 55/100. The detector must now only
  // claim MRZ detection when the stricter structural parser (real DOB/
  // expiry digit positions, ICAO check-digit shape) actually matches.
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  const wallpaperOcrNoise = `HDMI1 DISPLAYPORT USB-C 4K60HZ ABCDEFGHIJKLMNOPQRST1234567890`;
  const { body } = await post('/audit', {
    applicationId, documentId: 'doc-not-a-passport', documentType: 'passport', extractedText: wallpaperOcrNoise
  }, token);
  assert.ok(!body.result.findings.some((f: any) => f.id === 'mrz-detected'), 'must not claim MRZ detection from incidental OCR noise that merely matches the character shape');
  assert.ok(body.result.findings.some((f: any) => f.id === 'passport-mismatch'), 'expected an honest "doesn\'t look like a passport" finding instead');
});

test('POST /audit — with an image attached but no AI configured (AI_MOCK=true), falls back to the OCR-text heuristic instead of calling out or crashing', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  const { res, body } = await post('/audit', {
    applicationId, documentId: 'doc-audit-image-no-ai', documentType: 'Passport',
    extractedText: 'PASSPORT REPUBLIC OF EXAMPLE',
    imageBase64: Buffer.from('not a real image, just proving the path is safe').toString('base64'),
    mimeType: 'image/jpeg'
  }, token);
  assert.equal(res.status, 202);
  assert.equal(typeof body.result.score, 'number');
  assert.ok(Array.isArray(body.result.findings));
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

test('POST /chat — "what\'s my score" is answered instantly from real data, never an AI call', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  const { res, body } = await post('/chat', { applicationId, message: "what's my score?" }, token);
  assert.equal(res.status, 200);
  assert.ok(/\d+\/100/.test(body.reply), 'expected the real readiness score to appear in the reply');
  assert.equal(body.escalate, false);
});

test('POST /chat — "how do I apply" is answered instantly from the real requirements knowledge base', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-09-01' }, token);
  const applicationId = create.body.application.id;

  const { res, body } = await post('/chat', { applicationId, message: 'how do I apply?' }, token);
  assert.equal(res.status, 200);
  assert.ok(body.reply.length > 20);
  assert.equal(body.escalate, false);
});

test('POST /chat — is rate limited (regression: this had NO limiter at all, so every message — a real, billed AI call once AI_MOCK=false — could be sent as fast as the network allows with zero cap)', async () => {
  const token = await demoToken('consumer');
  process.env.RATE_LIMIT_DISABLED = 'false';
  try {
    let sawRateLimited = false;
    for (let i = 0; i < 65; i += 1) {
      const { res } = await post('/chat', { message: 'What documents do I need for a Schengen visa?' }, token);
      if (res.status === 429) {
        sawRateLimited = true;
        break;
      }
    }
    assert.ok(sawRateLimited, 'expected a 429 well within 65 requests given the chat limiter caps at 60 per window');
  } finally {
    process.env.RATE_LIMIT_DISABLED = 'true';
  }
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
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-11-01', applicantName: 'Booking Test Applicant' }, token);
  const { res, body } = await post('/bookings', {
    consultantId: 'c-priya',
    applicationId: create.body.application.id,
    sessionType: 'deep-dive'
  }, token);
  assert.equal(res.status, 201);
  assert.ok(body.bookingId.startsWith('booking-'));
  assert.ok(body.calendlyUrl.includes('calendly.com'));
});

test('POST /bookings — rejects an applicationId the caller does not own (IDOR)', async () => {
  const ownerToken = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Germany', visaType: 'Tourist', intendedFrom: '2026-11-01', applicantName: 'Owner' }, ownerToken);

  const attacker = await post('/auth/register', { name: 'Booking Attacker', email: `bookingattacker${Date.now()}@example.com`, password: 'SecurePass123' });
  const { res, body } = await post('/bookings', {
    consultantId: 'c-priya',
    applicationId: create.body.application.id,
    sessionType: 'deep-dive'
  }, attacker.body.token);
  assert.equal(res.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('GET /booking/slots/:consultantId — reflects a real booked slot, not a consultantId-hash fake', async () => {
  // Regression test: this used to mark slots "taken" from a character-code
  // hash of the consultantId string, with zero relationship to real bookings
  // — meaning double-booking the same real slot was always possible.
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-11-01', applicantName: 'Slot Test Applicant' }, token);

  // 10:00 AM GST on a fixed future date -> 06:00:00.000Z
  const slotISO = '2026-11-05T06:00:00.000Z';
  const booking = await post('/bookings', { consultantId: 'c-elena', applicationId: create.body.application.id, sessionType: 'standard', slotISO }, token);
  assert.equal(booking.res.status, 201);

  const { res, body } = await get('/booking/slots/c-elena?date=2026-11-05');
  assert.equal(res.status, 200);
  assert.ok(body.takenSlots.includes('10:00 AM'), 'the real booked GST time must show as taken');

  // A different consultant, and a different day, must NOT show it as taken.
  const otherConsultant = await get('/booking/slots/c-priya?date=2026-11-05');
  assert.ok(!otherConsultant.body.takenSlots.includes('10:00 AM'), 'a booking must not leak into a different consultant\'s availability');
  const otherDay = await get('/booking/slots/c-elena?date=2026-11-06');
  assert.ok(!otherDay.body.takenSlots.includes('10:00 AM'), 'a booking must not leak into a different day\'s availability');
});

// ─── Role-gated endpoints ─────────────────────────────────────────────────────

test('GET /admin/users and GET /admin/audit-log — the seeded demo account/entries are marked, not presented as real activity', async () => {
  const adminToken = await demoToken('platform_admin');

  const users = await get('/admin/users', adminToken);
  assert.equal(users.res.status, 200);
  const demoUser = users.body.users.find((u: any) => u.email === 'sarah.mathew@example.com');
  assert.ok(demoUser, 'the demo account should still be listed');
  assert.equal(demoUser.source, 'seed', 'must be marked as seeded, not indistinguishable from a real signup');

  const log = await get('/admin/audit-log', adminToken);
  assert.equal(log.res.status, 200);
  const seededEntries = log.body.entries.filter((e: any) => e.id.startsWith('al-00'));
  assert.ok(seededEntries.length > 0, 'the canned demo entries should still be listed');
  for (const entry of seededEntries) {
    assert.equal(entry.source, 'seed', `entry ${entry.id} must be marked as seeded, not presented as real activity`);
  }
});

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

test('POST /reports/:docId/unlock — fails closed instead of accepting any token as a valid payment', async () => {
  // Regression test: this used to accept any non-"invalid" string as a valid
  // payment and unlock the report for free — a real free-unlock bug, not a
  // dev convenience (it ran unconditionally, in every environment).
  const token = await demoToken('consumer');
  const { res, body } = await post('/reports/doc-1/unlock', { paymentToken: 'anything-at-all' }, token);
  assert.equal(res.status, 501, 'must not unlock without a real payment processor configured');
  assert.equal(body.error.code, 'NOT_IMPLEMENTED');
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
    categories: ['requirements'], acceptedTerms: true, expiresAt: '2026-12-01T00:00:00.000Z'
  });
  assert.equal(res.status, 401);
});

test('POST /access-grants — creates grant when authenticated', async () => {
  const token = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-12-01', applicantName: 'Grant Test Applicant' }, token);
  const { res, body } = await post('/access-grants', {
    applicationId: create.body.application.id,
    consultantId: 'c-priya',
    categories: ['requirements', 'audit_findings'],
    acceptedTerms: true, expiresAt: '2026-12-01T00:00:00.000Z'
  }, token);
  assert.equal(res.status, 201);
  assert.equal(body.status, 'active');
  assert.ok(body.grantId.startsWith('grant-'));
});

test('POST /access-grants — rejects an applicationId the caller does not own (IDOR)', async () => {
  const ownerToken = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Spain', visaType: 'Tourist', intendedFrom: '2026-12-01', applicantName: 'Owner' }, ownerToken);

  const attacker = await post('/auth/register', { name: 'Grant Attacker', email: `grantattacker${Date.now()}@example.com`, password: 'SecurePass123' });
  const { res, body } = await post('/access-grants', {
    applicationId: create.body.application.id,
    consultantId: 'c-priya',
    categories: ['documents', 'contact'],
    acceptedTerms: true, expiresAt: '2026-12-01T00:00:00.000Z'
  }, attacker.body.token);
  assert.equal(res.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('GET /access-grants — a user can see and revoke their own grants, never someone else\'s', async () => {
  // Regression test: there was no way at all to list a grant back — the
  // mobile profile screen claimed "View and revoke consultant access from
  // your profile" next to a dead, unclickable row.
  const ownerToken = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Japan', visaType: 'Tourist', intendedFrom: '2026-12-01', applicantName: 'Grant List Owner' }, ownerToken);
  const grant = await post('/access-grants', {
    applicationId: create.body.application.id,
    consultantId: 'c-priya',
    categories: ['documents'],
    acceptedTerms: true, expiresAt: '2026-12-31T00:00:00.000Z'
  }, ownerToken);
  assert.equal(grant.res.status, 201);

  const other = await post('/auth/register', { name: 'Other User', email: `otheruser${Date.now()}@example.com`, password: 'SecurePass123' });
  const otherList = await get('/access-grants', other.body.token);
  assert.equal(otherList.res.status, 200);
  assert.ok(!otherList.body.grants.some((g: any) => g.grantId === grant.body.grantId), 'must never leak another user\'s grants');

  const mine = await get('/access-grants', ownerToken);
  assert.equal(mine.res.status, 200);
  const found = mine.body.grants.find((g: any) => g.grantId === grant.body.grantId);
  assert.ok(found, 'the real grant must be listed back to the user who created it');
  assert.equal(found.consultantName, 'Priya Sharma', 'must show the real consultant name, not just the raw id');
  assert.equal(found.destinationCountry, 'Japan');

  const revoke = await del(`/access-grants/${grant.body.grantId}`, ownerToken);
  assert.equal(revoke.res.status, 200);
  const afterRevoke = await get('/access-grants', ownerToken);
  assert.ok(!afterRevoke.body.grants.some((g: any) => g.grantId === grant.body.grantId), 'a revoked grant must drop out of the list');
});

// ─── Consultant console / HR / employee portal — real data, not fixtures ──────

test('GET /consultant-console — queue reflects a real access grant + real application, not the old hardcoded names', async () => {
  const consumerToken = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Netherlands', visaType: 'Tourist', intendedFrom: '2026-10-01', applicantName: 'Console Test Applicant' }, consumerToken);
  const applicationId = create.body.application.id;

  const grant = await post('/access-grants', {
    applicationId, consultantId: 'c-priya', categories: ['requirements', 'audit_findings'], acceptedTerms: true, expiresAt: '2027-01-01T00:00:00.000Z'
  }, consumerToken);
  assert.equal(grant.res.status, 201);

  const consultantToken = await demoToken('consultant');
  const { res, body } = await get('/consultant-console', consultantToken);
  assert.equal(res.status, 200);
  const entry = body.queue.find((q: any) => q.id === grant.body.grantId);
  assert.ok(entry, 'the real grant must appear in the queue, keyed by its real grantId');
  assert.equal(entry.applicant, 'Console Test Applicant');
  assert.equal(entry.destination, 'Netherlands');
  assert.deepEqual(entry.sharedCategories, ['requirements', 'audit_findings']);
  // The old hardcoded fixture names must be gone.
  assert.ok(!body.queue.some((q: any) => q.applicant === 'Nadia Rahman'), 'fabricated queue entries must not appear');

  await del(`/access-grants/${grant.body.grantId}`, consumerToken);
  const afterRevoke = await get('/consultant-console', consultantToken);
  assert.ok(!afterRevoke.body.queue.some((q: any) => q.id === grant.body.grantId), 'a revoked grant must drop out of the real queue');
});

test('GET /consultant-console — crm reflects real booking count/revenue, not fabricated per-client rows', async () => {
  const consumerToken = await demoToken('consumer');
  const create = await post('/applications', { destinationCountry: 'Italy', visaType: 'Tourist', intendedFrom: '2026-12-01', applicantName: 'CRM Test Applicant' }, consumerToken);
  const before = await get('/consultant-console', await demoToken('consultant'));
  const bookingsBefore = Number(before.body.crm.find((c: any) => c.label === 'Total bookings').value);

  const booking = await post('/bookings', { consultantId: 'c-omar', applicationId: create.body.application.id, sessionType: 'standard' }, consumerToken);
  assert.equal(booking.res.status, 201);

  const after = await get('/consultant-console', await demoToken('consultant'));
  const bookingsAfter = Number(after.body.crm.find((c: any) => c.label === 'Total bookings').value);
  assert.equal(bookingsAfter, bookingsBefore + 1, 'a real booking must increment the real count');
  assert.ok(!after.body.crm.some((c: any) => c.label.includes('Nadia Rahman')), 'fabricated per-client CRM rows must not appear');
});

test('POST /messages + GET /messages — real consultant<->client conversation, with authorization', async () => {
  const clientA = await post('/auth/register', { name: 'Message Client A', email: `msgclienta${Date.now()}@example.com`, password: 'SecurePass123' });
  const clientAToken = clientA.body.token;
  const clientB = await post('/auth/register', { name: 'Message Client B', email: `msgclientb${Date.now()}@example.com`, password: 'SecurePass123' });
  const clientBToken = clientB.body.token;

  const sent = await post('/messages', { consultantId: 'c-elena', text: 'My bank statement is 4 months old — is that too old?' }, clientAToken);
  assert.equal(sent.res.status, 201);
  const threadId = sent.body.message.threadId;
  assert.equal(sent.body.message.senderRole, 'client');

  // A different client has no business reading this thread.
  const forbidden = await get(`/messages?threadId=${threadId}`, clientBToken);
  assert.equal(forbidden.res.status, 403);

  // The client who owns the thread can read it.
  const own = await get(`/messages?threadId=${threadId}`, clientAToken);
  assert.equal(own.res.status, 200);
  assert.equal(own.body.messages.length, 1);

  const consultantToken = await demoToken('consultant');
  const reply = await post('/messages', { threadId, text: 'Yes, please provide a statement from the last 3 months.' }, consultantToken);
  assert.equal(reply.res.status, 201);
  assert.equal(reply.body.message.senderRole, 'consultant');

  const consoleView = await get('/consultant-console', consultantToken);
  const thread = consoleView.body.conversations.find((c: any) => c.id === threadId);
  assert.ok(thread, 'the real thread must appear in the console, not a fabricated conversation list');
  assert.equal(thread.lastMessage, 'Yes, please provide a statement from the last 3 months.');
  assert.equal(thread.status, 'Replied');
});

test('GET /my-conversations — a client can discover a consultant\'s reply (previously had no way to)', async () => {
  // Regression test: sendMessage from a consultant's profile screen promised
  // "they'll reply here soon", but there was no endpoint at all for a client
  // to list their own threads — listThreadsForUser existed on the service
  // but was never wired to a route, so a real reply was permanently
  // invisible to the client who sent the original message.
  const client = await post('/auth/register', { name: 'Conversation Client', email: `myconv${Date.now()}@example.com`, password: 'SecurePass123' });
  const clientToken = client.body.token;

  const before = await get('/my-conversations', clientToken);
  assert.equal(before.res.status, 200);
  assert.equal(before.body.threads.length, 0);

  const sent = await post('/messages', { consultantId: 'c-omar', text: 'Do you handle GCC resident applications to Canada?' }, clientToken);
  assert.equal(sent.res.status, 201);
  const threadId = sent.body.message.threadId;

  const afterSend = await get('/my-conversations', clientToken);
  const threadAfterSend = afterSend.body.threads.find((t: any) => t.threadId === threadId);
  assert.ok(threadAfterSend, 'the real thread must appear in the client\'s own conversation list');
  assert.equal(threadAfterSend.consultantName, 'Omar Haddad', 'must show the real consultant name, not just the raw id');
  assert.equal(threadAfterSend.status, 'Awaiting reply');

  const consultantToken = await demoToken('consultant');
  await post('/messages', { threadId, text: 'Yes — I specialize in exactly that route.' }, consultantToken);

  const afterReply = await get('/my-conversations', clientToken);
  const threadAfterReply = afterReply.body.threads.find((t: any) => t.threadId === threadId);
  assert.equal(threadAfterReply.lastMessage, 'Yes — I specialize in exactly that route.');
  assert.equal(threadAfterReply.status, 'New reply', 'the client must be able to see they got a real reply');
});

test('GET /hr — teams are grouped from real employee profiles, scoped to the HR admin\'s own company (not leaking every company into every hr_admin\'s view)', async () => {
  const hrToken = await demoToken('hr_admin');
  const employer = `Acme Corp ${Date.now()}`;
  // Regression test: getHrPortal() used to return every company's teams
  // mixed together regardless of who asked — a real cross-tenant data leak
  // in a B2B feature. Which company an hr_admin sees is now derived from
  // their OWN profile, the same field everyone else's employer comes from.
  await put('/profile', { employment: { employer, jobTitle: 'HR Manager', annualIncomeUsd: '0' } }, hrToken);

  const empA = await post('/auth/register', { name: 'HR Employee A', email: `hremp-a-${Date.now()}@example.com`, password: 'SecurePass123' });
  const empB = await post('/auth/register', { name: 'HR Employee B', email: `hremp-b-${Date.now()}@example.com`, password: 'SecurePass123' });
  // Field names match what apps/mobile/App.tsx's ProfileEmploymentScreen
  // actually sends (employer/jobTitle/annualIncomeUsd/resumeUploaded/
  // resumeFileName) — not the older, never-actually-sent contractType/
  // employmentLetterUploaded fields this test used to (incorrectly) exercise.
  await put('/profile', { employment: { employer, jobTitle: 'Engineer', annualIncomeUsd: '80000', resumeUploaded: false } }, empA.body.token);
  await put('/profile', { employment: { employer, jobTitle: 'Designer', annualIncomeUsd: '70000', resumeUploaded: false } }, empB.body.token);
  await post('/applications', { destinationCountry: 'Canada', visaType: 'Work', intendedFrom: '2026-11-01' }, empA.body.token);

  // A different company's employee must never appear in this admin's view.
  const otherEmployer = `Globex ${Date.now()}`;
  const empC = await post('/auth/register', { name: 'Other Company Employee', email: `otherco-${Date.now()}@example.com`, password: 'SecurePass123' });
  await put('/profile', { employment: { employer: otherEmployer, jobTitle: 'Analyst', annualIncomeUsd: '50000' } }, empC.body.token);

  const { res, body } = await get('/hr', hrToken);
  assert.equal(res.status, 200);
  const team = body.teams.find((t: any) => t.name === employer);
  assert.ok(team, 'a real team must be derived from real employment.employer values');
  // 3, not 2 — the HR admin's own profile is also at this company (that's
  // literally how the scoping works: which company you see is your own
  // employer), so they correctly show up in their own company's headcount.
  assert.equal(team.members, 3);
  assert.equal(team.openCases, 1, 'only the employee with a non-terminal application counts as an open case');
  assert.ok(!body.teams.some((t: any) => t.name === otherEmployer), 'a different company\'s team must never appear in this admin\'s view');
  assert.ok(!body.teams.some((t: any) => t.name === 'Engineering' && t.members === 12), 'the old hardcoded department fixtures must be gone');
  assert.deepEqual(body.bulkUploads, [], 'bulk uploads must be honestly empty — no such feature exists yet');
});

test('GET /employee — profile and tasks are derived from the real employment profile and real application state', async () => {
  const emp = await post('/auth/register', { name: 'Task Employee', email: `taskemp-${Date.now()}@example.com`, password: 'SecurePass123' });
  const token = emp.body.token;
  const employer = `Globex ${Date.now()}`;
  await put('/profile', {
    personal: { firstName: 'Task', lastName: 'Employee', nationality: 'Kenya', dateOfBirth: '1990-01-01', phone: '+254700000000', gender: 'other' },
    employment: { employer, jobTitle: 'Analyst', annualIncomeUsd: '60000', resumeUploaded: false }
  }, token);
  const create = await post('/applications', { destinationCountry: 'Germany', visaType: 'Work', intendedFrom: '2026-12-01' }, token);
  assert.equal(create.res.status, 201);

  const { res, body } = await get('/employee', token);
  assert.equal(res.status, 200);
  assert.equal(body.profile.company, employer);
  assert.equal(body.profile.homeCountry, 'Kenya');
  assert.ok(body.tasks.some((t: any) => t.id === 'emp-docs'), 'a fresh application with zero documents must surface a real open task');
  assert.ok(!body.tasks.some((t: any) => t.id === 'emp-insurance'), 'the old hardcoded canned tasks must be gone');
});

// ─── Referrals ──────────────────────────────────────────────────────────────

test('GET /referrals + POST /referrals/claim — real validation and persistence, not an unconditional success', async () => {
  const referrer = await post('/auth/register', { name: 'Referrer', email: `referrer-${Date.now()}@example.com`, password: 'SecurePass123' });
  const referrerToken = referrer.body.token;
  const friend = await post('/auth/register', { name: 'Referred Friend', email: `friend-${Date.now()}@example.com`, password: 'SecurePass123' });
  const friendToken = friend.body.token;

  const before = await get('/referrals', referrerToken);
  assert.equal(before.res.status, 200);
  assert.equal(before.body.stats.converted, 0);
  assert.deepEqual(before.body.history, []);
  const { referralCode } = before.body;
  assert.ok(before.body.referralLink.endsWith(`/join?ref=${referralCode}`));

  const badCode = await post('/referrals/claim', { code: 'REF-NOTREAL1' }, friendToken);
  assert.equal(badCode.res.status, 404);

  const selfClaim = await post('/referrals/claim', { code: referralCode }, referrerToken);
  assert.equal(selfClaim.res.status, 400);
  assert.equal(selfClaim.body.error.code, 'SELF_REFERRAL');

  const claim = await post('/referrals/claim', { code: referralCode }, friendToken);
  assert.equal(claim.res.status, 200);
  assert.equal(claim.body.ok, true);

  const duplicateClaim = await post('/referrals/claim', { code: referralCode }, friendToken);
  assert.equal(duplicateClaim.res.status, 409);
  assert.equal(duplicateClaim.body.error.code, 'ALREADY_CLAIMED');

  const after = await get('/referrals', referrerToken);
  assert.equal(after.body.stats.converted, 1);
  assert.equal(after.body.stats.totalEarned, 10);
  assert.equal(after.body.history.length, 1);
  assert.equal(after.body.history[0].name, friend.body.user.email);
});

// ─── 404 ─────────────────────────────────────────────────────────────────────

test('Unknown route returns generic 404', async () => {
  const { res, body } = await get('/this-route-does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
  // Must not leak stack trace or internal info
  assert.equal(body.error.stack, undefined);
});
