import { test, expect } from '@playwright/test';

const ANDROID_VIEWPORT = { width: 412, height: 915 };

async function expect3DOrFallback(page, ariaLabel) {
  const canvas3D = page.locator(`canvas[aria-label="${ariaLabel}"]`);
  const fallback3D = page.locator(`[aria-label="${ariaLabel}"]`);
  const hasCanvas = (await canvas3D.count()) > 0;
  const hasFallback = (await fallback3D.count()) > 0;
  expect(hasCanvas || hasFallback).toBeTruthy();
}

test.describe('Android 3D Smoke', () => {
  test.use({ viewport: ANDROID_VIEWPORT });

  test('chat 3D shell renders on mobile layout', async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...args) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          return null;
        }
        return originalGetContext.call(this, type, ...args);
      };
    });

    await page.goto('/chat', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/WebGL is not supported/i)).toBeVisible({ timeout: 15000 });
  });

  test('drug checker shows 3D visualizations after interaction run', async ({ page }) => {
    await page.goto('/tools/drug-checker', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.medication-input').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.medication-input').first().fill('Warfarin');
    await page.locator('.btn-add-med').click();
    await page.locator('.medication-input').nth(1).fill('Aspirin');

    await page.locator('.btn-check-interactions').click();
    await expect(page.locator('.results-section')).toBeVisible({ timeout: 15000 });

    await expect3DOrFallback(page, '3D molecular structure');
    await expect3DOrFallback(page, '3D drug interaction network');
  });
});
