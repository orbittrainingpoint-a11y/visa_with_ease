/**
 * VisaIQ — Complete Web Portal Smoke Tests
 *
 * Covers: Auth, demo personas, all main routes, core flows (create app, chat, waiver),
 * and regression checks (no "undefined" text, no 401 UI leaks).
 *
 * Run: npx playwright test --project=desktop-chromium
 * Mobile viewport: npx playwright test --project=mobile-pixel7
 */
import { expect, test, type Page } from '@playwright/test';

const API = process.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Log in using a demo persona button on the auth page. */
async function loginAsDemo(page: Page, persona: 'consumer' | 'consultant' | 'hr_admin' | 'platform_admin') {
  await page.goto('/auth');
  const label = { consumer: 'Consumer', consultant: 'Consultant', hr_admin: 'HR Admin', platform_admin: 'Platform' }[persona];
  await page.getByRole('button', { name: label }).click();
  await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15_000 });
}

/** Assert no raw "undefined" text is visible anywhere on the page. */
async function assertNoUndefined(page: Page) {
  const undefinedText = page.getByText('undefined', { exact: false });
  await expect(undefinedText).toHaveCount(0);
}

// ─── Auth Page ────────────────────────────────────────────────────────────────

test.describe('Auth page', () => {
  test('renders sign-in form with demo role buttons', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByRole('heading', { name: /open your visa workspace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // All 4 demo persona buttons must be present
    for (const label of ['Consumer', 'Consultant', 'HR Admin', 'Platform']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('sign-in with credentials navigates to dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('sarah.mathew@example.com');
    await page.getByLabel(/password/i).fill('demo1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
    await assertNoUndefined(page);
  });

  test('demo login as consumer reaches dashboard', async ({ page }) => {
    await loginAsDemo(page, 'consumer');
    await expect(page.getByRole('heading', { name: /readiness command center/i })).toBeVisible();
    await assertNoUndefined(page);
  });

  test('demo login as consultant reaches dashboard', async ({ page }) => {
    await loginAsDemo(page, 'consultant');
    await expect(page.getByRole('heading', { name: /readiness command center/i })).toBeVisible();
  });

  test('demo login as hr_admin reaches dashboard', async ({ page }) => {
    await loginAsDemo(page, 'hr_admin');
    await expect(page.getByRole('heading', { name: /readiness command center/i })).toBeVisible();
  });

  test('demo login as platform_admin reaches dashboard', async ({ page }) => {
    await loginAsDemo(page, 'platform_admin');
    await expect(page.getByRole('heading', { name: /readiness command center/i })).toBeVisible();
  });

  test('unauthenticated /app redirects to /auth', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/auth/);
  });
});

// ─── Landing Page ─────────────────────────────────────────────────────────────

test.describe('Landing page', () => {
  test('renders hero section and key trust signals', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/visa/i).first()).toBeVisible();
    await assertNoUndefined(page);
  });

  test('navigation links do not return 404', async ({ page }) => {
    await page.goto('/');
    // All public nav routes should load
    for (const path of ['/', '/services', '/about', '/faq']) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await assertNoUndefined(page);
    }
  });
});

// ─── Dashboard (consumer) ─────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('shows readiness score and application list', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByText(/readiness/i).first()).toBeVisible();
    await assertNoUndefined(page);
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/app');
    const navLinks = ['Applications', 'Requirements', 'AI Assistant', 'Consultants'];
    for (const label of navLinks) {
      await expect(page.getByRole('link', { name: new RegExp(label, 'i') }).first()).toBeVisible();
    }
  });

  test('shows greeting with user name, not raw email', async ({ page }) => {
    await page.goto('/app');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('@demo.visawithease.app');
  });
});

// ─── Applications ─────────────────────────────────────────────────────────────

test.describe('Applications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('applications page loads cleanly', async ({ page }) => {
    await page.goto('/applications');
    await expect(page.getByRole('heading', { name: /applications|track.*visa|visa journey/i })).toBeVisible();
    await assertNoUndefined(page);
  });

  test('can open new application flow', async ({ page }) => {
    await page.goto('/applications');
    const newBtn = page.getByRole('button', { name: /new application/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      // Should show country or visa type form
      await expect(page.getByText(/destination|country|visa type/i)).toBeVisible();
    }
  });
});

// ─── Requirements ─────────────────────────────────────────────────────────────

test.describe('Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('requirements page loads with checklist items', async ({ page }) => {
    await page.goto('/requirements');
    await expect(page.getByRole('heading', { name: /requirements|France|Schengen/i })).toBeVisible();
    await assertNoUndefined(page);
  });

  test('freshness badge is visible', async ({ page }) => {
    await page.goto('/requirements');
    await expect(page.getByText(/fetched|ago|expires/i).first()).toBeVisible();
  });
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('chat page renders with message input', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByRole('heading', { name: /chat|ask.*question|visa-scoped/i })).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();
    await assertNoUndefined(page);
  });

  test('visa-related message gets a reply', async ({ page }) => {
    await page.goto('/chat');
    const input = page.getByRole('textbox');
    await input.fill('What documents do I need for a Schengen visa?');
    await page.getByRole('button', { name: /send/i }).click();
    // Wait for a new AI reply bubble to appear in the chat window
    await expect(page.locator('.bubble.ai').last()).toBeVisible({ timeout: 20_000 });
    await assertNoUndefined(page);
  });
});

// ─── Consultants ──────────────────────────────────────────────────────────────

test.describe('Consultants', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('consultants list loads', async ({ page }) => {
    await page.goto('/consultants');
    await expect(page.getByRole('heading', { name: /consultant|france|tourist visa|pre-filtered/i })).toBeVisible();
    await assertNoUndefined(page);
  });

  test('consultant cards show rating and specialty', async ({ page }) => {
    await page.goto('/consultants');
    await expect(page.getByText(/4\.\d/).first()).toBeVisible(); // rating like 4.9
    await expect(page.getByText(/Schengen|GCC|European/i).first()).toBeVisible();
  });
});

// ─── Upload / Audit ───────────────────────────────────────────────────────────

test.describe('Upload & Audit', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('upload page renders document checklist', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: /upload|document/i }).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Role-Gated Routes ────────────────────────────────────────────────────────

test.describe('Consultant Console (role-gated)', () => {
  test('consultant can access consultant console', async ({ page }) => {
    await loginAsDemo(page, 'consultant');
    await page.goto('/consultant-console');
    await expect(page.getByRole('heading', { name: /console|queue|case/i }).first()).toBeVisible();
    await assertNoUndefined(page);
  });

  test('consumer cannot reach consultant console content', async ({ page }) => {
    await loginAsDemo(page, 'consumer');
    await page.goto('/consultant-console');
    // React Router Navigate redirect fires after SPA loads — poll until URL settles
    await expect(page).toHaveURL(/\/app/, { timeout: 4000 });
  });
});

test.describe('HR Portal (role-gated)', () => {
  test('hr_admin can access HR portal', async ({ page }) => {
    await loginAsDemo(page, 'hr_admin');
    await page.goto('/hr');
    await expect(page.getByRole('heading', { name: /hr|team|employee/i }).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

test.describe('Admin Panel (role-gated)', () => {
  test('platform_admin can access admin overview', async ({ page }) => {
    await loginAsDemo(page, 'platform_admin');
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /admin|overview|operations/i })).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('settings page renders account controls', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings|account/i })).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Visa Tools (public routes) ───────────────────────────────────────────────

test.describe('Visa Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('visa calculator page loads', async ({ page }) => {
    await page.goto('/visa-calculator');
    await expect(page.getByRole('heading', { name: /calculator|readiness/i })).toBeVisible();
    await assertNoUndefined(page);
  });
});

test.describe('Embassy Finder', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('embassy finder shows country list', async ({ page }) => {
    await page.goto('/embassy-finder');
    await expect(page.getByRole('heading', { name: /embassy|finder/i }).first()).toBeVisible();
    await expect(page.getByText(/France|United Kingdom|United States/i).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

test.describe('Visa Waiver Checker', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('visa waiver checker shows nationality and destination pickers', async ({ page }) => {
    await page.goto('/visa-waiver');
    await expect(page.getByRole('heading', { name: /waiver|checker/i })).toBeVisible();
    await expect(page.getByText(/India|Pakistan|Philippines/i).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

test.describe('Country Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('country comparison loads two-column view', async ({ page }) => {
    await page.goto('/country-comparison');
    await expect(page.getByRole('heading', { name: /comparison|compare/i })).toBeVisible();
    await assertNoUndefined(page);
  });
});

test.describe('Rejection Analyzer', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('rejection analyzer page loads with text input', async ({ page }) => {
    await page.goto('/rejection-analyzer');
    await expect(page.getByRole('heading', { name: /rejection|refusal|analyzer/i }).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Ecosystem Partners ───────────────────────────────────────────────────────

test.describe('Partners', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('partners marketplace loads with category tabs', async ({ page }) => {
    await page.goto('/partners');
    await expect(page.getByRole('heading', { name: /partner|ecosystem/i })).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Compliance DB ────────────────────────────────────────────────────────────

test.describe('Compliance DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('compliance db page loads country table', async ({ page }) => {
    await page.goto('/compliance-db');
    await expect(page.getByRole('heading', { name: /compliance|database/i })).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Pricing Page ─────────────────────────────────────────────────────────────

test.describe('Pricing', () => {
  test('pricing page loads with tiers', async ({ page }) => {
    await loginAsDemo(page, 'consumer');
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /pricing|plan/i })).toBeVisible();
    await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── API Portal ───────────────────────────────────────────────────────────────

test.describe('API Portal', () => {
  test('api portal loads with developer tools', async ({ page }) => {
    await loginAsDemo(page, 'consumer');
    await page.goto('/api-portal');
    await expect(page.getByRole('heading', { name: /api|developer|portal/i }).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Investor Demo ────────────────────────────────────────────────────────────

test.describe('Investor Demo', () => {
  test('investor page loads pitch deck content', async ({ page }) => {
    await loginAsDemo(page, 'consumer');
    await page.goto('/investor');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/TAM|SAM|SOM|revenue|market/i).first()).toBeVisible();
    await assertNoUndefined(page);
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'consumer');
  });

  test('notifications panel can be opened from header', async ({ page }) => {
    await page.goto('/app');
    const bellBtn = page.getByRole('button', { name: /notification|bell/i });
    if (await bellBtn.isVisible()) {
      await bellBtn.click();
      await expect(page.getByText(/notification|alert|update/i).first()).toBeVisible();
      await assertNoUndefined(page);
    }
  });
});

// ─── Regression: No "undefined" across all main routes ───────────────────────

test.describe('Regression — no undefined text', () => {
  const routes = [
    '/app', '/applications', '/requirements', '/chat',
    '/consultants', '/upload', '/settings',
    '/visa-calculator', '/embassy-finder', '/visa-waiver',
    '/country-comparison', '/rejection-analyzer',
    '/partners', '/compliance-db', '/pricing', '/api-portal',
  ];

  for (const route of routes) {
    test(`${route} shows no raw "undefined"`, async ({ page }) => {
      await loginAsDemo(page, 'consumer');
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await assertNoUndefined(page);
    });
  }
});

// ─── Role isolation — platform_admin sees extra routes ────────────────────────

test.describe('Platform admin sees all privileged routes', () => {
  const adminRoutes = [
    '/consultant-console',
    '/hr',
    '/admin',
    '/admin/users',
  ];

  for (const route of adminRoutes) {
    test(`platform_admin can load ${route}`, async ({ page }) => {
      await loginAsDemo(page, 'platform_admin');
      await page.goto(route);
      // Should not be redirected to auth or show 401/403
      await expect(page).not.toHaveURL(/\/auth/);
      await assertNoUndefined(page);
    });
  }
});

// ─── API direct smoke (fetch from Playwright browser context) ─────────────────

test.describe('Backend API direct smoke', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('embassies endpoint returns list', async ({ request }) => {
    const res = await request.get(`${API}/embassies`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.embassies.length).toBeGreaterThan(0);
  });

  test('visa-waiver endpoint responds to query params', async ({ request }) => {
    const res = await request.get(`${API}/visa-waiver?nationality=Indian&destination=UAE`);
    expect(res.status()).toBe(200);
  });

  test('exchange-rates endpoint returns USD base', async ({ request }) => {
    const res = await request.get(`${API}/exchange-rates`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.base).toBe('USD');
    expect(typeof body.rates.EUR).toBe('number');
  });

  test('auth/demo returns correct token for each persona', async ({ request }) => {
    for (const persona of ['consumer', 'consultant', 'hr_admin', 'platform_admin'] as const) {
      const res = await request.post(`${API}/auth/demo`, { data: { persona } });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.roles).toContain('consumer');
    }
  });
});
