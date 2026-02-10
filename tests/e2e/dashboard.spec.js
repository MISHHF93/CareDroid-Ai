import { test, expect } from '@playwright/test';

/**
 * Phase 5 — Playwright E2E tests for the CareDroid Dashboard.
 * The app uses mock data fallbacks — no backend needed.
 */

test.describe('App Shell & Navigation', () => {
  test('welcome page renders at root', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/caredroid|sign in/i, { timeout: 15000 });
  });

  test('unknown routes redirect to root', async ({ page }) => {
    await page.goto('/some-random-page', { waitUntil: 'domcontentloaded' });
    // React Router Navigate fallback redirects to "/"
    await page.waitForURL('**/', { timeout: 15000 });
  });

  test('auth page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });
});

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
  });

  test('renders without crashing', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('page contains rendered content', async ({ page }) => {
    const text = await page.locator('body').innerText();
    // Dashboard should have substantial rendered content (not blank page)
    expect(text.length).toBeGreaterThan(50);
  });

  test('dashboard has interactive widget elements', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a button does not crash the app', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstButton.click();
    }
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });
});

test.describe('Code Splitting Verification', () => {
  test('production build creates separate vendor-react chunk', async ({}) => {
    // Code splitting is validated in the production build output.
    // Vite dev server serves unbundled ESM modules, so chunk names
    // like vendor-react only exist after `vite build`.
    // This test verifies the build output exists from our earlier build.
    const fs = await import('fs');
    const distDir = '/workspaces/CareDroid-Ai/dist/assets';
    const files = fs.readdirSync(distDir);
    const hasVendorReact = files.some(f => f.includes('vendor-react'));
    const hasDashboardWidgets = files.some(f => f.includes('dashboard-widgets'));
    expect(hasVendorReact).toBeTruthy();
    expect(hasDashboardWidgets).toBeTruthy();
  });
});
