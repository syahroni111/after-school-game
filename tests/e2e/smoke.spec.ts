import { expect, test } from '@playwright/test';

test('M0: canvas 480x270 tampil dengan zoom bulat', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const info = await canvas.evaluate((c: HTMLCanvasElement) => ({
    w: c.width,
    h: c.height,
    cssW: c.getBoundingClientRect().width,
    cssH: c.getBoundingClientRect().height,
  }));
  expect(info.w).toBe(480);
  expect(info.h).toBe(270);
  expect(info.cssW % 480).toBe(0);
  expect(info.cssH % 270).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'docs/screens/M0_boot.png' });
});
