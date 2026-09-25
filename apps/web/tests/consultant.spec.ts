/**
 * Consultant experience — web console UI plus the consultant API lifecycle against the real dev servers.
 *
 * UI: consultant sign-in via the demo persona, the console panels, role gating.
 * API: invitation → password → consultant-only sign-in → workspace, sharing rules, isolation, cancellation.
 * (The Android app's consultant screens are covered by apps/mobile/e2e/consultant_ui_test.py.)
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const API = process.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const STRONG = 'Consultant#2026x';

async function loginAsDemo(page: Page, persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin') {
  await page.goto('/auth');
  const label = { consumer: 'Consumer', consultant: 'Consultant', hr_admin: 'HR Admin', platform_admin: 'Platform' }[persona];
  await page.getByRole('button', { name: label }).click();
  await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15_000 });
}

async function demoToken(request: APIRequestContext, persona: string): Promise<string> {
  const r = await request.post(`${API}/auth/demo`, { data: { persona } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token;
}
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const unique = (tag: string) => `${tag}.${Date.now()}.${Math.floor(Math.random() * 1e6)}`;

async function newClient(request: APIRequestContext, tag: string) {
  const r = await request.post(`${API}/auth/register`, { data: { name: `Client ${tag}`, email: `${unique(tag)}@example.com`, password: 'ClientOnly#2026x' } });
  expect(r.status()).toBe(201);
  return r.json() as Promise<{ token: string; user: { email: string; uid: string } }>;
}

async function invitedConsultantToken(request: APIRequestContext, consultantId: string, tag: string): Promise<string> {
  const admin = await demoToken(request, 'platform_admin');
  const email = `${unique(tag)}@partner.example.com`;
  const inv = await request.post(`${API}/admin/consultants/invite`, { headers: auth(admin), data: { email, name: `Consultant ${tag}`, consultantId } });
  expect(inv.status()).toBe(201);
  const setupToken = new URL((await inv.json()).setupUrl).searchParams.get('token');
  const reset = await request.post(`${API}/auth/reset-password`, { data: { token: setupToken, newPassword: STRONG } });
  expect(reset.ok()).toBeTruthy();
  const login = await request.post(`${API}/auth/consultant-session`, { data: { email, password: STRONG } });
  expect(login.status()).toBe(201);
  return (await login.json()).token;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

test.describe('Consultant console — UI', () => {
  test('consultant signs in and sees the console panels', async ({ page }) => {
    await loginAsDemo(page, 'consultant');
    await page.goto('/consultant-console');
    await expect(page.getByRole('heading', { name: /case queue, conversations and crm/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /shared cases/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /conversations/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /commission tracking/i })).toBeVisible();
    await expect(page.getByText('undefined', { exact: false })).toHaveCount(0);
  });

  test('a client-shared case appears in the console with only the categories the client chose', async ({ page, request }) => {
    const client = await newClient(request, 'ui-share');
    const app = await request.post(`${API}/applications`, { headers: auth(client.token), data: { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' } });
    const appId = (await app.json()).application.id as string;
    const grant = await request.post(`${API}/access-grants`, {
      headers: auth(client.token),
      data: { applicationId: appId, consultantId: 'c-priya', categories: ['profile', 'requirements'], expiresAt: '2031-01-01T00:00:00.000Z', acceptedTerms: true },
    });
    expect(grant.status()).toBe(201);

    await loginAsDemo(page, 'consultant');
    await page.goto('/consultant-console');
    const row = page.locator('.activity-row', { hasText: 'France' }).filter({ hasText: /profile/i }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(/requirements/i);
    await expect(row).not.toContainText(/contact|documents|ai_messages/i);
  });

  test('a consultant cannot open admin or HR pages', async ({ page }) => {
    await loginAsDemo(page, 'consultant');
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
    await page.goto('/hr');
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  });

  test('a client cannot open the consultant console', async ({ page }) => {
    await loginAsDemo(page, 'consumer');
    await page.goto('/consultant-console');
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });
  });
});

// ─── API lifecycle (desktop project only — no need to run it twice) ─────────────────

test.describe('Consultant API lifecycle', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'API-only; runs once');
  });

  test('invite → password → consultant-only sign-in; clients are turned away at that door', async ({ request }) => {
    const admin = await demoToken(request, 'platform_admin');
    const consumerToken = await demoToken(request, 'consumer');
    const email = `${unique('inv')}@partner.example.com`;

    const forbidden = await request.post(`${API}/admin/consultants/invite`, { headers: auth(consumerToken), data: { email, name: 'X', consultantId: 'c-priya' } });
    expect(forbidden.status()).toBe(403);

    const inv = await request.post(`${API}/admin/consultants/invite`, { headers: auth(admin), data: { email, name: 'Invited One', consultantId: 'c-priya' } });
    expect(inv.status()).toBe(201);
    const body = await inv.json();
    expect(body.setupUrl).toContain('reset-password?token=');

    // Nobody can sign in before choosing a password.
    expect((await request.post(`${API}/auth/consultant-session`, { data: { email, password: 'Whatever#2026x' } })).status()).toBe(401);

    await request.post(`${API}/auth/reset-password`, { data: { token: new URL(body.setupUrl).searchParams.get('token'), newPassword: STRONG } });
    const login = await request.post(`${API}/auth/consultant-session`, { data: { email, password: STRONG } });
    expect(login.status()).toBe(201);
    const session = await login.json();
    expect(session.user.roles).toEqual(['consultant']);

    const me = await request.get(`${API}/consultant/me`, { headers: auth(session.token) });
    expect((await me.json()).linked).toBe(true);

    const client = await newClient(request, 'door');
    const refused = await request.post(`${API}/auth/consultant-session`, { data: { email: client.user.email, password: 'ClientOnly#2026x' } });
    expect(refused.status()).toBe(403);
    expect((await refused.json()).error.code).toBe('NOT_A_CONSULTANT');
  });

  test('a consultant-only account cannot use client features', async ({ request }) => {
    const t = await invitedConsultantToken(request, 'c-priya', 'closed');
    const attempts: Array<[string, unknown]> = [
      ['/applications', { destinationCountry: 'France', visaType: 'Tourist', intendedFrom: '2026-12-01' }],
      ['/chat', { message: 'hello' }],
      ['/face/enroll', { faceFeature: 'f'.repeat(64), passportSimilarity: 0.9, liveness: 0.9, steps: ['a', 'b'] }],
    ];
    for (const [path, data] of attempts) {
      const r = await request.post(`${API}${path}`, { headers: auth(t), data });
      expect(r.status(), path).toBe(403);
      expect((await r.json()).error.code).toBe('CONSULTANT_ACCOUNT');
    }
    expect((await request.get(`${API}/consultant/appointments`, { headers: auth(t) })).status()).toBe(200);
  });

  test('sharing, isolation, revoke and cancellation behave as promised', async ({ request }) => {
    const priya = await invitedConsultantToken(request, 'c-priya', 'priya');
    const omar = await invitedConsultantToken(request, 'c-omar', 'omar');
    const client = await newClient(request, 'life');
    const app = await request.post(`${API}/applications`, { headers: auth(client.token), data: { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01', nationality: 'India' } });
    const appId = (await app.json()).application.id as string;
    const booking = await (await request.post(`${API}/bookings`, { headers: auth(client.token), data: { consultantId: 'c-priya', applicationId: appId, sessionType: 'standard', slotISO: '2030-09-10T06:00:00.000Z' } })).json();
    const caseUrl = `${API}/consultant/appointments/${booking.bookingId}/case`;

    // Before sharing: name + destination only, and the case is closed.
    const list = await (await request.get(`${API}/consultant/appointments`, { headers: auth(priya) })).json();
    const row = list.appointments.find((a: { bookingId: string }) => a.bookingId === booking.bookingId);
    expect(row.access.granted).toBe(false);
    expect(row.nationality).toBeUndefined();
    const denied = await request.get(caseUrl, { headers: auth(priya) });
    expect(denied.status()).toBe(403);
    expect((await denied.json()).error.code).toBe('ACCESS_NOT_GRANTED');

    // The grant requires accepted terms.
    const noTerms = await request.post(`${API}/access-grants`, { headers: auth(client.token), data: { applicationId: appId, consultantId: 'c-priya', categories: ['profile'], expiresAt: '2031-01-01T00:00:00.000Z' } });
    expect(noTerms.status()).toBe(400);
    const grant = await request.post(`${API}/access-grants`, { headers: auth(client.token), data: { applicationId: appId, consultantId: 'c-priya', categories: ['profile', 'requirements'], expiresAt: '2031-01-01T00:00:00.000Z', acceptedTerms: true } });
    expect(grant.status()).toBe(201);

    // Only the shared categories come back; another consultant gets nothing.
    const view = await (await request.get(caseUrl, { headers: auth(priya) })).json();
    expect(view.profile.nationality).toBe('India');
    expect(Array.isArray(view.requirements)).toBe(true);
    expect(view.documents).toBeUndefined();
    expect(view.contact).toBeUndefined();
    expect((await request.get(caseUrl, { headers: auth(omar) })).status()).toBe(404);

    // Revoke closes it at once; a fresh grant reopens it; cancelling the appointment closes it for good.
    expect((await request.delete(`${API}/access-grants/${(await grant.json()).grantId}`, { headers: auth(client.token) })).status()).toBe(200);
    expect((await request.get(caseUrl, { headers: auth(priya) })).status()).toBe(403);
    await request.post(`${API}/access-grants`, { headers: auth(client.token), data: { applicationId: appId, consultantId: 'c-priya', categories: ['profile'], expiresAt: '2031-01-01T00:00:00.000Z', acceptedTerms: true } });
    expect((await request.get(caseUrl, { headers: auth(priya) })).status()).toBe(200);
    expect((await request.post(`${API}/bookings/${booking.bookingId}/cancel`, { headers: auth(client.token), data: {} })).status()).toBe(200);
    expect((await request.get(caseUrl, { headers: auth(priya) })).status()).toBe(403);
  });

  test('the call link is refused outside the join window and only offered to the two people on the booking', async ({ request }) => {
    const priya = await invitedConsultantToken(request, 'c-priya', 'call');
    const client = await newClient(request, 'call');
    const stranger = await newClient(request, 'stranger');
    const app = await request.post(`${API}/applications`, { headers: auth(client.token), data: { destinationCountry: 'France', visaType: 'schengen-tourist', intendedFrom: '2026-12-01' } });
    const appId = (await app.json()).application.id as string;
    const booking = await (await request.post(`${API}/bookings`, { headers: auth(client.token), data: { consultantId: 'c-priya', applicationId: appId, sessionType: 'standard', slotISO: '2031-02-10T06:00:00.000Z' } })).json();
    const joinUrl = `${API}/bookings/${booking.bookingId}/join`;
    const early = await request.get(joinUrl, { headers: auth(client.token) });
    expect(early.status()).toBe(409);
    expect((await early.json()).error.code).toBe('JOIN_NOT_OPEN');
    expect((await request.get(joinUrl, { headers: auth(priya) })).status()).toBe(409);
    expect((await request.get(joinUrl, { headers: auth(stranger.token) })).status()).toBe(404);
  });
});
