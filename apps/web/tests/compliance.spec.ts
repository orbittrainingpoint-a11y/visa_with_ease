/**
 * Legal-compliance checks in a real browser.
 *
 *  - Fonts are self-hosted (GDPR): no request to Google Fonts, and the app's fonts really load.
 *  - No session-recording or tracking tool is contacted (CIPA guard): if one is ever added it must come with a
 *    consent gate, and this test will fail until it is reviewed.
 *  - The DMCA notice page exists and explains the process (DMCA).
 */
import { expect, test, type Page } from '@playwright/test';

const THIRD_PARTY_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'use.typekit.net',
  'static.hotjar.com',
  'script.hotjar.com',
  'www.clarity.ms',
  'cdn.logrocket.io',
  'cdn.lr-ingest.io',
  'rs.fullstory.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
];

/** Records every host the page contacts while it loads and settles. */
async function watchHosts(page: Page): Promise<Set<string>> {
  const hosts = new Set<string>();
  page.on('request', (req) => {
    try { hosts.add(new URL(req.url()).host); } catch { /* data: and blob: URLs have no host */ }
  });
  return hosts;
}

test.describe('Compliance — fonts, tracking and notices', () => {
  test('the app contacts no third-party font or tracking host on the public pages', async ({ page }) => {
    const hosts = await watchHosts(page);
    for (const path of ['/auth', '/privacy', '/terms', '/dmca']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    const offenders = THIRD_PARTY_HOSTS.filter((h) => hosts.has(h));
    expect(offenders, `third-party hosts contacted: ${offenders.join(', ')}`).toEqual([]);
  });

  test('the self-hosted fonts are served and used', async ({ page }) => {
    const served = await page.request.get('/assets/fonts/fonts.css');
    expect(served.ok()).toBeTruthy();
    const css = await served.text();
    expect(css).toContain("font-family: 'Inter'");
    expect(css).not.toContain('https://');

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return { inter: document.fonts.check('16px Inter'), jakarta: document.fonts.check('800 16px "Plus Jakarta Sans"') };
    });
    expect(loaded.inter).toBeTruthy();
    expect(loaded.jakarta).toBeTruthy();
  });

  test('the /dmca page explains the notice process and the counter-notice steps', async ({ page }) => {
    await page.goto('/dmca');
    await expect(page.getByRole('heading', { name: /copyright \(dmca\) notices/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /designated copyright agent/i })).toBeVisible();
    await expect(page.getByText(/under penalty of perjury/i)).toBeVisible();
    await expect(page.getByText(/counter-notice/i).first()).toBeVisible();
    await expect(page.getByText(/dmca\.copyright\.gov/i).first()).toBeVisible();
  });

  test('the terms page links to the DMCA process', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('link', { name: /dmca notice process/i })).toHaveAttribute('href', '/dmca');
  });
});
