import { expect, test, type Page } from '@playwright/test';

const routes = [
  ['/auth', 'Open your visa workspace'],
  ['/app', 'Your visa readiness command center'],
  ['/consultants', 'Pre-filtered for France'],
  ['/consultant-console', 'Case queue, conversations and CRM'],
  ['/hr', 'HR dashboard and employee visa readiness'],
  // 'Your Company' was a hardcoded fallback removed this session — the
  // employee portal now shows a real name derived from the signed-in user
  // (their profile name if set, else their email's local-part), with the
  // real employer only appended when one is actually on file. The
  // platform_admin demo persona (admin@demo.visawithease.app) has no
  // profile, so this derives to "Admin" with no company suffix.
  ['/employee', 'Admin'],
  ['/admin', 'Operations overview']
];

async function loginAsPlatformAdmin(page: Page) {
  await page.goto('/auth');
  await page.getByRole('button', { name: 'Platform' }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await loginAsPlatformAdmin(page);
});

for (const [path, heading] of routes.slice(1)) {
  test(`loads ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: new RegExp(heading) })).toBeVisible();
    await expect(page.getByText('undefined')).toHaveCount(0);
  });
}
